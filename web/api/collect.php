<?php
/**
 * API: Coleta de dados do agente - SEM autenticação
 * Esta API aceita dados de qualquer origem para coleta de monitoramento
 */

require_once 'cors.php'; // Carrega configurações CORS
require_once '../includes/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Utils::jsonResponse(['error' => 'Método não permitido'], 405);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['computer_id'])) {
        Utils::jsonResponse(['error' => 'Computer ID obrigatório'], 400);
    }
    
    $db = new Database();
    
    // Registrar ou atualizar computador automaticamente
    $computerExists = $db->fetchOne(
        "SELECT id FROM computers WHERE computer_id = ?",
        [$input['computer_id']]
    );
    
    if (!$computerExists) {
        // Auto-registrar novo computador
        $computerName = $input['computer_name'] ?? $input['computer_id'];
        $db->execute(
            "INSERT INTO computers (computer_id, computer_name, os_info, is_online, created_at, updated_at) 
             VALUES (?, ?, ?, 1, NOW(), NOW())",
            [
                $input['computer_id'],
                $computerName,
                $input['os_info'] ?? 'Unknown'
            ]
        );
        
        $computerId = $db->lastInsertId();
        Utils::logActivity("Auto-registrado computador: {$computerName} (ID: {$input['computer_id']})", 'INFO');
    } else {
        $computerId = $computerExists['id'];
        
        // Atualizar último heartbeat
        $db->execute(
            "UPDATE computers SET 
                last_activity = NOW(), 
                is_online = 1,
                updated_at = NOW()
            WHERE id = ?",
            [$computerId]
        );
    }
    
    // Registrar dados de aplicação se fornecidos
    if (isset($input['application_name']) && !empty($input['application_name'])) {
        // Verificar se existe sessão do dia atual
        $today = date('Y-m-d');
        $session = $db->fetchOne(
            "SELECT id FROM daily_sessions 
             WHERE computer_id = ? AND session_date = ?",
            [$computerId, $today]
        );
        
        if (!$session) {
            // Criar nova sessão diária
            $db->execute(
                "INSERT INTO daily_sessions (computer_id, session_date, start_time, total_minutes, created_at, updated_at) 
                 VALUES (?, ?, TIME(NOW()), 0, NOW(), NOW())",
                [$computerId, $today]
            );
            $sessionId = $db->lastInsertId();
        } else {
            $sessionId = $session['id'];
            
            // Atualizar fim da sessão
            $db->execute(
                "UPDATE daily_sessions SET 
                    end_time = TIME(NOW()),
                    updated_at = NOW()
                 WHERE id = ?",
                [$sessionId]
            );
        }
        
        // Registrar uso de aplicação
        $db->execute(
            "INSERT INTO application_usage (session_id, application_name, window_title, timestamp, duration_minutes) 
             VALUES (?, ?, ?, NOW(), ?)",
            [
                $sessionId,
                $input['application_name'],
                $input['window_title'] ?? '',
                $input['duration_minutes'] ?? 1
            ]
        );
    }
    
    // Atualizar tempo total de uso se fornecido
    if (isset($input['usage_minutes']) && $input['usage_minutes'] > 0) {
        $today = date('Y-m-d');
        
        $db->execute(
            "INSERT INTO daily_sessions (computer_id, session_date, total_minutes, updated_at) 
             VALUES (?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE 
             total_minutes = GREATEST(total_minutes, VALUES(total_minutes)),
             updated_at = NOW()",
            [
                $computerId,
                $today,
                intval($input['usage_minutes'])
            ]
        );
    }
    
    // Registrar log de atividade
    $db->execute(
        "INSERT INTO activity_logs (computer_id, activity_type, activity_data) 
         VALUES (?, 'data_collection', ?)",
        [
            $computerId,
            json_encode([
                'application' => $input['application_name'] ?? null,
                'window_title' => $input['window_title'] ?? null,
                'usage_minutes' => $input['usage_minutes'] ?? 0,
                'timestamp' => $input['timestamp'] ?? date('Y-m-d H:i:s'),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
            ])
        ]
    );
    
    Utils::jsonResponse([
        'status' => 'success',
        'message' => 'Dados coletados com sucesso',
        'computer_id' => $input['computer_id'],
        'server_time' => date('Y-m-d H:i:s'),
        'session_id' => $sessionId ?? null
    ]);
    
} catch (Exception $e) {
    Utils::logActivity("Erro na coleta de dados: " . $e->getMessage(), 'ERROR');
    Utils::jsonResponse([
        'status' => 'error',
        'message' => 'Erro interno do servidor',
        'error_code' => 'COLLECTION_ERROR'
    ], 500);
}
?>
