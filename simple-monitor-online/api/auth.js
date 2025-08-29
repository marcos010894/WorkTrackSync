/**
 * API de Autenticação
 */

const VALID_CREDENTIALS = {
    email: 'gneconstrucoes@outlook.com.br',
    password: 'gne254575'
};

// Tokens de sessão válidos (em produção usar Redis/DB)
let validTokens = new Set();

function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { email, password, action } = req.body;

        if (action === 'login') {
            // Verificar credenciais
            if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
                const token = generateToken();
                validTokens.add(token);

                // Limpar tokens antigos (manter apenas 10)
                if (validTokens.size > 10) {
                    const tokensArray = Array.from(validTokens);
                    validTokens.delete(tokensArray[0]);
                }

                return res.status(200).json({
                    success: true,
                    token: token,
                    message: 'Login realizado com sucesso'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
            }
        }

        if (action === 'logout') {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                validTokens.delete(token);
            }

            return res.status(200).json({
                success: true,
                message: 'Logout realizado com sucesso'
            });
        }

        if (action === 'verify') {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                if (validTokens.has(token)) {
                    return res.status(200).json({
                        success: true,
                        message: 'Token válido'
                    });
                }
            }

            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }

    if (req.method === 'GET') {
        // Verificar se o usuário está autenticado
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (validTokens.has(token)) {
                return res.status(200).json({
                    success: true,
                    authenticated: true,
                    email: VALID_CREDENTIALS.email
                });
            }
        }

        return res.status(401).json({
            success: false,
            authenticated: false
        });
    }

    return res.status(405).json({
        success: false,
        message: 'Método não permitido'
    });
};