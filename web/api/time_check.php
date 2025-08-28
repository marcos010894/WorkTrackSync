<?php
/**
 * API: Verificação de tempo
 * Retorna o tempo do servidor para debug
 */

require_once 'cors.php';
require_once '../includes/config.php';

try {
    $db = new Database();
    
    // Buscar tempo do banco
    $db_time = $db->fetchOne("SELECT NOW() as server_time");
    
    Utils::jsonResponse([
        'status' => 'success',
        'times' => [
            'php_time' => date('Y-m-d H:i:s'),
            'php_timezone' => date_default_timezone_get(),
            'db_time' => $db_time['server_time'],
            'timestamp' => time(),
            'utc_time' => gmdate('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    Utils::jsonResponse([
        'status' => 'error',
        'message' => 'Erro ao verificar tempo: ' . $e->getMessage()
    ], 500);
}
