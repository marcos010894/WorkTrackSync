<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WorkTrack Admin - Login</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .glass-effect {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
    </style>
</head>
<body class="gradient-bg min-h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
        <!-- Logo e Título -->
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                <i class="fas fa-desktop text-2xl text-indigo-600"></i>
            </div>
            <h1 class="text-3xl font-bold text-white mb-2">WorkTrack Sync</h1>
            <p class="text-indigo-100">Painel Administrativo</p>
        </div>

        <!-- Formulário de Login -->
        <div class="glass-effect rounded-2xl shadow-xl p-8">
            <form id="loginForm" onsubmit="handleLogin(event)">
                <div class="mb-6">
                    <label for="username" class="block text-sm font-medium text-white mb-2">
                        <i class="fas fa-user mr-2"></i>Usuário
                    </label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white bg-opacity-90"
                        placeholder="Digite seu usuário"
                    >
                </div>

                <div class="mb-6">
                    <label for="password" class="block text-sm font-medium text-white mb-2">
                        <i class="fas fa-lock mr-2"></i>Senha
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white bg-opacity-90"
                        placeholder="Digite sua senha"
                    >
                </div>

                <div class="mb-6">
                    <label class="flex items-center">
                        <input type="checkbox" class="rounded border-gray-300 text-indigo-600">
                        <span class="ml-2 text-sm text-white">Lembrar-me</span>
                    </label>
                </div>

                <button 
                    type="submit" 
                    id="loginBtn"
                    class="w-full bg-white text-indigo-600 py-3 px-4 rounded-lg font-semibold hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                >
                    <i class="fas fa-sign-in-alt mr-2"></i>Entrar
                </button>
            </form>

            <!-- Mensagem de erro -->
            <div id="errorMessage" class="hidden mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span id="errorText"></span>
            </div>

            <!-- Loading -->
            <div id="loadingMessage" class="hidden mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-center">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Autenticando...
            </div>
        </div>

        <!-- Informações do Sistema -->
        <div class="text-center mt-8 text-indigo-100 text-sm">
            <p>
                <i class="fas fa-shield-alt mr-1"></i>
                Sistema seguro de monitoramento
            </p>
            <p class="mt-2">
                <strong>Credenciais padrão:</strong><br>
                Usuário: admin | Senha: admin123
            </p>
        </div>
    </div>

    <script>
        async function handleLogin(event) {
            event.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('loginBtn');
            const errorMessage = document.getElementById('errorMessage');
            const loadingMessage = document.getElementById('loadingMessage');
            
            // Reset UI
            errorMessage.classList.add('hidden');
            loadingMessage.classList.remove('hidden');
            loginBtn.disabled = true;
            
            try {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                formData.append('action', 'login');
                
                const response = await fetch('auth.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.location.href = 'dashboard.php';
                } else {
                    showError(result.message || 'Erro ao fazer login');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                showError('Erro de conexão. Tente novamente.');
            } finally {
                loadingMessage.classList.add('hidden');
                loginBtn.disabled = false;
            }
        }
        
        function showError(message) {
            const errorMessage = document.getElementById('errorMessage');
            const errorText = document.getElementById('errorText');
            
            errorText.textContent = message;
            errorMessage.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorMessage.classList.add('hidden');
            }, 5000);
        }
        
        // Focus no primeiro campo
        document.getElementById('username').focus();
        
        // Enter key navigation
        document.getElementById('username').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('password').focus();
            }
        });
    </script>
</body>
</html>
