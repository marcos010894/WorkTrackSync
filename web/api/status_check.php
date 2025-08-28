<?php
/**
 * API: Verificação de status em tempo real
 * Atualiza computadores offline baseado no último heartbeat
 */

require_once 'cors.php';
require_once '../includes/config.php';

try {
    $db = new Database();
    
    // Marcar computadores como offline se não enviaram heartbeat há mais de 90 segundos
    // (heartbeat é a cada 60s, então 90s detecta rapidamente desconexões)
    $updated = $db->execute(
        "UPDATE computers SET 
            is_online = 0,
            updated_at = NOW()
         WHERE is_online = 1 
         AND last_activity < DATE_SUB(NOW(), INTERVAL 90 SECOND)"
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
    
    Utils::jsonResponse([
        'status' => 'success',
        'message' => 'Status check completed',
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    Utils::jsonResponse([
        'status' => 'error',
        'message' => 'Erro ao verificar status: ' . $e->getMessage()
    ], 500);
}
