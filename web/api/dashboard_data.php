<?php
/**
 * API: Dados do Dashboard
 */

require_once '../includes/config.php';

$auth = new Auth();
$auth->requireLogin();

header('Content-Type: application/json');

try {
    $db = new Database();
    
    // Estatísticas gerais
    $stats = [
        'total_computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers")['count'],
        'online_computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers WHERE is_online = 1")['count'],
        'offline_computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers WHERE is_online = 0")['count'],
        'total_usage_today' => Utils::formatTime($db->fetchOne("SELECT COALESCE(SUM(total_minutes), 0) as total FROM daily_sessions WHERE session_date = CURDATE()")['total'])
    ];
    
    // Atividades recentes
    $recentActivity = $db->fetchAll(
        "SELECT 
            al.activity_type,
            al.timestamp,
            c.computer_name,
            c.user_name,
            al.activity_data
         FROM activity_logs al
         JOIN computers c ON al.computer_id = c.computer_id
         ORDER BY al.timestamp DESC
         LIMIT 10"
    );
    
    $formattedActivity = array_map(function($activity) {
        return [
            'type' => $activity['activity_type'],
            'title' => getActivityTitle($activity),
            'description' => getActivityDescription($activity),
            'time_ago' => Utils::timeAgo($activity['timestamp'])
        ];
    }, $recentActivity);
    
    // Dados para gráficos
    
    // Gráfico de uso (últimos 7 dias)
    $usageData = $db->fetchAll(
        "SELECT 
            session_date,
            SUM(total_minutes) / 60 as total_hours
         FROM daily_sessions 
         WHERE session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         GROUP BY session_date
         ORDER BY session_date"
    );
    
    $usageLabels = [];
    $usageValues = [];
    
    // Preencher dados dos últimos 7 dias
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $usageLabels[] = date('d/m', strtotime($date));
        
        $found = false;
        foreach ($usageData as $usage) {
            if ($usage['session_date'] === $date) {
                $usageValues[] = round($usage['total_hours'], 1);
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            $usageValues[] = 0;
        }
    }
    
    // Gráfico de status
    $statusData = [
        intval($stats['online_computers']),
        intval($stats['offline_computers'])
    ];
    
    $charts = [
        'usage' => [
            'labels' => $usageLabels,
            'data' => $usageValues
        ],
        'status' => [
            'data' => $statusData
        ]
    ];
    
    Utils::jsonResponse([
        'success' => true,
        'stats' => $stats,
        'recent_activity' => $formattedActivity,
        'charts' => $charts
    ]);
    
} catch (Exception $e) {
    Utils::logActivity("Dashboard data error: " . $e->getMessage(), 'ERROR');
    Utils::jsonResponse(['success' => false, 'error' => 'Erro interno do servidor'], 500);
}

function getActivityTitle($activity) {
    $titles = [
        'login' => 'Login realizado',
        'logout' => 'Logout realizado',
        'heartbeat' => 'Computador ativo',
        'program_start' => 'Programas atualizados',
        'command_received' => 'Comando executado',
        'register' => 'Computador registrado'
    ];
    
    return $titles[$activity['activity_type']] ?? 'Atividade';
}

function getActivityDescription($activity) {
    $computerInfo = "{$activity['computer_name']} ({$activity['user_name']})";
    
    $descriptions = [
        'login' => "Usuário fez login em $computerInfo",
        'logout' => "Usuário fez logout de $computerInfo",
        'heartbeat' => "Atividade detectada em $computerInfo",
        'program_start' => "Programas atualizados em $computerInfo",
        'command_received' => "Comando executado em $computerInfo",
        'register' => "Computador $computerInfo foi registrado"
    ];
    
    return $descriptions[$activity['activity_type']] ?? "Atividade em $computerInfo";
}
?>
