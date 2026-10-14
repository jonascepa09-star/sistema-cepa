-- =======================================================
-- SISTEMA DE GESTÃO CEPA / CFIC - ESQUEMA DO BANCO DE DADOS
-- =======================================================

-- 1. Alunos
CREATE TABLE IF NOT EXISTS tb_alunos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prontuario VARCHAR(30) UNIQUE NOT NULL,
    nome_completo VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20),
    data_nasc DATE,
    contato_whatsapp VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    endereco_completo TEXT,
    documentos_status VARCHAR(20) DEFAULT 'Pendente', -- 'Pendente', 'Conferido', 'OK'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Turmas
CREATE TABLE IF NOT EXISTS tb_turmas (
    id_turma INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_turma VARCHAR(50) UNIQUE NOT NULL, -- Ex: '129', '131', 'TN-240', 'IC-15'
    curso_nome VARCHAR(100) NOT NULL, -- 'Técnico em Enfermagem', 'Auxiliar de Enfermagem', 'Enfermagem do Trabalho', 'Instrumentação Cirúrgica'
    curso_sigla VARCHAR(10) NOT NULL, -- 'TEC', 'AUX', 'ENF_TRAB', 'IC'
    data_inicio DATE NOT NULL,
    data_fim DATE,
    dias_semana VARCHAR(50), -- 'Sábados', 'Segunda a Sexta'
    horario VARCHAR(50), -- 'Noite (18:50 às 22:30)', 'Manhã', 'Integral'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Matrículas
CREATE TABLE IF NOT EXISTS tb_matriculas (
    id_matricula INTEGER PRIMARY KEY AUTOINCREMENT,
    id_aluno INTEGER NOT NULL,
    id_turma INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'Ativo', -- 'Ativo', 'Trancado', 'Desistente', 'Concluído'
    motivo_saida VARCHAR(100), -- 'Trabalho', 'Saúde', 'Mudança', 'Financeiro', 'Pessoal', etc.
    observacao_saida TEXT,
    data_matricula DATE NOT NULL,
    data_encerramento DATE,
    FOREIGN KEY (id_aluno) REFERENCES tb_alunos(id),
    FOREIGN KEY (id_turma) REFERENCES tb_turmas(id_turma)
);

-- 4. Financeiro / Mensalidades
CREATE TABLE IF NOT EXISTS tb_financeiro (
    id_lancamento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_matricula INTEGER NOT NULL,
    numero_parcela INTEGER NOT NULL,
    descricao VARCHAR(100) DEFAULT 'Mensalidade',
    valor_base DECIMAL(10,2) NOT NULL,
    vencimento DATE NOT NULL,
    data_pagamento DATE,
    valor_pago DECIMAL(10,2),
    forma_pagamento VARCHAR(30), -- 'Pix', 'Cartão', 'Boleto', 'Dinheiro'
    status VARCHAR(20) DEFAULT 'Pendente', -- 'Pendente', 'Pago', 'Atrasado'
    multa_juros DECIMAL(10,2) DEFAULT 0.00,
    link_chave_pix VARCHAR(255),
    FOREIGN KEY (id_matricula) REFERENCES tb_matriculas(id_matricula)
);

-- 5. Chamada e Frequência das Aulas Teóricas
CREATE TABLE IF NOT EXISTS tb_frequencia (
    id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
    id_matricula INTEGER NOT NULL,
    id_turma INTEGER NOT NULL,
    data_aula DATE NOT NULL,
    disciplina_modulo VARCHAR(100),
    tipo VARCHAR(20) DEFAULT 'Teórica', -- 'Teórica', 'Prática em Laboratório'
    status VARCHAR(20) NOT NULL, -- 'Presenca', 'Falta', 'Falta Justificada'
    atestado_anexo_url TEXT,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_matricula) REFERENCES tb_matriculas(id_matricula),
    FOREIGN KEY (id_turma) REFERENCES tb_turmas(id_turma)
);

-- 6. Escala e Gestão de Estágios
CREATE TABLE IF NOT EXISTS tb_estagio_escalas (
    id_escala INTEGER PRIMARY KEY AUTOINCREMENT,
    id_aluno INTEGER NOT NULL,
    id_matricula INTEGER NOT NULL,
    id_turma INTEGER NOT NULL,
    preceptor_nome VARCHAR(100) NOT NULL,
    hospital_campo VARCHAR(150) NOT NULL, -- Ex: 'Hospital Municipal de Franco da Rocha', 'Santa Casa'
    data_estagio DATE NOT NULL,
    turno VARCHAR(20) NOT NULL, -- 'Manhã', 'Tarde', 'Noite'
    status_presenca VARCHAR(25) DEFAULT 'Agendado', -- 'Agendado', 'Presenca', 'Falta', 'Falta Justificada'
    taxa_reposicao_gerada BOOLEAN DEFAULT 0,
    taxa_reposicao_valor DECIMAL(10,2) DEFAULT 0.00,
    atestado_protocolo VARCHAR(50),
    ficha_validada_bool BOOLEAN DEFAULT 0,
    parecer_coordenacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_aluno) REFERENCES tb_alunos(id),
    FOREIGN KEY (id_matricula) REFERENCES tb_matriculas(id_matricula),
    FOREIGN KEY (id_turma) REFERENCES tb_turmas(id_turma)
);

-- 7. Regras e Parâmetros Contratuais
CREATE TABLE IF NOT EXISTS tb_regras_contrato (
    id_regra INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_sigla VARCHAR(10) NOT NULL,
    media_aprovacao DECIMAL(3,1) DEFAULT 6.0,
    frequencia_minima DECIMAL(5,2) DEFAULT 75.0,
    valor_reposicao_falta DECIMAL(10,2) DEFAULT 50.00,
    dias_max_falta_ic INTEGER DEFAULT 3,
    bloqueio_fds_noite_ic BOOLEAN DEFAULT 1,
    multa_atraso_percentual DECIMAL(4,2) DEFAULT 2.00,
    juros_diario_percentual DECIMAL(5,3) DEFAULT 0.033
);

-- 8. Ocorrências e Alertas
CREATE TABLE IF NOT EXISTS tb_ocorrencias (
    id_ocorrencia INTEGER PRIMARY KEY AUTOINCREMENT,
    id_aluno INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'Alerta Evasão IC', 'Débito Financeiro', 'Falta Consecutiva'
    descricao TEXT NOT NULL,
    nivel_urgencia VARCHAR(20) DEFAULT 'Alerta', -- 'Informativo', 'Alerta', 'Critico'
    data_ocorrencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolvido_bool BOOLEAN DEFAULT 0,
    FOREIGN KEY (id_aluno) REFERENCES tb_alunos(id)
);
