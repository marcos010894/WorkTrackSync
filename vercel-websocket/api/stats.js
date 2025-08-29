/**
 * Vercel Function - API de estatísticas
 * Retorna estatísticas gerais do sistema
 */

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const statistics = {
            server_status: 'online',
            server_time: new Date().toISOString(),
            worktrack_version: '2.0.0-vercel',
            total_computers: 0,
            online_computers: 0,
            offline_computers: 0,
            total_usage_minutes: 0,
            total_usage_hours: 0,
            average_usage_minutes: 0,
            last_data_update: null,
            computers_list: [],
            message: 'WorkTrack API funcionando no Vercel!'
        };

        return res.status(200).json(statistics);

    } catch (error) {
        console.error('Erro ao gerar estatísticas:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor',
            server_status: 'error',
            server_time: new Date().toISOString(),
            worktrack_version: '2.0.0-vercel'
        });
    }
};