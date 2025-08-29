/**
 * API para receber dados dos agentes
 * Sistema de monitoramento em tempo real
 */

// Cache global para dados dos computadores
let computers = new Map();
let activities = new Map();

// Sistema de histórico integrado
let dailyHistory = new Map();

// Função para compartilhar dados históricos com outras APIs
function getSharedHistoryData() {
    return dailyHistory;
}

// Exportar para uso em outras APIs (simulação de compartilhamento)
global.sharedHistoryData = getSharedHistoryData;

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getTodayKey() {
    return formatDate(new Date());
}

function addToHistory(data) {
    const today = getTodayKey();

    if (!dailyHistory.has(today)) {
        dailyHistory.set(today, {
            date: today,
            computers: new Map(),
            totalActivities: 0,
            activities: []
        });
    }

    const todayData = dailyHistory.get(today);

    // Adicionar atividade
    if (data.type === 'activity') {
        todayData.activities.push({
            computer_id: data.computer_id,
            computer_name: data.computer_name || 'Desconhecido',
            activity: data.current_activity,
            window: data.active_window,
            timestamp: new Date().toISOString(),
            minutes: data.total_minutes
        });

        todayData.totalActivities++;

        // Atualizar dados do computador no histórico
        todayData.computers.set(data.computer_id, {
            computer_id: data.computer_id,
            computer_name: data.computer_name || 'Desconhecido',
            user_name: data.user_name || 'Desconhecido',
            os_info: data.os_info || 'Desconhecido',
            total_minutes: data.total_minutes,
            last_activity: data.current_activity,
            last_seen: new Date().toISOString()
        });
    }

    // Limitar histórico a 30 dias
    if (dailyHistory.size > 30) {
        const oldestKey = Array.from(dailyHistory.keys()).sort()[0];
        dailyHistory.delete(oldestKey);
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
        // Retornar dados atuais para o dashboard
        const computersArray = Array.from(computers.values());
        const stats = getStats(computersArray);

        return res.status(200).json({
            success: true,
            computers: computersArray,
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