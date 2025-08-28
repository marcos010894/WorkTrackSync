<?php
require_once '../includes/config.php';

$auth = new Auth();
$auth->requireLogin();

$db = new Database();

// Get parameters
$startDate = $_GET['start_date'] ?? date('Y-m-d');
$endDate = $_GET['end_date'] ?? date('Y-m-d');
$computerId = $_GET['computer_id'] ?? '';
$export = $_GET['export'] ?? '';

try {
    // Base query conditions
    $conditions = ["session_date BETWEEN ? AND ?"];
    $params = [$startDate, $endDate];
    
    if (!empty($computerId)) {
        $conditions[] = "computer_id = ?";
        $params[] = $computerId;
    }
    
    $whereClause = "WHERE " . implode(" AND ", $conditions);
    
    if ($export === 'csv') {
        exportReportCSV($db, $whereClause, $params, $startDate, $endDate);
        exit;
    }
    
    // Get statistics
    $stats = getReportStats($db, $whereClause, $params, $startDate, $endDate);
    
    // Get daily usage
    $dailyUsage = getDailyUsage($db, $whereClause, $params);
    
    // Get detailed sessions
    $sessions = getDetailedSessions($db, $whereClause, $params);
    
    // Get top applications
    $topApps = getTopApplications($db, $whereClause, $params);
    
    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'daily_usage' => $dailyUsage,
        'sessions' => $sessions,
        'top_apps' => $topApps
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function getReportStats($db, $whereClause, $params, $startDate, $endDate) {
    // Total minutes
    $totalQuery = "SELECT COALESCE(SUM(total_minutes), 0) as total FROM daily_sessions $whereClause";
    $totalMinutes = $db->fetchOne($totalQuery, $params)['total'];
    
    // Calculate days in period
    $start = new DateTime($startDate);
    $end = new DateTime($endDate);
    $interval = $start->diff($end);
    $days = $interval->days + 1;
    
    // Average daily usage
    $avgDaily = $days > 0 ? round($totalMinutes / $days, 0) : 0;
    
    // Most used day
    $dayQuery = "SELECT session_date, SUM(total_minutes) as daily_total 
                 FROM daily_sessions $whereClause 
                 GROUP BY session_date 
                 ORDER BY daily_total DESC 
                 LIMIT 1";
    $mostUsedResult = $db->fetchOne($dayQuery, $params);
    $mostUsedDay = $mostUsedResult ? date('d/m', strtotime($mostUsedResult['session_date'])) : '-';
    
    // Productivity (placeholder - could be based on productive apps vs total time)
    $productivity = $totalMinutes > 0 ? min(100, round(($totalMinutes / ($days * 8 * 60)) * 100, 0)) : 0;
    
    return [
        'total_minutes' => (int)$totalMinutes,
        'avg_daily' => (int)$avgDaily,
        'most_used_day' => $mostUsedDay,
        'productivity' => (int)$productivity
    ];
}

function getDailyUsage($db, $whereClause, $params) {
    $query = "SELECT session_date as date, SUM(total_minutes) as minutes 
              FROM daily_sessions $whereClause 
              GROUP BY session_date 
              ORDER BY session_date";
    
    return $db->fetchAll($query, $params);
}

function getDetailedSessions($db, $whereClause, $params) {
    $query = "SELECT 
                ds.session_date,
                ds.start_time,
                ds.end_time,
                ds.total_minutes,
                c.computer_name,
                COUNT(DISTINCT ap.id) as app_count
              FROM daily_sessions ds
              JOIN computers c ON ds.computer_id = c.id
              LEFT JOIN application_usage ap ON ds.id = ap.session_id
              $whereClause
              GROUP BY ds.id, ds.session_date, ds.start_time, ds.end_time, ds.total_minutes, c.computer_name
              ORDER BY ds.session_date DESC, ds.start_time DESC
              LIMIT 50";
    
    return $db->fetchAll($query, $params);
}

function getTopApplications($db, $whereClause, $params) {
    // Modify where clause for application_usage table
    $appWhereClause = str_replace('session_date', 'DATE(au.timestamp)', $whereClause);
    
    $query = "SELECT 
                au.application_name as app_name,
                SUM(au.duration_minutes) as total_minutes,
                ROUND((SUM(au.duration_minutes) / (SELECT SUM(duration_minutes) FROM application_usage au2 JOIN daily_sessions ds2 ON au2.session_id = ds2.id $whereClause)) * 100, 1) as percentage
              FROM application_usage au
              JOIN daily_sessions ds ON au.session_id = ds.id
              $appWhereClause
              GROUP BY au.application_name
              ORDER BY total_minutes DESC
              LIMIT 10";
    
    $result = $db->fetchAll($query, $params);
    
    // Ensure percentage is calculated correctly
    foreach ($result as &$app) {
        $app['percentage'] = (float)$app['percentage'];
        $app['total_minutes'] = (int)$app['total_minutes'];
    }
    
    return $result;
}

function exportReportCSV($db, $whereClause, $params, $startDate, $endDate) {
    // Set headers for CSV download
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="relatorio_' . $startDate . '_' . $endDate . '.csv"');
    
    // Create output stream
    $output = fopen('php://output', 'w');
    
    // Write BOM for UTF-8
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    // Write CSV headers
    fputcsv($output, [
        'Data',
        'Computador',
        'Início',
        'Fim',
        'Duração (minutos)',
        'Aplicações Utilizadas'
    ], ';');
    
    // Get detailed sessions with applications
    $query = "SELECT 
                ds.session_date,
                c.computer_name,
                ds.start_time,
                ds.end_time,
                ds.total_minutes,
                GROUP_CONCAT(DISTINCT au.application_name SEPARATOR ', ') as applications
              FROM daily_sessions ds
              JOIN computers c ON ds.computer_id = c.id
              LEFT JOIN application_usage au ON ds.id = au.session_id
              $whereClause
              GROUP BY ds.id, ds.session_date, c.computer_name, ds.start_time, ds.end_time, ds.total_minutes
              ORDER BY ds.session_date DESC, ds.start_time DESC";
    
    $sessions = $db->fetchAll($query, $params);
    
    // Write data rows
    foreach ($sessions as $session) {
        fputcsv($output, [
            date('d/m/Y', strtotime($session['session_date'])),
            $session['computer_name'],
            $session['start_time'] ? substr($session['start_time'], 0, 5) : '',
            $session['end_time'] ? substr($session['end_time'], 0, 5) : 'Em andamento',
            $session['total_minutes'],
            $session['applications'] ?? 'Nenhuma aplicação registrada'
        ], ';');
    }
    
    fclose($output);
}
