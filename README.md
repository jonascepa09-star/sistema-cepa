# 🏥 Sistema Integrado de Gestão Escolar & Hospitalar — CEPA / CFIC

<div align="center">

![CEPA Banner](public/assets/LOGO%20CEPA%20SEM%20FUNDO.png)

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Backend-Express.js-black.svg)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Frontend-Tailwind_CSS_3-blue.svg)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_3-orange.svg)](#estrutura-do-banco-de-dados)
[![JWT & RBAC](https://img.shields.io/badge/Auth-JWT_%2B_RBAC-purple.svg)](#credenciais-de-acesso-homologação)
[![Status](https://img.shields.io/badge/Status-Produção_Pronta-brightgreen.svg)]()

**Arquitetura profissional modular em Node.js com autenticação JWT segura, controle de permissões por perfil (RBAC), telas dedicadas para cada setor, controle de presença mobile e automação de regras de estágio.**

[Como Executar](#-como-executar-em-1-minuto) •
[Credenciais de Acesso](#-credenciais-de-acesso-homologação) •
[Perfis & Telas Dedicadas](#-perfis--telas-dedicadas) •
[Módulos & Regras](#-regras-de-negócio-do-estágio) •
[Arquitetura do Projeto](#-estrutura-de-diretórios-modular)

</div>

---

## 🚀 Como Executar em 1 Minuto

O sistema utiliza **Node.js**, **Express**, **SQLite3** nativo e banco com criptografia **bcrypt**.

```bash
# 1. Instale as dependências
npm install

# 2. Inicialize o servidor e carregue os seeds automáticos
npm start
```

> 🌐 **Tela de Login:** [http://localhost:3000/login.html](http://localhost:3000/login.html)  
> Ao acessar [http://localhost:3000](http://localhost:3000), o sistema redireciona automaticamente para o login.

---

## 🔑 Credenciais de Acesso (Homologação)

O banco de dados SQLite já vem populado com 4 usuários reais para testes imediatos (basta clicar nos botões de preenchimento rápido na tela de login):

| Perfil | E-mail / Login | Senha | Tela de Destino Automática |
| :--- | :--- | :---: | :--- |
| **👤 Secretaria / Adm** | `secretaria@cepa.edu.br` | `cepa123` | `/views/secretaria/dashboard.html` |
| **🎓 Coordenação** | `coordenacao@cepa.edu.br` | `cepa123` | `/views/coordenacao/dashboard.html` |
| **🩺 Preceptor / Prof** | `professor@cepa.edu.br` | `cepa123` | `/views/professor/mobile-chamada.html` |
| **🎒 Portal do Aluno** | `aluno@cepa.edu.br` *(ou prontuário)* | `cepa123` | `/views/aluno/portal.html` |

---

## 👥 Perfis & Telas Dedicadas

### 1. Secretaria & Adm (`/views/secretaria/`)
* **`dashboard.html`**: Indicadores de alunos ativos, inadimplência e rematrículas travadas.
* **`alunos.html`**: Cadastro sequencial de prontuários (`2026-00...`) e **Motor de Rematrícula em 1 Clique** (diagnóstico da trava tripla: débitos, frequência $< 75\%$ e nota $< 6.0$).
* **`financeiro.html`**: Régua de cobrança diária, cálculo automático de juros e multa, e **disparador dinâmico de cobrança via WhatsApp** (`wa.me`) com chave Pix.
* **`certificados.html`**: Fila de conferência dos 4 pilares e impressão oficial nos modelos **CFIC** e **Técnico (GDAE)**.

### 2. Coordenação de Estágios (`/views/coordenacao/`)
* **`dashboard.html`**: Visão executiva de campos cirúrgicos e distribuição de turmas.
* **`escalas.html`**: Criador de cronogramas por hospital, turno e preceptor com **bloqueio automático de turno noturno para Instrumentação Cirúrgica (IC)**.
* **`validacao.html`**: Homologação digital de fichas de estágio preenchidas pelos preceptores.
* **`alertas.html`**: Monitor de evasão com **banners vermelhos** disparados após 3 faltas consecutivas no estágio cirúrgico.

### 3. Professor / Preceptor (`/views/professor/`)
* **`mobile-chamada.html`**: Interface **Mobile-First** com botões táteis grandes para smartphone/tablet:
  * `[P] Presença`: Computa presença no campo cirúrgico ou na sala de aula.
  * `[F] Falta`: Registra falta e **dispara taxa automática de R$ 50,00** para reposição.
  * `[FJ] Falta Justificada`: Modal para protocolar atestado médico e **abonar os R$ 50,00**.

### 4. Portal do Aluno (`/views/aluno/`)
* **`portal.html`**: Acesso individual do aluno com:
  * Percentual de frequência global (alerta se $< 75\%$).
  * Média de notas do módulo (corte em $6.0$).
  * Consulta do cronograma de estágio no hospital.
  * Ficha financeira com parcelas pagas, pendentes e chave Pix institucional.

---

## ⚖️ Regras de Negócio do Estágio

| Evento | Ação do Backend | Impacto Financeiro |
| :--- | :--- | :---: |
| **Presença no Campo** | Computa carga horária na escala. | R$ 0,00 |
| **Falta sem Atestado** | Gera lançamento pendente de débito na tabela `tb_financeiro`. | **+ R$ 50,00** |
| **Falta Justificada (`[FJ]`)** | Salva protocolo médico e isenta a cobrança de reposição. | **R$ 0,00 (Abonado)** |
| **3 Faltas Consecutivas IC** | Cria ocorrência crítica na tabela `tb_ocorrencias` e notifica Coordenação. | Alerta Vermelho |
| **Tentativa de Estágio Noturno IC** | Bloqueado na API (`HTTP 400 - Regra IC Violada`). | Não permitido |

---

## 🏛️ Trava dos 4 Pilares de Certificação

O aluno só é considerado apto para emissão de certificado oficial caso cumpra **simultaneamente**:

```
  [1. Média >= 6.0]  ──┐
  [2. Freq >= 75%]   ──┼──>  [ CERTIFICADO LIBERADO ] ──> Impressão CFIC / GDAE
  [3. Ficha 100% OK] ──┤
  [4. Quitado]       ──┘
```

---

## 📁 Estrutura de Diretórios Modular

```
sistema-cepa/
├── src/
│   ├── config/             # Configuração do SQLite3 assíncrono e segredos JWT
│   │   ├── database.js
│   │   └── auth.js
│   ├── middlewares/        # Proteção JWT e Controle de Permissões RBAC
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── controllers/        # Regras de Negócio por Área
│   │   ├── authController.js
│   │   ├── secretariaController.js
│   │   ├── estagiosController.js
│   │   ├── financeiroController.js
│   │   ├── professorController.js
│   │   └── alunoController.js
│   ├── routes/             # Rotas REST da API por Perfil
│   │   ├── authRoutes.js
│   │   ├── secretariaRoutes.js
│   │   ├── estagiosRoutes.js
│   │   ├── financeiroRoutes.js
│   │   ├── professorRoutes.js
│   │   └── alunoRoutes.js
│   └── views/              # Telas HTML/Templates Independentes
│       ├── auth/           # login.html
│       ├── secretaria/     # dashboard.html, alunos.html, financeiro.html, certificados.html
│       ├── coordenacao/    # dashboard.html, escalas.html, validacao.html, alertas.html
│       ├── professor/      # mobile-chamada.html
│       └── aluno/          # portal.html
├── public/                 # Assets públicos, JS de login e guardas de sessão
│   ├── js/                 # login.js, auth-guard.js
│   └── assets/             # Logos oficiais institucionais CEPA e CFIC
├── database/
│   ├── schema.sql          # DDL completo das 8 tabelas relacionais
│   ├── seeds/              # createUsers.js com bcrypt e turmas reais (Turma 131, 129...)
│   └── cepa.sqlite         # Banco de dados ativo
├── .env.example
├── server.js               # Entry point Express com roteamento modular
└── package.json
```

---

<div align="center">

**CEPA — Centro de Ensino Profissionalizante Anchieta & CFIC**  
*Desenvolvido para máxima segurança pedagógica, agilidade no campo e gestão hospitalar de ponta.*

</div>