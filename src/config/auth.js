// Configuração de Autenticação JWT
module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'cepa_secret_key_2026_super_secure_jwt_token',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
    cookieName: 'cepa_token',
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000 // 8 horas
    }
};
