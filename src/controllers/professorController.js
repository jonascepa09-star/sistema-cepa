const db = require('../config/database');

const professorController = {
    async listarTurmas(req, res) {
        try {
            const turmas = await db.all('SELECT * FROM tb_turmas ORDER BY codigo_turma ASC');
            return res.json(turmas);
        } catch (error) {
            console.error('Erro ao listar turmas do professor:', error);
            return res.status(500).json({ error: 'Erro ao carregar turmas.' });
        }
    },

    async obterChamada(req, res) {
        try {
            const { id_turma, data_aula } = req.query;
            if (!id_turma) {
                return res.status(400).json({ error: 'Informe id_turma.' });
            }

            const dataBusca = data_aula || new Date().toISOString().split('T')[0];

            const alunos = await db.all(`
                SELECT 
                    a.id as id_aluno,
                    a.prontuario,
                    a.nome_completo,
                    a.frequencia_acumulada,
                    m.status as status_matricula,
                    COALESCE(f.status, 'PRESENCA') as status_chamada,
                    f.observacao
                FROM tb_alunos a
                INNER JOIN tb_matriculas m ON m.id_aluno = a.id
                LEFT JOIN tb_frequencia f ON f.id_aluno = a.id AND f.id_turma = ? AND f.data_aula = ?
                WHERE m.id_turma = ?
                ORDER BY a.nome_completo ASC
            `, [id_turma, dataBusca, id_turma]);

            return res.json(alunos);
        } catch (error) {
            console.error('Erro ao obter chamada:', error);
            return res.status(500).json({ error: 'Erro ao carregar lista de chamada.' });
        }
    },

    async salvarChamada(req, res) {
        try {
            const { id_turma, data_aula, disciplina, presencas } = req.body;
            // presencas: [{ id_aluno, status: 'PRESENCA'|'FALTA'|'JUSTIFICADA', observacao }]

            if (!id_turma || !data_aula || !Array.isArray(presencas)) {
                return res.status(400).json({ error: 'Dados incompletos para chamada.' });
            }

            for (const item of presencas) {
                const existe = await db.get(
                    'SELECT id_registro FROM tb_frequencia WHERE id_aluno = ? AND id_turma = ? AND data_aula = ?',
                    [item.id_aluno, id_turma, data_aula]
                );

                if (existe) {
                    await db.run(
                        'UPDATE tb_frequencia SET status = ?, observacao = ? WHERE id_registro = ?',
                        [item.status, item.observacao || null, existe.id_registro]
                    );
                } else {
                    await db.run(
                        'INSERT INTO tb_frequencia (id_aluno, id_turma, data_aula, disciplina_modulo, status, observacao) VALUES (?, ?, ?, ?, ?, ?)',
                        [item.id_aluno, id_turma, data_aula, disciplina || 'Teórica', item.status, item.observacao || null]
                    );
                }
            }

            return res.json({ message: 'Chamada teórica gravada com sucesso!' });
        } catch (error) {
            console.error('Erro ao salvar chamada:', error);
            return res.status(500).json({ error: 'Erro ao registrar chamada.' });
        }
    }
};

module.exports = professorController;
