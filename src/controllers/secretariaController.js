const db = require('../config/database');
const bcrypt = require('bcryptjs');

const secretariaController = {
    // Estatísticas do Dashboard da Secretaria
    async dashboardStats(req, res) {
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

            const financeiroStats = await db.get(`
                SELECT 
                    COUNT(*) as inadimplentes_qtd,
                    COALESCE(SUM(valor_base + multa_juros), 0) as inadimplentes_total
                FROM tb_financeiro
                WHERE status = 'Atrasado'
            `);

            const rematriculasTravadas = await db.get(`
                SELECT COUNT(DISTINCT a.id) as travadas
                FROM tb_alunos a
                LEFT JOIN tb_financeiro f ON f.id_aluno = a.id AND f.status = 'Atrasado'
                WHERE a.frequencia_acumulada < 75.0 OR a.media_modulo < 6.0 OR f.id_lancamento IS NOT NULL
            `);

            return res.json({
                totalAlunos: alunosStats.total || 0,
                ativos: alunosStats.ativos || 0,
                desistentes: alunosStats.desistentes || 0,
                trancados: alunosStats.trancados || 0,
                inadimplentesQtd: financeiroStats.inadimplentes_qtd || 0,
                inadimplentesTotal: financeiroStats.inadimplentes_total || 0,
                rematriculasTravadas: rematriculasTravadas.travadas || 0
            });
        } catch (error) {
            console.error('Erro no dashboard da secretaria:', error);
            return res.status(500).json({ error: 'Erro ao carregar estatísticas da secretaria.' });
        }
    },

    // Listagem de Alunos com Turma e Matrícula
    async listarAlunos(req, res) {
        try {
            const { turma_id, status, busca } = req.query;

            let query = `
                SELECT 
                    a.*,
                    m.id_matricula,
                    m.status as status_matricula,
                    m.motivo_saida,
                    t.id_turma,
                    t.codigo_turma,
                    t.curso_nome,
                    t.curso_sigla
                FROM tb_alunos a
                LEFT JOIN tb_matriculas m ON m.id_aluno = a.id
                LEFT JOIN tb_turmas t ON m.id_turma = t.id_turma
                WHERE 1=1
            `;
            const params = [];

            if (turma_id) {
                query += ' AND t.id_turma = ?';
                params.push(turma_id);
            }
            if (status) {
                query += ' AND m.status = ?';
                params.push(status);
            }
            if (busca) {
                query += ' AND (a.nome_completo LIKE ? OR a.prontuario LIKE ? OR a.cpf LIKE ?)';
                params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
            }

            query += ' ORDER BY a.id ASC';

            const alunos = await db.all(query, params);
            return res.json(alunos);
        } catch (error) {
            console.error('Erro ao listar alunos:', error);
            return res.status(500).json({ error: 'Erro ao listar alunos.' });
        }
    },

    // Cadastro de Aluno com Prontuário Sequencial e Criação de Usuário
    async cadastrarAluno(req, res) {
        try {
            const { nome_completo, cpf, rg, contato_whatsapp, email, id_turma, status } = req.body;

            if (!nome_completo || !cpf || !contato_whatsapp || !id_turma) {
                return res.status(400).json({ error: 'Nome, CPF, WhatsApp e Turma são obrigatórios.' });
            }

            // Geração sequencial de prontuário: 2026-00XXX
            const countRow = await db.get('SELECT COUNT(*) as total FROM tb_alunos');
            const seq = 100 + (countRow.total || 0) + 1;
            const prontuario = `2026-00${seq}`;

            const result = await db.run(
                `INSERT INTO tb_alunos (prontuario, nome_completo, cpf, rg, contato_whatsapp, email, media_modulo, frequencia_acumulada, fichas_validadas)
                 VALUES (?, ?, ?, ?, ?, ?, 8.0, 100.0, 0)`,
                [prontuario, nome_completo, cpf, rg || null, contato_whatsapp, email || null]
            );
            const idAluno = result.id;

            // Cria Matrícula
            await db.run(
                `INSERT INTO tb_matriculas (id_aluno, id_turma, status, data_matricula)
                 VALUES (?, ?, ?, DATE('now'))`,
                [idAluno, id_turma, status || 'Ativo']
            );

            // Cria Usuário no Sistema para o Portal do Aluno
            const emailUsuario = email || `${prontuario}@aluno.cepa.edu.br`;
            const senhaHash = await bcrypt.hash('cepa123', 10);
            await db.run(
                `INSERT INTO tb_usuarios (nome, email, senha_hash, perfil, prontuario_ref, ativo)
                 VALUES (?, ?, ?, 'ALUNO', ?, 1)`,
                [nome_completo, emailUsuario.toLowerCase(), senhaHash, prontuario]
            );

            return res.status(201).json({
                message: 'Aluno cadastrado com sucesso!',
                id: idAluno,
                prontuario,
                nome_completo,
                acesso_portal: {
                    login: emailUsuario,
                    senha_inicial: 'cepa123'
                }
            });
        } catch (error) {
            console.error('Erro ao cadastrar aluno:', error);
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'CPF ou Prontuário já cadastrado no sistema.' });
            }
            return res.status(500).json({ error: 'Erro ao cadastrar aluno.' });
        }
    },

    // Motor de Validação de Rematrícula em 1 Clique (Trava Tripla)
    async validarRematricula(req, res) {
        try {
            const { id_aluno } = req.params;

            const aluno = await db.get(`
                SELECT a.*, m.status as status_matricula, t.codigo_turma
                FROM tb_alunos a
                LEFT JOIN tb_matriculas m ON m.id_aluno = a.id
                LEFT JOIN tb_turmas t ON m.id_turma = t.id_turma
                WHERE a.id = ?
            `, [id_aluno]);

            if (!aluno) {
                return res.status(404).json({ error: 'Aluno não encontrado.' });
            }

            const bloqueios = [];

            // 1. Financeiro: Existe parcela em atraso?
            const parcelasAtraso = await db.all(
                "SELECT * FROM tb_financeiro WHERE id_aluno = ? AND status = 'Atrasado'",
                [id_aluno]
            );
            if (parcelasAtraso.length > 0) {
                bloqueios.push({
                    pilar: 'FINANCEIRO',
                    mensagem: `Débito Pendente: Consta(m) ${parcelasAtraso.length} parcela(s) em atraso no sistema.`
                });
            }

            // 2. Frequência: Frequência acumulada < 75%?
            if (aluno.frequencia_acumulada < 75.0) {
                bloqueios.push({
                    pilar: 'FREQUENCIA',
                    mensagem: `Frequência Insuficiente: Frequência atual de ${aluno.frequencia_acumulada}% está abaixo do mínimo (75%).`
                });
            }

            // 3. Acadêmico: Média do módulo < 6.0?
            if (aluno.media_modulo < 6.0) {
                bloqueios.push({
                    pilar: 'ACADEMICO',
                    mensagem: `Nota Insuficiente: Média (${aluno.media_modulo}) está abaixo do corte de aprovação (6.0).`
                });
            }

            const liberado = bloqueios.length === 0;

            return res.json({
                aluno: aluno.nome_completo,
                prontuario: aluno.prontuario,
                turma: aluno.codigo_turma,
                liberado,
                bloqueios,
                mensagem: liberado ? 'Rematrícula liberada com 1 clique!' : 'Rematrícula travada por pendências.'
            });
        } catch (error) {
            console.error('Erro ao validar rematrícula:', error);
            return res.status(500).json({ error: 'Erro ao validar rematrícula.' });
        }
    },

    // Motor de Certificação (Os 4 Pilares)
    async validarCertificado(req, res) {
        try {
            const { id_aluno } = req.params;

            const aluno = await db.get(`
                SELECT a.*, t.codigo_turma, t.curso_nome, t.curso_sigla
                FROM tb_alunos a
                LEFT JOIN tb_matriculas m ON m.id_aluno = a.id
                LEFT JOIN tb_turmas t ON m.id_turma = t.id_turma
                WHERE a.id = ?
            `, [id_aluno]);

            if (!aluno) {
                return res.status(404).json({ error: 'Aluno não encontrado.' });
            }

            const pendencias = [];

            // 1. Média >= 6.0
            const c1_media = aluno.media_modulo >= 6.0;
            if (!c1_media) pendencias.push(`Média de notas insuficiente (${aluno.media_modulo} < 6.0)`);

            // 2. Frequência >= 75%
            const c2_freq = aluno.frequencia_acumulada >= 75.0;
            if (!c2_freq) pendencias.push(`Frequência teórica insuficiente (${aluno.frequencia_acumulada}% < 75%)`);

            // 3. Fichas de Estágio Homologadas
            const c3_estagio = Boolean(aluno.fichas_validadas);
            if (!c3_estagio) pendencias.push('Fichas de estágio pendentes de validação pela Coordenação');

            // 4. Quitação Financeira (sem pendências ou atrasos)
            const debitos = await db.get(
                "SELECT COUNT(*) as qtd FROM tb_financeiro WHERE id_aluno = ? AND (status = 'Atrasado' OR status = 'Pendente')",
                [id_aluno]
            );
            const c4_financeiro = (debitos && debitos.qtd === 0);
            if (!c4_financeiro) pendencias.push('Existem débitos ou mensalidades em aberto');

            const elegivel = c1_media && c2_freq && c3_estagio && c4_financeiro;

            return res.json({
                aluno: aluno.nome_completo,
                prontuario: aluno.prontuario,
                cpf: aluno.cpf,
                curso: aluno.curso_nome,
                sigla: aluno.curso_sigla,
                criterios: {
                    media_aprovada: { status: c1_media, valor: aluno.media_modulo, exigido: 6.0 },
                    frequencia_minima: { status: c2_freq, valor: `${aluno.frequencia_acumulada}%`, exigido: '75%' },
                    fichas_estagio_validadas: { status: c3_estagio, valor: c3_estagio ? '100% Homologadas' : 'Pendentes' },
                    quitacao_financeira: { status: c4_financeiro, valor: c4_financeiro ? 'Quitado' : 'Com Débitos' }
                },
                elegivel,
                pendencias
            });
        } catch (error) {
            console.error('Erro ao validar certificado:', error);
            return res.status(500).json({ error: 'Erro ao validar emissão de certificado.' });
        }
    }
};

module.exports = secretariaController;
