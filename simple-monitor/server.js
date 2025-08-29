const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Servidor HTTP para servir o dashboard
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'dashboard.html' : req.url);

    // Determinar tipo de conteúdo
    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Página não encontrada');
            } else {
                res.writeHead(500);
                res.end('Erro do servidor: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// WebSocket Server
const wss = new WebSocket.Server({ server });

// Armazenar dados dos computadores
const computers = new Map();
const activities = new Map(); // Atividades por computador

wss.on('connection', (ws, req) => {
    console.log('🔗 Nova conexão WebSocket');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    });

    ws.on('close', () => {
        console.log('❌ Conexão fechada');
    });
});

function handleMessage(ws, data) {
    switch (data.type) {
        case 'register':
            handleRegister(ws, data);
            break;

        case 'activity':
            handleActivity(ws, data);
            break;

        case 'dashboard_connect':
            handleDashboardConnect(ws);
            break;

        case 'remote_command':
            handleRemoteCommand(data);
            break;
    }
}

function handleRegister(ws, data) {
    const computerInfo = {
        id: data.computer_id,
        name: data.computer_name,
        user: data.user_name,
        os: data.os_info,
        status: 'online',
        last_seen: new Date(),
        total_time: 0,
        ws: ws
    };

    computers.set(data.computer_id, computerInfo);

    if (!activities.has(data.computer_id)) {
        activities.set(data.computer_id, []);
    }

    console.log(`🖥️ Computador registrado: ${data.computer_name}`);
    broadcastToAllDashboards();
}

function handleActivity(ws, data) {
    const computer = computers.get(data.computer_id);
    if (computer) {
        computer.last_seen = new Date();
        computer.total_time = data.total_minutes || 0;
        computer.current_activity = data.current_activity;
        computer.active_window = data.active_window;

        // Salvar atividade
        const computerActivities = activities.get(data.computer_id) || [];
        computerActivities.push({
            timestamp: new Date(),
            activity: data.current_activity,
            window: data.active_window,
            duration: data.activity_duration || 0
        });

        // Manter apenas últimas 100 atividades
        if (computerActivities.length > 100) {
            computerActivities.splice(0, computerActivities.length - 100);
        }

        activities.set(data.computer_id, computerActivities);
        computers.set(data.computer_id, computer);

        broadcastToAllDashboards();
    }
}

function handleDashboardConnect(ws) {
    ws.isDashboard = true;
    console.log('📊 Dashboard conectado');

    // Enviar dados atuais
    const dashboardData = {
        type: 'computers_update',
        computers: Array.from(computers.values()).map(comp => ({
            id: comp.id,
            name: comp.name,
            user: comp.user,
            os: comp.os,
            status: comp.status,
            last_seen: comp.last_seen,
            total_time: comp.total_time,
            current_activity: comp.current_activity,
            active_window: comp.active_window
        })),
        activities: Object.fromEntries(activities),
        stats: getStats()
    };

    ws.send(JSON.stringify(dashboardData));
}

function handleRemoteCommand(data) {
    const computer = computers.get(data.computer_id);
    if (computer && computer.ws) {
        const command = {
            type: 'remote_command',
            action: data.action // 'lock', 'shutdown', 'restart'
        };

        computer.ws.send(JSON.stringify(command));
        console.log(`🎮 Comando enviado para ${computer.name}: ${data.action}`);
    }
}

function broadcastToAllDashboards() {
    const dashboardData = {
        type: 'computers_update',
        computers: Array.from(computers.values()).map(comp => ({
            id: comp.id,
            name: comp.name,
            user: comp.user,
            os: comp.os,
            status: comp.status,
            last_seen: comp.last_seen,
            total_time: comp.total_time,
            current_activity: comp.current_activity,
            active_window: comp.active_window
        })),
        stats: getStats()
    };

    wss.clients.forEach(client => {
        if (client.isDashboard && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(dashboardData));
        }
    });
}

function getStats() {
    const computersArray = Array.from(computers.values());
    const totalComputers = computersArray.length;
    const onlineComputers = computersArray.filter(c => c.status === 'online').length;
    const totalHours = computersArray.reduce((sum, c) => sum + (c.total_time || 0), 0);

    return {
        total_computers: totalComputers,
        online_computers: onlineComputers,
        offline_computers: totalComputers - onlineComputers,
        total_hours: Math.round(totalHours / 60 * 100) / 100,
        total_minutes: totalHours
    };
}

// Verificar computadores offline
setInterval(() => {
    const now = new Date();
    computers.forEach((computer, id) => {
        const timeDiff = now - computer.last_seen;
        if (timeDiff > 30000) { // 30 segundos
            computer.status = 'offline';
            computers.set(id, computer);
        }
    });
    broadcastToAllDashboards();
}, 10000); // Verificar a cada 10 segundos

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
});