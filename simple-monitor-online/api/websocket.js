/**
 * WebSocket API para tempo real
 * Status online/offline + controle de tempo diário
 */

const dao = require('../database/dao');
const DAO = dao; // Alias para compatibilidade

// Inicializar tabelas na primeira execução
(async() => {
    try {
        await DAO.createDailyHistoryTable();
        await DAO.createMinuteTrackingTable();
        console.log('✅ Tabelas WebSocket inicializadas');
    } catch (error) {
        console.error('❌ Erro na inicialização WebSocket:', error);
    }
})();

// Cache simples para dispositivos online
let onlineDevices = new Map(); // device_id -> { name, last_seen, status, session_start, today_minutes }

// Cache para tempo diário acumulado
let dailyTimeCache = new Map(); // device_id -> total_minutes

// Função para formatar minutos em formato HH:MM
function formatMinutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Função para verificar se dispositivo está online (últimos 90 segundos)
function isDeviceOnline(lastSeen) {
    if (!lastSeen) return false;
    const now = new Date();
    const diff = now - new Date(lastSeen);
    return diff < 90000; // 90 segundos (1.5 minutos)
}

// Função para atualizar status de um dispositivo COM CONTROLE DE TEMPO
async function updateDeviceStatus(deviceId, deviceName, userName) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Obter dispositivo existente
    const existingDevice = onlineDevices.get(deviceId);

    // Carregar horas do dia se não estiver no cache
    if (!dailyTimeCache.has(deviceId)) {
        try {
            const todayHours = await DAO.getDeviceTodayHours(deviceId);
            dailyTimeCache.set(deviceId, todayHours.total_minutes);
            console.log(`📊 Tempo carregado: ${deviceName} = ${todayHours.formatted_time} hoje`);
        } catch (error) {
            console.log(`🆕 Novo dia para ${deviceName} - iniciando em 0h 0m`);
            dailyTimeCache.set(deviceId, 0);
        }
    }

    // Salvar minuto de atividade (sempre que receber heartbeat)
    if (existingDevice) {
        const timeSinceLastSeen = now - new Date(existingDevice.last_seen);

        // Se última atividade foi entre 50s e 180s, salvar 1 minuto
        if (timeSinceLastSeen >= 50000 && timeSinceLastSeen <= 180000) {
            try {
                await DAO.saveMinuteTracking(deviceId, deviceName, userName);

                // Atualizar cache local
                const currentMinutes = dailyTimeCache.get(deviceId) || 0;
                const newMinutes = currentMinutes + 1;
                dailyTimeCache.set(deviceId, newMinutes);

                const hours = Math.floor(newMinutes / 60);
                const mins = newMinutes % 60;
                console.log(`⏰ +1min salvo: ${deviceName} = ${hours}h ${mins}m total hoje`);
            } catch (error) {
                console.error(`❌ Erro ao salvar minuto para ${deviceName}:`, error);
            }
        }
    } else {
        // Primeiro heartbeat do dia, salvar minuto inicial
        try {
            await DAO.saveMinuteTracking(deviceId, deviceName, userName);
            dailyTimeCache.set(deviceId, 1);
            console.log(`🆕 Primeiro minuto salvo: ${deviceName}`);
        } catch (error) {
            console.error(`❌ Erro ao salvar primeiro minuto para ${deviceName}:`, error);
        }
    }

    // Atualizar dispositivo no cache
    onlineDevices.set(deviceId, {
        device_id: deviceId,
        computer_name: deviceName,
        user_name: userName,
        last_seen: now.toISOString()
    });

    console.log(`🔄 Device atualizado: ${deviceName} às ${now.toLocaleTimeString()}`);
}

// Função para verificar se dispositivo está online (últimos 90 segundos)
function isDeviceOnline(lastSeen) {
    if (!lastSeen) return false;
    const now = new Date();
    const diff = now - new Date(lastSeen);
    return diff < 90000; // 90 segundos (1.5 minutos)
}

// Função para obter todos os dispositivos com status E TEMPO
async function getAllDevicesStatus() {
    const devices = [];
    const now = new Date();

    for (const [deviceId, device] of onlineDevices) {
        const timeDiff = now - new Date(device.last_seen);
        const isOnline = timeDiff <= 90000; // 90 segundos

        // Buscar horas do dia do banco
        let timeData = { total_minutes: 0, formatted_time: '0h 0m' };
        try {
            timeData = await DAO.getDeviceTodayHours(deviceId);
            dailyTimeCache.set(deviceId, timeData.total_minutes);
        } catch (error) {
            console.error(`❌ Erro ao carregar horas do dia para ${deviceId}:`, error);
        }

        devices.push({
            device_id: deviceId,
            computer_name: device.computer_name,
            user_name: device.user_name,
            last_seen: device.last_seen,
            status: isOnline ? 'online' : 'offline',
            time_diff_seconds: Math.floor(timeDiff / 1000),
            daily_minutes: timeData.total_minutes,
            daily_hours: timeData.total_hours,
            remaining_minutes: timeData.remaining_minutes,
            daily_time_formatted: timeData.formatted_time
        });
    }

    return devices.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));
}

// Limpeza periódica de dispositivos offline
setInterval(() => {
    const now = new Date();
    let cleaned = 0;

    onlineDevices.forEach((device, deviceId) => {
        const timeDiff = now - new Date(device.last_seen);

        // Remove dispositivos offline há mais de 2 minutos (quase instantâneo)
        if (timeDiff > 120000) { // 2 minutos
            onlineDevices.delete(deviceId);
            cleaned++;
        }
    });

    if (cleaned > 0) {
        console.log(`🧹 ${cleaned} dispositivos offline removidos do cache`);
    }
}, 10000); // Verificar a cada 10 segundos (mais frequente)

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
            const devices = await getAllDevicesStatus();

            return res.status(200).json({
                success: true,
                devices: devices,
                total_devices: devices.length,
                online_devices: devices.filter(d => d.status === 'online').length,
                offline_devices: devices.filter(d => d.status === 'offline').length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Erro no WebSocket:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;

            if (data.type === 'heartbeat') {
                // Atualizar status do dispositivo com tempo
                await updateDeviceStatus(
                    data.computer_id,
                    data.computer_name,
                    data.user_name
                );

                return res.status(200).json({
                    success: true,
                    message: 'Status atualizado',
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(400).json({
                success: false,
                error: 'Tipo de dados não suportado'
            });

        } catch (error) {
            console.error('❌ Erro ao processar WebSocket:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }

    return res.status(405).json({
        success: false,
        error: 'Método não permitido'
    });
};