const db = require('../config/database');

const alunoController = {
    async meuPainel(req, res) {
        try {
            const prontuarioRef = req.user.prontuario_ref || '2026-00129';

            const aluno = await db.get(`
                SELECT 
                    a.*,
                    m.status as status_matricula,
                    m.data_matricula,
                    t.id_turma,
                    t.codigo_turma,
                    t.curso_nome,
                    t.dias_semana,
                    t.horario,
                    t.preceptor_padrao
                FROM tb_alunos a
                LEFT JOIN tb_matriculas m ON m.id_aluno = a.id
                LEFT JOIN tb_turmas t ON m.id_turma = t.id_turma
                WHERE a.prontuario = ?
            `, [prontuarioRef]);

            if (!aluno) {
                return res.status(404).json({ error: 'Cadastro de aluno não localizado para este usuário.' });
            }

            const escalas = await db.all(`
                SELECT * FROM tb_estagio_escalas
                WHERE id_aluno = ?
                ORDER BY data_estagio DESC
            `, [aluno.id]);

            const financeiro = await db.all(`
                SELECT * FROM tb_financeiro
                WHERE id_aluno = ?
                ORDER BY vencimento ASC
            `, [aluno.id]);

            return res.json({
                aluno,
                escalas,
                financeiro
            });
        } catch (error) {
            console.error('Erro no painel do aluno:', error);
            return res.status(500).json({ error: 'Erro ao carregar portal do aluno.' });
        }
    }
};

module.exports = alunoController;
