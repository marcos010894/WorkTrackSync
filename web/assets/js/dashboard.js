// WorkTrack Dashboard JavaScript

let charts = {};
let refreshInterval;
let currentSection = 'dashboard';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    startAutoRefresh();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

function initializeDashboard() {
    // Load initial data
    loadDashboardData();
    loadComputers();

    // Initialize charts
    initializeCharts();
}

function startAutoRefresh() {
    // Refresh data every 30 seconds
    refreshInterval = setInterval(function() {
        if (currentSection === 'dashboard') {
            loadDashboardData();
        } else if (currentSection === 'computers') {
            loadComputers();
        }
    }, 30000);
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

// Dashboard data loading
async function loadDashboardData() {
    try {
        const response = await fetch('api/dashboard_data.php');
        const data = await response.json();

        if (data.success) {
            updateDashboardStats(data.stats);
            updateRecentActivity(data.recent_activity);
            updateCharts(data.charts);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
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
    const usageCtx = document.getElementById('usageChart').getContext('2d');
    charts.usage = new Chart(usageCtx, {
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
            scales: {
                y: {
                    beginAtZero: true,
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

    // Status Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    charts.status = new Chart(statusCtx, {
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

function updateCharts(chartData) {
    if (chartData.usage && charts.usage) {
        charts.usage.data.labels = chartData.usage.labels;
        charts.usage.data.datasets[0].data = chartData.usage.data;
        charts.usage.update();
    }

    if (chartData.status && charts.status) {
        charts.status.data.datasets[0].data = chartData.status.data;
        charts.status.update();
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