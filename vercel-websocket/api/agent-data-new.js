/**
 * Vercel Function - Recebe dados dos agentes
 * Substitui o WebSocket para envio de dados dos computadores
 */

// Cache global para dados dos computadores (em memória da função)
let computersCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Computer-ID');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // Retornar dados atuais (para debug)
        cleanupCache();
        const computers = Array.from(computersCache.values());

        return res.status(200).json({
            success: true,
            message: 'WorkTrack API rodando no Vercel',
            computers_count: computers.length,
            computers: computers,
            timestamp: new Date().toISOString()
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const data = req.body;

        if (!data.computer_id) {
            return res.status(400).json({ error: 'Computer ID obrigatório' });
        }

        const timestamp = new Date().toISOString();

        // Processar dados baseado no tipo
        switch (data.type) {
            case 'agent_register':
                await handleAgentRegister(data, timestamp);
                break;

            case 'agent_data':
                await handleAgentData(data, timestamp);
                break;

            default:
                return res.status(400).json({ error: 'Tipo de dados não reconhecido' });
        }

        // Resposta de sucesso
        return res.status(200).json({
            status: 'success',
            message: 'Dados recebidos',
            server_time: timestamp,
            cache_size: computersCache.size
        });

    } catch (error) {
        console.error('Erro ao processar dados do agente:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

async function handleAgentRegister(data, timestamp) {
    const computerData = {
        computer_id: data.computer_id,
        computer_name: data.computer_name || 'Computador Desconhecido',
        os_info: data.os_info || 'Sistema Desconhecido',
        user_name: data.user_name || 'Usuário Desconhecido',
        status: 'online',
        registered_at: timestamp,
        last_update: timestamp,
        usage_minutes: 0
    };

    computersCache.set(data.computer_id, computerData);

    console.log(`🖥️ Agente registrado: ${data.computer_id}`);
}

async function handleAgentData(data, timestamp) {
    const existingData = computersCache.get(data.computer_id) || {};

    const computerData = {
        ...existingData,
        computer_id: data.computer_id,
        usage_minutes: data.usage_minutes || 0,
        running_programs: data.running_programs || [],
        active_window: data.active_window || null,
        status: 'online',
        last_update: timestamp,
        timestamp: timestamp
    };

    computersCache.set(data.computer_id, computerData);

    console.log(`📊 Dados atualizados: ${data.computer_id} - ${computerData.usage_minutes} min`);

    // Limpar cache antigo
    cleanupCache();
}

function cleanupCache() {
    const now = Date.now();

    for (const [computerId, data] of computersCache.entries()) {
        const lastUpdate = new Date(data.last_update).getTime();

        if (now - lastUpdate > CACHE_EXPIRY) {
            computersCache.delete(computerId);
            console.log(`🧹 Removido do cache: ${computerId}`);
        }
    }
}

// Função para obter dados do cache (usada por outras funções)
module.exports.getCachedData = function getCachedData() {
    cleanupCache();
    return Array.from(computersCache.values());
};