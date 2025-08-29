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
                total_minutes: device.today_minutes || 0,
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
                total_minutes: data.total_minutes || 0,
                last_activity_time: new Date().toISOString()
            });
        });
        return fallbackDevices;
    }
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // Retornar todos os dispositivos (online e offline)
        const allDevices = getAllDevices();
        const onlineDevices = allDevices.filter(device => device.is_online);
        const stats = {
            total: allDevices.length,
            online: onlineDevices.length,
            offline: allDevices.length - onlineDevices.length,
            avgMinutes: onlineDevices.length > 0 ?
                Math.round(onlineDevices.reduce((sum, comp) => sum + comp.total_minutes, 0) / onlineDevices.length) :
                0
        };

        return res.status(200).json({
            success: true,
            computers: allDevices,
            stats: stats,
            activities: Object.fromEntries(activities),
            timestamp: new Date().toISOString()
        });
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;

            switch (data.type) {
                case 'register':
                    handleRegister(data);
                    break;

                case 'activity':
                    handleActivity(data);
                    break;

                case 'heartbeat':
                    handleHeartbeat(data);
                    break;
            }

            return res.status(200).json({
                success: true,
                message: 'Dados recebidos',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro ao processar dados:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }

    return res.status(405).json({ error: 'Método não permitido' });
};

function handleRegister(data) {
    // Registrar dispositivo persistentemente
    const deviceInfo = registerDevice(data);

    // Atualizar cache de computadores ativos
    const computerInfo = {
        id: data.computer_id,
        name: data.computer_name,
        user: data.user_name,
        os: data.os_info,
        status: 'online',
        last_seen: new Date(),
        total_time: 0,
        registered_at: new Date()
    };

    computers.set(data.computer_id, computerInfo);

    if (!activities.has(data.computer_id)) {
        activities.set(data.computer_id, []);
    }

    console.log(`🖥️ Computador registrado: ${data.computer_name}`);
}

function handleActivity(data) {
    // Atualizar dispositivo registrado
    if (registeredDevices.has(data.computer_id)) {
        const device = registeredDevices.get(data.computer_id);
        device.last_seen = new Date().toISOString();
        device.is_online = true;
    }

    const computer = computers.get(data.computer_id);
    if (computer) {
        computer.last_seen = new Date();
        computer.total_time = data.total_minutes || 0;
        computer.current_activity = data.current_activity;
        computer.active_window = data.active_window;
        computer.status = 'online';

        // Salvar atividade
        const computerActivities = activities.get(data.computer_id) || [];
        computerActivities.push({
            timestamp: new Date(),
            activity: data.current_activity,
            window: data.active_window,
            duration: data.activity_duration || 0
        });

        // Manter apenas últimas 50 atividades
        if (computerActivities.length > 50) {
            computerActivities.splice(0, computerActivities.length - 50);
        }

        activities.set(data.computer_id, computerActivities);
        computers.set(data.computer_id, computer);

        // Adicionar ao histórico diário
        const historyData = {
            ...data,
            computer_name: computer.computer_name,
            user_name: computer.user_name,
            os_info: computer.os_info
        };
        addToHistory(historyData);
    }
}

function handleHeartbeat(data) {
    const computer = computers.get(data.computer_id);
    if (computer) {
        computer.last_seen = new Date();
        computer.status = 'online';
        computers.set(data.computer_id, computer);
    }
}

function getStats(computersArray) {
    const totalComputers = computersArray.length;
    const onlineComputers = computersArray.filter(c => c.status === 'online').length;
    const totalMinutes = computersArray.reduce((sum, c) => sum + (c.total_time || 0), 0);

    return {
        total_computers: totalComputers,
        online_computers: onlineComputers,
        offline_computers: totalComputers - onlineComputers,
        total_hours: Math.round(totalMinutes / 60 * 100) / 100,
        total_minutes: totalMinutes
    };
}

// Limpar computadores offline periodicamente
setInterval(() => {
    const now = new Date();
    computers.forEach((computer, id) => {
        const timeDiff = now - computer.last_seen;
        if (timeDiff > 60000) { // 1 minuto
            computer.status = 'offline';
            computers.set(id, computer);
        }
    });
}, 30000); // Verificar a cada 30 segundos