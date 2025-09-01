/**
 * API de Histórico unificada (minute_tracking)
 * Query params:
 *   start=YYYY-MM-DD
 *   end=YYYY-MM-DD
 *   device_id=ID (opcional)
 */
const dao = require('../database/dao');

module.exports = async function historyHandler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Método não permitido' });

    try {
        const { start, end, device_id } = req.query || {};
        const rows = await dao.getMinuteTrackingDailySummary(start, end, device_id);

        // Aggregate per day
        const map = new Map();
        for (const r of rows) {
            map.set(r.date, (map.get(r.date) || 0) + r.total_minutes);
        }
        const aggregate = [...map.entries()]
            .sort((a,b) => a[0] < b[0] ? 1 : -1)
            .map(([date, total]) => ({
                date,
                total_minutes: total,
                total_hours: Math.floor(total/60),
                remaining_minutes: total % 60,
                formatted: `${Math.floor(total/60)}h ${total%60}m`
            }));

        const startRange = start || (rows.length ? rows[rows.length - 1].date : null);
        const endRange = end || (rows.length ? rows[0].date : null);

        return res.status(200).json({
            success: true,
            range: { start: startRange, end: endRange },
            device_filter: device_id || null,
            days: rows,
            aggregate,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('❌ Erro histórico:', err);
        return res.status(500).json({ success: false, error: 'Erro interno', details: err.message });
    }
};