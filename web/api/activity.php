<?php
/**
 * API: Dados de atividade (programas em execução)
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
    
    // Verificar se computador existe
    $computer = $db->fetchOne(
        "SELECT id FROM computers WHERE computer_id = ?",
        [$input['computer_id']]
    );
    
    if (!$computer) {
        Utils::jsonResponse(['error' => 'Computador não registrado'], 404);
    }
    
    $db->beginTransaction();
    
    try {
        // Atualizar sessão diária
        if (isset($input['session_date']) && isset($input['usage_minutes'])) {
            $db->execute(
                "INSERT INTO daily_sessions (computer_id, session_date, total_minutes, updated_at) 
                 VALUES (?, ?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE 
                 total_minutes = GREATEST(total_minutes, VALUES(total_minutes)),
                 updated_at = NOW()",
                [
                    $input['computer_id'],
                    $input['session_date'],
                    intval($input['usage_minutes'])
                ]
            );
        }
        
        // Marcar programas anteriores como inativos
        $db->execute(
            "UPDATE running_programs SET 
                is_active = 0, 
                end_time = NOW(),
                duration_minutes = TIMESTAMPDIFF(MINUTE, start_time, NOW())
             WHERE computer_id = ? AND is_active = 1",
            [$input['computer_id']]
        );
        
        // Processar programas em execução
        if (isset($input['running_programs']) && is_array($input['running_programs'])) {
            foreach ($input['running_programs'] as $program) {
                if (empty($program['name'])) continue;
                
                $db->execute(
                    "INSERT INTO running_programs (
                        computer_id, program_name, program_path, 
                        window_title, start_time, is_active, captured_at
                    ) VALUES (?, ?, ?, ?, ?, 1, NOW())",
                    [
                        $input['computer_id'],
                        $program['name'],
                        $program['path'] ?? null,
                        null, // window_title será preenchido separadamente
                        $program['start_time'] ?? date('Y-m-d H:i:s'),
                    ]
                );
            }
        }
        
        // Processar janela ativa
        if (isset($input['active_window']) && is_array($input['active_window'])) {
            $activeWindow = $input['active_window'];
            
            if (!empty($activeWindow['program_name'])) {
                // Atualizar programa ativo com informações da janela
                $db->execute(
                    "UPDATE running_programs SET 
                        window_title = ?
                     WHERE computer_id = ? AND program_name = ? AND is_active = 1 
                     ORDER BY captured_at DESC LIMIT 1",
                    [
                        $activeWindow['window_title'] ?? $activeWindow['program_name'],
                        $input['computer_id'],
                        $activeWindow['program_name']
                    ]
                );
            }
        }
        
        // Registrar atividade
        $db->execute(
            "INSERT INTO activity_logs (computer_id, activity_type, activity_data) 
             VALUES (?, 'program_start', ?)",
            [
                $input['computer_id'],
                json_encode([
                    'programs_count' => count($input['running_programs'] ?? []),
                    'active_window' => $input['active_window'] ?? null,
                    'timestamp' => $input['timestamp'] ?? date('Y-m-d H:i:s')
                ])
            ]
        );
        
        $db->commit();
        
        Utils::jsonResponse([
            'status' => 'ok',
            'message' => 'Dados de atividade recebidos',
            'programs_processed' => count($input['running_programs'] ?? [])
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    Utils::logActivity("Activity data error: " . $e->getMessage(), 'ERROR');
    Utils::jsonResponse(['error' => 'Erro interno do servidor'], 500);
}
?>
