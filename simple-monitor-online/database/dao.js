/**
 * Data Access Object (DAO) para WorkTrackSync
 * Funções de acesso aos dados MySQL
 */

const db = require('./connection');

// Fuso horário lógico para consolidação diária (minutos). Default: -180 (UTC-3)
const TZ_OFFSET_MINUTES = parseInt(process.env.WORKTRACK_TZ_OFFSET_MINUTES || process.env.TZ_OFFSET_MINUTES || '-180', 10);

function getOffsetDateString(dateObj = new Date()) {
    const shifted = new Date(dateObj.getTime() + TZ_OFFSET_MINUTES * 60000);
    // toISOString sempre UTC; após shift, a parte de data representa o "dia local" desejado
    return shifted.toISOString().split('T')[0];
}

/**
 * INICIALIZAÇÃO DE TABELAS
 */

// Criar tabela de histórico diário se não existir
async function createDailyHistoryTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS daily_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(100) NOT NULL,
            date DATE NOT NULL,
            total_minutes INT DEFAULT 0,
            activities JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_device_date (device_id, date),
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    try {
        await db.executeQuery(query);
        console.log('✅ Tabela daily_history criada/verificada');
    } catch (error) {
        console.error('❌ Erro ao criar tabela daily_history:', error);
        throw error;
    }
}

// Criar tabela de tracking de minutos detalhado
async function createMinuteTrackingTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS minute_tracking (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(100) NOT NULL,
            device_name VARCHAR(255),
            user_name VARCHAR(255),
            tracked_date DATE NOT NULL,
            tracked_minute DATETIME NOT NULL,
            activity_type VARCHAR(50) DEFAULT 'online',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_device_date (device_id, tracked_date),
            INDEX idx_tracked_minute (tracked_minute),
            UNIQUE KEY uniq_device_minute (device_id, tracked_minute),
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    try {
        await db.executeQuery(query);
        console.log('✅ Tabela minute_tracking criada/verificada');
    } catch (error) {
        console.error('❌ Erro ao criar tabela minute_tracking:', error);
        throw error;
    }
}

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

    console.log(`🔍 Registrando dispositivo:`, {
        id: deviceData.computer_id,
        name: deviceData.computer_name,
        user: deviceData.user_name,
        os: deviceData.os_info
    });

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

// Atualizar informações do dispositivo
async function updateDeviceInfo(deviceId, deviceInfo) {
    const query = `
        UPDATE devices 
        SET name = ?, user_name = ?, os_info = ?, last_seen = NOW()
        WHERE id = ?
    `;

    const params = [
        deviceInfo.name || 'Computador Desconhecido',
        deviceInfo.user_name || 'Usuário Desconhecido',
        deviceInfo.os_info || 'Sistema Desconhecido',
        deviceId
    ];

    try {
        await db.executeQuery(query, params);
        console.log(`🔄 Info atualizada: ${deviceInfo.name}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao atualizar info do dispositivo:', error);
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

/**
 * HISTÓRICO DIÁRIO
 */

// Adicionar tempo incremental ao dia atual
async function addIncrementalTime(deviceId, incrementMinutes, activityData, dayDate) {
    const query = `
        INSERT INTO daily_history (device_id, date, total_minutes, activities)
        VALUES (?, ?, ?, JSON_ARRAY(?))
        ON DUPLICATE KEY UPDATE
            total_minutes = total_minutes + VALUES(total_minutes),
            activities = JSON_ARRAY_APPEND(IFNULL(activities, JSON_ARRAY()), '$', ?),
            updated_at = CURRENT_TIMESTAMP
    `;

    const activity = {
        timestamp: new Date().toISOString(),
        activity: activityData.current_activity || 'Ativo',
        window: activityData.active_window || null,
        minutes: incrementMinutes
    };

    const params = [
        deviceId,
        dayDate,
        incrementMinutes,
        JSON.stringify(activity),
        JSON.stringify(activity)
    ];

    try {
        await db.executeQuery(query, params);
        console.log(`⏱️ +${incrementMinutes}min adicionado para ${deviceId} em ${dayDate}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao adicionar tempo incremental:', error);
        throw error;
    }
}

// Buscar tempo total do dia atual
async function getCurrentDayTime(deviceId, dayDate) {
    const query = `
        SELECT total_minutes 
        FROM daily_history 
        WHERE device_id = ? AND date = ?
    `;

    try {
        const results = await db.executeQuery(query, [deviceId, dayDate]);
        return results[0] ? results[0].total_minutes : 0;
    } catch (error) {
        console.error('❌ Erro ao buscar tempo do dia atual:', error);
        return 0;
    }
}

// Buscar histórico completo de um dispositivo
async function getDeviceHistory(deviceId, limit = 30) {
    const query = `
        SELECT date, total_minutes, activities, created_at, updated_at
        FROM daily_history 
        WHERE device_id = ? 
        ORDER BY date DESC 
        LIMIT ?
    `;

    try {
        const results = await db.executeQuery(query, [deviceId, limit]);
        return results.map(row => ({
            date: row.date,
            total_minutes: row.total_minutes,
            total_hours: Math.floor(row.total_minutes / 60),
            remaining_minutes: row.total_minutes % 60,
            activities: row.activities ? JSON.parse(row.activities) : [],
            created_at: row.created_at,
            updated_at: row.updated_at
        }));
    } catch (error) {
        console.error('❌ Erro ao buscar histórico do dispositivo:', error);
        return [];
    }
}

// Buscar histórico geral (todos os dispositivos)
async function getAllDevicesHistory(limit = 100) {
    const query = `
        SELECT 
            dh.date,
            dh.device_id,
            d.name as device_name,
            d.user_name,
            dh.total_minutes,
            dh.activities,
            dh.updated_at
        FROM daily_history dh
        JOIN devices d ON dh.device_id = d.id
        ORDER BY dh.date DESC, dh.updated_at DESC
        LIMIT ?
    `;

    try {
        const results = await db.executeQuery(query, [limit]);
        return results.map(row => ({
            date: row.date,
            device_id: row.device_id,
            device_name: row.device_name,
            user_name: row.user_name,
            total_minutes: row.total_minutes,
            total_hours: Math.floor(row.total_minutes / 60),
            remaining_minutes: row.total_minutes % 60,
            activities: row.activities ? JSON.parse(row.activities) : [],
            updated_at: row.updated_at
        }));
    } catch (error) {
        console.error('❌ Erro ao buscar histórico geral:', error);
        return [];
    }
}

/**
 * TRACKING DE MINUTOS DETALHADO
 */

// Salvar um minuto individual de atividade
async function saveMinuteTracking(deviceId, deviceName, userName) {
    const now = new Date();
    // Truncar para o minuto (zero segundos / ms)
    now.setSeconds(0, 0);
    // Data lógica (considerando offset) – garante que trabalho após meia-noite UTC mas antes da meia-noite local continue no mesmo dia
    const today = getOffsetDateString(now);

    const query = `
        INSERT IGNORE INTO minute_tracking (device_id, device_name, user_name, tracked_date, tracked_minute, activity_type)
        VALUES (?, ?, ?, ?, ?, 'online')
    `;

    try {
        const res = await db.executeQuery(query, [deviceId, deviceName, userName, today, now]);
        if (res.affectedRows === 1) {
            console.log(`⏰ Minuto salvo: ${deviceName} ${now.toISOString()}`);
        } else {
            console.log(`↺ Minuto ignorado (duplicado): ${deviceName} ${now.toISOString()}`);
        }
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar minuto:', error);
        return false;
    }
}

// Buscar total de horas do dia para um dispositivo
async function getDeviceTodayHours(deviceId, date = null) {
    const targetDate = date || getOffsetDateString();

    const query = `
        SELECT COUNT(*) as total_minutes
        FROM minute_tracking 
        WHERE device_id = ? AND tracked_date = ?
    `;

    try {
        const result = await db.executeQuery(query, [deviceId, targetDate]);
        // Corrigido operador ternário inválido
        const totalMinutes = result[0] ? (result[0].total_minutes || 0) : 0;
        return {
            total_minutes: totalMinutes,
            total_hours: Math.floor(totalMinutes / 60),
            remaining_minutes: totalMinutes % 60,
            formatted_time: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
        };
    } catch (error) {
        console.error('❌ Erro ao buscar horas do dia:', error);
        return {
            total_minutes: 0,
            total_hours: 0,
            remaining_minutes: 0,
            formatted_time: '0h 0m'
        };
    }
}

// Buscar estatísticas de todos os dispositivos para hoje
async function getAllDevicesTodayStats(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const query = `
        SELECT 
            device_id,
            device_name,
            user_name,
            COUNT(*) as total_minutes,
            MIN(tracked_minute) as first_activity,
            MAX(tracked_minute) as last_activity
        FROM minute_tracking 
        WHERE tracked_date = ?
        GROUP BY device_id, device_name, user_name
        ORDER BY total_minutes DESC
    `;

    try {
        const results = await db.executeQuery(query, [targetDate]);
        return results.map(row => ({
            device_id: row.device_id,
            device_name: row.device_name,
            user_name: row.user_name,
            total_minutes: row.total_minutes,
            total_hours: Math.floor(row.total_minutes / 60),
            remaining_minutes: row.total_minutes % 60,
            formatted_time: `${Math.floor(row.total_minutes / 60)}h ${row.total_minutes % 60}m`,
            first_activity: row.first_activity,
            last_activity: row.last_activity
        }));
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas do dia:', error);
        return [];
    }
}

// Limpar dados antigos (manter apenas últimos 30 dias)
async function cleanOldMinuteTracking() {
    const query = `
        DELETE FROM minute_tracking 
        WHERE tracked_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;

    try {
        const result = await db.executeQuery(query);
        console.log(`🧹 ${result.affectedRows} registros antigos removidos do tracking`);
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Erro ao limpar dados antigos:', error);
        return 0;
    }
}

// Somatório de minutos (minute_tracking) de todos os dispositivos no dia
async function getSystemMinuteTrackingSum(date = null) {
    const targetDate = date || getOffsetDateString();
    const query = `SELECT COUNT(*) as total_minutes FROM minute_tracking WHERE tracked_date = ?`;
    try {
        const result = await db.executeQuery(query, [targetDate]);
        return result[0] ? (result[0].total_minutes || 0) : 0;
    } catch (error) {
        console.error('❌ Erro ao somar minutos (minute_tracking):', error);
        return 0;
    }
}

// Resumo diário por faixa de datas (minute_tracking)
async function getMinuteTrackingDailySummary(startDate = null, endDate = null, deviceId = null) {
    // Defaults: últimos 7 dias considerando offset
    const today = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const toDateStr = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    if (!endDate) endDate = getOffsetDateString(today);
    if (!startDate) {
        const past = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate = getOffsetDateString(past);
    }

    let query = `
        SELECT 
            tracked_date AS date,
            device_id,
            MAX(device_name) AS device_name,
            MAX(user_name) AS user_name,
            COUNT(*) AS total_minutes
        FROM minute_tracking
        WHERE tracked_date BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];
    if (deviceId) {
        query += ' AND device_id = ?';
        params.push(deviceId);
    }
    query += ' GROUP BY tracked_date, device_id ORDER BY tracked_date DESC, total_minutes DESC';

    try {
        const rows = await db.executeQuery(query, params);
        return rows.map(r => ({
            date: r.date,
            device_id: r.device_id,
            device_name: r.device_name,
            user_name: r.user_name,
            total_minutes: r.total_minutes,
            total_hours: Math.floor(r.total_minutes / 60),
            remaining_minutes: r.total_minutes % 60,
            formatted: `${Math.floor(r.total_minutes/60)}h ${r.total_minutes%60}m`
        }));
    } catch (error) {
        console.error('❌ Erro ao buscar resumo diário:', error);
        return [];
    }
}

module.exports = {
    // Inicialização
    createDailyHistoryTable,
    createMinuteTrackingTable,

    // Dispositivos
    registerDevice,
    getDeviceById,
    getAllDevices,
    getDeviceTodayMinutes,
    resetDeviceDailyTime,
    updateDeviceInfo,
    updateDevicesStatus,

    // Atividades
    registerActivity,
    getDeviceActivities,

    // Histórico Diário
    addIncrementalTime,
    getCurrentDayTime,
    getDeviceHistory,
    getAllDevicesHistory,

    // Histórico (original)
    getDailyHistory,
    getSystemStats,

    // Comandos
    logCommand,
    updateCommandStatus,

    // Manutenção
    cleanOldData,
    cleanTestDevices,

    // Tracking de Minutos
    saveMinuteTracking,
    getDeviceTodayHours,
    getAllDevicesTodayStats,
    cleanOldMinuteTracking,
    getSystemMinuteTrackingSum,
    getMinuteTrackingDailySummary
};