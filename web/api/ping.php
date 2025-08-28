<?php
/**
 * API: Ping - Verificação de conectividade
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Computer-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$response = [
    'status' => 'ok',
    'message' => 'WorkTrack API is running',
    'timestamp' => date('Y-m-d H:i:s'),
    'version' => '1.0.0'
];

echo json_encode($response);
?>
