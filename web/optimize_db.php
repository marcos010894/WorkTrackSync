<?php
/**
 * Script de Otimização do Banco de Dados
 * Execute este script para melhorar a performance do sistema
 */

require_once '../includes/config.php';

echo "=== WorkTrack - Otimização do Banco de Dados ===\n";
echo "Data: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $db = new Database();
    
    echo "1. Criando índices para otimização...\n";
    
    // Índices para activity_logs
    try {
        $db->execute("CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp)");
        echo "✓ Índice timestamp criado\n";
    } catch (Exception $e) {
        echo "- Índice timestamp já existe\n";
    }
    
    try {
        $db->execute("CREATE INDEX IF NOT EXISTS idx_activity_logs_computer_timestamp ON activity_logs(computer_id, timestamp)");
        echo "✓ Índice computer_id+timestamp criado\n";
    } catch (Exception $e) {
        echo "- Índice computer_id+timestamp já existe\n";
    }
    
    // Índices para daily_sessions
    try {
        $db->execute("CREATE INDEX IF NOT EXISTS idx_daily_sessions_date ON daily_sessions(session_date)");
        echo "✓ Índice session_date criado\n";
    } catch (Exception $e) {
        echo "- Índice session_date já existe\n";
    }
    
    try {
        $db->execute("CREATE INDEX IF NOT EXISTS idx_daily_sessions_computer_date ON daily_sessions(computer_id, session_date)");
        echo "✓ Índice computer_id+session_date criado\n";
    } catch (Exception $e) {
        echo "- Índice computer_id+session_date já existe\n";
    }
    
    // Índices para computers
    try {
        $db->execute("CREATE INDEX IF NOT EXISTS idx_computers_online ON computers(is_online)");
        echo "✓ Índice is_online criado\n";
    } catch (Exception $e) {
        echo "- Índice is_online já existe\n";
    }
    
    try {
        $db->execute("CREATE INDEX IF NOT EXISTS idx_computers_activity ON computers(last_activity)");
        echo "✓ Índice last_activity criado\n";
    } catch (Exception $e) {
        echo "- Índice last_activity já existe\n";
    }
    
    echo "\n2. Otimizando tabelas...\n";
    
    // Otimizar tabelas
    $tables = ['activity_logs', 'daily_sessions', 'computers', 'application_usage', 'administrators'];
    
    foreach ($tables as $table) {
        try {
            $db->execute("OPTIMIZE TABLE $table");
            echo "✓ Tabela $table otimizada\n";
        } catch (Exception $e) {
            echo "- Erro ao otimizar $table: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n3. Limpando dados antigos...\n";
    
    // Limpar logs antigos (manter últimos 30 dias)
    $deleted = $db->execute("DELETE FROM activity_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)");
    echo "✓ $deleted registros antigos removidos de activity_logs\n";
    
    // Limpar sessões muito antigas (manter últimos 90 dias)
    $deleted = $db->execute("DELETE FROM daily_sessions WHERE session_date < DATE_SUB(CURDATE(), INTERVAL 90 DAY)");
    echo "✓ $deleted sessões antigas removidas\n";
    
    // Limpar application_usage antigo (manter últimos 60 dias)
    $deleted = $db->execute("DELETE FROM application_usage WHERE timestamp < DATE_SUB(NOW(), INTERVAL 60 DAY)");
    echo "✓ $deleted registros antigos removidos de application_usage\n";
    
    echo "\n4. Verificando estatísticas...\n";
    
    // Estatísticas das tabelas
    $stats = [
        'activity_logs' => $db->fetchOne("SELECT COUNT(*) as count FROM activity_logs")['count'],
        'daily_sessions' => $db->fetchOne("SELECT COUNT(*) as count FROM daily_sessions")['count'],
        'computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers")['count'],
        'application_usage' => $db->fetchOne("SELECT COUNT(*) as count FROM application_usage")['count']
    ];
    
    foreach ($stats as $table => $count) {
        echo "• $table: " . number_format($count) . " registros\n";
    }
    
    // Tamanho do banco
    $sizeQuery = "
        SELECT 
            ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS db_size_mb
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
    ";
    
    $size = $db->fetchOne($sizeQuery);
    echo "• Tamanho total do banco: " . $size['db_size_mb'] . " MB\n";
    
    echo "\n=== Otimização Concluída com Sucesso! ===\n";
    echo "Recomendações:\n";
    echo "- Execute este script mensalmente\n";
    echo "- Configure backup automático do banco\n";
    echo "- Monitore o crescimento dos dados\n\n";
    
} catch (Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
    exit(1);
}

// Se executado via web, retornar JSON
if (isset($_SERVER['HTTP_HOST'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Otimização concluída com sucesso',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
