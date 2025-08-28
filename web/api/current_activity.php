<?php
/**
 * API: Buscar dados de atividade atual dos computadores
 * Retorna programas em execução e janela ativa
 */

require_once 'cors.php';
require_once '../includes/config.php';

try {
    $db = new Database();
    
    // Buscar todos os computadores online com seus programas ativos
    $computers = $db->fetchAll(
        "SELECT 
            c.computer_id,
            c.computer_name,
            c.user_name,
            c.last_activity,
            c.is_online
         FROM computers c 
         WHERE c.is_online = 1
         ORDER BY c.last_activity DESC"
    );
    
    $result = [];
    
    foreach ($computers as $computer) {
        // Buscar programas em execução
        $programs = $db->fetchAll(
            "SELECT 
                program_name,
                window_title,
                start_time,
                captured_at
             FROM running_programs 
             WHERE computer_id = ? AND is_active = 1
             ORDER BY captured_at DESC",
            [$computer['computer_id']]
        );
        
        // Identificar janela ativa (o mais recente com window_title)
        $activeWindow = null;
        foreach ($programs as $program) {
            if (!empty($program['window_title']) && $program['window_title'] !== $program['program_name']) {
                $activeWindow = [
                    'program_name' => $program['program_name'],
                    'window_title' => $program['window_title'],
                    'captured_at' => $program['captured_at']
                ];
                break;
            }
        }
        
        $result[] = [
            'computer_id' => $computer['computer_id'],
            'computer_name' => $computer['computer_name'],
            'user_name' => $computer['user_name'],
            'last_activity' => $computer['last_activity'],
            'is_online' => (bool)$computer['is_online'],
            'running_programs' => array_slice($programs, 0, 10), // Máximo 10 programas
            'active_window' => $activeWindow,
            'total_programs' => count($programs)
        ];
    }
    
    Utils::jsonResponse([
        'status' => 'success',
        'data' => $result,
        'total_computers' => count($result),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    Utils::jsonResponse([
        'status' => 'error',
        'message' => 'Erro ao buscar dados de atividade: ' . $e->getMessage()
    ], 500);
}
