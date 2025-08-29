/**
 * Vercel Function - Stream de dados para dashboard via Server-Sent Events (SSE)
 * Substitui o WebSocket para envio contínuo de dados para o dashboard
 */

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    // Headers para Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('📡 Dashboard conectado via SSE');

    // Função para enviar dados
    const sendData = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Enviar dados iniciais
    sendData({
        type: 'connection_established',
        message: 'Dashboard conectado ao WorkTrack SSE',
        timestamp: new Date().toISOString()
    });

    // Configurar intervalo para envio periódico
    let intervalId;
    let isConnected = true;

    const startPeriodicUpdates = () => {
        intervalId = setInterval(() => {
            if (!isConnected) return;

            try {
                // Enviar dados básicos por enquanto
                sendData({
                    type: 'computers_update',
                    computers: [],
                    total_computers: 0,
                    online_computers: 0,
                    timestamp: new Date().toISOString()
                });

                sendData({
                    type: 'statistics_update',
                    statistics: {
                        total_computers: 0,
                        online_computers: 0,
                        total_usage_minutes: 0,
                        average_usage_minutes: 0,
                        last_update: new Date().toISOString()
                    },
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('Erro no envio periódico:', error);
                sendData({
                    type: 'error',
                    message: 'Erro no servidor',
                    timestamp: new Date().toISOString()
                });
            }
        }, 5000); // Atualizar a cada 5 segundos
    };

    // Detectar quando a conexão é fechada
    req.on('close', () => {
        console.log('📡 Dashboard desconectado do SSE');
        isConnected = false;
        if (intervalId) {
            clearInterval(intervalId);
        }
    });

    req.on('error', (error) => {
        console.error('Erro na conexão SSE:', error);
        isConnected = false;
        if (intervalId) {
            clearInterval(intervalId);
        }
    });

    // Iniciar atualizações periódicas
    startPeriodicUpdates();

    // Para evitar timeout do Vercel, enviar keep-alive
    const keepAliveInterval = setInterval(() => {
        if (!isConnected) {
            clearInterval(keepAliveInterval);
            return;
        }

        res.write(': keep-alive\n\n');
    }, 30000); // Keep-alive a cada 30 segundos

    req.on('close', () => {
        clearInterval(keepAliveInterval);
    });
};