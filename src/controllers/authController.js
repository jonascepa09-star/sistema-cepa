const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const authConfig = require('../config/auth');

const authController = {
    async login(req, res) {
        try {
            const { login, senha } = req.body;

            if (!login || !senha) {
                return res.status(400).json({ error: 'Informe e-mail ou prontuário e a senha.' });
            }

            // Busca por email ou por prontuario_ref
            const user = await db.get(
                'SELECT * FROM tb_usuarios WHERE (email = ? OR prontuario_ref = ?) AND ativo = 1',
                [login.trim().toLowerCase(), login.trim()]
            );

            if (!user) {
                return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu login e senha.' });
            }

            const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);
            if (!senhaCorreta) {
                return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu login e senha.' });
            }

            // Gera JWT
            const payload = {
                id: user.id,
                nome: user.nome,
                email: user.email,
                perfil: user.perfil,
                prontuario_ref: user.prontuario_ref
            };

            const token = jwt.sign(payload, authConfig.jwtSecret, { expiresIn: authConfig.jwtExpiresIn });

            // Define Cookie Seguro HTTPOnly
            res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);

            // Mapeia URL de redirecionamento por perfil
            let redirectUrl = '/views/secretaria/dashboard.html';
            if (user.perfil === 'COORDENACAO') {
                redirectUrl = '/views/coordenacao/dashboard.html';
            } else if (user.perfil === 'PROFESSOR') {
                redirectUrl = '/views/professor/mobile-chamada.html';
            } else if (user.perfil === 'ALUNO') {
                redirectUrl = '/views/aluno/portal.html';
            }

            return res.json({
                message: 'Login realizado com sucesso!',
                token,
                usuario: payload,
                redirectUrl
            });
        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(500).json({ error: 'Erro interno ao autenticar usuário.' });
        }
    },

    async logout(req, res) {
        res.clearCookie(authConfig.cookieName);
        return res.json({ message: 'Sessão encerrada com sucesso.' });
    },

    async me(req, res) {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        return res.json({ usuario: req.user });
    }
};

module.exports = authController;
