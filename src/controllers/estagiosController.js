const db = require('../config/database');

const estagiosController = {
    // Listar escalas com dados do aluno, turma e status
    async listar(req, res) {
        try {
            const { turma_id, hospital, preceptor, data } = req.query;

            let query = `
                SELECT 
                    e.id_escala,
                    e.id_aluno,
                    a.prontuario,
                    a.nome_completo as nome_aluno,
                    t.codigo_turma,
                    t.curso_sigla,
                    m.status as status_aluno,
                    m.motivo_saida as motivo_desistencia,
                    e.hospital_campo,
                    e.preceptor_nome,
                    e.data_estagio,
                    e.turno,
                    e.status_presenca,
                    e.taxa_reposicao_gerada,
                    e.taxa_reposicao_valor,
                    e.atestado_protocolo,
                    e.ficha_validada_bool,
                    e.faltas_consecutivas
                FROM tb_estagio_escalas e
                INNER JOIN tb_alunos a ON e.id_aluno = a.id
                INNER JOIN tb_turmas t ON e.id_turma = t.id_turma
                LEFT JOIN tb_matriculas m ON m.id_aluno = a.id AND m.id_turma = t.id_turma
                WHERE 1=1
            `;
            const params = [];

            if (turma_id) {
                query += ` AND e.id_turma = ?`;
                params.push(turma_id);
            }
            if (hospital) {
                query += ` AND e.hospital_campo LIKE ?`;
                params.push(`%${hospital}%`);
            }
            if (preceptor) {
                query += ` AND e.preceptor_nome LIKE ?`;
                params.push(`%${preceptor}%`);
            }
            if (data) {
                query += ` AND e.data_estagio = ?`;
                params.push(data);
            }

            query += ` ORDER BY e.data_estagio DESC, a.nome_completo ASC`;

            const escalas = await db.all(query, params);
            return res.json(escalas);
        } catch (error) {
            console.error('Erro ao listar escalas:', error);
            return res.status(500).json({ error: 'Erro ao listar escalas de estágio.' });
        }
    },

    // Criar nova escala com validação IC (Bloqueio Noturno)
    async criar(req, res) {
        try {
            const { id_aluno, id_turma, hospital_campo, preceptor_nome, data_estagio, turno } = req.body;

            if (!id_aluno || !id_turma || !hospital_campo || !preceptor_nome || !data_estagio || !turno) {
                return res.status(400).json({ error: 'Preencha todos os campos obrigatórios da escala.' });
            }

            const turma = await db.get('SELECT * FROM tb_turmas WHERE id_turma = ?', [id_turma]);
            if (!turma) {
                return res.status(404).json({ error: 'Turma não encontrada.' });
            }

            // Regra IC: Bloqueia agendamento noturno para Instrumentação Cirúrgica
            if (turma.curso_sigla === 'IC' && turno.toLowerCase().includes('noite')) {
                return res.status(400).json({
                    error: '❌ Regra Contratual IC Violada: Estágios de Instrumentação Cirúrgica não são autorizados no turno da noite.'
                });
            }

            const result = await db.run(
                `INSERT INTO tb_estagio_escalas (id_aluno, id_turma, hospital_campo, preceptor_nome, data_estagio, turno, status_presenca)
                 VALUES (?, ?, ?, ?, ?, ?, 'AGENDADO')`,
                [id_aluno, id_turma, hospital_campo, preceptor_nome, data_estagio, turno]
            );

            return res.status(201).json({
                message: 'Escala de estágio cadastrada com sucesso!',
                id_escala: result.id
            });
        } catch (error) {
            console.error('Erro ao criar escala:', error);
            return res.status(500).json({ error: 'Erro ao cadastrar escala de estágio.' });
        }
    },

    // Marcação de Presença no Campo com Regras Automáticas
    async lancarPresenca(req, res) {
        try {
            const { id_escala, id_aluno, status, atestado_num } = req.body;

            if (!id_escala || !status) {
                return res.status(400).json({ error: 'Informe id_escala e status (PRESENCA, FALTA, JUSTIFICADA).' });
            }

            const escala = await db.get(`
                SELECT e.*, t.curso_sigla, a.nome_completo, a.prontuario
                FROM tb_estagio_escalas e
                INNER JOIN tb_turmas t ON e.id_turma = t.id_turma
                INNER JOIN tb_alunos a ON e.id_aluno = a.id
                WHERE e.id_escala = ?
            `, [id_escala]);

            if (!escala) {
                return res.status(404).json({ error: 'Escala não encontrada.' });
            }

            let taxaGerada = 0;
            let taxaValor = 0.00;
            let novasFaltas = escala.faltas_consecutivas || 0;
            let alertaDisparado = false;

            if (status === 'FALTA') {
                taxaGerada = 1;
                taxaValor = 50.00;
                novasFaltas += 1;

                // a) Cria automaticamente débito de R$ 50,00 na tb_financeiro
                const vencimento = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                await db.run(
                    `INSERT INTO tb_financeiro (id_aluno, descricao, valor_base, vencimento, status, multa_juros, chave_pix)
                     VALUES (?, ?, 50.00, ?, 'Pendente', 0.00, 'secretaria@cepa.edu.br')`,
                    [escala.id_aluno, `Taxa de Reposição de Falta em Estágio (${escala.data_estagio})`, vencimento]
                );

                // b) Verifica se é 3ª falta consecutiva no IC
                if (escala.curso_sigla === 'IC' && novasFaltas >= 3) {
                    alertaDisparado = true;
                    await db.run(
                        `INSERT INTO tb_ocorrencias (id_aluno, tipo, titulo, descricao, nivel_urgencia)
                         VALUES (?, 'ALERTA_EVASAO_IC', '3 Faltas Consecutivas no Estágio de IC', ?, 'CRITICO')`,
                        [
                            escala.id_aluno,
                            `O aluno ${escala.nome_completo} (${escala.prontuario}) acumulou 3 faltas consecutivas sem justificativa no estágio de IC. Notificação imediata para Coordenação.`
                        ]
                    );
                }
            } else if (status === 'PRESENCA') {
                novasFaltas = 0;
            } else if (status === 'JUSTIFICADA') {
                // Isenta a taxa de R$ 50,00 e salva número do atestado
                taxaGerada = 0;
                taxaValor = 0.00;
            }

            await db.run(
                `UPDATE tb_estagio_escalas 
                 SET status_presenca = ?, 
                     taxa_reposicao_gerada = ?, 
                     taxa_reposicao_valor = ?, 
                     atestado_protocolo = ?,
                     faltas_consecutivas = ?
                 WHERE id_escala = ?`,
                [status, taxaGerada, taxaValor, atestado_num || null, novasFaltas, id_escala]
            );

            return res.json({
                message: 'Frequência do estágio registrada com sucesso!',
                status,
                taxa_reposicao_gerada: Boolean(taxaGerada),
                taxa_reposicao_valor: taxaValor,
                faltas_consecutivas: novasFaltas,
                alerta_evasao_ic: alertaDisparado
            });
        } catch (error) {
            console.error('Erro ao lançar presença de estágio:', error);
            return res.status(500).json({ error: 'Erro ao registrar frequência no estágio.' });
        }
    },

    // Validação da Ficha pela Coordenação
    async validarFicha(req, res) {
        try {
            const { id } = req.params;
            const { parecer } = req.body;

            const escala = await db.get('SELECT * FROM tb_estagio_escalas WHERE id_escala = ?', [id]);
            if (!escala) {
                return res.status(404).json({ error: 'Escala não encontrada.' });
            }

            const novoStatus = escala.ficha_validada_bool ? 0 : 1;
            await db.run(
                'UPDATE tb_estagio_escalas SET ficha_validada_bool = ?, parecer_coordenacao = ? WHERE id_escala = ?',
                [novoStatus, parecer || null, id]
            );

            if (novoStatus === 1) {
                await db.run('UPDATE tb_alunos SET fichas_validadas = 1 WHERE id = ?', [escala.id_aluno]);
            }

            return res.json({
                message: novoStatus ? 'Ficha de estágio homologada com sucesso!' : 'Homologação cancelada.',
                ficha_validada: Boolean(novoStatus)
            });
        } catch (error) {
            console.error('Erro ao validar ficha:', error);
            return res.status(500).json({ error: 'Erro ao validar ficha de estágio.' });
        }
    },

    // Listar Alertas Críticos de Evasão
    async listarAlertas(req, res) {
        try {
            const alertas = await db.all(`
                SELECT o.*, a.nome_completo as aluno_nome, a.prontuario, a.contato_whatsapp
                FROM tb_ocorrencias o
                INNER JOIN tb_alunos a ON o.id_aluno = a.id
                WHERE o.resolvido_bool = 0
                ORDER BY o.created_at DESC
            `);
            return res.json(alertas);
        } catch (error) {
            console.error('Erro ao listar alertas:', error);
            return res.status(500).json({ error: 'Erro ao carregar alertas.' });
        }
    }
};

module.exports = estagiosController;
