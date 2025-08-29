/**
 * Vercel Edge Function - Server-Sent Events para Dashboard
 * Substitui WebSocket com streaming de dados em tempo real
 */

export default async function handler(req) {
  // CORS headers para SSE
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Headers para Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  console.log('� Dashboard conectado via SSE');

  // Função para enviar dados
  const sendData = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Função para obter dados dos computadores
  const getComputersData = async () => {
    try {
      // Importar função de cache do agent-data
      const { getCachedData } = await import('./agent-data.js');
      const computers = getCachedData();

      return {
        type: 'computers_update',
        computers: computers,
        total_computers: computers.length,
        online_computers: computers.filter(c => c.status === 'online').length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter dados:', error);
      return {
        type: 'error',
        message: 'Erro ao obter dados dos computadores',
        timestamp: new Date().toISOString()
      };
    }
  };

  // Função para calcular estatísticas
  const getStatistics = async () => {
    try {
      const { getCachedData } = await import('./agent-data.js');
      const computers = getCachedData();

      const totalMinutes = computers.reduce((sum, computer) => {
        return sum + (computer.usage_minutes || 0);
      }, 0);

      const avgMinutes = computers.length > 0 ? totalMinutes / computers.length : 0;

      return {
        type: 'statistics_update',
        statistics: {
          total_computers: computers.length,
          online_computers: computers.filter(c => c.status === 'online').length,
          total_usage_minutes: totalMinutes,
          average_usage_minutes: Math.round(avgMinutes),
          last_update: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        type: 'error',
        message: 'Erro ao calcular estatísticas',
        timestamp: new Date().toISOString()
      };
    }
  };

  // Enviar dados iniciais
  sendData({
    type: 'connection_established',
    message: 'Dashboard conectado ao WorkTrack SSE',
    timestamp: new Date().toISOString()
  });

  // Enviar dados dos computadores imediatamente
  const initialData = await getComputersData();
  sendData(initialData);

  // Configurar intervalo para envio periódico
  let intervalId;
  let isConnected = true;

  const startPeriodicUpdates = () => {
    intervalId = setInterval(async () => {
      if (!isConnected) return;

      try {
        // Enviar dados dos computadores
        const computersData = await getComputersData();
        sendData(computersData);

        // Enviar estatísticas
        const statsData = await getStatistics();
        sendData(statsData);

      } catch (error) {
        console.error('Erro no envio periódico:', error);
        sendData({
          type: 'error',
          message: 'Erro no servidor',
          timestamp: new Date().toISOString()
        });
      }
    }, 5000); // Atualizar a cada 5 segundos
  };

  // Detectar quando a conexão é fechada
  req.on('close', () => {
    console.log('📡 Dashboard desconectado do SSE');
    isConnected = false;
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  req.on('error', (error) => {
    console.error('Erro na conexão SSE:', error);
    isConnected = false;
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  // Iniciar atualizações periódicas
  startPeriodicUpdates();

  // Para evitar timeout do Vercel, enviar keep-alive
  const keepAliveInterval = setInterval(() => {
    if (!isConnected) {
      clearInterval(keepAliveInterval);
      return;
    }
    
    res.write(': keep-alive\n');
  }, 30000); // Keep-alive a cada 30 segundos

  req.on('close', () => {
    clearInterval(keepAliveInterval);
  });
}
