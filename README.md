# 🚀 Buscador de Prontuários - WinSIGAA

Aplicativo desktop moderno, intuitivo e de alta performance desenvolvido para automatizar a extração e sincronização de dados de prontuários do **WinSIGAA** diretamente a partir de planilhas Excel.

---

## 💡 Destaques da Solução

- **Interface Gráfica Intuitiva (Desktop Moderno)**: Desenvolvida com `customtkinter`, pensada para que qualquer usuário comum da secretaria ou financeiro consiga utilizar com facilidade.
- **Acesso Direto ao Banco de Dados (Firebird/GDB)**: Sem a lentidão ou instabilidade de cliques em tela (RPA). Conecta-se diretamente ao servidor do WinSIGAA (`192.168.0.12:3050`), processando dezenas ou centenas de prontuários em poucos segundos.
- **Consultas Modulares**:
  - 💰 **Ficha Financeira**: Extrai dados cadastrais (Aluno, CPF, Mãe), contas, ano letivo, data de vencimento, valor gerado, valor pago, saldo devedor e situação (*Quitado* ou *Aberto*).
  - 🎓 **Matrícula / Acadêmico**: Extrai dados cadastrais, ano letivo, período, curso, série, turma/classe, turno, situação da matrícula (*Ativo*, *Trancado*, etc.) e data da matrícula.
- **Gerador de Modelo Integrado**: Gera um arquivo Excel padrão formatado com um único clique.
- **Feedback em Tempo Real**: Barra de progresso visual e terminal de log exibindo cada registro processado.
- **Executável com 1 Clique (`.bat`)**: Não requer abertura de terminal pelo usuário.

---

## 📁 Estrutura de Arquivos

```text
📁 projetos/
├── 📄 Abrir_Buscador_WinSIGAA.bat     # Executável para abrir o app com 2 cliques
├── 🐍 app_buscador_winsigaa.py       # Código-fonte principal com interface CustomTkinter
├── 📊 Modelo_Prontuarios_Exemplo.xlsx # Exemplo de planilha de entrada pronta para uso
├── 📖 README.md                      # Documentação completa do projeto
└── 📖 COMO_USAR.md                   # Guia rápido de operação
```

---

## 🛠️ Tecnologias Utilizadas

- **Python 3.11**
- **CustomTkinter**: Interface gráfica moderna com suporte a temas.
- **Pandas & OpenPyXL**: Leitura e gravação de planilhas Excel (`.xlsx`, `.xls`, `.csv`).
- **FirebirdSQL**: Driver nativo em Python para comunicação com o banco de dados do WinSIGAA (`WinSIGAA.gdb`).
- **Passlib**: Suporte a protocolos de autenticação criptografada Firebird.

---

## 📖 Como Usar

### 1. Inicialização
Basta dar dois cliques no arquivo:
👉 **`Abrir_Buscador_WinSIGAA.bat`**

### 2. Escolha o Tipo de Consulta
- Selecione **Ficha Financeira** para informações de parcelas e valores.
- Selecione **Matrícula / Acadêmico** para dados de cursos, turmas e períodos.

### 3. Prepare a Planilha
- Caso não tenha uma planilha pronta, clique em **"📥 Baixar Modelo Excel"** para gerar um modelo com a coluna `Prontuario`.
- Cole os números dos prontuários desejados (o sistema reconhece prontuários com ou sem dígito verificador, ex: `00003-5` ou `3-5`).
- Clique em **"📂 Selecionar Planilha com Prontuários"** e aponte para o arquivo preenchido.

### 4. Executar e Coletar os Resultados
- Clique em **"🚀 Iniciar Busca e Atualizar Planilha"**.
- Acompanhe o processamento no visor e na barra de progresso.
- Ao concluir, o programa salva automaticamente um novo arquivo na mesma pasta do arquivo original com o sufixo:
  - `[NomeDoArquivo]_ATUALIZADO_FINANCEIRO.xlsx` ou
  - `[NomeDoArquivo]_ATUALIZADO_MATRICULA.xlsx`

---

## 🔍 Tabelas do WinSIGAA Utilizadas

O sistema realiza consultas integradas nas seguintes tabelas relacionais do WinSIGAA:
- **`SIGGERAL`**: Tabela principal de pessoas e alunos (Nome, Sobrenome, CPF, Filiação, Contatos).
- **`SIGALUCX`**: Contas e parcelas a receber (Valores, Vencimentos, Pagamentos, Situações).
- **`SIGALUNO`**: Histórico acadêmico de matrículas por ano/período, cursos e séries."# sistemabusca" 
