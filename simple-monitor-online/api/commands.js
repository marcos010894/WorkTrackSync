/**
 * API para comandos remotos
 * Enviar comandos para os computadores
 */

// Cache para comandos pendentes
let pendingCommands = new Map();

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const { computer_id, action } = req.body;

            if (!computer_id || !action) {
                return res.status(400).json({
                    success: false,
                    error: 'computer_id e action são obrigatórios'
                });
            }

            // Armazenar comando para o computador
            const commandId = `${computer_id}-${Date.now()}`;
            const command = {
                id: commandId,
                computer_id: computer_id,
                action: action, // 'lock', 'shutdown', 'restart'
                timestamp: new Date(),
                status: 'pending'
            };

            pendingCommands.set(commandId, command);

            console.log(`🎮 Comando criado: ${action} para ${computer_id}`);

            return res.status(200).json({
                success: true,
                command_id: commandId,
                message: `Comando ${action} criado para ${computer_id}`
            });

        } catch (error) {
            console.error('Erro ao criar comando:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }

    if (req.method === 'GET') {
        const { computer_id } = req.query;

        if (!computer_id) {
            // Retornar todos os comandos pendentes
            return res.status(200).json({
                success: true,
                commands: Array.from(pendingCommands.values())
            });
        }

        // Buscar comandos para um computador específico
        const computerCommands = Array.from(pendingCommands.values())
            .filter(cmd => cmd.computer_id === computer_id && cmd.status === 'pending');

        // Marcar comandos como enviados
        computerCommands.forEach(cmd => {
            cmd.status = 'sent';
            pendingCommands.set(cmd.id, cmd);
        });

        return res.status(200).json({
            success: true,
            commands: computerCommands
        });
    }

    return res.status(405).json({ error: 'Método não permitido' });
};

// Limpar comandos antigos periodicamente
setInterval(() => {
    const now = new Date();
    pendingCommands.forEach((command, id) => {
        const timeDiff = now - command.timestamp;
        if (timeDiff > 300000) { // 5 minutos
            pendingCommands.delete(id);
        }
    });
}, 60000); // Verificar a cada 1 minuto