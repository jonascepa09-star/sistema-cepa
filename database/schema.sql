-- =======================================================
-- SISTEMA DE GESTÃO CEPA / CFIC - ESQUEMA DO BANCO DE DADOS
-- =======================================================

-- 0. Usuários e Autenticação (RBAC)
CREATE TABLE IF NOT EXISTS tb_usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(30) NOT NULL, -- 'SECRETARIA', 'COORDENACAO', 'PROFESSOR', 'ALUNO'
    prontuario_ref VARCHAR(30), -- Vinculado quando perfil for 'ALUNO'
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    media_modulo DECIMAL(3,1) DEFAULT 0.0,
    frequencia_acumulada DECIMAL(5,2) DEFAULT 100.0,
    fichas_validadas BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Turmas
CREATE TABLE IF NOT EXISTS tb_turmas (
    id_turma INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_turma VARCHAR(50) UNIQUE NOT NULL, -- Ex: 'Turma 131', 'Turma 129', 'TN-240', 'AUX-242'
    curso_nome VARCHAR(100) NOT NULL,
    curso_sigla VARCHAR(10) NOT NULL, -- 'IC', 'TEC', 'AUX', 'ENF_TRAB'
    data_inicio DATE NOT NULL,
    data_fim DATE,
    dias_semana VARCHAR(50), -- 'Sábados', 'Segunda a Sexta'
    horario VARCHAR(50),
    preceptor_padrao VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Matrículas
CREATE TABLE IF NOT EXISTS tb_matriculas (
    id_matricula INTEGER PRIMARY KEY AUTOINCREMENT,
    id_aluno INTEGER NOT NULL,
    id_turma INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'Ativo', -- 'Ativo', 'Trancado', 'Desistente', 'Concluído'
    motivo_saida VARCHAR(100), -- 'Mudança de Turno de Trabalho', 'Saúde', 'Financeiro', etc.
    observacao_saida TEXT,
    data_matricula DATE NOT NULL,
    data_encerramento DATE,
    FOREIGN KEY (id_aluno) REFERENCES tb_alunos(id),
    FOREIGN KEY (id_turma) REFERENCES tb_turmas(id_turma)
);

-- 4. Financeiro / Mensalidades & Taxas de Reposição
CREATE TABLE IF NOT EXISTS tb_financeiro (
    id_lancamento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_matricula INTEGER,
    id_aluno INTEGER NOT NULL,
    descricao VARCHAR(150) NOT NULL, -- 'Mensalidade', 'Taxa de Reposição de Falta em Estágio'
    valor_base DECIMAL(10,2) NOT NULL,
    vencimento DATE NOT NULL,
    data_pagamento DATE,
    valor_pago DECIMAL(10,2),
    forma_pagamento VARCHAR(30), -- 'Pix', 'Cartão', 'Boleto'
    status VARCHAR(20) DEFAULT 'Pendente', -- 'Pendente', 'Pago', 'Atrasado'
    multa_juros DECIMAL(10,2) DEFAULT 0.00,
    chave_pix VARCHAR(255) DEFAULT 'secretaria@cepa.edu.br',
    FOREIGN KEY (id_aluno) REFERENCES tb_alunos(id)
);

-- 5. Chamada e Frequência das Aulas Teóricas
CREATE TABLE IF NOT EXISTS tb_frequencia (
    id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
    id_aluno INTEGER NOT NULL,
    id_turma INTEGER NOT NULL,
    data_aula DATE NOT NULL,
    disciplina_modulo VARCHAR(100),
    status VARCHAR(20) NOT NULL, -- 'PRESENCA', 'FALTA', 'JUSTIFICADA'
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_aluno) REFERENCES tb_alunos(id),
    FOREIGN KEY (id_turma) REFERENCES tb_turmas(id_turma)
);

-- 6. Escala e Gestão de Estágios Hospitalares
CREATE TABLE IF NOT EXISTS tb_estagio_escalas (
    id_escala INTEGER PRIMARY KEY AUTOINCREMENT,
    id_aluno INTEGER NOT NULL,
    id_turma INTEGER NOT NULL,
    hospital_campo VARCHAR(150) NOT NULL,
    preceptor_nome VARCHAR(100) NOT NULL,
    data_estagio DATE NOT NULL,
    turno VARCHAR(30) NOT NULL, -- 'Manhã (07:00 às 13:00)', 'Tarde (13:00 às 19:00)', 'Noite (18:50 às 22:30)'
    status_presenca VARCHAR(25) DEFAULT 'AGENDADO', -- 'AGENDADO', 'PRESENCA', 'FALTA', 'JUSTIFICADA'
    taxa_reposicao_gerada BOOLEAN DEFAULT 0,
    taxa_reposicao_valor DECIMAL(10,2) DEFAULT 0.00,
    atestado_protocolo VARCHAR(50),
    ficha_validada_bool BOOLEAN DEFAULT 0,
    parecer_coordenacao TEXT,
    faltas_consecutivas INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_aluno) REFERENCES tb_alunos(id),
    FOREIGN KEY (id_turma) REFERENCES tb_turmas(id_turma)
);

-- 7. Regras e Parâmetros Contratuais
CREATE TABLE IF NOT EXISTS tb_regras_contrato (
    id_regra INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_sigla VARCHAR(10) UNIQUE NOT NULL,
    curso_nome VARCHAR(100) NOT NULL,
    media_aprovacao DECIMAL(3,1) DEFAULT 6.0,
    frequencia_minima DECIMAL(5,2) DEFAULT 75.0,
    valor_reposicao_falta DECIMAL(10,2) DEFAULT 50.00,
    dias_max_falta_ic INTEGER DEFAULT 3,
    bloqueio_fds_noite_ic BOOLEAN DEFAULT 1,
    multa_atraso_percentual DECIMAL(4,2) DEFAULT 2.00,
    juros_diario_percentual DECIMAL(5,3) DEFAULT 0.033
);

-- 8. Ocorrências e Alertas Críticos de Evasão
CREATE TABLE IF NOT EXISTS tb_ocorrencias (
    id_ocorrencia INTEGER PRIMARY KEY AUTOINCREMENT,
    id_aluno INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'ALERTA_EVASAO_IC', 'DEBITO_FINANCEIRO'
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    nivel_urgencia VARCHAR(20) DEFAULT 'CRITICO', -- 'INFORMATIVO', 'ALERTA', 'CRITICO'
    resolvido_bool BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_aluno) REFERENCES tb_alunos(id)
);
