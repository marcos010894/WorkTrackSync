/**
 * API para receber dados dos agentes
 * Sistema de monitoramento em tempo real com persistência MySQL
 */

const dao = require('../database/dao');
const db = require('../database/connection');

// Cache temporário para dados ativos (otimização)
let computers = new Map();
let activities = new Map();

// Inicializar conexão MySQL
db.initializePool();

// Função para testar e inicializar banco
async function initializeDatabase() {
    try {
        const isConnected = await db.testConnection();
        if (isConnected) {
            console.log('✅ Conexão MySQL estabelecida com sucesso');
            // Atualizar status dos dispositivos na inicialização
            await dao.updateDevicesStatus();
        } else {
            console.warn('⚠️ Falha na conexão MySQL - usando cache temporário');
        }
    } catch (error) {
        console.error('❌ Erro na inicialização do banco:', error);
    }
}

// Inicializar na primeira execução
initializeDatabase();

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getTodayKey() {
    return formatDate(new Date());
}

// Função para adicionar ao histórico (agora usa MySQL)
async function addToHistory(data) {
    try {
        if (data.type === 'activity') {
            await dao.registerActivity(data);
            console.log(`📝 Atividade salva no MySQL: ${data.computer_name}`);
        }
    } catch (error) {
        console.error('❌ Erro ao salvar no histórico MySQL:', error);
        // Fallback para memória se MySQL falhar
        console.log('⚠️ Usando fallback para memória local');
    }
}

// Função para registrar dispositivo (agora usa MySQL)
async function registerDevice(deviceData) {
    try {
        const device = await dao.registerDevice(deviceData);
        console.log(`✅ Dispositivo registrado no MySQL: ${device.name}`);
        return device;
    } catch (error) {
        console.error('❌ Erro ao registrar dispositivo no MySQL:', error);
        // Fallback para estrutura básica
        return {
            id: deviceData.computer_id,
            name: deviceData.computer_name || 'Computador Desconhecido',
            user_name: deviceData.user_name || 'Usuário Desconhecido',
            os_info: deviceData.os_info || 'Sistema Desconhecido',
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            total_sessions: 1,
            is_online: true
        };
    }
}

// Função para atualizar status dos dispositivos
async function updateDeviceStatus() {
    try {
        await dao.updateDevicesStatus();
    } catch (error) {
        console.error('❌ Erro ao atualizar status no MySQL:', error);
    }
}

// Função para obter todos os dispositivos
async function getAllDevices() {
    try {
        await updateDeviceStatus();
        const devices = await dao.getAllDevices();

        // Combinar com dados em cache para atividade atual
        return devices.map(device => {
            const currentData = computers.get(device.id);
            return {
                id: device.id,
                name: device.name,
                user_name: device.user_name,
                os_info: device.os_info,
                first_seen: device.first_seen,
                last_seen: device.last_seen,
                total_sessions: device.total_sessions,
                is_online: device.is_online,
                current_activity: currentData ? currentData.current_activity : (device.is_online ? 'Ativo' : 'Offline'),
                today_minutes: device.today_minutes || 0,
                total_minutes_all_time: device.total_minutes_all_time || 0,
                total_activities_all_time: device.total_activities_all_time || 0,
                last_activity_time: device.last_seen
            };
        });
    } catch (error) {
        console.error('❌ Erro ao buscar dispositivos do MySQL:', error);
        // Fallback para dados em memória
        const fallbackDevices = [];
        computers.forEach((data, id) => {
            fallbackDevices.push({
                id: id,
                name: data.computer_name || 'Computador Desconhecido',
                user_name: data.user_name || 'Usuário Desconhecido',
                os_info: data.os_info || 'Sistema Desconhecido',
                first_seen: new Date().toISOString(),
                last_seen: new Date().toISOString(),
                total_sessions: 1,
                is_online: true,
                current_activity: data.current_activity || 'Ativo',
                today_minutes: data.total_minutes || 0,
                last_activity_time: new Date().toISOString()
            });
        });
        return fallbackDevices;
    }
}

// Funções de manipulação de dados (agora com MySQL)
async function handleRegister(data) {
    try {
        // Registrar no MySQL
        const device = await registerDevice(data);

        // Manter cache local para performance
        const computer = {
            id: data.computer_id,
            computer_name: data.computer_name,
            user_name: data.user_name,
            os_info: data.os_info,
            last_seen: new Date(),
            status: 'online',
            total_time: 0
        };

        computers.set(data.computer_id, computer);
        console.log(`📱 Dispositivo registrado: ${data.computer_name} (MySQL + Cache)`);
    } catch (error) {
        console.error('❌ Erro no registro:', error);
        // Fallback para cache apenas
        const computer = {
            id: data.computer_id,
            computer_name: data.computer_name,
            user_name: data.user_name,
            os_info: data.os_info,
            last_seen: new Date(),
            status: 'online',
            total_time: 0
        };
        computers.set(data.computer_id, computer);
    }
}

async function handleActivity(data) {
    try {
        // Salvar atividade no MySQL
        await addToHistory(data);

        // Atualizar cache local
        const computer = computers.get(data.computer_id) || {
            id: data.computer_id,
            computer_name: data.computer_name,
            user_name: data.user_name,
            os_info: data.os_info,
            last_seen: new Date(),
            status: 'online',
            total_time: 0
        };

        computer.current_activity = data.current_activity;
        computer.active_window = data.active_window;
        computer.last_seen = new Date();
        computer.total_time = data.total_minutes || 0;
        computer.activity_duration = data.activity_duration || 0;
        computer.last_activity_time = new Date();

        // Manter atividades no cache para dashboard em tempo real
        let computerActivities = activities.get(data.computer_id) || [];
        computerActivities.push({
            timestamp: new Date(),
            activity: data.current_activity,
            window: data.active_window,
            duration: data.activity_duration || 0
        });

        // Manter apenas últimas 20 atividades no cache
        if (computerActivities.length > 20) {
            computerActivities.splice(0, computerActivities.length - 20);
        }

        activities.set(data.computer_id, computerActivities);
        computers.set(data.computer_id, computer);

        console.log(`💼 Atividade salva: ${data.computer_name} - ${data.current_activity}`);
    } catch (error) {
        console.error('❌ Erro ao salvar atividade:', error);
        // Fallback para cache apenas
        const computer = computers.get(data.computer_id) || {};
        computer.current_activity = data.current_activity;
        computer.last_seen = new Date();
        computers.set(data.computer_id, computer);
    }
}

async function handleHeartbeat(data) {
    try {
        // Atualizar último acesso no MySQL via cache
        const computer = computers.get(data.computer_id);
        if (computer) {
            computer.last_seen = new Date();
            computer.status = 'online';
            computers.set(data.computer_id, computer);

            // Registrar dispositivo se não existir
            if (!computer.registered_in_mysql) {
                await registerDevice({
                    computer_id: data.computer_id,
                    computer_name: computer.computer_name,
                    user_name: computer.user_name,
                    os_info: computer.os_info
                });
                computer.registered_in_mysql = true;
            }
        }

        console.log(`💓 Heartbeat: ${data.computer_id}`);
    } catch (error) {
        console.error('❌ Erro no heartbeat:', error);
    }
}

// Sincronização periódica com MySQL
setInterval(async() => {
    try {
        // Atualizar status dos dispositivos no MySQL
        await dao.updateDevicesStatus();

        // Sincronizar dados do cache com MySQL
        const now = new Date();
        computers.forEach(async(computer, id) => {
            const timeDiff = now - computer.last_seen;
            if (timeDiff > 60000) { // 1 minuto offline
                computer.status = 'offline';
                computers.set(id, computer);
            }
        });

        console.log('🔄 Sincronização MySQL realizada');
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
    }
}, 60000); // Sincronizar a cada 1 minuto

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        try {
            // Verificar se é requisição de comandos
            if (req.query && req.query.commands === 'true') {
                return res.status(200).json({
                    success: true,
                    commands: [] // Por enquanto vazio, mas endpoint funcionando
                });
            }

            // Obter todos os dispositivos do MySQL
            const allDevices = await getAllDevices();

            // Calcular estatísticas
            const onlineDevices = allDevices.filter(device => device.is_online);
            const stats = await dao.getSystemStats();

            return res.status(200).json({
                success: true,
                computers: allDevices,
                stats: {
                    total_computers: stats.total_devices,
                    online_computers: stats.online_devices,
                    offline_computers: stats.offline_devices,
                    total_hours: stats.today_hours
                },
                activities: Object.fromEntries(activities),
                timestamp: new Date().toISOString(),
                source: 'MySQL'
            });
        } catch (error) {
            console.error('❌ Erro ao buscar dados:', error);

            // Fallback para dados em memória em caso de erro MySQL
            const fallbackDevices = [];
            computers.forEach((data, id) => {
                fallbackDevices.push({
                    id: id,
                    name: data.computer_name || 'Computador Desconhecido',
                    is_online: true,
                    current_activity: data.current_activity || 'Ativo',
                    today_minutes: data.total_minutes || 0
                });
            });

            return res.status(200).json({
                success: true,
                computers: fallbackDevices,
                stats: {
                    total_computers: fallbackDevices.length,
                    online_computers: fallbackDevices.length,
                    offline_computers: 0,
                    total_hours: 0
                },
                activities: Object.fromEntries(activities),
                timestamp: new Date().toISOString(),
                source: 'Fallback (MySQL indisponível)'
            });
        }
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;

            switch (data.type) {
                case 'register':
                    await handleRegister(data);
                    break;

                case 'activity':
                    await handleActivity(data);
                    break;

                case 'heartbeat':
                    await handleHeartbeat(data);
                    break;

                case 'cleanup_test_devices':
                    await dao.cleanTestDevices();
                    break;

                default:
                    console.warn('⚠️ Tipo de dados desconhecido:', data.type);
            }

            return res.status(200).json({
                success: true,
                message: 'Dados recebidos e salvos no MySQL',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Erro ao processar dados:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                details: error.message
            });
        }
    }

    return res.status(405).json({
        success: false,
        error: 'Método não permitido'
    });
};