<?php
/**
 * API: Comandos remotos
 */

require_once '../includes/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Computer-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $computerIdFromHeader = $_SERVER['HTTP_X_COMPUTER_ID'] ?? null;
    $computerIdFromParam = $_GET['computer_id'] ?? null;
    
    // Para POST, decodificar JSON e tentar pegar computer_id do body
    $input = null;
    $computerIdFromBody = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $computerIdFromBody = $input['computer_id'] ?? null;
    }
    
    $computerId = $computerIdFromHeader ?: $computerIdFromParam ?: $computerIdFromBody;
    
    if (empty($computerId)) {
        Utils::jsonResponse(['error' => 'Computer ID obrigatório'], 400);
    }
    
    if (!Utils::validateComputerId($computerId)) {
        Utils::jsonResponse(['error' => 'Computer ID inválido'], 400);
    }
    
    $db = new Database();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Buscar comandos pendentes
        $commands = $db->fetchAll(
            "SELECT id, command_type, command_data, sent_at 
             FROM remote_commands 
             WHERE computer_id = ? AND status = 'pending' 
             ORDER BY sent_at ASC",
            [$computerId]
        );
        
        // Marcar comandos como enviados
        if (!empty($commands)) {
            $commandIds = array_column($commands, 'id');
            $placeholders = str_repeat('?,', count($commandIds) - 1) . '?';
            
            $db->execute(
                "UPDATE remote_commands SET status = 'sent' WHERE id IN ($placeholders)",
                $commandIds
            );
        }
        
        Utils::jsonResponse($commands);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Para administradores enviarem comandos (requer autenticação)
        $auth = new Auth();
        $auth->requireLogin();
        
        // Usar $input já decodificado anteriormente
        if (!$input || empty($input['command_type'])) {
            Utils::jsonResponse(['error' => 'Tipo de comando obrigatório'], 400);
        }
        
        $allowedCommands = ['lock', 'unlock', 'restart', 'shutdown', 'message'];
        if (!in_array($input['command_type'], $allowedCommands)) {
            Utils::jsonResponse(['error' => 'Tipo de comando inválido'], 400);
        }
        
        // Verificar se computador existe e está online
        $computer = $db->fetchOne(
            "SELECT id, computer_name, is_online 
             FROM computers 
             WHERE computer_id = ?",
            [$computerId]
        );
        
        if (!$computer) {
            Utils::jsonResponse(['error' => 'Computador não encontrado'], 404);
        }
        
        if (!$computer['is_online']) {
            Utils::jsonResponse(['error' => 'Computador está offline'], 400);
        }
        
        // Inserir comando
        $commandId = $db->execute(
            "INSERT INTO remote_commands (
                computer_id, command_type, command_data, sent_by, sent_at
            ) VALUES (?, ?, ?, ?, NOW())",
            [
                $computerId,
                $input['command_type'],
                $input['command_data'] ?? null,
                $_SESSION['admin_id']
            ]
        );
        
        Utils::logActivity(
            "Remote command sent: {$input['command_type']} to {$computer['computer_name']} by {$_SESSION['admin_username']}"
        );
        
        Utils::jsonResponse([
            'status' => 'ok',
            'message' => 'Comando enviado com sucesso',
            'command_id' => $db->lastInsertId()
        ], 201);
    }
    
} catch (Exception $e) {
    Utils::logActivity("Commands error: " . $e->getMessage(), 'ERROR');
    Utils::jsonResponse(['error' => 'Erro interno do servidor'], 500);
}
?>
