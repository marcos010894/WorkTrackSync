<?php
require_once 'includes/config.php';

$auth = new Auth();
$auth->requireLogin();

$db = new Database();

// Estatísticas gerais
$stats = [
    'total_computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers")['count'],
    'online_computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers WHERE is_online = 1")['count'],
    'offline_computers' => $db->fetchOne("SELECT COUNT(*) as count FROM computers WHERE is_online = 0")['count'],
    'total_usage_today' => $db->fetchOne("SELECT COALESCE(SUM(total_minutes), 0) as total FROM daily_sessions WHERE session_date = CURDATE()")['total']
];

$currentUser = $auth->getCurrentUser();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WorkTrack Admin - Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/chart-fix.css">
</head>
<body class="bg-gray-100">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform -translate-x-full transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0" id="sidebar">
        <div class="flex items-center justify-center h-16 bg-indigo-600">
            <h1 class="text-white text-xl font-bold">
                <i class="fas fa-desktop mr-2"></i>WorkTrack
            </h1>
        </div>
        
        <nav class="mt-5 px-2">
            <a href="#dashboard" class="nav-item active" onclick="showSection('dashboard')">
                <i class="fas fa-tachometer-alt mr-3"></i>Dashboard
            </a>
            <a href="#computers" class="nav-item" onclick="showSection('computers')">
                <i class="fas fa-desktop mr-3"></i>Computadores
            </a>
            <a href="#activity" class="nav-item" onclick="showSection('activity')">
                <i class="fas fa-eye mr-3"></i>Atividade Atual
            </a>
            <a href="#reports" class="nav-item" onclick="showSection('reports')">
                <i class="fas fa-file-alt mr-3"></i>Relatórios
            </a>
        </nav>
        
        <div class="absolute bottom-0 left-0 right-0 p-4">
            <div class="bg-gray-50 rounded-lg p-3 text-sm">
                <div class="font-medium text-gray-900"><?= htmlspecialchars($currentUser['name']) ?></div>
                <div class="text-gray-500"><?= htmlspecialchars($currentUser['username']) ?></div>
                <button onclick="logout()" class="mt-2 text-red-600 hover:text-red-800">
                    <i class="fas fa-sign-out-alt mr-1"></i>Sair
                </button>
            </div>
        </div>
    </div>

    <!-- Mobile menu button -->
    <div class="lg:hidden">
        <button onclick="toggleSidebar()" class="fixed top-4 left-4 z-50 bg-indigo-600 text-white p-2 rounded-md">
            <i class="fas fa-bars"></i>
        </button>
    </div>

    <!-- Main Content -->
    <div class="lg:ml-64 min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
                <h2 id="pageTitle" class="text-2xl font-bold text-gray-900">Dashboard</h2>
                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <div class="absolute -inset-1">
                            <div class="w-full h-full mx-auto lg:mx-0 opacity-30 blur-lg bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        </div>
                        <div class="relative flex items-center space-x-2 bg-white px-3 py-2 rounded-lg">
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <span class="ml-2 text-sm text-gray-600">Tempo Real</span>
                            </div>
                        </div>
                    </div>
                    <span class="text-sm text-gray-500" id="currentTime"></span>
                </div>
            </div>
        </header>

        <!-- Dashboard Section -->
        <div id="section-dashboard" class="section active p-6">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="stats-card">
                    <div class="stats-icon bg-blue-500">
                        <i class="fas fa-desktop"></i>
                    </div>
                    <div>
                        <p class="stats-label">Total de Computadores</p>
                        <p class="stats-value" id="totalComputers"><?= $stats['total_computers'] ?></p>
                    </div>
                </div>

                <div class="stats-card">
                    <div class="stats-icon bg-green-500">
                        <i class="fas fa-circle"></i>
                    </div>
                    <div>
                        <p class="stats-label">Online</p>
                        <p class="stats-value" id="onlineComputers"><?= $stats['online_computers'] ?></p>
                    </div>
                </div>

                <div class="stats-card">
                    <div class="stats-icon bg-red-500">
                        <i class="fas fa-power-off"></i>
                    </div>
                    <div>
                        <p class="stats-label">Offline</p>
                        <p class="stats-value" id="offlineComputers"><?= $stats['offline_computers'] ?></p>
                    </div>
                </div>

                <div class="stats-card">
                    <div class="stats-icon bg-purple-500">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div>
                        <p class="stats-label">Tempo Hoje</p>
                        <p class="stats-value" id="totalUsageToday"><?= Utils::formatTime($stats['total_usage_today']) ?></p>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- Usage Chart -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Uso por Dia (Última Semana)</h3>
                    <canvas id="usageChart" height="200"></canvas>
                </div>

                <!-- Computer Status Chart -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Status dos Computadores</h3>
                    <canvas id="statusChart" height="200"></canvas>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">Atividade Recente</h3>
                </div>
                <div class="p-6">
                    <div id="recentActivity" class="space-y-4">
                        <!-- Conteúdo carregado via AJAX -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Computers Section -->
        <div id="section-computers" class="section p-6">
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-900">Gerenciamento de Computadores</h3>
                    <button onclick="refreshComputers()" class="btn-primary">
                        <i class="fas fa-sync-alt mr-2"></i>Atualizar
                    </button>
                </div>
                <div class="p-6">
                    <!-- Filtros -->
                    <div class="mb-4 flex flex-wrap gap-4">
                        <select id="statusFilter" onchange="filterComputers()" class="form-select">
                            <option value="">Todos os Status</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                        </select>
                        <input type="text" id="searchComputers" placeholder="Buscar computador..." 
                               class="form-input" onkeyup="filterComputers()">
                    </div>
                    
                    <!-- Tabela de Computadores -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="table-header">Computador</th>
                                    <th class="table-header">Usuário</th>
                                    <th class="table-header">Status</th>
                                    <th class="table-header">Última Atividade</th>
                                    <th class="table-header">Tempo Hoje</th>
                                    <th class="table-header">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="computersTable">
                                <!-- Conteúdo carregado via AJAX -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Activity Section -->
        <div id="section-activity" class="section p-6" style="display: none;">
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Atividade Atual dos Computadores</h3>
                        <p class="text-sm text-gray-500">
                            Atualização automática a cada 20 segundos
                            <span id="activityTimer" class="ml-2 font-mono"></span>
                        </p>
                    </div>
                    <button onclick="refreshActivity()" class="btn-primary">
                        <i class="fas fa-sync-alt mr-2"></i>Atualizar
                    </button>
                </div>
                <div class="p-6">
                    <div id="activityData">
                        <div class="text-center py-8">
                            <p class="text-gray-600">Clique em "Atualizar" para carregar as atividades</p>
                            <button onclick="refreshActivity()" class="mt-4 btn-primary">
                                <i class="fas fa-sync-alt mr-2"></i>Carregar Atividades
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Reports Section -->
        <div id="section-reports" class="section p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Filtros de Relatório -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Filtros de Relatório</h3>
                    </div>
                    <div class="p-6">
                        <div class="space-y-4">
                            <div>
                                <label class="form-label">Período:</label>
                                <select id="reportPeriod" class="form-select">
                                    <option value="today">Hoje</option>
                                    <option value="yesterday">Ontem</option>
                                    <option value="week">Esta Semana</option>
                                    <option value="month">Este Mês</option>
                                    <option value="custom">Período Personalizado</option>
                                </select>
                            </div>
                            <div id="customPeriod" style="display:none;" class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="form-label">Data Inicial:</label>
                                    <input type="date" id="startDate" class="form-input">
                                </div>
                                <div>
                                    <label class="form-label">Data Final:</label>
                                    <input type="date" id="endDate" class="form-input">
                                </div>
                            </div>
                            <div>
                                <label class="form-label">Computador:</label>
                                <select id="reportComputer" class="form-select">
                                    <option value="">Todos os Computadores</option>
                                </select>
                            </div>
                            <button onclick="generateReport()" class="btn-primary">
                                <i class="fas fa-chart-line mr-2"></i>Gerar Relatório
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Estatísticas Rápidas -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Estatísticas do Período</h3>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600" id="totalHours">0h</div>
                                <div class="text-sm text-gray-500">Total de Horas</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-green-600" id="avgDaily">0h</div>
                                <div class="text-sm text-gray-500">Média Diária</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-purple-600" id="mostUsedDay">-</div>
                                <div class="text-sm text-gray-500">Dia Mais Usado</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-orange-600" id="productivity">0%</div>
                                <div class="text-sm text-gray-500">Produtividade</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráficos e Tabelas -->
            <div class="grid grid-cols-1 gap-6">
                <!-- Gráfico de Uso por Dia -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Uso por Dia</h3>
                    </div>
                    <div class="p-6">
                        <canvas id="dailyUsageChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Tabela de Sessões Detalhadas -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-900">Sessões Detalhadas</h3>
                        <button onclick="exportReport()" class="btn-secondary">
                            <i class="fas fa-download mr-2"></i>Exportar CSV
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th class="table-header">Data</th>
                                    <th class="table-header">Computador</th>
                                    <th class="table-header">Início</th>
                                    <th class="table-header">Fim</th>
                                    <th class="table-header">Duração</th>
                                    <th class="table-header">Aplicações</th>
                                </tr>
                            </thead>
                            <tbody id="sessionsTable">
                                <tr>
                                    <td colspan="6" class="table-cell text-center text-gray-500">
                                        Selecione um período para visualizar as sessões
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Top Aplicações -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Aplicações Mais Usadas</h3>
                    </div>
                    <div class="p-6">
                        <div id="topApplications">
                            <div class="text-center text-gray-500 py-8">
                                Gere um relatório para ver as aplicações mais usadas
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Command Modal -->
    <div id="commandModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Enviar Comando</h3>
                <button onclick="closeModal('commandModal')" class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="commandForm" onsubmit="sendCommand(event)">
                    <input type="hidden" id="targetComputerId">
                    
                    <div class="mb-4">
                        <label class="form-label">Tipo de Comando</label>
                        <select id="commandType" class="form-select" onchange="toggleCommandData()">
                            <option value="lock">Bloquear Tela</option>
                            <option value="restart">Reiniciar</option>
                            <option value="shutdown">Desligar</option>
                        </select>
                    </div>
                    
                    <div id="messageData" class="mb-4" style="display: none;">
                        <label class="form-label">Mensagem</label>
                        <textarea id="commandMessage" class="form-textarea" rows="3" 
                                  placeholder="Digite a mensagem para o usuário..."></textarea>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="closeModal('commandModal')" class="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-paper-plane mr-2"></i>Enviar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <script src="assets/js/dashboard.js"></script>
    <script src="assets/js/websocket-client.js"></script>
    <script>
        // Carregar SSE client se estiver no Vercel
        if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.com')) {
            const sseScript = document.createElement('script');
            sseScript.src = '/api/sse-client.js';
            sseScript.onerror = () => {
                console.log('📡 Usando SSE client local');
                const localScript = document.createElement('script');
                localScript.src = 'assets/js/sse-client.js';
                document.head.appendChild(localScript);
            };
            document.head.appendChild(sseScript);
        }
    </script>
</body>
</html>
