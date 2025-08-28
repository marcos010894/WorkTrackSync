<?php
/**
 * Autenticação de usuários
 */

require_once 'includes/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Utils::jsonResponse(['success' => false, 'message' => 'Método não permitido'], 405);
}

$action = $_POST['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    default:
        Utils::jsonResponse(['success' => false, 'message' => 'Ação inválida'], 400);
}

function handleLogin() {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        Utils::jsonResponse(['success' => false, 'message' => 'Usuário e senha são obrigatórios']);
    }
    
    $auth = new Auth();
    
    if ($auth->login($username, $password)) {
        Utils::logActivity("Login successful: $username");
        Utils::jsonResponse(['success' => true, 'message' => 'Login realizado com sucesso']);
    } else {
        Utils::logActivity("Login failed: $username", 'WARNING');
        Utils::jsonResponse(['success' => false, 'message' => 'Usuário ou senha inválidos']);
    }
}

function handleLogout() {
    $auth = new Auth();
    $currentUser = $auth->getCurrentUser();
    
    if ($currentUser) {
        Utils::logActivity("Logout: {$currentUser['username']}");
    }
    
    $auth->logout();
    Utils::jsonResponse(['success' => true, 'message' => 'Logout realizado com sucesso']);
}
?>
