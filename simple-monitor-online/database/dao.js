/**
 * Data Access Object (DAO) para WorkTrackSync
 * Funções de acesso aos dados MySQL
 */

const db = require('./connection');

/**
 * DISPOSITIVOS
 */

// Registrar ou atualizar dispositivo
async function registerDevice(deviceData) {
    const query = `
        INSERT INTO devices (id, name, user_name, os_info, first_seen, last_seen, total_sessions, is_online)
        VALUES (?, ?, ?, ?, NOW(), NOW(), 1, TRUE)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            user_name = VALUES(user_name),
            os_info = VALUES(os_info),
            last_seen = NOW(),
            total_sessions = total_sessions + 1,
            is_online = TRUE
    `;

    const params = [
        deviceData.computer_id,
        deviceData.computer_name || 'Computador Desconhecido',
        deviceData.user_name || 'Usuário Desconhecido',
        deviceData.os_info || 'Sistema Desconhecido'
    ];

    try {
        await db.executeQuery(query, params);
        console.log(`✅ Dispositivo registrado: ${deviceData.computer_name}`);
        return await getDeviceById(deviceData.computer_id);
    } catch (error) {
        console.error('❌ Erro ao registrar dispositivo:', error);
        throw error;
    }
}

// Buscar dispositivo por ID
async function getDeviceById(deviceId) {
    const query = 'SELECT * FROM devices WHERE id = ?';

    try {
        const results = await db.executeQuery(query, [deviceId]);
        return results[0] || null;
    } catch (error) {
        console.error('❌ Erro ao buscar dispositivo:', error);
        throw error;
    }
}

// Verificar se dispositivo já tem dados hoje
async function getDeviceTodayMinutes(deviceId) {
    const query = `
        SELECT total_minutes 
        FROM daily_history 
        WHERE device_id = ? AND date = CURDATE()
    `;

    try {
        const results = await db.executeQuery(query, [deviceId]);
        return results[0] ? results[0].total_minutes : 0;
    } catch (error) {
        console.error('❌ Erro ao buscar minutos do dia:', error);
        return 0;
    }
}

// Resetar tempo diário de um dispositivo específico
async function resetDeviceDailyTime(deviceId) {
    const query = `
        UPDATE daily_history 
        SET total_minutes = 0, total_activities = 0 
        WHERE device_id = ? AND date = CURDATE()
    `;

    try {
        await db.executeQuery(query, [deviceId]);
        console.log(`🔄 Reset do tempo diário: ${deviceId}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao resetar tempo diário:', error);
        return false;
    }
}

// Obter todos os dispositivos
async function getAllDevices() {
    const query = `
        SELECT 
            d.*,
            COALESCE(dh_today.total_minutes, 0) as today_minutes,
            COALESCE(dh_today.total_activities, 0) as today_activities,
            COALESCE(dh_all.total_minutes_all, 0) as total_minutes_all_time,
            COALESCE(dh_all.total_activities_all, 0) as total_activities_all_time
        FROM devices d
        LEFT JOIN (
            SELECT device_id, 
                   SUM(total_minutes) as total_minutes,
                   SUM(total_activities) as total_activities
            FROM daily_history 
            WHERE date = CURDATE()
            GROUP BY device_id
        ) dh_today ON d.id = dh_today.device_id
        LEFT JOIN (
            SELECT device_id,
                   SUM(total_minutes) as total_minutes_all,
                   SUM(total_activities) as total_activities_all
            FROM daily_history
            GROUP BY device_id
        ) dh_all ON d.id = dh_all.device_id
        ORDER BY d.last_seen DESC
    `;

    try {
        const results = await db.executeQuery(query);
        return results;
    } catch (error) {
        console.error('❌ Erro ao buscar todos os dispositivos:', error);
        throw error;
    }
}

// Atualizar status online/offline dos dispositivos
async function updateDevicesStatus() {
    const timeoutMinutes = 5;
    const query = `
        UPDATE devices 
        SET is_online = FALSE 
        WHERE last_seen < DATE_SUB(NOW(), INTERVAL ? MINUTE) 
        AND is_online = TRUE
    `;

    try {
        const result = await db.executeQuery(query, [timeoutMinutes]);
        if (result.affectedRows > 0) {
            console.log(`📴 ${result.affectedRows} dispositivo(s) marcado(s) como offline`);
        }
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Erro ao atualizar status dos dispositivos:', error);
        throw error;
    }
}

/**
 * ATIVIDADES
 */

// Registrar nova atividade
async function registerActivity(activityData) {
    const insertActivity = `
        INSERT INTO activities (device_id, device_name, activity_description, active_window, total_minutes)
        VALUES (?, ?, ?, ?, ?)
    `;

    const updateDailyHistory = `
        INSERT INTO daily_history (date, device_id, device_name, total_activities, total_minutes, first_activity, last_activity, activities_summary)
        VALUES (CURDATE(), ?, ?, 1, ?, NOW(), NOW(), JSON_ARRAY(?))
        ON DUPLICATE KEY UPDATE
            total_activities = total_activities + 1,
            total_minutes = GREATEST(total_minutes, VALUES(total_minutes)),
            last_activity = NOW(),
            activities_summary = JSON_ARRAY_APPEND(activities_summary, '$', VALUES(activities_summary))
    `;

    const params1 = [
        activityData.computer_id,
        activityData.computer_name || 'Desconhecido',
        activityData.current_activity || 'Atividade não especificada',
        activityData.active_window || 'Janela não especificada',
        activityData.total_minutes || 0
    ];

    const params2 = [
        activityData.computer_id,
        activityData.computer_name || 'Desconhecido',
        activityData.total_minutes || 0,
        JSON.stringify({
            activity: activityData.current_activity,
            window: activityData.active_window,
            timestamp: new Date().toISOString(),
            minutes: activityData.total_minutes
        })
    ];

    try {
        await db.executeTransaction([
            { query: insertActivity, params: params1 },
            { query: updateDailyHistory, params: params2 }
        ]);

        console.log(`📝 Atividade registrada: ${activityData.computer_name}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao registrar atividade:', error);
        throw error;
    }
}

// Obter atividades de um dispositivo
async function getDeviceActivities(deviceId, limit = 100) {
    const query = `
        SELECT * FROM activities 
        WHERE device_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    `;

    try {
        const results = await db.executeQuery(query, [deviceId, limit]);
        return results;
    } catch (error) {
        console.error('❌ Erro ao buscar atividades do dispositivo:', error);
        throw error;
    }
}

/**
 * HISTÓRICO
 */

// Obter histórico diário
async function getDailyHistory(startDate, endDate) {
    let query = `
        SELECT 
            dh.*,
            d.name as device_name,
            d.user_name,
            d.os_info
        FROM daily_history dh
        JOIN devices d ON dh.device_id = d.id
    `;

    const params = [];

    if (startDate && endDate) {
        query += ' WHERE dh.date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    } else if (startDate) {
        query += ' WHERE dh.date >= ?';
        params.push(startDate);
    }

    query += ' ORDER BY dh.date DESC, dh.device_name';

    try {
        const results = await db.executeQuery(query, params);
        return results;
    } catch (error) {
        console.error('❌ Erro ao buscar histórico diário:', error);
        throw error;
    }
}

// Obter estatísticas do sistema
async function getSystemStats() {
    const queries = [
        'SELECT COUNT(*) as total_devices FROM devices',
        'SELECT COUNT(*) as online_devices FROM devices WHERE is_online = TRUE',
        'SELECT COUNT(*) as offline_devices FROM devices WHERE is_online = FALSE',
        'SELECT COALESCE(SUM(total_activities), 0) as today_activities FROM daily_history WHERE date = CURDATE()',
        'SELECT COALESCE(SUM(total_minutes), 0) as today_minutes FROM daily_history WHERE date = CURDATE()'
    ];

    try {
        const results = await Promise.all(
            queries.map(query => db.executeQuery(query))
        );

        return {
            total_devices: results[0][0].total_devices,
            online_devices: results[1][0].online_devices,
            offline_devices: results[2][0].offline_devices,
            today_activities: results[3][0].today_activities,
            today_hours: Math.round(results[4][0].today_minutes / 60 * 100) / 100
        };
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas do sistema:', error);
        throw error;
    }
}

/**
 * COMANDOS
 */

// Registrar comando enviado
async function logCommand(deviceId, commandType) {
    const query = `
        INSERT INTO commands_log (device_id, command_type, status, sent_at)
        VALUES (?, ?, 'sent', NOW())
    `;

    try {
        const result = await db.executeQuery(query, [deviceId, commandType]);
        console.log(`🎮 Comando ${commandType} registrado para dispositivo ${deviceId}`);
        return result.insertId;
    } catch (error) {
        console.error('❌ Erro ao registrar comando:', error);
        throw error;
    }
}

// Atualizar status do comando
async function updateCommandStatus(commandId, status, errorMessage = null) {
    const query = `
        UPDATE commands_log 
        SET status = ?, executed_at = NOW(), error_message = ?
        WHERE id = ?
    `;

    try {
        await db.executeQuery(query, [status, errorMessage, commandId]);
        return true;
    } catch (error) {
        console.error('❌ Erro ao atualizar status do comando:', error);
        throw error;
    }
}

/**
 * LIMPEZA E MANUTENÇÃO
 */

// Limpar dispositivos de teste
async function cleanTestDevices() {
    const queries = [
        "DELETE FROM activities WHERE device_id LIKE 'test%'",
        "DELETE FROM daily_history WHERE device_id LIKE 'test%'",
        "DELETE FROM devices WHERE id LIKE 'test%' OR id LIKE '%test%'"
    ];

    try {
        for (const query of queries) {
            const result = await db.executeQuery(query);
            console.log(`🧪 Removendo testes: ${result.affectedRows} registros removidos`);
        }
        return true;
    } catch (error) {
        console.error('❌ Erro ao limpar dispositivos de teste:', error);
        throw error;
    }
}

// Limpar dados antigos (manter últimos 90 dias)
async function cleanOldData() {
    const queries = [
        'DELETE FROM activities WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)',
        'DELETE FROM daily_history WHERE date < DATE_SUB(CURDATE(), INTERVAL 90 DAY)',
        'DELETE FROM commands_log WHERE sent_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    ];

    try {
        for (const query of queries) {
            const result = await db.executeQuery(query);
            console.log(`🧹 Limpeza: ${result.affectedRows} registros removidos`);
        }
        return true;
    } catch (error) {
        console.error('❌ Erro na limpeza de dados:', error);
        throw error;
    }
}

module.exports = {
    // Dispositivos
    registerDevice,
    getDeviceById,
    getAllDevices,
    getDeviceTodayMinutes,
    resetDeviceDailyTime,
    updateDevicesStatus,

    // Atividades
    registerActivity,
    getDeviceActivities,

    // Histórico
    getDailyHistory,
    getSystemStats,

    // Comandos
    logCommand,
    updateCommandStatus,

    // Manutenção
    cleanOldData,
    cleanTestDevices
};