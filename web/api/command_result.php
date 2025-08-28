<?php
/**
 * API: Resultado de comandos remotos
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
    
    if (!$input || empty($input['command_id'])) {
        Utils::jsonResponse(['error' => 'Command ID obrigatório'], 400);
    }
    
    if (!isset($input['result']) || !is_array($input['result'])) {
        Utils::jsonResponse(['error' => 'Resultado obrigatório'], 400);
    }
    
    $db = new Database();
    
    // Verificar se comando existe
    $command = $db->fetchOne(
        "SELECT id, computer_id, command_type FROM remote_commands WHERE id = ?",
        [$input['command_id']]
    );
    
    if (!$command) {
        Utils::jsonResponse(['error' => 'Comando não encontrado'], 404);
    }
    
    // Atualizar status do comando
    $status = $input['result']['status'] === 'success' ? 'executed' : 'failed';
    
    $db->execute(
        "UPDATE remote_commands SET 
            status = ?, 
            executed_at = ?, 
            response_data = ? 
         WHERE id = ?",
        [
            $status,
            $input['executed_at'] ?? date('Y-m-d H:i:s'),
            json_encode($input['result']),
            $input['command_id']
        ]
    );
    
    // Registrar atividade
    $db->execute(
        "INSERT INTO activity_logs (computer_id, activity_type, activity_data) 
         VALUES (?, 'command_received', ?)",
        [
            $command['computer_id'],
            json_encode([
                'command_id' => $input['command_id'],
                'command_type' => $command['command_type'],
                'result' => $input['result'],
                'executed_at' => $input['executed_at'] ?? date('Y-m-d H:i:s')
            ])
        ]
    );
    
    Utils::logActivity(
        "Command result received: {$command['command_type']} ({$input['command_id']}) - Status: {$status}"
    );
    
    Utils::jsonResponse([
        'status' => 'ok',
        'message' => 'Resultado recebido com sucesso'
    ]);
    
} catch (Exception $e) {
    Utils::logActivity("Command result error: " . $e->getMessage(), 'ERROR');
    Utils::jsonResponse(['error' => 'Erro interno do servidor'], 500);
}
?>
