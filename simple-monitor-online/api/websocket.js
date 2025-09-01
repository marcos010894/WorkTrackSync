/**
 * WebSocket API para tempo real
 * Apenas status online/offline dos dispositivos
 */

const dao = require('../database/dao');

// Cache simples para dispositivos online
let onlineDevices = new Map(); // device_id -> { name, last_seen, status }

// Função para verificar se dispositivo está online (últimos 90 segundos)
function isDeviceOnline(lastSeen) {
    if (!lastSeen) return false;
    const now = new Date();
    const diff = now - new Date(lastSeen);
    return diff < 90000; // 90 segundos (1.5 minutos)
}

// Função para atualizar status de um dispositivo
function updateDeviceStatus(deviceId, deviceName, userName) {
    const now = new Date();
    
    onlineDevices.set(deviceId, {
        id: deviceId,
        name: deviceName || 'Computador Desconhecido',
        user: userName || 'Usuário Desconhecido',
        last_seen: now,
        status: 'online',
        last_heartbeat: now.toISOString()
    });
    
    console.log(`📱 ${deviceName} está ONLINE`);
}

// Função para obter todos os dispositivos com status
function getAllDevicesStatus() {
    const now = new Date();
    const devices = [];
    
    onlineDevices.forEach((device, deviceId) => {
        const isOnline = isDeviceOnline(device.last_seen);
        
        devices.push({
            id: deviceId,
            name: device.name,
            user: device.user,
            status: isOnline ? 'online' : 'offline',
            last_seen: device.last_seen,
            last_heartbeat: device.last_heartbeat
        });
    });
    
    return devices;
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
            const devices = getAllDevicesStatus();
            
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
                // Atualizar status do dispositivo
                updateDeviceStatus(
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
