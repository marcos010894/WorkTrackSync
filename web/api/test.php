<?php
/**
 * API: Teste de conectividade e CORS
 * Esta API testa se o servidor está aceitando conexões de qualquer origem
 */

require_once 'cors.php'; // Carrega configurações CORS

// Informações do servidor
$serverInfo = [
    'status' => 'online',
    'message' => 'WorkTrack Server está funcionando',
    'version' => '1.0.0',
    'server_time' => date('Y-m-d H:i:s'),
    'timezone' => date_default_timezone_get(),
    'cors_enabled' => true,
    'methods_allowed' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'origin_policy' => 'Allow from any origin (*)',
    'server_info' => [
        'php_version' => PHP_VERSION,
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
    ]
];

// Verificar se é uma requisição POST com dados
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input) {
        $serverInfo['received_data'] = $input;
        $serverInfo['message'] = 'Dados recebidos com sucesso';
    } else {
        $serverInfo['message'] = 'Requisição POST recebida (sem dados JSON)';
    }
}

// Headers de resposta
http_response_code(200);
echo json_encode($serverInfo, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
