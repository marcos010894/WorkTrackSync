<?php
/**
 * API: Registro de computadores
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
    
    if (!$input) {
        Utils::jsonResponse(['error' => 'JSON inválido'], 400);
    }
    
    $requiredFields = ['computer_id', 'computer_name', 'user_name', 'os_info'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            Utils::jsonResponse(['error' => "Campo obrigatório: $field"], 400);
        }
    }
    
    if (!Utils::validateComputerId($input['computer_id'])) {
        Utils::jsonResponse(['error' => 'Computer ID inválido'], 400);
    }
    
    $db = new Database();
    
    // Verificar se computador já existe
    $existing = $db->fetchOne(
        "SELECT id FROM computers WHERE computer_id = ?",
        [$input['computer_id']]
    );
    
    if ($existing) {
        // Atualizar informações existentes
        $db->execute(
            "UPDATE computers SET 
                computer_name = ?, 
                user_name = ?, 
                os_info = ?, 
                ip_address = ?, 
                mac_address = ?, 
                agent_version = ?,
                last_activity = NOW(),
                is_online = 1,
                updated_at = NOW()
            WHERE computer_id = ?",
            [
                $input['computer_name'],
                $input['user_name'],
                $input['os_info'],
                $input['ip_address'] ?? $_SERVER['REMOTE_ADDR'],
                $input['mac_address'] ?? null,
                $input['agent_version'] ?? '1.0.0',
                $input['computer_id']
            ]
        );
        
        Utils::logActivity("Computer updated: {$input['computer_id']} - {$input['computer_name']}");
        
        Utils::jsonResponse([
            'status' => 'updated',
            'message' => 'Computador atualizado com sucesso',
            'computer_id' => $input['computer_id']
        ]);
    } else {
        // Inserir novo computador
        $db->execute(
            "INSERT INTO computers (
                computer_id, computer_name, user_name, os_info, 
                ip_address, mac_address, agent_version, 
                last_activity, is_online
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 1)",
            [
                $input['computer_id'],
                $input['computer_name'],
                $input['user_name'],
                $input['os_info'],
                $input['ip_address'] ?? $_SERVER['REMOTE_ADDR'],
                $input['mac_address'] ?? null,
                $input['agent_version'] ?? '1.0.0'
            ]
        );
        
        Utils::logActivity("Computer registered: {$input['computer_id']} - {$input['computer_name']}");
        
        Utils::jsonResponse([
            'status' => 'registered',
            'message' => 'Computador registrado com sucesso',
            'computer_id' => $input['computer_id']
        ], 201);
    }
    
} catch (Exception $e) {
    Utils::logActivity("Registration error: " . $e->getMessage(), 'ERROR');
    Utils::jsonResponse(['error' => 'Erro interno do servidor'], 500);
}
?>
