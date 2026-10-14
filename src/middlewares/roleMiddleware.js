/**
 * Middleware RBAC (Role-Based Access Control)
 * @param  {...string} allowedRoles - Ex: 'SECRETARIA', 'COORDENACAO', 'PROFESSOR', 'ALUNO'
 */
function roleMiddleware(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        if (!allowedRoles.includes(req.user.perfil)) {
            return res.status(403).json({ 
                error: `Acesso negado. Seu perfil (${req.user.perfil}) não possui permissão para este recurso.`,
                perfilRequerido: allowedRoles
            });
        }

        next();
    };
}

module.exports = roleMiddleware;
