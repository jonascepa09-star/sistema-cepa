const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

function authMiddleware(req, res, next) {
    let token = null;

    // 1. Verifica no Cookie HTTPOnly
    if (req.cookies && req.cookies[authConfig.cookieName]) {
        token = req.cookies[authConfig.cookieName];
    }
    // 2. Ou no Header Authorization: Bearer <token>
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Acesso não autorizado. Faça login para continuar.' });
        }
        return res.redirect('/login.html');
    }

    try {
        const decoded = jwt.verify(token, authConfig.jwtSecret);
        req.user = decoded; // { id, nome, email, perfil, prontuario_ref }
        next();
    } catch (err) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }
        return res.redirect('/login.html');
    }
}

module.exports = authMiddleware;
