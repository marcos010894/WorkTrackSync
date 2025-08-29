<?php
/**
 * WebSocket Server para comunicação em tempo real
 * Uso: php websocket_server.php
 */

require_once 'includes/config.php';

class WorkTrackWebSocketServer {
    private $clients = [];
    private $computers = [];
    private $db;
    private $lastSave = 0;
    private $saveInterval = 30; // Salvar no banco a cada 30 segundos
    
    public function __construct($host = '127.0.0.1', $port = 8081) {
        $this->db = new Database();
        
        $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, 1);
        socket_bind($socket, $host, $port);
        socket_listen($socket, 5);
        
        echo "WebSocket Server iniciado em {$host}:{$port}\n";
        
        $this->loop($socket);
    }
    
    private function loop($socket) {
        while (true) {
            $sockets = array_merge([$socket], $this->clients);
            $write = $except = null;
            
            if (socket_select($sockets, $write, $except, 1) > 0) {
                // Nova conexão
                if (in_array($socket, $sockets)) {
                    $newSocket = socket_accept($socket);
                    $this->handshake($newSocket);
                    $this->clients[] = $newSocket;
                    echo "Nova conexão estabelecida\n";
                }
                
                // Mensagens dos clientes
                foreach ($this->clients as $key => $client) {
                    if (in_array($client, $sockets)) {
                        $data = socket_read($client, 2048);
                        
                        if ($data === false) {
                            unset($this->clients[$key]);
                            socket_close($client);
                            continue;
                        }
                        
                        $message = $this->decode($data);
                        if ($message) {
                            $this->handleMessage($message, $client);
                        }
                    }
                }
            }
            
            // Salvar dados periodicamente no banco
            if (time() - $this->lastSave > $this->saveInterval) {
                $this->saveToDatabase();
                $this->lastSave = time();
            }
        }
    }
    
    private function handshake($socket) {
        $request = socket_read($socket, 2048);
        
        preg_match('/Sec-WebSocket-Key: (.*)\r\n/', $request, $matches);
        $key = trim($matches[1]);
        
        $acceptKey = base64_encode(sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
        
        $response = "HTTP/1.1 101 Switching Protocols\r\n" .
                   "Upgrade: websocket\r\n" .
                   "Connection: Upgrade\r\n" .
                   "Sec-WebSocket-Accept: {$acceptKey}\r\n\r\n";
        
        socket_write($socket, $response);
    }
    
    private function decode($data) {
        $length = ord($data[1]) & 127;
        
        if ($length == 126) {
            $masks = substr($data, 4, 4);
            $data = substr($data, 8);
        } else if ($length == 127) {
            $masks = substr($data, 10, 4);
            $data = substr($data, 14);
        } else {
            $masks = substr($data, 2, 4);
            $data = substr($data, 6);
        }
        
        $text = '';
        for ($i = 0; $i < strlen($data); ++$i) {
            $text .= $data[$i] ^ $masks[$i % 4];
        }
        
        return json_decode($text, true);
    }
    
    private function encode($text) {
        $text = json_encode($text);
        $length = strlen($text);
        
        if ($length <= 125) {
            return chr(129) . chr($length) . $text;
        } else if ($length <= 65535) {
            return chr(129) . chr(126) . pack('n', $length) . $text;
        } else {
            return chr(129) . chr(127) . pack('NN', 0, $length) . $text;
        }
    }
    
    private function handleMessage($message, $client) {
        echo "Mensagem recebida: " . json_encode($message) . "\n";
        
        if (isset($message['type'])) {
            switch ($message['type']) {
                case 'agent_data':
                    $this->handleAgentData($message);
                    break;
                case 'dashboard_connect':
                    $this->handleDashboardConnect($client);
                    break;
                case 'ping':
                    $this->send($client, ['type' => 'pong']);
                    break;
            }
        }
    }
    
    private function handleAgentData($data) {
        $computerId = $data['computer_id'] ?? null;
        
        if (!$computerId) return;
        
        // Armazenar dados em memória
        $this->computers[$computerId] = [
            'computer_id' => $computerId,
            'usage_minutes' => $data['usage_minutes'] ?? 0,
            'timestamp' => date('Y-m-d H:i:s'),
            'status' => 'online',
            'running_programs' => $data['running_programs'] ?? [],
            'active_window' => $data['active_window'] ?? null
        ];
        
        // Enviar para todos os dashboards conectados
        $this->broadcastToDashboards([
            'type' => 'computer_update',
            'data' => $this->computers[$computerId]
        ]);
    }
    
    private function handleDashboardConnect($client) {
        // Enviar dados atuais para o dashboard recém-conectado
        foreach ($this->computers as $computer) {
            $this->send($client, [
                'type' => 'computer_update',
                'data' => $computer
            ]);
        }
    }
    
    private function broadcastToDashboards($message) {
        foreach ($this->clients as $client) {
            $this->send($client, $message);
        }
    }
    
    private function send($client, $message) {
        $encoded = $this->encode($message);
        socket_write($client, $encoded);
    }
    
    private function saveToDatabase() {
        if (empty($this->computers)) return;
        
        echo "Salvando " . count($this->computers) . " computadores no banco...\n";
        
        try {
            $this->db->beginTransaction();
            
            foreach ($this->computers as $computer) {
                // Atualizar status do computador
                $this->db->execute(
                    "UPDATE computers SET 
                        last_activity = NOW(), 
                        is_online = 1,
                        updated_at = NOW()
                    WHERE computer_id = ?",
                    [$computer['computer_id']]
                );
                
                // Atualizar sessão diária
                if ($computer['usage_minutes'] > 0) {
                    $this->db->execute(
                        "INSERT INTO daily_sessions (computer_id, session_date, total_minutes, updated_at) 
                         VALUES (?, CURDATE(), ?, NOW()) 
                         ON DUPLICATE KEY UPDATE 
                         total_minutes = VALUES(total_minutes),
                         updated_at = NOW()",
                        [
                            $computer['computer_id'],
                            intval($computer['usage_minutes'])
                        ]
                    );
                }
                
                // Registrar log de atividade
                $this->db->execute(
                    "INSERT INTO activity_logs (computer_id, activity_type, activity_data) 
                     VALUES (?, 'websocket_data', ?)",
                    [
                        $computer['computer_id'],
                        json_encode([
                            'usage_minutes' => $computer['usage_minutes'],
                            'programs_count' => count($computer['running_programs']),
                            'timestamp' => $computer['timestamp']
                        ])
                    ]
                );
            }
            
            $this->db->commit();
            echo "Dados salvos com sucesso!\n";
            
        } catch (Exception $e) {
            $this->db->rollback();
            echo "Erro ao salvar: " . $e->getMessage() . "\n";
        }
    }
}

// Iniciar servidor
new WorkTrackWebSocketServer();
?>
