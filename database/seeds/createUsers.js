const bcrypt = require('bcryptjs');
const db = require('../../src/config/database');

async function seed() {
    console.log('🌱 Iniciando carga de sementes (Seeds)...');

    // 1. Usuários de Teste Padrão com bcrypt
    const senhaPadrao = 'cepa123';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPadrao, salt);

    const usuarios = [
        { nome: 'Secretaria Geral CEPA', email: 'secretaria@cepa.edu.br', perfil: 'SECRETARIA', prontuario_ref: null },
        { nome: 'Coordenação de Estágios', email: 'coordenacao@cepa.edu.br', perfil: 'COORDENACAO', prontuario_ref: null },
        { nome: 'Profª. Amanda Silveira', email: 'professor@cepa.edu.br', perfil: 'PROFESSOR', prontuario_ref: null },
        { nome: 'Ana Cristina de Souza', email: 'aluno@cepa.edu.br', perfil: 'ALUNO', prontuario_ref: '2026-00129' }
    ];

    for (const u of usuarios) {
        const existe = await db.get('SELECT id FROM tb_usuarios WHERE email = ?', [u.email]);
        if (!existe) {
            await db.run(
                'INSERT INTO tb_usuarios (nome, email, senha_hash, perfil, prontuario_ref, ativo) VALUES (?, ?, ?, ?, ?, 1)',
                [u.nome, u.email, senhaHash, u.perfil, u.prontuario_ref]
            );
            console.log(`👤 Usuário criado: [${u.perfil}] ${u.email} (Senha: ${senhaPadrao})`);
        }
    }

    // 2. Regras de Contrato
    const regras = [
        { sigla: 'IC', nome: 'Instrumentação Cirúrgica', media: 6.0, freq: 75.0, reposicao: 50.00, max_falta: 3, bloqueio_noturno: 1 },
        { sigla: 'TEC', nome: 'Técnico em Enfermagem', media: 6.0, freq: 75.0, reposicao: 50.00, max_falta: 5, bloqueio_noturno: 0 },
        { sigla: 'AUX', nome: 'Auxiliar de Enfermagem', media: 6.0, freq: 75.0, reposicao: 50.00, max_falta: 5, bloqueio_noturno: 0 }
    ];

    for (const r of regras) {
        const existeRegra = await db.get('SELECT id_regra FROM tb_regras_contrato WHERE curso_sigla = ?', [r.sigla]);
        if (!existeRegra) {
            await db.run(
                `INSERT INTO tb_regras_contrato (curso_sigla, curso_nome, media_aprovacao, frequencia_minima, valor_reposicao_falta, dias_max_falta_ic, bloqueio_fds_noite_ic) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [r.sigla, r.nome, r.media, r.freq, r.reposicao, r.max_falta, r.bloqueio_noturno]
            );
        }
    }

    // 3. Turmas
    const turmas = [
        { id: 1, codigo: 'Turma 131', curso: 'Instrumentação Cirúrgica', sigla: 'IC', inicio: '2026-02-07', fim: '2026-11-28', dias: 'Sábados', horario: 'Manhã / Tarde (08:00 às 17:00)', preceptor: 'Enfª. Amanda Silveira' },
        { id: 2, codigo: 'Turma 129', curso: 'Instrumentação Cirúrgica', sigla: 'IC', inicio: '2025-08-10', fim: '2026-06-20', dias: 'Sábados', horario: 'Manhã / Tarde (08:00 às 17:00)', preceptor: 'Enfª. Amanda Silveira' },
        { id: 3, codigo: 'TN-240', curso: 'Técnico em Enfermagem', sigla: 'TEC', inicio: '2026-01-15', fim: '2027-07-20', dias: 'Segunda a Sexta', horario: 'Noite (18:50 às 22:30)', preceptor: 'Prof. Carlos Eduardo' },
        { id: 4, codigo: 'AUX-242', curso: 'Auxiliar de Enfermagem', sigla: 'AUX', inicio: '2026-02-01', fim: '2026-12-18', dias: 'Segunda a Sexta', horario: 'Noite (18:50 às 22:30)', preceptor: 'Enfª. Patrícia Lima' }
    ];

    for (const t of turmas) {
        const existeTurma = await db.get('SELECT id_turma FROM tb_turmas WHERE codigo_turma = ?', [t.codigo]);
        if (!existeTurma) {
            await db.run(
                `INSERT INTO tb_turmas (id_turma, codigo_turma, curso_nome, curso_sigla, data_inicio, data_fim, dias_semana, horario, preceptor_padrao) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [t.id, t.codigo, t.curso, t.sigla, t.inicio, t.fim, t.dias, t.horario, t.preceptor]
            );
        }
    }

    // 4. Alunos da Turma 131 e outras turmas
    const alunos = [
        { id: 1, pront: '2026-00129', nome: 'Ana Cristina de Souza', cpf: '234.567.890-11', zap: '11987654321', email: 'ana.cristina@email.com', media: 8.5, freq: 92.0, val: 1, status: 'Ativo', motivo: null, turma_id: 1 },
        { id: 2, pront: '2026-00130', nome: 'Carla Roberta Oliveira', cpf: '345.678.901-22', zap: '11976543210', email: 'carla.oliveira@email.com', media: 7.8, freq: 88.0, val: 1, status: 'Ativo', motivo: null, turma_id: 1 },
        { id: 3, pront: '2026-00131', nome: 'Fernanda Lima de Carvalho', cpf: '456.789.012-33', zap: '11965432109', email: 'fernanda.carvalho@email.com', media: 9.2, freq: 96.0, val: 1, status: 'Ativo', motivo: null, turma_id: 1 },
        { id: 4, pront: '2026-00132', nome: 'Mateus Silva Santos', cpf: '567.890.123-44', zap: '11954321098', email: 'mateus.santos@email.com', media: 6.5, freq: 65.0, val: 0, status: 'Desistente', motivo: 'Mudança de Turno de Trabalho', turma_id: 1 },
        { id: 5, pront: '2026-00133', nome: 'Raquel Mendonça Viana', cpf: '678.901.234-55', zap: '11943210987', email: 'raquel.viana@email.com', media: 7.0, freq: 72.0, val: 0, status: 'Ativo', motivo: null, turma_id: 1 },
        { id: 6, pront: '2026-00134', nome: 'Richard Henrique Souza', cpf: '789.012.345-66', zap: '11932109876', email: 'richard.souza@email.com', media: 6.0, freq: 70.0, val: 0, status: 'Trancado', motivo: 'Questões de Saúde Pessoal', turma_id: 1 },
        { id: 7, pront: '2026-00135', nome: 'Tamires Rodrigues Ramos', cpf: '890.123.456-77', zap: '11921098765', email: 'tamires.ramos@email.com', media: 8.0, freq: 85.0, val: 1, status: 'Ativo', motivo: null, turma_id: 1 },
        { id: 8, pront: '2026-00136', nome: 'Wellington Barboza da Silva', cpf: '901.234.567-88', zap: '11910987654', email: 'wellington.silva@email.com', media: 6.8, freq: 80.0, val: 0, status: 'Ativo', motivo: null, turma_id: 1 }
    ];

    for (const a of alunos) {
        const existeAluno = await db.get('SELECT id FROM tb_alunos WHERE prontuario = ?', [a.pront]);
        if (!existeAluno) {
            await db.run(
                `INSERT INTO tb_alunos (id, prontuario, nome_completo, cpf, contato_whatsapp, email, media_modulo, frequencia_acumulada, fichas_validadas) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [a.id, a.pront, a.nome, a.cpf, a.zap, a.email, a.media, a.freq, a.val]
            );

            // Vincula matrícula
            await db.run(
                `INSERT INTO tb_matriculas (id_aluno, id_turma, status, motivo_saida, data_matricula) 
                 VALUES (?, ?, ?, ?, '2026-02-01')`,
                [a.id, a.turma_id, a.status, a.motivo]
            );
        }
    }

    // 5. Escalas de Estágio
    const escalas = [
        { id: 101, aluno_id: 1, turma_id: 1, campo: 'Hospital Municipal de Franco da Rocha - Centro Cirúrgico', preceptor: 'Enfª. Amanda Silveira', data: '2026-10-17', turno: 'Manhã (07:00 às 13:00)', presenca: 'PRESENCA', reposicao: 0, taxa: 0, ficha: 1, faltas: 0 },
        { id: 102, aluno_id: 2, turma_id: 1, campo: 'Hospital Municipal de Franco da Rocha - Centro Cirúrgico', preceptor: 'Enfª. Amanda Silveira', data: '2026-10-17', turno: 'Manhã (07:00 às 13:00)', presenca: 'PRESENCA', reposicao: 0, taxa: 0, ficha: 1, faltas: 0 },
        { id: 103, aluno_id: 3, turma_id: 1, campo: 'Hospital Estadual de Francisco Morato', preceptor: 'Enf. Marcos Vinicius', data: '2026-10-17', turno: 'Tarde (13:00 às 19:00)', presenca: 'PRESENCA', reposicao: 0, taxa: 0, ficha: 1, faltas: 0 },
        { id: 104, aluno_id: 4, turma_id: 1, campo: 'Hospital Municipal de Franco da Rocha - Centro Cirúrgico', preceptor: 'Enfª. Amanda Silveira', data: '2026-10-17', turno: 'Manhã (07:00 às 13:00)', presenca: 'FALTA', reposicao: 1, taxa: 50.00, ficha: 0, faltas: 3 },
        { id: 105, aluno_id: 5, turma_id: 1, campo: 'Hospital Regional de Caieiras', preceptor: 'Enfª. Amanda Silveira', data: '2026-10-18', turno: 'Manhã (07:00 às 13:00)', presenca: 'JUSTIFICADA', reposicao: 0, taxa: 0, ficha: 0, faltas: 0 },
        { id: 106, aluno_id: 6, turma_id: 1, campo: 'Hospital Regional de Caieiras', preceptor: 'Enfª. Amanda Silveira', data: '2026-10-18', turno: 'Manhã (07:00 às 13:00)', presenca: 'JUSTIFICADA', reposicao: 0, taxa: 0, ficha: 0, faltas: 0 },
        { id: 107, aluno_id: 7, turma_id: 1, campo: 'Hospital Estadual de Francisco Morato', preceptor: 'Enf. Marcos Vinicius', data: '2026-10-18', turno: 'Tarde (13:00 às 19:00)', presenca: 'AGENDADO', reposicao: 0, taxa: 0, ficha: 0, faltas: 0 },
        { id: 108, aluno_id: 8, turma_id: 1, campo: 'Hospital Regional de Caieiras', preceptor: 'Enfª. Amanda Silveira', data: '2026-10-18', turno: 'Manhã (07:00 às 13:00)', presenca: 'FALTA', reposicao: 1, taxa: 50.00, ficha: 0, faltas: 1 }
    ];

    for (const e of escalas) {
        const existeEscala = await db.get('SELECT id_escala FROM tb_estagio_escalas WHERE id_escala = ?', [e.id]);
        if (!existeEscala) {
            await db.run(
                `INSERT INTO tb_estagio_escalas (id_escala, id_aluno, id_turma, hospital_campo, preceptor_nome, data_estagio, turno, status_presenca, taxa_reposicao_gerada, taxa_reposicao_valor, ficha_validada_bool, faltas_consecutivas) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [e.id, e.aluno_id, e.turma_id, e.campo, e.preceptor, e.data, e.turno, e.presenca, e.reposicao, e.taxa, e.ficha, e.faltas]
            );
        }
    }

    // 6. Alerta de Evasão IC para Mateus (3 faltas)
    const existeOcorrencia = await db.get('SELECT id_ocorrencia FROM tb_ocorrencias WHERE id_aluno = 4');
    if (!existeOcorrencia) {
        await db.run(
            `INSERT INTO tb_ocorrencias (id_aluno, tipo, titulo, descricao, nivel_urgencia) 
             VALUES (4, 'ALERTA_EVASAO_IC', '3 Faltas Consecutivas em Campo Cirúrgico', 'O aluno atingiu 3 faltas consecutivas sem justificativa no estágio de IC. Taxa de reposição de R$ 50,00 gerada automaticamente.', 'CRITICO')`
        );
    }

    // 7. Financeiro
    const financeiro = [
        { id: 501, aluno_id: 4, desc: 'Mensalidade Parcela 08/10', valor: 380.00, venc: '2026-10-05', status: 'Atrasado', multa: 18.80 },
        { id: 502, aluno_id: 4, desc: 'Taxa de Reposição de Falta em Estágio (17/10)', valor: 50.00, venc: '2026-10-20', status: 'Pendente', multa: 0.00 },
        { id: 503, aluno_id: 5, desc: 'Mensalidade Parcela 08/10', valor: 380.00, venc: '2026-10-05', status: 'Atrasado', multa: 18.80 },
        { id: 504, aluno_id: 8, desc: 'Taxa de Reposição de Falta em Estágio (18/10)', valor: 50.00, venc: '2026-10-22', status: 'Pendente', multa: 0.00 },
        { id: 505, aluno_id: 1, desc: 'Mensalidade Parcela 09/10', valor: 380.00, venc: '2026-10-15', status: 'Pago', multa: 0.00 }
    ];

    for (const f of financeiro) {
        const existeFin = await db.get('SELECT id_lancamento FROM tb_financeiro WHERE id_lancamento = ?', [f.id]);
        if (!existeFin) {
            await db.run(
                `INSERT INTO tb_financeiro (id_lancamento, id_aluno, descricao, valor_base, vencimento, status, multa_juros, chave_pix) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'secretaria@cepa.edu.br')`,
                [f.id, f.aluno_id, f.desc, f.valor, f.venc, f.status, f.multa]
            );
        }
    }

    console.log('✅ Seeds finalizados com sucesso! 4 Usuários e dados operacionais disponíveis.');
}

if (require.main === module) {
    seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = seed;
