const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Carregamento e persistência de dados em memória e disco
const dataFilePath = path.join(__dirname, 'database', 'seed.json');

function loadData() {
    try {
        const raw = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Erro ao ler seed.json:', e);
        return { turmas: [], alunos: [], escalas_estagio: [], financeiro: [], regras: [] };
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Erro ao salvar no disco:', e);
    }
}

// -------------------------------------------------------------
// ROTAS DA API
// -------------------------------------------------------------

// 1. Resumo / Dashboard
app.get('/api/dashboard/stats', (req, res) => {
    const db = loadData();
    const totalAlunos = db.alunos.length;
    const ativos = db.alunos.filter(a => a.status === 'Ativo').length;
    const desistentes = db.alunos.filter(a => a.status === 'Desistente').length;
    const trancados = db.alunos.filter(a => a.status === 'Trancado').length;
    
    const pendenciasFinanceiras = db.financeiro.filter(f => f.status === 'Atrasado' || f.status === 'Pendente');
    const valorInadimplente = db.financeiro
        .filter(f => f.status === 'Atrasado')
        .reduce((acc, curr) => acc + (curr.valor_total || curr.valor_base), 0);

    const alertasEvasao = db.escalas_estagio.filter(e => e.alerta_evasao).length;

    res.json({
        totalAlunos,
        ativos,
        desistentes,
        trancados,
        totalInadimplentes: pendenciasFinanceiras.length,
        valorInadimplente: valorInadimplente.toFixed(2),
        alertasEvasao,
        totalEscalas: db.escalas_estagio.length
    });
});

// 2. Turmas
app.get('/api/turmas', (req, res) => {
    const db = loadData();
    res.json(db.turmas);
});

// 3. Alunos
app.get('/api/alunos', (req, res) => {
    const db = loadData();
    const { turma_id, status, busca } = req.query;
    let list = db.alunos;

    if (turma_id) {
        list = list.filter(a => a.turma_id == turma_id);
    }
    if (status) {
        list = list.filter(a => a.status === status);
    }
    if (busca) {
        const q = busca.toLowerCase();
        list = list.filter(a => 
            a.nome_completo.toLowerCase().includes(q) || 
            a.prontuario.toLowerCase().includes(q)
        );
    }
    res.json(list);
});

// Cadastro de Aluno com Prontuário sequencial automático
app.post('/api/alunos', (req, res) => {
    const db = loadData();
    const { nome_completo, cpf, rg, contato_whatsapp, email, turma_id, status } = req.body;
    
    // Gera prontuário sequencial ex: 2026-00137
    const year = new Date().getFullYear();
    const nextSeq = 100 + db.alunos.length + 1;
    const prontuario = `${year}-00${nextSeq}`;

    const turma = db.turmas.find(t => t.id_turma == turma_id) || db.turmas[0];

    const novoAluno = {
        id: db.alunos.length > 0 ? Math.max(...db.alunos.map(a => a.id)) + 1 : 1,
        prontuario,
        nome_completo,
        cpf,
        rg,
        contato_whatsapp,
        email,
        turma_id: turma.id_turma,
        codigo_turma: turma.codigo_turma,
        status: status || 'Ativo',
        motivo_saida: null,
        media_modulo: 0.0,
        frequencia_acumulada: 100.0,
        fichas_validadas: false,
        parcelas_atraso: 0
    };

    db.alunos.push(novoAluno);
    saveData(db);
    res.status(201).json(novoAluno);
});

// 4. Escalas de Estágio (Módulo 3)
app.get('/api/estagios', (req, res) => {
    const db = loadData();
    const { turma, hospital, preceptor } = req.query;
    let list = db.escalas_estagio;

    if (turma) {
        list = list.filter(e => e.codigo_turma === turma);
    }
    if (hospital) {
        list = list.filter(e => e.hospital_campo.toLowerCase().includes(hospital.toLowerCase()));
    }
    if (preceptor) {
        list = list.filter(e => e.preceptor_nome.toLowerCase().includes(preceptor.toLowerCase()));
    }

    res.json(list);
});

// Registro de Presença/Falta de Estágio com Regras Automáticas
app.put('/api/estagios/:id/presenca', (req, res) => {
    const db = loadData();
    const escalaId = parseInt(req.params.id);
    const { status_presenca, atestado_protocolo } = req.body; // 'Presenca', 'Falta', 'Falta Justificada'

    const item = db.escalas_estagio.find(e => e.id_escala === escalaId);
    if (!item) {
        return res.status(404).json({ error: 'Escala não encontrada' });
    }

    item.status_presenca = status_presenca;
    if (atestado_protocolo) {
        item.atestado_protocolo = atestado_protocolo;
    }

    // Regra Automática 1: Falta sem atestado gera taxa de R$ 50,00 e adiciona débito financeiro
    if (status_presenca === 'Falta') {
        item.taxa_reposicao_gerada = true;
        item.taxa_reposicao_valor = 50.00;
        item.faltas_consecutivas = (item.faltas_consecutivas || 0) + 1;

        // Regra Automática 2: 3 faltas consecutivas no IC disparam alerta vermelho de evasão
        if (item.codigo_turma.includes('131') || item.codigo_turma.includes('129') || item.codigo_turma.includes('IC')) {
            if (item.faltas_consecutivas >= 3) {
                item.alerta_evasao = true;
            }
        }

        // Lança automaticamente no módulo financeiro
        const aluno = db.alunos.find(a => a.id === item.aluno_id);
        const novoLancamento = {
            id_lancamento: Math.floor(Math.random() * 90000) + 1000,
            aluno_id: item.aluno_id,
            nome_aluno: item.nome_aluno,
            prontuario: item.prontuario,
            contato_whatsapp: aluno ? aluno.contato_whatsapp : '11999999999',
            descricao: `Taxa de Reposição de Falta em Estágio (${item.data_estagio})`,
            valor_base: 50.00,
            vencimento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dias_atraso: 0,
            multa_juros: 0.00,
            valor_total: 50.00,
            status: 'Pendente',
            chave_pix: 'secretaria@cepa.edu.br'
        };
        db.financeiro.push(novoLancamento);
    } else if (status_presenca === 'Presenca') {
        item.faltas_consecutivas = 0;
        item.taxa_reposicao_gerada = false;
        item.taxa_reposicao_valor = 0.00;
    } else if (status_presenca === 'Falta Justificada') {
        // Falta Justificada abona a cobrança da taxa de R$ 50,00
        item.taxa_reposicao_gerada = false;
        item.taxa_reposicao_valor = 0.00;
    }

    saveData(db);
    res.json({ message: 'Presença atualizada com sucesso', escala: item });
});

// Validação / Aprovação da Ficha de Estágio pela Coordenação
app.put('/api/estagios/:id/validar-ficha', (req, res) => {
    const db = loadData();
    const escalaId = parseInt(req.params.id);
    const { ficha_validada_bool, parecer_coordenacao } = req.body;

    const item = db.escalas_estagio.find(e => e.id_escala === escalaId);
    if (!item) {
        return res.status(404).json({ error: 'Escala não encontrada' });
    }

    item.ficha_validada_bool = ficha_validada_bool !== undefined ? ficha_validada_bool : true;
    if (parecer_coordenacao) {
        item.parecer_coordenacao = parecer_coordenacao;
    }

    // Se aprovado, atualiza status do aluno
    const aluno = db.alunos.find(a => a.id === item.aluno_id);
    if (aluno && item.ficha_validada_bool) {
        aluno.fichas_validadas = true;
    }

    saveData(db);
    res.json({ message: 'Ficha de estágio validada com sucesso', escala: item });
});

// Adicionar nova escala de estágio com validação IC (bloqueia fds/noite se for IC)
app.post('/api/estagios', (req, res) => {
    const db = loadData();
    const { aluno_id, hospital_campo, preceptor_nome, data_estagio, turno } = req.body;

    const aluno = db.alunos.find(a => a.id == aluno_id);
    if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    // Validação IC: regras do curso de Instrumentação Cirúrgica
    if (aluno.codigo_turma.includes('131') || aluno.codigo_turma.includes('129') || aluno.codigo_turma.includes('IC')) {
        const dateObj = new Date(data_estagio + 'T00:00:00');
        const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado
        
        // Bloqueio regra contratual: Estágio IC não permite agendamento noturno
        if (turno.toLowerCase().includes('noite')) {
            return res.status(400).json({ 
                error: 'Regra IC Violada: Estágios de Instrumentação Cirúrgica não são permitidos no turno da noite.' 
            });
        }
    }

    const novaEscala = {
        id_escala: Math.floor(Math.random() * 90000) + 1000,
        aluno_id: aluno.id,
        nome_aluno: aluno.nome_completo,
        prontuario: aluno.prontuario,
        codigo_turma: aluno.codigo_turma,
        status_aluno: aluno.status,
        motivo_desistencia: aluno.motivo_saida || null,
        hospital_campo,
        preceptor_nome,
        data_estagio,
        turno,
        status_presenca: 'Agendado',
        taxa_reposicao_gerada: false,
        taxa_reposicao_valor: 0.00,
        ficha_validada_bool: false,
        faltas_consecutivas: 0,
        alerta_evasao: false
    };

    db.escalas_estagio.push(novaEscala);
    saveData(db);
    res.status(201).json(novaEscala);
});

// 5. Motor de Validação de Rematrícula (Módulo 1)
app.post('/api/rematricula/validar/:alunoId', (req, res) => {
    const db = loadData();
    const alunoId = parseInt(req.params.alunoId);
    const aluno = db.alunos.find(a => a.id === alunoId);

    if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const bloqueios = [];

    // 1. Financeiro: Existe parcela em atraso?
    const parcelasAtrasadas = db.financeiro.filter(f => f.aluno_id === alunoId && f.status === 'Atrasado');
    if (parcelasAtrasadas.length > 0 || aluno.parcelas_atraso > 0) {
        bloqueios.push({
            tipo: 'FINANCEIRO',
            mensagem: `Débito pendente: Aluno possui ${parcelasAtrasadas.length || aluno.parcelas_atraso} parcela(s) em atraso.`
        });
    }

    // 2. Frequência: Frequência acumulada < 75%?
    if (aluno.frequencia_acumulada < 75.0) {
        bloqueios.push({
            tipo: 'FREQUENCIA',
            mensagem: `Frequência insuficiente: Acumulado de ${aluno.frequencia_acumulada}% está abaixo do mínimo exigido (75%).`
        });
    }

    // 3. Acadêmico: Média do módulo < 6,0?
    if (aluno.media_modulo < 6.0) {
        bloqueios.push({
            tipo: 'ACADEMICO',
            mensagem: `Nota abaixo da média: Média atual (${aluno.media_modulo}) é inferior ao corte de aprovação (6.0).`
        });
    }

    const liberado = bloqueios.length === 0;

    res.json({
        aluno: aluno.nome_completo,
        prontuario: aluno.prontuario,
        liberado,
        bloqueios,
        mensagem: liberado ? 'Rematrícula liberada com 1 clique!' : 'Rematrícula travada por pendências.'
    });
});

// 6. Fila de Emissão de Certificados (Módulo 5)
app.get('/api/certificados/verificar/:alunoId', (req, res) => {
    const db = loadData();
    const alunoId = parseInt(req.params.alunoId);
    const aluno = db.alunos.find(a => a.id === alunoId);

    if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    // Requisitos:
    // 1. Todos os módulos concluídos com média >= 6.0
    // 2. Frequência global >= 75%
    // 3. Fichas de estágio 100% validadas
    // 4. Quitação financeira completa
    const temDebito = db.financeiro.some(f => f.aluno_id === alunoId && (f.status === 'Atrasado' || f.status === 'Pendente'));
    
    const c1_media = aluno.media_modulo >= 6.0;
    const c2_freq = aluno.frequencia_acumulada >= 75.0;
    const c3_estagio = aluno.fichas_validadas === true;
    const c4_quitacao = !temDebito && aluno.parcelas_atraso === 0;

    const aptoParaCertificado = c1_media && c2_freq && c3_estagio && c4_quitacao;

    res.json({
        aluno: aluno.nome_completo,
        prontuario: aluno.prontuario,
        curso: aluno.codigo_turma,
        criterios: {
            media_aprovada: { status: c1_media, valor: aluno.media_modulo, exigido: 6.0 },
            frequencia_minima: { status: c2_freq, valor: `${aluno.frequencia_acumulada}%`, exigido: '75%' },
            fichas_estagio_validadas: { status: c3_estagio, valor: aluno.fichas_validadas ? '100% Validadas' : 'Incompleto' },
            quitacao_financeira: { status: c4_quitacao, valor: c4_quitacao ? 'Quitado' : 'Débitos em aberto' }
        },
        aptoParaCertificado
    });
});

// 7. Financeiro & Módulo de Cobrança WhatsApp (Módulo 4)
app.get('/api/financeiro', (req, res) => {
    const db = loadData();
    res.json(db.financeiro);
});

app.post('/api/financeiro/pagamento/:id', (req, res) => {
    const db = loadData();
    const id = parseInt(req.params.id);
    const lanc = db.financeiro.find(f => f.id_lancamento === id);

    if (!lanc) {
        return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    lanc.status = 'Pago';
    lanc.data_pagamento = new Date().toISOString().split('T')[0];
    lanc.valor_pago = lanc.valor_total || lanc.valor_base;

    saveData(db);
    res.json({ message: 'Pagamento baixado com sucesso', lancamento: lanc });
});

// 8. Regras Contratuais
app.get('/api/regras', (req, res) => {
    const db = loadData();
    res.json(db.regras);
});

// Inicia servidor
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Sistema de Gestão CEPA rodando na porta ${PORT}`);
    console.log(`🌐 Acesse no navegador: http://localhost:${PORT}`);
    console.log(`=======================================================`);
});
