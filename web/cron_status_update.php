<?php
/**
 * Cron Job: Atualização de status dos computadores
 * Executa a cada minuto para marcar computadores inativos como offline
 */

require_once 'includes/config.php';

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
    
    if ($updated > 0) {
        Utils::logActivity("Marked $updated computers as offline");
    }
    
    // Limpar logs antigos (manter apenas 30 dias)
    $db->execute(
        "DELETE FROM activity_logs 
         WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    
    // Limpar comandos antigos executados (manter apenas 7 dias)
    $db->execute(
        "DELETE FROM remote_commands 
         WHERE status IN ('executed', 'failed') 
         AND sent_at < DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    
    echo "Status update completed\n";
    
} catch (Exception $e) {
    Utils::logActivity("Status update error: " . $e->getMessage(), 'ERROR');
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
