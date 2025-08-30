const data = require('./data');

export default async function handler(req, res) {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const devices = await data.getAllDevices();
            return res.status(200).json(devices);
        }
        
        if (req.method === 'POST') {
            const result = await data.handleRegister(req.body);
            return res.status(200).json(result);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Erro na API devices:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
