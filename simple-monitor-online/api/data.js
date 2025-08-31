/**
 * API para receber dados dos agentes
 * Sistema de monitoramento em tempo real com persistência MySQL
 */

const dao = require('../database/dao');
const db = require('../database/connection');

// Cache temporário para dados ativos (otimização)
let computers = new Map();
let activities = new Map();

// NOVO: Acumulador de minutos em memória
let dailyAccumulator = new Map(); // device_id -> { date, minutes, lastSave }

// Função para obter/criar acumulador diário
function getDailyAccumulator(deviceId, date) {
    const key = `${deviceId}_${date}`;

    if (!dailyAccumulator.has(key)) {
        dailyAccumulator.set(key, {
            device_id: deviceId,
            date: date,
            minutes: 0,
            lastSave: 0,
            lastActivity: null
        });
    }

    return dailyAccumulator.get(key);
}

// Função para limpar acumuladores de dias anteriores
function cleanOldAccumulators() {
    const today = new Date().toISOString().split('T')[0];
    const keysToDelete = [];

    dailyAccumulator.forEach((acc, key) => {
        if (acc.date !== today) {
            keysToDelete.push(key);
        }
    });

    keysToDelete.forEach(key => {
        const acc = dailyAccumulator.get(key);
        console.log(`🧹 Removendo acumulador antigo: ${acc.device_id} - ${acc.date} (${acc.minutes}min)`);
        dailyAccumulator.delete(key);
    });
}

// Inicializar conexão MySQL
db.initializePool();

// Função para testar e inicializar banco
async function initializeDatabase() {
    try {
        const isConnected = await db.testConnection();
        if (isConnected) {
            console.log('✅ Conexão MySQL estabelecida com sucesso');

            // Criar tabela de histórico diário
            await dao.createDailyHistoryTable();

            // Atualizar status dos dispositivos na inicialização
            await dao.updateDevicesStatus();

            // Limpar acumuladores antigos na inicialização
            cleanOldAccumulators();

            console.log('🔧 Sistema de acumulação em memória inicializado');
        } else {
            console.warn('⚠️ Falha na conexão MySQL - usando cache temporário');
        }
    } catch (error) {
        console.error('❌ Erro na inicialização do banco:', error);
    }
}

// Função para salvar dados restantes (chamada antes de shutdown)
async function saveRemainingData() {
    try {
        console.log('💾 Salvando dados restantes no banco...');

        for (const [key, accumulator] of dailyAccumulator.entries()) {
            const remainingMinutes = accumulator.minutes - accumulator.lastSave;

            if (remainingMinutes > 0) {
                console.log(`💾 Salvando ${remainingMinutes}min restantes: ${accumulator.device_id}`);

                await dao.addIncrementalTime(
                    accumulator.device_id,
                    remainingMinutes,
                    accumulator.lastActivity || {},
                    accumulator.date
                );

                accumulator.lastSave = accumulator.minutes;
            }
        }

        console.log('✅ Dados restantes salvos com sucesso');
    } catch (error) {
        console.error('❌ Erro ao salvar dados restantes:', error);
    }
}

// Salvar dados restantes a cada 5 minutos (backup)
setInterval(async() => {
    try {
        for (const [key, accumulator] of dailyAccumulator.entries()) {
            const remainingMinutes = accumulator.minutes - accumulator.lastSave;

            if (remainingMinutes >= 5) { // Backup a cada 5 minutos
                console.log(`🔄 Backup: Salvando ${remainingMinutes}min: ${accumulator.device_id}`);

                await dao.addIncrementalTime(
                    accumulator.device_id,
                    remainingMinutes,
                    accumulator.lastActivity || {},
                    accumulator.date
                );

                accumulator.lastSave = accumulator.minutes;
            }
        }
    } catch (error) {
        console.error('❌ Erro no backup automático:', error);
    }
}, 5 * 60 * 1000); // 5 minutos

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
            // Validar e corrigir dados de tempo antes de salvar
            const validatedData = await validateTimeData(data);
            await dao.registerActivity(validatedData);
            console.log(`📝 Atividade salva no MySQL: ${validatedData.computer_name} - ${validatedData.total_minutes}min`);
        }
    } catch (error) {
        console.error('❌ Erro ao salvar no histórico MySQL:', error);
        // Fallback para memória se MySQL falhar
        console.log('⚠️ Usando fallback para memória local');
    }
}

// Cache para rastrear último valor enviado pelo agente
const lastAgentValues = new Map();

// Função para validar dados de tempo e evitar inconsistências
async function validateTimeData(data) {
    try {
        // Buscar minutos já registrados hoje para este dispositivo
        const currentTodayMinutes = await dao.getDeviceTodayMinutes(data.computer_id);
        const newAgentMinutes = data.total_minutes || 0;
        const lastAgentMinutes = lastAgentValues.get(data.computer_id) || 0;

        // RESETAR se tempo atual for absurdo (>12 horas por dia)
        if (currentTodayMinutes > 720) { // 12 horas = 720 minutos
            console.log(`🚨 RESET: ${data.computer_name} tinha ${currentTodayMinutes}min (>12h) - resetando para 0`);
            await dao.resetDeviceDailyTime(data.computer_id);
            const resetMinutes = Math.min(newAgentMinutes, 60); // Máximo 1 hora para restart
            data.total_minutes = resetMinutes;
            lastAgentValues.set(data.computer_id, newAgentMinutes);
            return data;
        }

        if (currentTodayMinutes > 0) {
            // Já existe registro para hoje

            // Calcular incremento real do agente
            let agentIncrement = 0;

            if (newAgentMinutes > lastAgentMinutes) {
                // Agente incrementou normalmente
                agentIncrement = newAgentMinutes - lastAgentMinutes;

                // Limitar incremento a no máximo 5 minutos por vez (mais conservador)
                if (agentIncrement > 5) {
                    agentIncrement = 1; // Se incremento for muito grande, adicionar apenas 1 minuto
                    console.log(`⚠️ Incremento grande detectado, limitando a +1min: ${data.computer_name}`);
                }
            } else if (newAgentMinutes < lastAgentMinutes && newAgentMinutes <= 5) {
                // Possível reinicialização - adicionar apenas 1 minuto
                agentIncrement = 1;
                console.log(`🔄 Reinicialização detectada: ${data.computer_name} - adicionando +1min`);
            } else if (newAgentMinutes === lastAgentMinutes) {
                // Mesmo valor - sem incremento
                agentIncrement = 0;
            } else {
                // Valor estranho - adicionar apenas 1 minuto por segurança
                agentIncrement = 1;
                console.log(`⚠️ Valor anômalo, adicionando +1min: ${data.computer_name}`);
            }

            // Aplicar incremento ao total atual
            const newTotalMinutes = currentTodayMinutes + agentIncrement;
            data.total_minutes = newTotalMinutes;

            console.log(`✅ ${data.computer_name}: Agent ${lastAgentMinutes}min→${newAgentMinutes}min (+${agentIncrement}min) = Total ${newTotalMinutes}min`);

        } else {
            // Primeiro registro do dia
            if (newAgentMinutes > 600) { // Mais de 10 horas para início de dia é suspeito
                console.log(`⚠️ Novo dia (valor alto): ${data.computer_name} ${newAgentMinutes}min -> 1min`);
                data.total_minutes = 1;
            } else {
                console.log(`✅ Novo dia iniciado: ${data.computer_name} - ${newAgentMinutes}min`);
            }
        }

        // Salvar último valor do agente para próxima comparação
        lastAgentValues.set(data.computer_id, newAgentMinutes);

        return data;
    } catch (error) {
        console.error('❌ Erro na validação de tempo:', error);
        return data;
    }
} // Função para limpar dados do dia anterior e garantir reset diário
async function cleanupDailyData() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`🧹 Executando limpeza diária para ${today}`);

        // Atualizar status de dispositivos offline
        await dao.updateDevicesStatus();

        // Log de status
        const stats = await dao.getSystemStats();
        console.log(`📊 Status: ${stats.online_devices} online, ${stats.offline_devices} offline, ${stats.today_minutes}min hoje`);

    } catch (error) {
        console.error('❌ Erro na limpeza diária:', error);
    }
}

// Executar limpeza a cada hora
setInterval(cleanupDailyData, 60 * 60 * 1000); // 1 hora
// Executar limpeza no início também
setTimeout(cleanupDailyData, 5000); // 5 segundos após iniciar

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
        const today = new Date().toISOString().split('T')[0];

        // Combinar com dados em cache e acumulador para atividade atual
        return devices.map(device => {
            const currentData = computers.get(device.id);

            // Obter dados do acumulador em tempo real
            const accumulatorKey = `${device.id}_${today}`;
            const accumulator = dailyAccumulator.get(accumulatorKey);
            const realtimeMinutes = accumulator ? accumulator.minutes : 0;

            // Converter para formato de horas
            const hours = Math.floor(realtimeMinutes / 60);
            const mins = realtimeMinutes % 60;
            const timeDisplay = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

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
                today_minutes: realtimeMinutes, // Tempo em tempo real do acumulador
                today_display: timeDisplay, // Formato legível
                saved_minutes: accumulator ? accumulator.lastSave : 0, // Minutos já salvos no banco
                pending_minutes: accumulator ? (accumulator.minutes - accumulator.lastSave) : 0, // Pendentes de salvamento
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
        console.log(`🔍 Dados de registro recebidos:`, {
            id: data.computer_id,
            name: data.computer_name,
            user: data.user_name,
            os: data.os_info
        });

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
        // Verificar se é atividade incremental (novo formato)
        if (data.increment_minutes && data.day_date) {
            return await handleIncrementalActivity(data);
        }

        // Processamento antigo para compatibilidade
        await handleLegacyActivity(data);

    } catch (error) {
        console.error('❌ Erro ao processar atividade:', error);
        // Fallback para cache apenas
        const computer = computers.get(data.computer_id) || {};
        computer.current_activity = data.current_activity;
        computer.last_seen = new Date();
        computers.set(data.computer_id, computer);
    }
}

// Nova função para atividades incrementais
async function handleIncrementalActivity(data) {
    try {
        console.log(`⏱️ +${data.increment_minutes}min recebido de ${data.computer_id}`);

        // Limpar acumuladores antigos
        cleanOldAccumulators();

        // Obter acumulador do dia atual
        const accumulator = getDailyAccumulator(data.computer_id, data.day_date);

        // Adicionar 1 minuto ao acumulador em memória
        accumulator.minutes += data.increment_minutes;
        accumulator.lastActivity = {
            activity: data.current_activity,
            window: data.active_window,
            timestamp: new Date().toISOString()
        };

        // Registrar/atualizar dispositivo
        await dao.registerDevice({
            computer_id: data.computer_id,
            computer_name: data.computer_name,
            user_name: data.user_name,
            os_info: data.os_info
        });

        // Verificar se deve salvar no banco (a cada 10 minutos acumulados)
        const minutesSinceLastSave = accumulator.minutes - accumulator.lastSave;

        if (minutesSinceLastSave >= 10) {
            console.log(`💾 Salvando ${minutesSinceLastSave}min no banco: ${data.computer_id}`);

            // Salvar incremento no banco
            await dao.addIncrementalTime(
                data.computer_id,
                minutesSinceLastSave, {
                    current_activity: data.current_activity,
                    active_window: data.active_window
                },
                data.day_date
            );

            // Atualizar último salvamento
            accumulator.lastSave = accumulator.minutes;

            console.log(`✅ ${minutesSinceLastSave}min salvos no banco. Total hoje: ${accumulator.minutes}min`);
        }

        // Atualizar cache para dashboard em tempo real
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
        computer.status = 'online';
        computer.total_time = accumulator.minutes; // Tempo acumulado em memória

        computers.set(data.computer_id, computer);

        // Manter atividades recentes no cache
        let computerActivities = activities.get(data.computer_id) || [];
        computerActivities.push({
            timestamp: new Date(),
            activity: data.current_activity,
            window: data.active_window,
            minutes: data.increment_minutes
        });

        // Manter apenas últimas 20 atividades
        if (computerActivities.length > 20) {
            computerActivities.splice(0, computerActivities.length - 20);
        }
        activities.set(data.computer_id, computerActivities);

        // Converter minutos para formato horas:minutos
        const hours = Math.floor(accumulator.minutes / 60);
        const mins = accumulator.minutes % 60;
        const timeFormat = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

        console.log(`🎯 ${data.computer_name}: +1min → ${timeFormat} (Próximo save: ${10 - minutesSinceLastSave}min)`);

    } catch (error) {
        console.error('❌ Erro na atividade incremental:', error);
        throw error;
    }
}

// Função para atividades antigas (compatibilidade)
async function handleLegacyActivity(data) {
    try {
        // Sempre atualizar informações do dispositivo com dados da atividade
        if (data.computer_name && data.computer_name !== 'undefined') {
            await dao.updateDeviceInfo(data.computer_id, {
                name: data.computer_name,
                user_name: data.user_name,
                os_info: data.os_info
            });
        }

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

        console.log(`💼 Atividade salva (legacy): ${data.computer_name} - ${data.current_activity}`);
    } catch (error) {
        console.error('❌ Erro ao salvar atividade legacy:', error);
        throw error;
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