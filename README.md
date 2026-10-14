# 🏥 Sistema Integrado de Gestão CEPA / CFIC

Sistema completo de gestão acadêmica, controle de frequência teórica, gestão digital de estágios hospitalares, cobrança via WhatsApp e validação de certificados para o **CEPA - Centro de Ensino Profissionalizante Anchieta** e **CFIC**.

---

## 🚀 Como Executar o Sistema

### Opção 1: Inicialização com Node.js (Servidor Completo com API REST)
No diretório `projetos`, instale as dependências leves e inicie o servidor:

```bash
npm install
npm start
```
Acesse no seu navegador: **`http://localhost:3000`**

### Opção 2: Abertura Direta no Navegador (Modo Standalone / Offline)
Basta abrir diretamente o arquivo no seu navegador (Google Chrome, Edge, Firefox):
`c:\Users\MICRO\Desktop\CEPA\Jonas\JONAS\EM PROGRAMACAO\projetos\public\index.html`

O sistema possui inteligência híbrida com persistência local e dados sementes das turmas reais do CEPA (Turma 131, 129, TN-240, AUX-242).

---

## 🏗️ Estrutura do Projeto

```
projetos/
├── package.json                   # Dependências do Express & CORS
├── server.js                      # API REST com motor de regras, relatórios e endpoints
├── database/
│   ├── schema.sql                 # Esquema relacional DDL (SQLite / PostgreSQL / MySQL)
│   └── seed.json                  # Banco de dados e parâmetros populados com dados reais do CEPA
├── public/
│   ├── index.html                 # Interface Single Page Application (SPA) responsiva
│   ├── app.js                     # Motor de regras, cálculo de reposição e gerador WhatsApp
│   ├── styles.css                 # Estilos visuais, alertas e regras de impressão
│   └── assets/                    # Identidade visual (Logos oficiais CEPA e CFIC)
└── README.md                      # Documentação técnica e operacional
```

---

## 🩺 Módulos Implementados

### 1. Escala & Cronograma de Estágios Digital (Módulo 3)
* **Identificação Completa:** Visualização tabular por **Prontuário**, **Nome do Aluno**, **Turma**, **Campo Hospitalar** e **Preceptor**.
* **Status do Aluno & Motivo de Desistência:** Exibição destacada para alunos **Ativos**, **Trancados** e **Desistentes** (com registro do motivo real: *Mudança de Turno de Trabalho*, *Saúde*, etc.).
* **Ações Rápidas no Campo (Mobile/Tablet/Web):**
  - **`[P] Presença`**: Confirmação imediata no campo cirúrgico.
  - **`[F] Falta`**: Aplicação da **taxa automática de R$ 50,00** de reposição e lançamento no financeiro.
  - **`[FJ] Falta Justificada`**: Modal com protocolo de atestado médico que **abona** a cobrança da taxa de R$ 50,00.
* **Alerta Vermelho de Evasão IC:** Monitoramento contínuo: ao atingir 3 faltas consecutivas sem justificativa no IC, o sistema dispara alerta sonoro/visual e notifica a coordenação.
* **Validação Automática IC:** Bloqueio preventivo no agendamento de estágios de Instrumentação Cirúrgica no turno da noite.
* **Homologação da Ficha:** Botão para a Coordenação aprovar e carimbar a ficha de estágio digitalmente.

### 2. Chamada Teórica das Aulas (Módulo 2)
* Seleção de turma (ex: Turma 131 - Sábados) e calendário.
* Lançamento de chamada teórica diária.
* Indicador dinâmico de frequência acumulada % com alerta caso fique abaixo dos 75% contratuais.

### 3. Financeiro & Cobrança Dinâmica WhatsApp (Módulo 4)
* **Painel de Controle:** Indicadores de recebimentos diários, parcelas a vencer em 3 dias e inadimplentes com multa de 2% e juros calculados.
* **Lançamentos de Reposição:** Exibição das taxas de R$ 50,00 geradas pelas faltas em estágio.
* **Disparador WhatsApp:** Gera mensagem oficial personalizada pronta com nome do aluno, parcelas em aberto, valor corrigido e Chave Pix (`secretaria@cepa.edu.br`) com link direto para o `wa.me`.

### 4. Fila de Emissão de Certificados & Os 4 Pilares (Módulo 5)
O sistema exige a aprovação simultânea de 4 requisitos para liberar o certificado:
1. **Média Acadêmica** $\ge 6.0$
2. **Frequência Teórica** $\ge 75\%$
3. **Fichas de Estágio** $100\%$ validadas e aprovadas
4. **Quitação Financeira** completa (sem parcelas em atraso)
* Modal de visualização e impressão oficial nos modelos **CFIC (Instrumentação Cirúrgica)** e **CEPA Técnico (com GDAE)**.

### 5. Cadastro & Motor de Rematrícula Automática (Módulo 1)
* Cadastro rápido com geração sequencial automática de Prontuário (`2026-00...`).
* Diagnóstico de rematrícula em 1 clique que avalia instantaneamente débitos, notas e faltas.
