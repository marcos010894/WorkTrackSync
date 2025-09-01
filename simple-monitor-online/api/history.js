/**
 * API de Histórico - resumo diário baseado em minute_tracking
 * Parâmetros (query string):
 *   start (YYYY-MM-DD) opcional
 *   end   (YYYY-MM-DD) opcional
 *   device_id opcional (filtrar por dispositivo)
 */

const dao = require('../database/dao');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const { start, end, device_id } = req.query || {};
    const summary = await dao.getMinuteTrackingDailySummary(start, end, device_id);

    // Agregado geral por dia
    const aggregateByDay = summary.reduce((acc, row) => {
      if (!acc[row.date]) acc[row.date] = 0;
      acc[row.date] += row.total_minutes;
      return acc;
    }, {});

    const aggregateArray = Object.keys(aggregateByDay).sort((a,b) => a < b ? 1 : -1).map(date => ({
      date,
      total_minutes: aggregateByDay[date],
      total_hours: Math.floor(aggregateByDay[date] / 60),
      remaining_minutes: aggregateByDay[date] % 60,
      formatted: `${Math.floor(aggregateByDay[date]/60)}h ${aggregateByDay[date]%60}m`
    }));

    return res.status(200).json({
      success: true,
      range: { start: start || summary.at(-1)?.date || null, end: end || summary[0]?.date || null },
      device_filter: device_id || null,
      days: summary,
      aggregate: aggregateArray,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro no histórico:', error);
    return res.status(500).json({ success: false, error: 'Erro interno', details: error.message });
  }
};
/**
 * API para histórico diário
 * Sistema de consulta de dados históricos por data
 */

const dao = require('../database/dao');
const db = require('../database/connection');

// Inicializar conexão MySQL
if (!db.pool) {
    db.initializePool();
}

module.exports = async(req, res) => {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        try {
            const { device_id, limit = 30, date } = req.query;

            if (device_id) {
                // Histórico de um dispositivo específico
                const history = await dao.getDeviceHistory(device_id, parseInt(limit));

                return res.status(200).json({
                    success: true,
                    device_id: device_id,
                    history: history,
                    total_records: history.length,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Histórico geral de todos os dispositivos
                const allHistory = await dao.getAllDevicesHistory(parseInt(limit));

                // Agrupar por data para melhor visualização
                const groupedByDate = {};
                const dailySummary = {};

                allHistory.forEach(record => {
                    const dateKey = record.date.toISOString().split('T')[0];

                    // Agrupar registros por data
                    if (!groupedByDate[dateKey]) {
                        groupedByDate[dateKey] = [];
                        dailySummary[dateKey] = {
                            date: dateKey,
                            total_devices: 0,
                            total_minutes: 0,
                            total_hours: 0,
                            devices: []
                        };
                    }

                    groupedByDate[dateKey].push(record);

                    // Calcular resumo diário
                    dailySummary[dateKey].total_devices++;
                    dailySummary[dateKey].total_minutes += record.total_minutes;
                    dailySummary[dateKey].total_hours = Math.floor(dailySummary[dateKey].total_minutes / 60);
                    dailySummary[dateKey].devices.push({
                        device_id: record.device_id,
                        device_name: record.device_name,
                        user_name: record.user_name,
                        total_minutes: record.total_minutes,
                        total_hours: record.total_hours,
                        remaining_minutes: record.remaining_minutes
                    });
                });

                // Ordenar datas em ordem decrescente
                const sortedDates = Object.keys(dailySummary).sort().reverse();
                const sortedSummary = {};
                sortedDates.forEach(date => {
                    sortedSummary[date] = dailySummary[date];
                });

                return res.status(200).json({
                    success: true,
                    history: allHistory,
                    grouped_by_date: groupedByDate,
                    daily_summary: sortedSummary,
                    total_records: allHistory.length,
                    total_dates: Object.keys(groupedByDate).length,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('❌ Erro ao buscar histórico:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar histórico',
                details: error.message
            });
        }
    }

    return res.status(405).json({
        success: false,
        error: 'Método não permitido'
    });
};