// WorkTrack Dashboard JavaScript

let charts = {};
let refreshInterval;
let activityRefreshInterval;
let activityTimerInterval;
let statusCheckInterval;
let currentSection = 'dashboard';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Verificar e corrigir canvas problemáticos
    fixCanvasSize();

    initializeDashboard();
    startAutoRefresh();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

function fixCanvasSize() {
    // Corrigir canvas com altura excessiva
    const canvasElements = document.querySelectorAll('canvas');
    canvasElements.forEach(canvas => {
        if (canvas.height > 400 || canvas.style.height === '23784px') {
            console.warn(`Canvas ${canvas.id} com altura excessiva detectado: ${canvas.height}px, corrigindo...`);
            canvas.height = 200;
            canvas.style.height = '200px';
            canvas.style.maxHeight = '200px';
            canvas.width = canvas.parentElement.clientWidth || 600;
        }
    });
}

function initializeDashboard() {
    // Load initial data
    loadDashboardData();
    loadComputers();

    // Initialize charts
    initializeCharts();
}

function startAutoRefresh() {
    // Refresh otimizado - menos frequente para evitar travamentos
    refreshInterval = setInterval(function() {
        // Só atualizar se a aba estiver visível
        if (!document.hidden) {
            if (currentSection === 'dashboard') {
                loadDashboardData();
            } else if (currentSection === 'computers') {
                loadComputers();
            }
        }
    }, 60000); // 60 segundos para dashboard e computadores

    // Refresh específico para atividade atual - mais frequente
    activityRefreshInterval = setInterval(function() {
        if (!document.hidden && currentSection === 'activity') {
            refreshActivity();
        }
    }, 20000); // 20 segundos para atividade atual

    // Pausar atualização quando aba não estiver visível
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
            if (activityRefreshInterval) {
                clearInterval(activityRefreshInterval);
                activityRefreshInterval = null;
            }
            if (activityTimerInterval) {
                clearInterval(activityTimerInterval);
                activityTimerInterval = null;
            }
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
                statusCheckInterval = null;
            }
        } else {
            if (!refreshInterval) {
                startAutoRefresh();
            }
            if (currentSection === 'activity') {
                loadActivity(); // Recarregar atividade e iniciar timers
            }
            // Reiniciar verificação de status
            if (!statusCheckInterval) {
                statusCheckInterval = setInterval(checkComputerStatus, 20000);
            }
        }
    });
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    document.getElementById(`section-${sectionName}`).classList.add('active');

    // Add active class to nav item
    event.target.classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'computers': 'Computadores',
        'activity': 'Atividades',
        'reports': 'Relatórios',
        'settings': 'Configurações'
    };

    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';

    // Parar refresh de atividade se sair da seção activity
    if (currentSection === 'activity' && sectionName !== 'activity') {
        if (activityRefreshInterval) {
            clearInterval(activityRefreshInterval);
            activityRefreshInterval = null;
        }
        if (activityTimerInterval) {
            clearInterval(activityTimerInterval);
            activityTimerInterval = null;
        }
    }

    currentSection = sectionName;

    // Load section-specific data
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'computers':
            loadComputers();
            break;
        case 'activity':
            loadActivity();
            break;
        case 'reports':
            loadReports();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Activity loading function
function loadActivity() {
    console.log('Loading activity data...');
    refreshActivity();

    // Iniciar auto-refresh para atividade se ainda não estiver rodando
    if (!activityRefreshInterval) {
        activityRefreshInterval = setInterval(function() {
            if (!document.hidden && currentSection === 'activity') {
                refreshActivity();
            }
        }, 20000); // 20 segundos
    }

    // Iniciar timer visual
    startActivityTimer();
}

function startActivityTimer() {
    let seconds = 20;

    const updateTimer = () => {
        const timerElement = document.getElementById('activityTimer');
        if (timerElement && currentSection === 'activity') {
            timerElement.textContent = `(próxima atualização em ${seconds}s)`;
            seconds--;

            if (seconds < 0) {
                seconds = 20;
            }
        }
    };

    // Parar timer anterior se existir
    if (activityTimerInterval) {
        clearInterval(activityTimerInterval);
    }

    // Iniciar novo timer
    updateTimer();
    activityTimerInterval = setInterval(updateTimer, 1000);
}

// Dashboard data loading - OTIMIZADO
let dashboardDataCache = null;
let lastDataLoad = 0;
const CACHE_DURATION = 30000; // 30 segundos

async function loadDashboardData() {
    // Verificar cache
    const now = Date.now();
    if (dashboardDataCache && (now - lastDataLoad) < CACHE_DURATION) {
        updateDashboardWithData(dashboardDataCache);
        return;
    }

    try {
        // Adicionar timeout para evitar travamentos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        const response = await fetch('api/dashboard_data.php', {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            dashboardDataCache = data;
            lastDataLoad = now;
            updateDashboardWithData(data);
        } else {
            console.error('API returned error:', data.error);
            showErrorMessage('Erro ao carregar dados do dashboard');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessage('Erro de conexão - tentando novamente...');

        // Tentar novamente em 5 segundos se for erro de rede
        if (error.name === 'AbortError' || error.name === 'TypeError') {
            setTimeout(loadDashboardData, 5000);
        }
    }
}

function updateDashboardWithData(data) {
    updateDashboardStats(data.stats);
    updateRecentActivity(data.recent_activity);
    updateCharts(data.charts);
}

function showErrorMessage(message) {
    // Mostrar erro na interface se necessário
    console.warn(message);
}

function updateDashboardStats(stats) {
    document.getElementById('totalComputers').textContent = stats.total_computers;
    document.getElementById('onlineComputers').textContent = stats.online_computers;
    document.getElementById('offlineComputers').textContent = stats.offline_computers;
    document.getElementById('totalUsageToday').textContent = stats.total_usage_today;
}

function updateRecentActivity(activities) {
    const container = document.getElementById('recentActivity');

    if (activities.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma atividade recente</p>';
        return;
    }

    const activityHtml = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon bg-${getActivityColor(activity.type)}">
                <i class="fas fa-${getActivityIcon(activity.type)} text-white text-sm"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${activity.time_ago}</div>
        </div>
    `).join('');

    container.innerHTML = activityHtml;
}

function getActivityColor(type) {
    const colors = {
        'login': 'green-500',
        'logout': 'red-500',
        'heartbeat': 'blue-500',
        'command': 'purple-500',
        'register': 'indigo-500'
    };
    return colors[type] || 'gray-500';
}

function getActivityIcon(type) {
    const icons = {
        'login': 'sign-in-alt',
        'logout': 'sign-out-alt',
        'heartbeat': 'heartbeat',
        'command': 'terminal',
        'register': 'desktop'
    };
    return icons[type] || 'info';
}

// Charts initialization
function initializeCharts() {
    // Usage Chart
    const usageCtx = document.getElementById('usageChart');
    if (usageCtx) {
        // Definir altura fixa para evitar travamentos
        usageCtx.style.maxHeight = '200px';
        usageCtx.height = 200;

        charts.usage = new Chart(usageCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Horas de Uso',
                    data: [],
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 24, // Máximo 24 horas
                        ticks: {
                            callback: function(value) {
                                return value + 'h';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Status Chart
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        // Definir altura fixa para evitar travamentos
        statusCtx.style.maxHeight = '200px';
        statusCtx.height = 200;

        charts.status = new Chart(statusCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Online', 'Offline'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#10B981', '#EF4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function updateCharts(chartData) {
    try {
        // Atualizar gráfico de uso com verificação de segurança
        if (chartData.usage && charts.usage && chartData.usage.labels && chartData.usage.data) {
            // Limitar dados para evitar travamentos
            const maxDataPoints = 7;
            const labels = chartData.usage.labels.slice(-maxDataPoints);
            const data = chartData.usage.data.slice(-maxDataPoints);

            // Verificar se o canvas não tem altura excessiva
            const usageCanvas = document.getElementById('usageChart');
            if (usageCanvas && usageCanvas.height > 400) {
                console.warn('Canvas altura excessiva detectada, resetando...');
                usageCanvas.height = 200;
                usageCanvas.style.height = '200px';
            }

            charts.usage.data.labels = labels;
            charts.usage.data.datasets[0].data = data;
            charts.usage.update('none'); // Atualização sem animação para performance
        }

        // Atualizar gráfico de status com verificação de segurança
        if (chartData.status && charts.status && chartData.status.data) {
            // Verificar se o canvas não tem altura excessiva
            const statusCanvas = document.getElementById('statusChart');
            if (statusCanvas && statusCanvas.height > 400) {
                console.warn('Canvas altura excessiva detectada, resetando...');
                statusCanvas.height = 200;
                statusCanvas.style.height = '200px';
            }

            charts.status.data.datasets[0].data = chartData.status.data;
            charts.status.update('none'); // Atualização sem animação para performance
        }
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);

        // Em caso de erro, tentar recriar os gráficos
        try {
            if (charts.usage) {
                charts.usage.destroy();
            }
            if (charts.status) {
                charts.status.destroy();
            }
            setTimeout(() => {
                initializeCharts();
            }, 1000);
        } catch (recreateError) {
            console.error('Erro ao recriar gráficos:', recreateError);
        }
    }
}

// Computer management
async function loadComputers() {
    try {
        const response = await fetch('api/computers.php');
        const data = await response.json();

        if (data.success) {
            updateComputersTable(data.computers);
        }
    } catch (error) {
        console.error('Error loading computers:', error);
    }
}

function updateComputersTable(computers) {
    const tbody = document.getElementById('computersTable');

    if (computers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">Nenhum computador encontrado</td></tr>';
        return;
    }

    const rows = computers.map(computer => `
        <tr class="hover:bg-gray-50">
            <td class="table-cell">
                <div class="flex items-center">
                    <i class="fas fa-desktop mr-2 text-gray-400"></i>
                    <div>
                        <div class="font-medium">${computer.computer_name}</div>
                        <div class="text-gray-500 text-xs">${computer.os_info}</div>
                    </div>
                </div>
            </td>
            <td class="table-cell">
                <div class="flex items-center">
                    <i class="fas fa-user mr-2 text-gray-400"></i>
                    ${computer.user_name}
                </div>
            </td>
            <td class="table-cell">
                <span class="status-${computer.is_online ? 'online' : 'offline'}">
                    <i class="fas fa-circle mr-1 text-xs"></i>
                    ${computer.is_online ? 'Online' : 'Offline'}
                </span>
            </td>
            <td class="table-cell">
                <span class="text-gray-900">${computer.last_activity_formatted}</span>
            </td>
            <td class="table-cell">
                <span class="font-medium">${computer.usage_today}</span>
            </td>
            <td class="table-cell">
                <div class="flex space-x-2">
                    ${computer.is_online ? `
                        <button onclick="openCommandModal('${computer.computer_id}')" class="btn-warning" title="Enviar Comando">
                            <i class="fas fa-terminal"></i>
                        </button>
                    ` : ''}
                    <button onclick="viewComputerDetails('${computer.computer_id}')" class="btn-info" title="Detalhes">
                        <i class="fas fa-info"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = rows;
}

function filterComputers() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchComputers').value.toLowerCase();
    
    const rows = document.querySelectorAll('#computersTable tr');
    
    rows.forEach(row => {
        const computerName = row.querySelector('td:first-child')?.textContent.toLowerCase() || '';
        const userName = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        const status = row.querySelector('.status-online, .status-offline')?.textContent.toLowerCase() || '';
        
        const matchesSearch = computerName.includes(searchTerm) || userName.includes(searchTerm);
        const matchesStatus = !statusFilter || status.includes(statusFilter);
        
        if (matchesSearch && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function refreshComputers() {
    const button = event.target;
    const icon = button.querySelector('i');
    
    icon.classList.add('fa-spin');
    
    loadComputers().finally(() => {
        setTimeout(() => {
            icon.classList.remove('fa-spin');
        }, 1000);
    });
}

// Command modal
function openCommandModal(computerId) {
    document.getElementById('targetComputerId').value = computerId;
    document.getElementById('commandType').value = 'lock';
    document.getElementById('commandMessage').value = '';
    toggleCommandData();
    showModal('commandModal');
}

function toggleCommandData() {
    const commandType = document.getElementById('commandType').value;
    const messageData = document.getElementById('messageData');
    
    if (commandType === 'message') {
        messageData.style.display = 'block';
        document.getElementById('commandMessage').required = true;
    } else {
        messageData.style.display = 'none';
        document.getElementById('commandMessage').required = false;
    }
}

async function sendCommand(event) {
    event.preventDefault();
    
    const computerId = document.getElementById('targetComputerId').value;
    const commandType = document.getElementById('commandType').value;
    const commandData = commandType === 'message' ? document.getElementById('commandMessage').value : null;
    
    try {
        const response = await fetch('api/commands.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                computer_id: computerId,
                command_type: commandType,
                command_data: commandData
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'ok') {
            showNotification('Comando enviado com sucesso!', 'success');
            closeModal('commandModal');
        } else {
            showNotification(result.error || 'Erro ao enviar comando', 'error');
        }
    } catch (error) {
        console.error('Error sending command:', error);
        showNotification('Erro de conexão', 'error');
    }
}

// Modal management
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Sidebar toggle (mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${getNotificationClass(type)}`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${getNotificationIcon(type)} mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationClass(type) {
    const classes = {
        'success': 'bg-green-500 text-white',
        'error': 'bg-red-500 text-white',
        'warning': 'bg-yellow-500 text-white',
        'info': 'bg-blue-500 text-white'
    };
    return classes[type] || classes.info;
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || icons.info;
}

// Logout
async function logout() {
    try {
        const formData = new FormData();
        formData.append('action', 'logout');
        
        await fetch('auth.php', {
            method: 'POST',
            body: formData
        });
        
        window.location.href = 'login.php';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'login.php';
    }
}

// Reports functionality
let dailyChart = null;

function loadReports() {
    // Load computers for filter
    loadComputersForFilter();
    
    // Set up period change handler
    document.getElementById('reportPeriod').addEventListener('change', function() {
        const customPeriod = document.getElementById('customPeriod');
        if (this.value === 'custom') {
            customPeriod.style.display = 'grid';
        } else {
            customPeriod.style.display = 'none';
        }
    });
}

function loadComputersForFilter() {
    fetch('api/computers.php')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('reportComputer');
            select.innerHTML = '<option value="">Todos os Computadores</option>';
            
            if (data.success && data.computers) {
                data.computers.forEach(computer => {
                    const option = document.createElement('option');
                    option.value = computer.id;
                    option.textContent = computer.computer_name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Erro ao carregar computadores:', error);
        });
}

function generateReport() {
    const period = document.getElementById('reportPeriod').value;
    const computerId = document.getElementById('reportComputer').value;
    
    let startDate, endDate;
    
    // Determine date range based on period
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    switch(period) {
        case 'today':
            startDate = endDate = today.toISOString().split('T')[0];
            break;
        case 'yesterday':
            startDate = endDate = yesterday.toISOString().split('T')[0];
            break;
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            startDate = weekStart.toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
            break;
        case 'custom':
            startDate = document.getElementById('startDate').value;
            endDate = document.getElementById('endDate').value;
            if (!startDate || !endDate) {
                showNotification('Por favor, selecione as datas inicial e final', 'warning');
                return;
            }
            break;
    }
    
    // Show loading
    showNotification('Gerando relatório...', 'info');
    
    // Fetch report data
    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        computer_id: computerId || ''
    });
    
    fetch(`api/reports.php?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateReportStats(data.stats);
                updateDailyChart(data.daily_usage);
                updateSessionsTable(data.sessions);
                updateTopApplications(data.top_apps);
                showNotification('Relatório gerado com sucesso!', 'success');
            } else {
                showNotification('Erro ao gerar relatório: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Erro ao gerar relatório:', error);
            showNotification('Erro ao gerar relatório', 'error');
        });
}

function updateReportStats(stats) {
    document.getElementById('totalHours').textContent = formatMinutes(stats.total_minutes);
    document.getElementById('avgDaily').textContent = formatMinutes(stats.avg_daily);
    document.getElementById('mostUsedDay').textContent = stats.most_used_day || '-';
    document.getElementById('productivity').textContent = stats.productivity + '%';
}

function updateDailyChart(dailyData) {
    const ctx = document.getElementById('dailyUsageChart').getContext('2d');
    
    if (dailyChart) {
        dailyChart.destroy();
    }
    
    const labels = dailyData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    const data = dailyData.map(item => Math.round(item.minutes / 60 * 100) / 100);
    
    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas de Uso',
                data: data,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Data'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateSessionsTable(sessions) {
    const tbody = document.getElementById('sessionsTable');
    
    if (!sessions || sessions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="table-cell text-center text-gray-500">
                    Nenhuma sessão encontrada no período selecionado
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = sessions.map(session => `
        <tr>
            <td class="table-cell">${formatDate(session.session_date)}</td>
            <td class="table-cell">${session.computer_name}</td>
            <td class="table-cell">${formatTime(session.start_time)}</td>
            <td class="table-cell">${formatTime(session.end_time) || 'Em andamento'}</td>
            <td class="table-cell">${formatMinutes(session.total_minutes)}</td>
            <td class="table-cell">
                <span class="text-sm text-gray-500">${session.app_count} aplicações</span>
            </td>
        </tr>
    `).join('');
}

function updateTopApplications(apps) {
    const container = document.getElementById('topApplications');
    
    if (!apps || apps.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                Nenhuma aplicação registrada no período selecionado
            </div>
        `;
        return;
    }
    
    container.innerHTML = apps.map((app, index) => `
        <div class="flex items-center justify-between py-3 ${index < apps.length - 1 ? 'border-b border-gray-200' : ''}">
            <div class="flex items-center">
                <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span class="text-sm font-semibold text-indigo-600">${index + 1}</span>
                </div>
                <div>
                    <div class="font-medium text-gray-900">${app.app_name}</div>
                    <div class="text-sm text-gray-500">${formatMinutes(app.total_minutes)}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm font-medium text-gray-900">${app.percentage}%</div>
                <div class="w-20 bg-gray-200 rounded-full h-2">
                    <div class="bg-indigo-600 h-2 rounded-full" style="width: ${app.percentage}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function exportReport() {
    const period = document.getElementById('reportPeriod').value;
    const computerId = document.getElementById('reportComputer').value;
    
    let startDate, endDate;
    const today = new Date();
    
    switch(period) {
        case 'today':
            startDate = endDate = today.toISOString().split('T')[0];
            break;
        case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = endDate = yesterday.toISOString().split('T')[0];
            break;
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            startDate = weekStart.toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
            break;
        case 'custom':
            startDate = document.getElementById('startDate').value;
            endDate = document.getElementById('endDate').value;
            break;
    }
    
    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        computer_id: computerId || '',
        export: 'csv'
    });
    
    window.open(`api/reports.php?${params}`, '_blank');
}

function formatMinutes(minutes) {
    if (!minutes || minutes === 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatTime(timeString) {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
}

function viewComputerDetails(computerId) {
    showNotification('Detalhes do computador em desenvolvimento', 'info');
}

// Verificação automática de status dos computadores

// Inicializar verificação de status
document.addEventListener('DOMContentLoaded', function() {
    // Verificação inicial após 5 segundos
    setTimeout(checkComputerStatus, 5000);
    
    // Verificação automática a cada 20 segundos
    statusCheckInterval = setInterval(checkComputerStatus, 20000);
});

// Função para verificar status dos computadores
async function checkComputerStatus() {
    try {
        console.log('Verificando status dos computadores...');
        const response = await fetch('/api/status_check.php');
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('Status check completo:', result.stats);
            // Atualizar estatísticas se algum computador foi marcado offline
            if (result.stats.computers_updated > 0) {
                console.log(`${result.stats.computers_updated} computadores marcados como offline`);
                showNotification(`${result.stats.computers_updated} computadores marcados como offline`, 'warning');
                
                // Recarregar dados do dashboard
                initializeDashboard();
            }
        }
    } catch (error) {
        console.warn('Erro na verificação de status:', error);
    }
}

// Função para carregar e exibir atividade atual
async function refreshActivity() {
    console.log('refreshActivity() chamada');
    
    // Resetar timer visual
    if (currentSection === 'activity') {
        startActivityTimer();
    }
    
    // Mostrar indicador de carregamento
    const container = document.getElementById('activityData');
    container.innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-2xl text-blue-600 mb-4"></i>
            <p class="text-gray-600">Carregando atividades...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/current_activity.php');
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Result received:', result);
        
        if (result.status === 'success') {
            console.log('Calling displayActivityData with:', result.data);
            displayActivityData(result.data);
        } else {
            console.error('API returned error:', result.message);
            document.getElementById('activityData').innerHTML = 
                '<div class="text-center text-red-600">Erro ao carregar atividade atual</div>';
        }
    } catch (error) {
        console.error('Erro ao carregar atividade:', error);
        document.getElementById('activityData').innerHTML = 
            '<div class="text-center text-red-600">Erro de conexão</div>';
    }
}

function displayActivityData(computers) {
    console.log('displayActivityData() chamada com:', computers);
    const container = document.getElementById('activityData');
    console.log('Container element:', container);
    
    if (!computers || computers.length === 0) {
        console.log('Nenhum computador encontrado');
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-desktop text-4xl mb-4"></i>
                <h4 class="text-lg font-medium mb-2">Nenhum computador online</h4>
                <p>Para ver atividades em tempo real, certifique-se de que:</p>
                <ul class="text-left mt-4 space-y-2 max-w-md mx-auto">
                    <li>• O agent está rodando nos computadores</li>
                    <li>• Os computadores estão enviando dados</li>
                    <li>• A conexão com a internet está funcionando</li>
                </ul>
                <button onclick="refreshActivity()" class="mt-4 btn-primary">
                    <i class="fas fa-sync-alt mr-2"></i>Verificar Novamente
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    console.log('Processando', computers.length, 'computadores');
    
    computers.forEach(computer => {
        const activeWindow = computer.active_window;
        const programsList = computer.running_programs.slice(0, 5); // Mostrar apenas 5 programas
        
        html += `
            <div class="mb-6 p-4 border border-gray-200 rounded-lg">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h4 class="font-semibold text-lg">${computer.computer_name}</h4>
                        <p class="text-sm text-gray-600">Usuário: ${computer.user_name}</p>
                    </div>
                    <div class="text-right">
                        <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <i class="fas fa-circle mr-1"></i>Online
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Última atividade: ${timeAgo(computer.last_activity)}</p>
                    </div>
                </div>
                
                ${activeWindow ? `
                    <div class="mb-3 p-3 bg-blue-50 rounded-lg">
                        <h5 class="font-medium text-blue-900 mb-1">
                            <i class="fas fa-window-maximize mr-2"></i>Janela Ativa
                        </h5>
                        <p class="text-blue-800">
                            <strong>${activeWindow.program_name}</strong>
                            ${activeWindow.window_title && activeWindow.window_title !== activeWindow.program_name 
                                ? ` - ${activeWindow.window_title}` : ''}
                        </p>
                    </div>
                ` : ''}
                
                <div>
                    <h5 class="font-medium text-gray-900 mb-2">
                        <i class="fas fa-list mr-2"></i>Programas em Execução (${computer.total_programs})
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        ${programsList.map(program => `
                            <div class="p-2 bg-gray-50 rounded text-sm">
                                <div class="font-medium">${program.program_name}</div>
                                ${program.window_title && program.window_title !== program.program_name 
                                    ? `<div class="text-gray-600 text-xs">${program.window_title}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ${computer.total_programs > 5 ? `
                        <p class="text-sm text-gray-500 mt-2">
                            ... e mais ${computer.total_programs - 5} programas
                        </p>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    console.log('HTML gerado:', html.length, 'caracteres');
    container.innerHTML = html;
    console.log('Container innerHTML definido');
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
}