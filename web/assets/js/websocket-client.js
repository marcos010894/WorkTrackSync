/**
 * WorkTrack WebSocket Client
 * Conecta ao servidor WebSocket Node.js para atualizações em tempo real
 */

class WorkTrackWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.isConnecting = false;
        this.computersData = new Map();
        this.isRegistered = false;

        this.connect();
    }

    connect() {
        if (this.isConnecting || this.socket ? .readyState === WebSocket.OPEN) {
            return;
        }

        this.isConnecting = true;

        try {
            // Conectar ao servidor WebSocket Node.js
            this.socket = new WebSocket('ws://127.0.0.1:8081');

            this.socket.onopen = () => {
                console.log('✅ WebSocket conectado ao servidor Node.js');
                this.isConnecting = false;
                this.reconnectAttempts = 0;

                // Registrar como dashboard
                this.registerDashboard();

                // Mostrar indicador de conexão
                this.updateConnectionStatus(true);
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Erro ao processar mensagem WebSocket:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('❌ WebSocket desconectado');
                this.isConnecting = false;
                this.isRegistered = false;
                this.updateConnectionStatus(false);
                this.scheduleReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('Erro WebSocket:', error);
                this.isConnecting = false;
                this.updateConnectionStatus(false);
            };

        } catch (error) {
            console.error('Erro ao conectar WebSocket:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    registerDashboard() {
        if (this.socket ? .readyState === WebSocket.OPEN && !this.isRegistered) {
            this.send({
                type: 'dashboard_register',
                user_id: 'admin', // Pode ser dinâmico baseado no usuário logado
                timestamp: new Date().toISOString()
            });
        }
    }

    handleMessage(data) {
        console.log('📨 Mensagem recebida:', data.type);

        switch (data.type) {
            case 'connection_established':
                console.log('🔗 Conexão estabelecida:', data.clientId);
                break;

            case 'dashboard_registered':
                console.log('📊 Dashboard registrado com sucesso');
                this.isRegistered = true;
                if (data.computers && data.computers.length > 0) {
                    this.handleInitialComputersData(data.computers);
                }
                break;

            case 'computer_update':
                this.handleComputerUpdate(data.data);
                break;

            case 'computers_data':
                this.handleComputersData(data.computers);
                break;

            case 'dashboard_stats':
                this.handleDashboardStats(data.stats);
                break;

            case 'agent_connected':
                this.handleAgentConnected(data);
                break;

            case 'agent_disconnected':
                this.handleAgentDisconnected(data);
                break;

            case 'pong':
                console.log('🏓 Pong recebido');
                break;

            case 'data_received':
                // Confirmação de dados recebidos (para agentes)
                break;

            default:
                console.log('❓ Mensagem WebSocket não reconhecida:', data);
        }
    }

    handleInitialComputersData(computers) {
        console.log(`📊 Dados iniciais: ${computers.length} computadores`);
        computers.forEach(computer => {
            this.computersData.set(computer.computer_id, computer);
        });

        if (currentSection === 'computers') {
            this.refreshComputersTable();
        }
    }

    handleComputersData(computers) {
        console.log(`📊 Dados atualizados: ${computers.length} computadores`);
        this.computersData.clear();
        computers.forEach(computer => {
            this.computersData.set(computer.computer_id, computer);
        });

        if (currentSection === 'computers') {
            this.refreshComputersTable();
        }
    }

    handleComputerUpdate(computerData) {
        console.log(`🔄 Computador atualizado: ${computerData.computer_id} - ${computerData.usage_minutes} min`);

        // Armazenar dados
        this.computersData.set(computerData.computer_id, {
            ...computerData,
            last_update: new Date().toISOString()
        });

        // Atualizar tabela em tempo real se estivermos na seção de computadores
        if (currentSection === 'computers') {
            this.updateComputerRow(computerData);
        }
    }

    handleDashboardStats(stats) {
        console.log('📈 Estatísticas atualizadas:', stats);

        // Atualizar contadores do dashboard
        this.updateDashboardCounters(stats);
    }

    handleAgentConnected(data) {
        console.log(`🟢 Agente conectado: ${data.computer_id}`);
        this.showNotification(`Computador ${data.computer_name} conectado`, 'success');

        // Solicitar dados atualizados
        this.requestData();
    }

    handleAgentDisconnected(data) {
        console.log(`🔴 Agente desconectado: ${data.computer_id}`);
        this.showNotification(`Computador desconectado`, 'warning');

        // Marcar como offline no cache local
        const computer = this.computersData.get(data.computer_id);
        if (computer) {
            computer.status = 'offline';
            computer.last_update = new Date().toISOString();
        }

        if (currentSection === 'computers') {
            this.updateComputerRow(computer);
        }
    }

    updateComputerRow(computerData) {
        // Usar a função existente do dashboard se disponível
        if (typeof loadComputers === 'function') {
            loadComputers();
        } else {
            this.refreshComputersTable();
        }
    }

    refreshComputersTable() {
        // Converter Map para Array e usar a função de atualização existente
        const computersArray = Array.from(this.computersData.values());

        if (typeof updateComputersTable === 'function') {
            updateComputersTable(computersArray);
        }
    }

    updateDashboardCounters(stats) {
        // Atualizar elementos do dashboard com as estatísticas recebidas
        const elements = {
            'online-computers-count': stats.online_computers,
            'total-computers-count': stats.total_computers,
            'offline-computers-count': stats.offline_computers,
            'total-usage-today': this.formatMinutes(stats.total_usage_today)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Tentar encontrar elementos por classes também
        const classElements = {
            '.online-count': stats.online_computers,
            '.total-count': stats.total_computers,
            '.offline-count': stats.offline_computers
        };

        Object.entries(classElements).forEach(([selector, value]) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = value;
            });
        });
    }

    formatMinutes(minutes) {
        if (!minutes || minutes === 0) return '0h 0m';

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        } else {
            return `${mins}m`;
        }
    }

    showNotification(message, type = 'info') {
        // Criar notificação visual simples
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 10px;
            padding: 10px 15px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            opacity: 0;
            transition: all 0.3s ease;
            background-color: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    updateConnectionStatus(connected) {
        // Criar/atualizar indicador de status
        let statusEl = document.getElementById('websocket-status');

        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'websocket-status';
            statusEl.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                z-index: 9999;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            `;
            document.body.appendChild(statusEl);
        }

        if (connected) {
            statusEl.textContent = '🟢 Tempo Real Ativo';
            statusEl.style.backgroundColor = '#10b981';
            statusEl.style.color = 'white';
        } else {
            statusEl.textContent = '🔴 Reconectando...';
            statusEl.style.backgroundColor = '#ef4444';
            statusEl.style.color = 'white';
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Máximo de tentativas de reconexão atingido');
            this.updateConnectionStatus(false);
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Tentando reconectar em ${this.reconnectDelay/1000}s (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);

        // Aumentar delay para próxima tentativa
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
    }

    send(data) {
        if (this.socket ? .readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket não conectado, não foi possível enviar:', data);
        }
    }

    ping() {
        this.send({ type: 'ping' });
    }

    requestData() {
        this.send({ type: 'dashboard_request_data' });
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    getComputerData(computerId) {
        return this.computersData.get(computerId);
    }

    getAllComputersData() {
        return Array.from(this.computersData.values());
    }
}

// Inicializar WebSocket quando o dashboard carregar
let worktrackWS = null;

document.addEventListener('DOMContentLoaded', function() {
    // Detectar ambiente
    const isVercel = window.location.hostname.includes('vercel.app') ||
        window.location.hostname.includes('vercel.com');

    // Aguardar um pouco para garantir que outros scripts carregaram
    setTimeout(() => {
        if (isVercel) {
            console.log('🔥 Ambiente Vercel detectado - usando SSE');
            // SSE será iniciado pelo sse-client.js
        } else {
            console.log('🏠 Ambiente local detectado - usando WebSocket');
            worktrackWS = new WorkTrackWebSocket();

            // Ping periódico para manter conexão viva
            setInterval(() => {
                if (worktrackWS) {
                    worktrackWS.ping();
                }
            }, 30000);
        }
    }, 1000);
});

// Limpar ao sair da página
window.addEventListener('beforeunload', function() {
    if (worktrackWS) {
        worktrackWS.disconnect();
    }
});