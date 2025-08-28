<?php
/**
 * Script para atualizar senha do administrador
 * Execute uma vez e depois delete este arquivo
 */

require_once 'includes/config.php';

try {
    $db = new Database();
    
    // Gerar novo hash para admin123
    $newHash = password_hash('admin123', PASSWORD_DEFAULT);
    
    // Atualizar no banco
    $updated = $db->execute(
        "UPDATE administrators SET password_hash = ? WHERE username = 'admin'",
        [$newHash]
    );
    
    if ($updated > 0) {
        echo "✅ Senha atualizada com sucesso!<br>";
        echo "🔑 Login: admin<br>";
        echo "🗝️ Senha: admin123<br>";
        echo "📝 Hash usado: " . htmlspecialchars($newHash) . "<br><br>";
        echo "⚠️ IMPORTANTE: Delete este arquivo (update_password.php) por segurança!";
    } else {
        echo "❌ Nenhum registro foi atualizado. Verificando se usuário existe...<br>";
        
        $user = $db->fetchOne("SELECT * FROM administrators WHERE username = 'admin'");
        if ($user) {
            echo "👤 Usuário admin encontrado:<br>";
            echo "ID: " . $user['id'] . "<br>";
            echo "Email: " . $user['email'] . "<br>";
            echo "Ativo: " . ($user['is_active'] ? 'Sim' : 'Não') . "<br>";
        } else {
            echo "❌ Usuário admin não encontrado. Criando usuário...<br>";
            
            $inserted = $db->execute(
                "INSERT INTO administrators (username, email, password_hash, full_name, is_active) VALUES (?, ?, ?, ?, ?)",
                ['admin', 'admin@worktrack.com', $newHash, 'Administrador do Sistema', 1]
            );
            
            if ($inserted) {
                echo "✅ Usuário admin criado com sucesso!<br>";
            } else {
                echo "❌ Erro ao criar usuário admin<br>";
            }
        }
    }
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "<br>";
    echo "📋 Detalhes técnicos: " . $e->getTraceAsString();
}
?>
