/**
 * API para gerenciar histórico de atividades
 * Integrada com o data.js para compartilhar o mesmo armazenamento
 */

// Função para obter dados históricos compartilhados
function getSharedHistoryData() {
    // Tentar acessar dados compartilhados globalmente
    if (global.sharedHistoryData && typeof global.sharedHistoryData === 'function') {
        return global.sharedHistoryData();
    }

    // Fallback: criar dados locais se não há dados compartilhados
    let localHistory = new Map();

    // Se não há dados, criar alguns exemplos para teste
    if (localHistory.size === 0) {
        const today = getTodayKey();
        const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

        // Dados de exemplo para hoje
        localHistory.set(today, {
            date: today,
            computers: new Map([
                ['test-computer-1', {
                    computer_id: 'test-computer-1',
                    computer_name: 'Computador Teste 1',
                    user_name: 'Usuario Teste',
                    os_info: 'Windows 11',
                    total_minutes: 120,
                    last_activity: 'Trabalhando em Documentos',
                    last_seen: new Date().toISOString()
                }]
            ]),
            totalActivities: 25,
            activities: [{
                computer_id: 'test-computer-1',
                computer_name: 'Computador Teste 1',
                activity: 'Trabalhando em Documentos',
                window: 'Microsoft Word',
                timestamp: new Date().toISOString(),
                minutes: 120
            }]
        });

        // Dados de exemplo para ontem
        localHistory.set(yesterday, {
            date: yesterday,
            computers: new Map([
                ['test-computer-1', {
                    computer_id: 'test-computer-1',
                    computer_name: 'Computador Teste 1',
                    user_name: 'Usuario Teste',
                    os_info: 'Windows 11',
                    total_minutes: 180,
                    last_activity: 'Navegando na Internet',
                    last_seen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                }]
            ]),
            totalActivities: 30,
            activities: []
        });
    }

    return localHistory;
}

// Importar o mesmo armazenamento usado em data.js
let dailyHistory = new Map();

// Função para sincronizar com data.js (chamar quando necessário)
function syncWithDataAPI() {
    // Em um ambiente real, isso seria um banco de dados compartilhado
    // Por agora, vamos usar uma abordagem simples
    return dailyHistory;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getTodayKey() {
    return formatDate(new Date());
}

function verifyAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.substring(7);
    return token && token.length > 10;
}

// Função para obter dados históricos (usa dados compartilhados ou cria exemplos)
function getHistoryData() {
    return getSharedHistoryData();
}
module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verificar autenticação
    if (!verifyAuth(req)) {
        return res.status(401).json({
            success: false,
            message: 'Não autorizado'
        });
    }

    if (req.method === 'GET') {
        // Obter dados históricos atualizados
        const historyData = getHistoryData();

        const { date, days } = req.query;

        if (date) {
            // Buscar data específica
            const dateData = historyData.get(date);

            if (dateData) {
                return res.status(200).json({
                    success: true,
                    date: date,
                    data: {
                        ...dateData,
                        computers: Array.from(dateData.computers.values())
                    }
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Nenhum dado encontrado para esta data'
                });
            }
        }

        if (days) {
            // Buscar últimos N dias
            const daysNum = parseInt(days) || 7;
            const dates = Array.from(historyData.keys())
                .sort()
                .slice(-daysNum);

            const result = dates.map(date => {
                const data = historyData.get(date);
                return {
                    date: date,
                    totalComputers: data.computers.size,
                    totalActivities: data.totalActivities,
                    computers: Array.from(data.computers.values()),
                    summary: {
                        totalMinutes: Array.from(data.computers.values())
                            .reduce((sum, comp) => sum + (comp.total_minutes || 0), 0),
                        averageMinutes: Math.round(
                            Array.from(data.computers.values())
                            .reduce((sum, comp) => sum + (comp.total_minutes || 0), 0) /
                            Math.max(data.computers.size, 1)
                        )
                    }
                };
            });

            return res.status(200).json({
                success: true,
                days: daysNum,
                data: result
            });
        }

        // Retornar resumo geral
        const summary = {
            totalDays: historyData.size,
            availableDates: Array.from(historyData.keys()).sort(),
            today: getTodayKey(),
            todayData: historyData.get(getTodayKey()) || null
        };

        if (summary.todayData) {
            summary.todayData = {
                ...summary.todayData,
                computers: Array.from(summary.todayData.computers.values())
            };
        }

        return res.status(200).json({
            success: true,
            summary: summary
        });
    }

    return res.status(405).json({
        success: false,
        message: 'Método não permitido'
    });
};