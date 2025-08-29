/**
 * Vercel Function - API de estatísticas
 * Retorna estatísticas gerais do sistema
 */

export default async function handler(req, res) {
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
    // Importar função de cache do agent-data
    const { getCachedData } = await import('./agent-data.js');
    const computers = getCachedData();

    const totalMinutes = computers.reduce((sum, computer) => {
      return sum + (computer.usage_minutes || 0);
    }, 0);

    const onlineComputers = computers.filter(c => c.status === 'online');
    const avgMinutes = computers.length > 0 ? totalMinutes / computers.length : 0;

    const statistics = {
      server_status: 'online',
      server_time: new Date().toISOString(),
      worktrack_version: '2.0.0-vercel',
      total_computers: computers.length,
      online_computers: onlineComputers.length,
      offline_computers: computers.length - onlineComputers.length,
      total_usage_minutes: totalMinutes,
      total_usage_hours: Math.round((totalMinutes / 60) * 100) / 100,
      average_usage_minutes: Math.round(avgMinutes),
      last_data_update: computers.length > 0 ? 
        Math.max(...computers.map(c => new Date(c.last_update).getTime())) : null,
      computers_list: computers.map(computer => ({
        computer_id: computer.computer_id,
        computer_name: computer.computer_name,
        status: computer.status,
        usage_minutes: computer.usage_minutes || 0,
        last_update: computer.last_update
      }))
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
}
