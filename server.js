const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
try { require('dotenv').config(); } catch (e) {}

// Inicialização do Banco de Dados SQLite e Seeds Automáticos
const db = require('./src/config/database');
const seed = require('./database/seeds/createUsers');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globais
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos Estáticos: Public e Views
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'src/views')));

// Rotas da API Modularizada (Fases 1 a 6)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/secretaria', require('./src/routes/secretariaRoutes'));
app.use('/api/estagios', require('./src/routes/estagiosRoutes'));
app.use('/api/financeiro', require('./src/routes/financeiroRoutes'));
app.use('/api/professor', require('./src/routes/professorRoutes'));
app.use('/api/aluno', require('./src/routes/alunoRoutes'));

// Compatibilidade com endpoints rápidos da v1
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const alunosStats = await db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN m.status = 'Ativo' THEN 1 ELSE 0 END) as ativos,
                SUM(CASE WHEN m.status = 'Desistente' THEN 1 ELSE 0 END) as desistentes,
                SUM(CASE WHEN m.status = 'Trancado' THEN 1 ELSE 0 END) as trancados
            FROM tb_alunos a
            LEFT JOIN tb_matriculas m ON m.id_aluno = a.id
        `);
        const finStats = await db.get("SELECT COUNT(*) as qtd, SUM(valor_base) as total FROM tb_financeiro WHERE status = 'Atrasado'");
        const alertas = await db.get("SELECT COUNT(*) as qtd FROM tb_ocorrencias WHERE resolvido_bool = 0");
        const escalas = await db.get("SELECT COUNT(*) as qtd FROM tb_estagio_escalas");

        res.json({
            totalAlunos: alunosStats.total || 0,
            ativos: alunosStats.ativos || 0,
            desistentes: alunosStats.desistentes || 0,
            trancados: alunosStats.trancados || 0,
            totalInadimplentes: finStats.qtd || 0,
            valorInadimplente: finStats.total ? finStats.total.toFixed(2) : "0.00",
            alertasEvasao: alertas.qtd || 0,
            totalEscalas: escalas.qtd || 0
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/turmas', async (req, res) => {
    try {
        const turmas = await db.all('SELECT * FROM tb_turmas ORDER BY codigo_turma ASC');
        res.json(turmas);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/alunos', async (req, res) => {
    try {
        const alunos = await db.all(`
            SELECT a.*, m.status, m.motivo_saida, t.codigo_turma, t.id_turma
            FROM tb_alunos a
            LEFT JOIN tb_matriculas m ON m.id_aluno = a.id
            LEFT JOIN tb_turmas t ON m.id_turma = t.id_turma
            ORDER BY a.id ASC
        `);
        res.json(alunos);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Redirecionamento da raiz
app.get('/', (req, res) => {
    // Se tiver cookie autenticado, pode ir direto, senão vai para o login
    if (req.cookies && req.cookies.cepa_token) {
        return res.redirect('/views/secretaria/dashboard.html');
    }
    res.redirect('/login.html');
});

// Inicialização com checagem de Seeds
async function startServer() {
    try {
        await seed(); // Garante os 4 usuários com bcrypt e turmas no SQLite
        app.listen(PORT, () => {
            console.log(`=======================================================`);
            console.log(`🏥 SISTEMA INTEGRADO DE GESTÃO CEPA / CFIC`);
            console.log(`🚀 Servidor Ativo na porta ${PORT}`);
            console.log(`🔐 Autenticação RBAC e JWT ativa`);
            console.log(`🌐 Acesso Web: http://localhost:${PORT}`);
            console.log(`🔑 Login: http://localhost:${PORT}/login.html`);
            console.log(`=======================================================`);
        });
    } catch (error) {
        console.error('Falha ao iniciar o servidor:', error);
    }
}

startServer();
