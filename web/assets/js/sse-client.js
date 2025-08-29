/**
 * WorkTrack SSE Client para Vercel
 * Usa Server-Sent Events em vez de WebSocket
 */

class WorkTrackSSEClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl || window.location.origin;
        this.eventSource = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.isConnecting = false;
        this.computersData = new Map();
        
        this.connect();
    }
    
    connect() {
        if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
            return;
        }
        
        this.isConnecting = true;
        console.log('🔗 Conectando ao stream SSE...');
        
        try {
            // Conectar ao stream de dados
            const streamUrl = `${this.baseUrl}/api/dashboard-stream`;
            this.eventSource = new EventSource(streamUrl);
            
            this.eventSource.onopen = () => {
                console.log('✅ SSE conectado ao Vercel');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
            };
            
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Erro ao processar mensagem SSE:', error);
                }
            };
            
            this.eventSource.onerror = (error) => {
                console.error('Erro SSE:', error);
                this.isConnecting = false;
                this.updateConnectionStatus(false);
                
                if (this.eventSource.readyState === EventSource.CLOSED) {
                    this.scheduleReconnect();
                }
            };
            
        } catch (error) {
            console.error('Erro ao conectar SSE:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }
    
    handleMessage(data) {
        console.log('📨 Mensagem SSE recebida:', data.type);
        
        switch (data.type) {
            case 'connected':
                console.log('🔗 Stream conectado:', data.data.message);
                break;
                
            case 'computers_update':
                this.handleComputersUpdate(data.data);
                break;
                
            default:
                console.log('❓ Mensagem SSE não reconhecida:', data);
        }
    }
    
    handleComputersUpdate(updateData) {
        const { computers, stats } = updateData;
        
        console.log(`📊 Dados atualizados: ${computers.length} computadores`);
        
        // Atualizar cache local
        this.computersData.clear();
        computers.forEach(computer => {
            this.computersData.set(computer.computer_id, computer);
        });
        
        // Atualizar interface se estivermos na seção de computadores
        if (typeof currentSection !== 'undefined' && currentSection === 'computers') {
            this.refreshComputersTable();
        }
        
        // Atualizar estatísticas do dashboard
        this.updateDashboardStats(stats);
        
        // Mostrar notificação de dados atualizados
        this.showDataUpdateNotification(computers.length, stats.online_computers);
    }
    
    refreshComputersTable() {
        const computersArray = Array.from(this.computersData.values());
        
        // Usar função existente do dashboard se disponível
        if (typeof updateComputersTable === 'function') {
            updateComputersTable(computersArray);
        } else if (typeof loadComputers === 'function') {
            loadComputers();
        }
    }
    
    updateDashboardStats(stats) {
        console.log('📈 Estatísticas atualizadas:', stats);
        
        // Atualizar elementos do dashboard
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
        
        // Atualizar por classes também
        const classElements = {
            '.online-count': stats.online_computers,
            '.total-count': stats.total_computers,
            '.offline-count': stats.offline_computers,
            '.usage-today': this.formatMinutes(stats.total_usage_today)
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
    
    showDataUpdateNotification(totalComputers, onlineComputers) {
        // Atualizar contador no indicador de status
        const statusEl = document.getElementById('websocket-status');
        if (statusEl && statusEl.textContent.includes('Tempo Real Ativo')) {
            statusEl.textContent = `🟢 Tempo Real Ativo (${onlineComputers}/${totalComputers})`;
        }
    }
    
    updateConnectionStatus(connected) {
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
            statusEl.textContent = '🟢 Tempo Real Ativo (Vercel)';
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
    
    async requestStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/stats`);
            const data = await response.json();
            
            if (data.success) {
                this.updateDashboardStats(data.stats);
                return data.stats;
            }
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        }
        return null;
    }
    
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
    
    getComputerData(computerId) {
        return this.computersData.get(computerId);
    }
    
    getAllComputersData() {
        return Array.from(this.computersData.values());
    }
}

// Inicializar SSE Client quando o dashboard carregar
let worktrackSSE = null;

document.addEventListener('DOMContentLoaded', function() {
    // Detectar se estamos no Vercel ou localhost
    const isVercel = window.location.hostname.includes('vercel.app') || 
                    window.location.hostname.includes('vercel.com') ||
                    window.location.port === '';
    
    if (isVercel) {
        console.log('🔥 Iniciando WorkTrack SSE Client para Vercel');
        
        setTimeout(() => {
            worktrackSSE = new WorkTrackSSEClient();
            
            // Buscar estatísticas iniciais
            worktrackSSE.requestStats();
            
            // Buscar estatísticas periodicamente como fallback
            setInterval(() => {
                if (worktrackSSE) {
                    worktrackSSE.requestStats();
                }
            }, 30000); // A cada 30 segundos
            
        }, 1000);
    } else {
        console.log('🏠 Ambiente local detectado, usando WebSocket normal');
        // Manter o WebSocket para desenvolvimento local
    }
});

// Limpar ao sair da página
window.addEventListener('beforeunload', function() {
    if (worktrackSSE) {
        worktrackSSE.disconnect();
    }
});

// Expor globalmente para debug
window.worktrackSSE = worktrackSSE;
