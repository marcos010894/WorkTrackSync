<?php
/**
 * API: Heartbeat - Manter conexão ativa
 */

require_once '../includes/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Computer-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Utils::jsonResponse(['error' => 'Método não permitido'], 405);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['computer_id'])) {
        Utils::jsonResponse(['error' => 'Computer ID obrigatório'], 400);
    }
    
    if (!Utils::validateComputerId($input['computer_id'])) {
        Utils::jsonResponse(['error' => 'Computer ID inválido'], 400);
    }
    
    $db = new Database();
    
    // Atualizar último heartbeat
    $updated = $db->execute(
        "UPDATE computers SET 
            last_activity = NOW(), 
            is_online = 1,
            updated_at = NOW()
        WHERE computer_id = ?",
        [$input['computer_id']]
    );
    
    if (!$updated) {
        Utils::jsonResponse(['error' => 'Computador não encontrado'], 404);
    }
    
    // Registrar atividade de heartbeat
    $db->execute(
        "INSERT INTO activity_logs (computer_id, activity_type, activity_data) 
         VALUES (?, 'heartbeat', ?)",
        [
            $input['computer_id'],
            json_encode([
                'usage_minutes' => $input['usage_minutes'] ?? 0,
                'timestamp' => $input['timestamp'] ?? date('Y-m-d H:i:s')
            ])
        ]
    );
    
    // Atualizar sessão diária se fornecido tempo de uso
    if (isset($input['usage_minutes']) && $input['usage_minutes'] > 0) {
        $today = date('Y-m-d');
        
        // Inserir ou atualizar sessão diária
        $db->execute(
            "INSERT INTO daily_sessions (computer_id, session_date, total_minutes, updated_at) 
             VALUES (?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE 
             total_minutes = GREATEST(total_minutes, VALUES(total_minutes)),
             updated_at = NOW()",
            [
                $input['computer_id'],
                $today,
                intval($input['usage_minutes'])
            ]
        );
    }
    
    Utils::jsonResponse([
        'status' => 'ok',
        'message' => 'Heartbeat recebido',
        'server_time' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    Utils::logActivity("Heartbeat error: " . $e->getMessage(), 'ERROR');
    Utils::jsonResponse(['error' => 'Erro interno do servidor'], 500);
}
?>
