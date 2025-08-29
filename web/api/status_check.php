<?php
/**
 * API: Verificação de status em tempo real
 * Atualiza computadores offline baseado no último heartbeat
 */

require_once 'cors.php';
require_once '../includes/config.php';

// Cache simples em arquivo para reduzir consultas ao banco
$cache_file = '../cache/status_check.json';
$cache_duration = 15; // 15 segundos de cache

// Verificar se existe cache válido
if (file_exists($cache_file)) {
    $cache_time = filemtime($cache_file);
    if (time() - $cache_time < $cache_duration) {
        $cached_data = json_decode(file_get_contents($cache_file), true);
        if ($cached_data) {
            Utils::jsonResponse($cached_data);
            exit;
        }
    }
}

try {
    $db = new Database();
    
    // Marcar computadores como offline se não enviaram heartbeat há mais de 120 segundos
    // (heartbeat é a cada 60s, então 120s detecta desconexões com margem de segurança)
    $updated = $db->execute(
        "UPDATE computers SET 
            is_online = 0,
            updated_at = NOW()
         WHERE is_online = 1 
         AND last_activity < DATE_SUB(NOW(), INTERVAL 120 SECOND)"
    );
    
    // Buscar estatísticas atualizadas
    $stats = [
        'total_computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers")['count'],
        'online_computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers WHERE is_online = 1")['count'],
        'offline_computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers WHERE is_online = 0")['count'],
        'computers_updated' => $updated,
        'last_check' => date('Y-m-d H:i:s')
    ];
    
    if ($updated > 0) {
        Utils::logActivity("Auto-marked $updated computers as offline");
    }

    $response = [
        'status' => 'success',
        'message' => 'Status check completed',
        'stats' => $stats
    ];

    // Salvar no cache
    if (!is_dir('../cache')) {
        mkdir('../cache', 0755, true);
    }
    file_put_contents($cache_file, json_encode($response));

    Utils::jsonResponse($response);} catch (Exception $e) {
    Utils::jsonResponse([
        'status' => 'error',
        'message' => 'Erro ao verificar status: ' . $e->getMessage()
    ], 500);
}
