<?php
/**
 * API: Dados dos Computadores
 */

require_once '../includes/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Computer-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$auth = new Auth();
$auth->requireLogin();

try {
    $db = new Database();
    
    // Buscar todos os computadores com dados de uso
    $computers = $db->fetchAll(
        "SELECT 
            c.*,
            COALESCE(ds.total_minutes, 0) as usage_today_minutes
         FROM computers c
         LEFT JOIN daily_sessions ds ON c.computer_id = ds.computer_id 
             AND ds.session_date = CURDATE()
         ORDER BY c.is_online DESC, c.last_activity DESC"
    );
    
    $formattedComputers = array_map(function($computer) {
        return [
            'computer_id' => $computer['computer_id'],
            'computer_name' => $computer['computer_name'],
            'user_name' => $computer['user_name'],
            'os_info' => $computer['os_info'],
            'ip_address' => $computer['ip_address'],
            'mac_address' => $computer['mac_address'],
            'is_online' => (bool) $computer['is_online'],
            'last_activity' => $computer['last_activity'],
            'last_activity_formatted' => Utils::timeAgo($computer['last_activity']),
            'usage_today' => Utils::formatTime($computer['usage_today_minutes']),
            'agent_version' => $computer['agent_version'],
            'created_at' => $computer['created_at']
        ];
    }, $computers);
    
    Utils::jsonResponse([
        'success' => true,
        'computers' => $formattedComputers
    ]);
    
} catch (Exception $e) {
    Utils::logActivity("Computers data error: " . $e->getMessage(), 'ERROR');
    Utils::jsonResponse(['success' => false, 'error' => 'Erro interno do servidor'], 500);
}
?>
