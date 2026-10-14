// ==============================================================
// SISTEMA DE GESTÃO ESCOLAR & HOSPITALAR CEPA / CFIC
// Lógica do Frontend (Compatível com API Node.js e modo Standalone)
// ==============================================================

let perfilAtual = 'preceptor';
let escalaSelecionadaParaAtestado = null;

// Estado local da aplicação (com fallback offline / standalone)
let state = {
    turmas: [],
    alunos: [],
    escalas: [],
    financeiro: [],
    regras: []
};

// Dados padrão caso seja aberto via file:/// sem servidor Node rodando
const FALLBACK_DATA = {
    turmas: [
        { id_turma: 1, codigo_turma: "Turma 131", curso_nome: "Instrumentação Cirúrgica", curso_sigla: "IC", preceptor_padrao: "Enfª. Amanda Silveira" },
        { id_turma: 2, codigo_turma: "Turma 129", curso_nome: "Instrumentação Cirúrgica", curso_sigla: "IC", preceptor_padrao: "Enfª. Amanda Silveira" },
        { id_turma: 3, codigo_turma: "TN-240", curso_nome: "Técnico em Enfermagem", curso_sigla: "TEC", preceptor_padrao: "Prof. Carlos Eduardo" },
        { id_turma: 4, codigo_turma: "AUX-242", curso_nome: "Auxiliar de Enfermagem", curso_sigla: "AUX", preceptor_padrao: "Enfª. Patrícia Lima" }
    ],
    alunos: [
        { id: 1, prontuario: "2026-00129", nome_completo: "Ana Cristina de Souza", cpf: "234.567.890-11", contato_whatsapp: "11987654321", turma_id: 1, codigo_turma: "Turma 131", status: "Ativo", motivo_saida: null, media_modulo: 8.5, frequencia_acumulada: 92.0, fichas_validadas: true, parcelas_atraso: 0 },
        { id: 2, prontuario: "2026-00130", nome_completo: "Carla Roberta Oliveira", cpf: "345.678.901-22", contato_whatsapp: "11976543210", turma_id: 1, codigo_turma: "Turma 131", status: "Ativo", motivo_saida: null, media_modulo: 7.8, frequencia_acumulada: 88.0, fichas_validadas: true, parcelas_atraso: 0 },
        { id: 3, prontuario: "2026-00131", nome_completo: "Fernanda Lima de Carvalho", cpf: "456.789.012-33", contato_whatsapp: "11965432109", turma_id: 1, codigo_turma: "Turma 131", status: "Ativo", motivo_saida: null, media_modulo: 9.2, frequencia_acumulada: 96.0, fichas_validadas: true, parcelas_atraso: 0 },
        { id: 4, prontuario: "2026-00132", nome_completo: "Mateus Silva Santos", cpf: "567.890.123-44", contato_whatsapp: "11954321098", turma_id: 1, codigo_turma: "Turma 131", status: "Desistente", motivo_saida: "Mudança de Turno de Trabalho", media_modulo: 6.5, frequencia_acumulada: 65.0, fichas_validadas: false, parcelas_atraso: 1 },
        { id: 5, prontuario: "2026-00133", nome_completo: "Raquel Mendonça Viana", cpf: "678.901.234-55", contato_whatsapp: "11943210987", turma_id: 1, codigo_turma: "Turma 131", status: "Ativo", motivo_saida: null, media_modulo: 7.0, frequencia_acumulada: 72.0, fichas_validadas: false, parcelas_atraso: 2 },
        { id: 6, prontuario: "2026-00134", nome_completo: "Richard Henrique Souza", cpf: "789.012.345-66", contato_whatsapp: "11932109876", turma_id: 1, codigo_turma: "Turma 131", status: "Trancado", motivo_saida: "Questões de Saúde Pessoal", media_modulo: 6.0, frequencia_acumulada: 70.0, fichas_validadas: false, parcelas_atraso: 0 },
        { id: 7, prontuario: "2026-00135", nome_completo: "Tamires Rodrigues Ramos", cpf: "890.123.456-77", contato_whatsapp: "11921098765", turma_id: 1, codigo_turma: "Turma 131", status: "Ativo", motivo_saida: null, media_modulo: 8.0, frequencia_acumulada: 85.0, fichas_validadas: true, parcelas_atraso: 0 },
        { id: 8, prontuario: "2026-00136", nome_completo: "Wellington Barboza da Silva", cpf: "901.234.567-88", contato_whatsapp: "11910987654", turma_id: 1, codigo_turma: "Turma 131", status: "Ativo", motivo_saida: null, media_modulo: 6.8, frequencia_acumulada: 80.0, fichas_validadas: false, parcelas_atraso: 1 }
    ],
    escalas: [
        { id_escala: 101, aluno_id: 1, nome_aluno: "Ana Cristina de Souza", prontuario: "2026-00129", codigo_turma: "Turma 131", status_aluno: "Ativo", motivo_desistencia: null, hospital_campo: "Hospital Municipal de Franco da Rocha - Centro Cirúrgico", preceptor_nome: "Enfª. Amanda Silveira", data_estagio: "2026-10-17", turno: "Manhã (07:00 às 13:00)", status_presenca: "Presenca", taxa_reposicao_gerada: false, taxa_reposicao_valor: 0.00, ficha_validada_bool: true, faltas_consecutivas: 0, alerta_evasao: false },
        { id_escala: 102, aluno_id: 2, nome_aluno: "Carla Roberta Oliveira", prontuario: "2026-00130", codigo_turma: "Turma 131", status_aluno: "Ativo", motivo_desistencia: null, hospital_campo: "Hospital Municipal de Franco da Rocha - Centro Cirúrgico", preceptor_nome: "Enfª. Amanda Silveira", data_estagio: "2026-10-17", turno: "Manhã (07:00 às 13:00)", status_presenca: "Presenca", taxa_reposicao_gerada: false, taxa_reposicao_valor: 0.00, ficha_validada_bool: true, faltas_consecutivas: 0, alerta_evasao: false },
        { id_escala: 103, aluno_id: 3, nome_aluno: "Fernanda Lima de Carvalho", prontuario: "2026-00131", codigo_turma: "Turma 131", status_aluno: "Ativo", motivo_desistencia: null, hospital_campo: "Hospital Estadual de Francisco Morato", preceptor_nome: "Enf. Marcos Vinicius", data_estagio: "2026-10-17", turno: "Tarde (13:00 às 19:00)", status_presenca: "Presenca", taxa_reposicao_gerada: false, taxa_reposicao_valor: 0.00, ficha_validada_bool: true, faltas_consecutivas: 0, alerta_evasao: false },
        { id_escala: 104, aluno_id: 4, nome_aluno: "Mateus Silva Santos", prontuario: "2026-00132", codigo_turma: "Turma 131", status_aluno: "Desistente", motivo_desistencia: "Mudança de Turno de Trabalho", hospital_campo: "Hospital Municipal de Franco da Rocha - Centro Cirúrgico", preceptor_nome: "Enfª. Amanda Silveira", data_estagio: "2026-10-17", turno: "Manhã (07:00 às 13:00)", status_presenca: "Falta", taxa_reposicao_gerada: true, taxa_reposicao_valor: 50.00, ficha_validada_bool: false, faltas_consecutivas: 3, alerta_evasao: true },
        { id_escala: 105, aluno_id: 5, nome_aluno: "Raquel Mendonça Viana", prontuario: "2026-00133", codigo_turma: "Turma 131", status_aluno: "Ativo", motivo_desistencia: null, hospital_campo: "Hospital Regional de Caieiras", preceptor_nome: "Enfª. Amanda Silveira", data_estagio: "2026-10-18", turno: "Manhã (07:00 às 13:00)", status_presenca: "Falta Justificada", taxa_reposicao_gerada: false, taxa_reposicao_valor: 0.00, ficha_validada_bool: false, faltas_consecutivas: 0, alerta_evasao: false, atestado_protocolo: "MED-2026-8841" },
        { id_escala: 106, aluno_id: 6, nome_aluno: "Richard Henrique Souza", prontuario: "2026-00134", codigo_turma: "Turma 131", status_aluno: "Trancado", motivo_desistencia: "Questões de Saúde Pessoal", hospital_campo: "Hospital Regional de Caieiras", preceptor_nome: "Enfª. Amanda Silveira", data_estagio: "2026-10-18", turno: "Manhã (07:00 às 13:00)", status_presenca: "Falta Justificada", taxa_reposicao_gerada: false, taxa_reposicao_valor: 0.00, ficha_validada_bool: false, faltas_consecutivas: 0, alerta_evasao: false, atestado_protocolo: "TRANC-2026-12" },
        { id_escala: 107, aluno_id: 7, nome_aluno: "Tamires Rodrigues Ramos", prontuario: "2026-00135", codigo_turma: "Turma 131", status_aluno: "Ativo", motivo_desistencia: null, hospital_campo: "Hospital Estadual de Francisco Morato", preceptor_nome: "Enf. Marcos Vinicius", data_estagio: "2026-10-18", turno: "Tarde (13:00 às 19:00)", status_presenca: "Agendado", taxa_reposicao_gerada: false, taxa_reposicao_valor: 0.00, ficha_validada_bool: false, faltas_consecutivas: 0, alerta_evasao: false },
        { id_escala: 108, aluno_id: 8, nome_aluno: "Wellington Barboza da Silva", prontuario: "2026-00136", codigo_turma: "Turma 131", status_aluno: "Ativo", motivo_desistencia: null, hospital_campo: "Hospital Regional de Caieiras", preceptor_nome: "Enfª. Amanda Silveira", data_estagio: "2026-10-18", turno: "Manhã (07:00 às 13:00)", status_presenca: "Falta", taxa_reposicao_gerada: true, taxa_reposicao_valor: 50.00, ficha_validada_bool: false, faltas_consecutivas: 1, alerta_evasao: false }
    ],
    financeiro: [
        { id_lancamento: 501, aluno_id: 4, nome_aluno: "Mateus Silva Santos", prontuario: "2026-00132", contato_whatsapp: "11954321098", descricao: "Mensalidade Parcela 08/10", valor_base: 380.00, vencimento: "2026-10-05", dias_atraso: 9, multa_juros: 18.80, valor_total: 398.80, status: "Atrasado", chave_pix: "secretaria@cepa.edu.br" },
        { id_lancamento: 502, aluno_id: 4, nome_aluno: "Mateus Silva Santos", prontuario: "2026-00132", contato_whatsapp: "11954321098", descricao: "Taxa de Reposição de Falta em Estágio (17/10)", valor_base: 50.00, vencimento: "2026-10-20", dias_atraso: 0, multa_juros: 0.00, valor_total: 50.00, status: "Pendente", chave_pix: "secretaria@cepa.edu.br" },
        { id_lancamento: 503, aluno_id: 5, nome_aluno: "Raquel Mendonça Viana", prontuario: "2026-00133", contato_whatsapp: "11943210987", descricao: "Mensalidade Parcela 08/10", valor_base: 380.00, vencimento: "2026-10-05", dias_atraso: 9, multa_juros: 18.80, valor_total: 398.80, status: "Atrasado", chave_pix: "secretaria@cepa.edu.br" },
        { id_lancamento: 504, aluno_id: 8, nome_aluno: "Wellington Barboza da Silva", prontuario: "2026-00136", contato_whatsapp: "11910987654", descricao: "Taxa de Reposição de Falta em Estágio (18/10)", valor_base: 50.00, vencimento: "2026-10-22", dias_atraso: 0, multa_juros: 0.00, valor_total: 50.00, status: "Pendente", chave_pix: "secretaria@cepa.edu.br" },
        { id_lancamento: 505, aluno_id: 1, nome_aluno: "Ana Cristina de Souza", prontuario: "2026-00129", contato_whatsapp: "11987654321", descricao: "Mensalidade Parcela 09/10", valor_base: 380.00, vencimento: "2026-10-15", dias_atraso: 0, multa_juros: 0.00, valor_total: 380.00, status: "Pago", chave_pix: "secretaria@cepa.edu.br" }
    ]
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    renderizarEscalas();
    popularSelects();
    renderizarChamadaTeorica();
    renderizarFinanceiro();
    renderizarCertificados();
});

// Carrega dados da API ou usa Fallback
async function carregarDados() {
    try {
        const [resTurmas, resAlunos, resEscalas, resFinanceiro] = await Promise.all([
            fetch('/api/turmas'),
            fetch('/api/alunos'),
            fetch('/api/estagios'),
            fetch('/api/financeiro')
        ]);

        if (resTurmas.ok && resAlunos.ok && resEscalas.ok && resFinanceiro.ok) {
            state.turmas = await resTurmas.json();
            state.alunos = await resAlunos.json();
            state.escalas = await resEscalas.json();
            state.financeiro = await resFinanceiro.json();
            return;
        }
    } catch (e) {
        console.warn('API não disponível no momento. Utilizando modo autônomo / local.');
    }

    // Modo autônomo offline
    state.turmas = [...FALLBACK_DATA.turmas];
    state.alunos = [...FALLBACK_DATA.alunos];
    state.escalas = [...FALLBACK_DATA.escalas];
    state.financeiro = [...FALLBACK_DATA.financeiro];
}

// Alternar Perfil
function trocarPerfil(perfil) {
    perfilAtual = perfil;
    const nameEl = document.getElementById('current-user-name');
    const badgeEl = document.getElementById('badge-alertas');

    if (perfil === 'secretaria') {
        nameEl.innerText = 'Secretaria / Financeiro CEPA';
    } else if (perfil === 'coordenacao') {
        nameEl.innerText = 'Coordenação de Estágios';
    } else if (perfil === 'preceptor') {
        nameEl.innerText = 'Enfª. Amanda Silveira (Preceptora)';
    } else if (perfil === 'aluno') {
        nameEl.innerText = 'Ana Cristina (Aluno - Turma 131)';
    }

    renderizarEscalas();
}

// Alternar Abas
function mudarAba(abaId) {
    const abas = ['estagios', 'chamada', 'financeiro', 'certificados', 'rematricula'];
    abas.forEach(id => {
        const section = document.getElementById(`modulo-${id}`);
        const btn = document.getElementById(`tab-${id}`);
        if (section && btn) {
            if (id === abaId) {
                section.classList.remove('hidden');
                btn.className = 'tab-btn active px-4 py-2 rounded-lg flex items-center space-x-2 text-emerald-800 bg-emerald-50 border border-emerald-200';
            } else {
                section.classList.add('hidden');
                btn.className = 'tab-btn px-4 py-2 rounded-lg flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100';
            }
        }
    });

    if (abaId === 'estagios') renderizarEscalas();
    if (abaId === 'chamada') renderizarChamadaTeorica();
    if (abaId === 'financeiro') renderizarFinanceiro();
    if (abaId === 'certificados') renderizarCertificados();
}

// ==============================================================
// MÓDULO 3: RENDERIZAR ESCALAS DE ESTÁGIO
// ==============================================================
function renderizarEscalas() {
    const tbody = document.getElementById('tabela-escala-estagios');
    if (!tbody) return;

    const filtroTurma = document.getElementById('filtro-turma-estagio').value;
    const filtroHospital = document.getElementById('filtro-hospital-estagio').value;
    const filtroBusca = document.getElementById('filtro-busca-estagio').value.toLowerCase();

    let filtrados = state.escalas.filter(item => {
        let matchTurma = !filtroTurma || item.codigo_turma === filtroTurma;
        let matchHospital = !filtroHospital || item.hospital_campo.includes(filtroHospital);
        let matchBusca = !filtroBusca || 
            item.nome_aluno.toLowerCase().includes(filtroBusca) || 
            item.prontuario.toLowerCase().includes(filtroBusca);
        return matchTurma && matchHospital && matchBusca;
    });

    document.getElementById('contador-escala').innerText = `${filtrados.length} aluno(s) listado(s)`;

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-slate-400">Nenhum aluno encontrado para os filtros selecionados.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrados.map(item => {
        // Formatação do Status do Aluno e Motivo de Desistência
        let statusBadge = '';
        if (item.status_aluno === 'Ativo') {
            statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-check mr-1"></i> Ativo</span>`;
        } else if (item.status_aluno === 'Desistente') {
            statusBadge = `
                <div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800"><i class="fa-solid fa-user-xmark mr-1"></i> Desistente</span>
                    <div class="text-[10px] text-rose-700 font-medium mt-0.5"><i class="fa-solid fa-quote-left text-[8px] mr-1"></i>${item.motivo_desistencia || 'Não informado'}</div>
                </div>`;
        } else if (item.status_aluno === 'Trancado') {
            statusBadge = `
                <div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800"><i class="fa-solid fa-lock mr-1"></i> Trancado</span>
                    <div class="text-[10px] text-amber-700 font-medium mt-0.5"><i class="fa-solid fa-quote-left text-[8px] mr-1"></i>${item.motivo_desistencia || 'Não informado'}</div>
                </div>`;
        }

        // Alerta de Evasão IC (3 faltas consecutivas)
        let alertaHtml = '';
        if (item.alerta_evasao || item.faltas_consecutivas >= 3) {
            alertaHtml = `<span class="inline-block ml-1 text-rose-600 font-bold" title="Alerta Vermelho: 3 faltas consecutivas IC!"><i class="fa-solid fa-triangle-exclamation animate-bounce"></i></span>`;
        }

        // Botões de Presença no Campo (P, F, FJ)
        let presencaBotoes = `
            <div class="flex items-center justify-center space-x-1">
                <button onclick="marcarPresencaEstagio(${item.id_escala}, 'Presenca')" title="Presença" class="px-2 py-1 rounded text-xs font-bold transition-all ${item.status_presenca === 'Presenca' ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300' : 'bg-slate-100 hover:bg-emerald-100 text-slate-700'}">[P]</button>
                <button onclick="marcarPresencaEstagio(${item.id_escala}, 'Falta')" title="Falta (Gera taxa R$ 50)" class="px-2 py-1 rounded text-xs font-bold transition-all ${item.status_presenca === 'Falta' ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300' : 'bg-slate-100 hover:bg-rose-100 text-slate-700'}">[F]</button>
                <button onclick="abrirModalAtestado(${item.id_escala})" title="Falta Justificada (Atestado Médico)" class="px-2 py-1 rounded text-xs font-bold transition-all ${item.status_presenca === 'Falta Justificada' ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300' : 'bg-slate-100 hover:bg-amber-100 text-slate-700'}">[FJ]</button>
            </div>
            ${item.atestado_protocolo ? `<div class="text-[10px] text-amber-700 mt-1 font-mono text-center">Protocolo: ${item.atestado_protocolo}</div>` : ''}
        `;

        // Taxa de Reposição
        let taxaHtml = item.taxa_reposicao_gerada
            ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800"><i class="fa-solid fa-receipt mr-1"></i> R$ 50,00</span>`
            : `<span class="text-slate-400 text-[11px]">-</span>`;

        // Validação da Ficha pela Coordenação
        let fichaHtml = item.ficha_validada_bool
            ? `<button onclick="alternarFicha(${item.id_escala})" class="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all"><i class="fa-solid fa-circle-check mr-1 text-emerald-600"></i> Aprovada</button>`
            : `<button onclick="alternarFicha(${item.id_escala})" class="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300 transition-all"><i class="fa-regular fa-circle mr-1"></i> Validar</button>`;

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">${item.prontuario}</td>
                <td class="py-3 px-4 whitespace-nowrap">
                    <div class="font-bold text-slate-800 flex items-center">
                        <span>${item.nome_aluno}</span>
                        ${alertaHtml}
                    </div>
                    <div class="text-[11px] text-slate-500">${item.codigo_turma}</div>
                </td>
                <td class="py-3 px-4">${statusBadge}</td>
                <td class="py-3 px-4">
                    <div class="font-medium text-slate-800">${item.hospital_campo}</div>
                    <div class="text-[11px] text-slate-500"><i class="fa-solid fa-user-doctor mr-1"></i>${item.preceptor_nome}</div>
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                    <div class="font-medium text-slate-800">${formatarData(item.data_estagio)}</div>
                    <div class="text-[11px] text-slate-500">${item.turno}</div>
                </td>
                <td class="py-3 px-4 text-center whitespace-nowrap">${presencaBotoes}</td>
                <td class="py-3 px-4 text-center whitespace-nowrap">${taxaHtml}</td>
                <td class="py-3 px-4 text-center whitespace-nowrap">${fichaHtml}</td>
            </tr>
        `;
    }).join('');
}

// Marcar Presença ou Falta no Estágio com Regras Automáticas
async function marcarPresencaEstagio(idEscala, status) {
    const escala = state.escalas.find(e => e.id_escala === idEscala);
    if (!escala) return;

    escala.status_presenca = status;

    if (status === 'Falta') {
        escala.taxa_reposicao_gerada = true;
        escala.taxa_reposicao_valor = 50.00;
        escala.faltas_consecutivas = (escala.faltas_consecutivas || 0) + 1;

        if (escala.codigo_turma.includes('131') || escala.codigo_turma.includes('129') || escala.codigo_turma.includes('IC')) {
            if (escala.faltas_consecutivas >= 3) {
                escala.alerta_evasao = true;
                alert(`⚠️ ALERTA VERMELHO IC: Aluno ${escala.nome_aluno} atingiu 3 faltas consecutivas sem justificativa!\nNotificação automática enviada à Coordenação.`);
            }
        }

        // Adiciona lançamento financeiro automático de R$ 50,00
        const lancamento = {
            id_lancamento: Math.floor(Math.random() * 90000) + 1000,
            aluno_id: escala.aluno_id,
            nome_aluno: escala.nome_aluno,
            prontuario: escala.prontuario,
            contato_whatsapp: '11999999999',
            descricao: `Taxa de Reposição de Falta em Estágio (${escala.data_estagio})`,
            valor_base: 50.00,
            vencimento: "2026-10-25",
            dias_atraso: 0,
            multa_juros: 0.00,
            valor_total: 50.00,
            status: "Pendente",
            chave_pix: "secretaria@cepa.edu.br"
        };
        state.financeiro.unshift(lancamento);

        alert(`Falta computada para ${escala.nome_aluno}.\nTaxa de reposição de R$ 50,00 lançada no módulo financeiro.`);
    } else if (status === 'Presenca') {
        escala.taxa_reposicao_gerada = false;
        escala.taxa_reposicao_valor = 0.00;
        escala.faltas_consecutivas = 0;
    }

    // Tenta atualizar no backend se estiver online
    try {
        await fetch(`/api/estagios/${idEscala}/presenca`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_presenca: status })
        });
    } catch (e) {}

    renderizarEscalas();
    renderizarFinanceiro();
}

// Modal de Falta Justificada / Atestado Médico
function abrirModalAtestado(idEscala) {
    escalaSelecionadaParaAtestado = idEscala;
    document.getElementById('modal-atestado').classList.remove('hidden');
}

function fecharModalAtestado() {
    escalaSelecionadaParaAtestado = null;
    document.getElementById('modal-atestado').classList.add('hidden');
}

async function confirmarFaltaJustificada() {
    if (!escalaSelecionadaParaAtestado) return;
    const protocolo = document.getElementById('atestado-protocolo').value || 'CRM-VALIDADO';
    
    const escala = state.escalas.find(e => e.id_escala === escalaSelecionadaParaAtestado);
    if (escala) {
        escala.status_presenca = 'Falta Justificada';
        escala.taxa_reposicao_gerada = false;
        escala.taxa_reposicao_valor = 0.00;
        escala.atestado_protocolo = protocolo;

        try {
            await fetch(`/api/estagios/${escala.id_escala}/presenca`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_presenca: 'Falta Justificada', atestado_protocolo: protocolo })
            });
        } catch (e) {}
    }

    fecharModalAtestado();
    renderizarEscalas();
    alert(`Falta Justificada protocolada com sucesso!\nA taxa de reposição de R$ 50,00 foi devidamente abonada.`);
}

// Alternar Validação da Ficha pela Coordenação
async function alternarFicha(idEscala) {
    const escala = state.escalas.find(e => e.id_escala === idEscala);
    if (!escala) return;

    escala.ficha_validada_bool = !escala.ficha_validada_bool;
    const aluno = state.alunos.find(a => a.id === escala.aluno_id);
    if (aluno && escala.ficha_validada_bool) {
        aluno.fichas_validadas = true;
    }

    try {
        await fetch(`/api/estagios/${idEscala}/validar-ficha`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ficha_validada_bool: escala.ficha_validada_bool })
        });
    } catch (e) {}

    renderizarEscalas();
    renderizarCertificados();
}

// Nova Escala de Estágio com Validação IC
function abrirModalNovaEscala() {
    document.getElementById('modal-nova-escala').classList.remove('hidden');
    document.getElementById('alerta-validacao-ic').classList.add('hidden');
}

function fecharModalNovaEscala() {
    document.getElementById('modal-nova-escala').classList.add('hidden');
}

async function salvarNovaEscala(e) {
    e.preventDefault();
    const alunoId = parseInt(document.getElementById('escala-aluno-select').value);
    const hospital = document.getElementById('escala-hospital').value;
    const preceptor = document.getElementById('escala-preceptor').value;
    const data = document.getElementById('escala-data').value;
    const turno = document.getElementById('escala-turno').value;

    const aluno = state.alunos.find(a => a.id === alunoId);
    if (!aluno) return;

    // Regra IC: Bloqueio automático de turno noturno para Instrumentação Cirúrgica
    const alertaBox = document.getElementById('alerta-validacao-ic');
    if ((aluno.codigo_turma.includes('131') || aluno.codigo_turma.includes('129') || aluno.codigo_turma.includes('IC')) && turno.includes('Noite')) {
        alertaBox.innerText = '❌ Bloqueio Contratual IC: Estágios de Instrumentação Cirúrgica não são autorizados no turno da noite.';
        alertaBox.classList.remove('hidden');
        return;
    }

    const nova = {
        id_escala: Math.floor(Math.random() * 90000) + 1000,
        aluno_id: aluno.id,
        nome_aluno: aluno.nome_completo,
        prontuario: aluno.prontuario,
        codigo_turma: aluno.codigo_turma,
        status_aluno: aluno.status,
        motivo_desistencia: aluno.motivo_saida || null,
        hospital_campo: hospital,
        preceptor_nome: preceptor,
        data_estagio: data,
        turno: turno,
        status_presenca: 'Agendado',
        taxa_reposicao_gerada: false,
        taxa_reposicao_valor: 0.00,
        ficha_validada_bool: false,
        faltas_consecutivas: 0,
        alerta_evasao: false
    };

    state.escalas.push(nova);

    try {
        await fetch('/api/estagios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                aluno_id: aluno.id,
                hospital_campo: hospital,
                preceptor_nome: preceptor,
                data_estagio: data,
                turno: turno
            })
        });
    } catch (err) {}

    fecharModalNovaEscala();
    renderizarEscalas();
    alert('Nova escala cadastrada com sucesso!');
}

// Popular Selects de Alunos e Turmas
function popularSelects() {
    const escalaSelect = document.getElementById('escala-aluno-select');
    const rematriculaSelect = document.getElementById('select-aluno-rematricula');

    if (escalaSelect) {
        escalaSelect.innerHTML = state.alunos.map(a => 
            `<option value="${a.id}">[${a.prontuario}] ${a.nome_completo} - ${a.codigo_turma} (${a.status})</option>`
        ).join('');
    }

    if (rematriculaSelect) {
        rematriculaSelect.innerHTML = state.alunos.map(a => 
            `<option value="${a.id}">[${a.prontuario}] ${a.nome_completo} - ${a.codigo_turma} (${a.status})</option>`
        ).join('');
    }
}

// ==============================================================
// MÓDULO 2: CHAMADA DE AULAS TEÓRICAS
// ==============================================================
function renderizarChamadaTeorica() {
    const tbody = document.getElementById('tabela-chamada-teorica');
    if (!tbody) return;

    const turmaId = parseInt(document.getElementById('turma-chamada').value);
    const alunosTurma = state.alunos.filter(a => a.turma_id === turmaId || !turmaId);

    tbody.innerHTML = alunosTurma.map(aluno => {
        let freqBadge = aluno.frequencia_acumulada < 75.0
            ? `<span class="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">${aluno.frequencia_acumulada}% ⚠️ Crítico</span>`
            : `<span class="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">${aluno.frequencia_acumulada}% OK</span>`;

        return `
            <tr class="hover:bg-slate-50">
                <td class="py-3 px-4 font-mono font-bold text-slate-700">${aluno.prontuario}</td>
                <td class="py-3 px-4 font-bold text-slate-800">${aluno.nome_completo}</td>
                <td class="py-3 px-4 text-slate-600">${aluno.codigo_turma}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${aluno.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                        ${aluno.status}
                    </span>
                </td>
                <td class="py-3 px-4 text-center">${freqBadge}</td>
                <td class="py-3 px-4 text-center">
                    <div class="inline-flex space-x-1">
                        <button class="px-2 py-1 rounded text-xs font-bold bg-emerald-600 text-white shadow-sm">[P]</button>
                        <button class="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 hover:bg-rose-100">[F]</button>
                        <button class="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 hover:bg-amber-100">[FJ]</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function salvarChamada() {
    alert('Chamada teórica salva com sucesso!\nFrequências acumuladas atualizadas no diário digital.');
}

// ==============================================================
// MÓDULO 4: FINANCEIRO & COBRANÇA WHATSAPP
// ==============================================================
function renderizarFinanceiro() {
    const tbody = document.getElementById('tabela-financeiro');
    if (!tbody) return;

    tbody.innerHTML = state.financeiro.map(item => {
        let statusBadge = '';
        if (item.status === 'Pago') {
            statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Pago</span>`;
        } else if (item.status === 'Atrasado') {
            statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">${item.dias_atraso}d em atraso</span>`;
        } else {
            statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">A vencer</span>`;
        }

        let total = item.valor_total || (item.valor_base + (item.multa_juros || 0));

        let zapBtn = item.status === 'Pago'
            ? `<span class="text-slate-400 text-xs">Quitado</span>`
            : `<button onclick="abrirModalWhatsApp(${item.id_lancamento})" class="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1 mx-auto transition-all">
                <i class="fa-brands fa-whatsapp"></i>
                <span>Cobrar</span>
               </button>`;

        let baixaBtn = item.status === 'Pago'
            ? `<span class="text-emerald-600 text-xs font-semibold"><i class="fa-solid fa-check"></i> Baixado</span>`
            : `<button onclick="darBaixa(${item.id_lancamento})" class="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300">Dar Baixa</button>`;

        return `
            <tr class="hover:bg-slate-50">
                <td class="py-3 px-4 font-mono font-bold text-slate-700">${item.prontuario}</td>
                <td class="py-3 px-4 font-bold text-slate-800">${item.nome_aluno}</td>
                <td class="py-3 px-4 text-slate-600">${item.descricao}</td>
                <td class="py-3 px-4 text-slate-700 whitespace-nowrap">${formatarData(item.vencimento)}</td>
                <td class="py-3 px-4 font-mono text-slate-700">R$ ${item.valor_base.toFixed(2)}</td>
                <td class="py-3 px-4 font-mono text-rose-600">R$ ${(item.multa_juros || 0).toFixed(2)}</td>
                <td class="py-3 px-4 font-mono font-bold text-slate-900">R$ ${total.toFixed(2)}</td>
                <td class="py-3 px-4 text-center">${statusBadge}</td>
                <td class="py-3 px-4 text-center">${zapBtn}</td>
                <td class="py-3 px-4 text-center">${baixaBtn}</td>
            </tr>
        `;
    }).join('');
}

// Disparador de Mensagem Dinâmica no WhatsApp
function abrirModalWhatsApp(idLancamento) {
    const lanc = state.financeiro.find(f => f.id_lancamento === idLancamento);
    if (!lanc) return;

    const total = (lanc.valor_total || (lanc.valor_base + (lanc.multa_juros || 0))).toFixed(2);
    const textoMensagem = 
`Olá, *${lanc.nome_aluno}*! Tudo bem?
Aqui é da Secretaria do *CEPA - Centro de Ensino Profissionalizante Anchieta*.

Identificamos em nosso sistema a pendência referente a:
📋 *${lanc.descricao}*
📅 Vencimento original: *${formatarData(lanc.vencimento)}*
💰 Valor atualizado com encargos: *R$ ${total}*

Para facilitar sua quitação, você pode pagar via Pix:
🔑 Chave Pix: *${lanc.chave_pix || 'secretaria@cepa.edu.br'}*

Após realizar a transferência, por favor nos envie o comprovante por aqui para darmos a baixa imediata em seu prontuário (${lanc.prontuario}).

Qualquer dúvida estamos à disposição!`;

    document.getElementById('whatsapp-destinatario').innerText = `${lanc.nome_aluno} (Prontuário: ${lanc.prontuario} - Tel: ${lanc.contato_whatsapp || '11954321098'})`;
    document.getElementById('whatsapp-mensagem-texto').value = textoMensagem;

    const tel = (lanc.contato_whatsapp || '11954321098').replace(/\D/g, '');
    const encoded = encodeURIComponent(textoMensagem);
    document.getElementById('btn-enviar-whatsapp-link').href = `https://wa.me/55${tel}?text=${encoded}`;

    document.getElementById('modal-whatsapp').classList.remove('hidden');
}

function fecharModalWhatsApp() {
    document.getElementById('modal-whatsapp').classList.add('hidden');
}

function copiarTextoWhatsApp() {
    const txt = document.getElementById('whatsapp-mensagem-texto');
    txt.select();
    navigator.clipboard.writeText(txt.value);
    alert('Mensagem copiada para a área de transferência!');
}

async function darBaixa(idLancamento) {
    const item = state.financeiro.find(f => f.id_lancamento === idLancamento);
    if (item) {
        item.status = 'Pago';
        try {
            await fetch(`/api/financeiro/pagamento/${idLancamento}`, { method: 'POST' });
        } catch (e) {}
        renderizarFinanceiro();
        renderizarCertificados();
        alert('Pagamento registrado e baixado com sucesso!');
    }
}

// ==============================================================
// MÓDULO 5: FILA DE CERTIFICADOS & OS 4 PILARES
// ==============================================================
function renderizarCertificados() {
    const tbody = document.getElementById('tabela-certificados');
    if (!tbody) return;

    tbody.innerHTML = state.alunos.map(aluno => {
        // Validação dos 4 Pilares:
        // 1. Média >= 6.0
        const c1_media = aluno.media_modulo >= 6.0;
        // 2. Frequência >= 75%
        const c2_freq = aluno.frequencia_acumulada >= 75.0;
        // 3. Fichas de Estágio 100% Validadas
        const c3_estagio = aluno.fichas_validadas === true;
        // 4. Quitação Financeira Completa
        const debitoPendente = state.financeiro.some(f => f.aluno_id === aluno.id && (f.status === 'Atrasado' || f.status === 'Pendente'));
        const c4_quitacao = !debitoPendente && aluno.parcelas_atraso === 0;

        const apto = c1_media && c2_freq && c3_estagio && c4_quitacao;

        const badgeC1 = c1_media 
            ? `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-circle-check"></i> ${aluno.media_modulo.toFixed(1)}</span>`
            : `<span class="text-rose-600 font-bold"><i class="fa-solid fa-circle-xmark"></i> ${aluno.media_modulo.toFixed(1)}</span>`;

        const badgeC2 = c2_freq 
            ? `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-circle-check"></i> ${aluno.frequencia_acumulada}%</span>`
            : `<span class="text-rose-600 font-bold"><i class="fa-solid fa-circle-xmark"></i> ${aluno.frequencia_acumulada}%</span>`;

        const badgeC3 = c3_estagio 
            ? `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-circle-check"></i> 100% OK</span>`
            : `<span class="text-rose-600 font-bold"><i class="fa-solid fa-clock"></i> Pendente</span>`;

        const badgeC4 = c4_quitacao 
            ? `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-circle-check"></i> Quitado</span>`
            : `<span class="text-rose-600 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> Débitos</span>`;

        const statusEmissao = apto
            ? `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Apto para Emissão</span>`
            : `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Bloqueado</span>`;

        const acaoBtn = apto
            ? `<button onclick="verCertificado(${aluno.id})" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-sm flex items-center space-x-1 mx-auto">
                <i class="fa-solid fa-print"></i>
                <span>Emitir</span>
               </button>`
            : `<button disabled class="px-3 py-1 bg-slate-200 text-slate-400 rounded text-xs font-semibold cursor-not-allowed mx-auto">Trava Ativa</button>`;

        return `
            <tr class="hover:bg-slate-50">
                <td class="py-3 px-4 font-mono font-bold text-slate-700">${aluno.prontuario}</td>
                <td class="py-3 px-4 font-bold text-slate-800">${aluno.nome_completo}</td>
                <td class="py-3 px-4 text-slate-600">${aluno.codigo_turma}</td>
                <td class="py-3 px-4 text-center">${badgeC1}</td>
                <td class="py-3 px-4 text-center">${badgeC2}</td>
                <td class="py-3 px-4 text-center">${badgeC3}</td>
                <td class="py-3 px-4 text-center">${badgeC4}</td>
                <td class="py-3 px-4 text-center">${statusEmissao}</td>
                <td class="py-3 px-4 text-center">${acaoBtn}</td>
            </tr>
        `;
    }).join('');
}

// Visualizador do Certificado e Ficha de Estágio Oficial
function verCertificado(alunoId) {
    const aluno = state.alunos.find(a => a.id === alunoId);
    if (!aluno) return;

    const isIC = aluno.codigo_turma.includes('131') || aluno.codigo_turma.includes('129') || aluno.codigo_turma.includes('IC');

    const html = `
        <div class="text-slate-800 space-y-3">
            <h1 class="text-2xl font-serif font-black tracking-wide text-emerald-900 uppercase">
                ${isIC ? 'CERTIFICADO DE CAPACITAÇÃO EM INSTRUMENTAÇÃO CIRÚRGICA' : 'CERTIFICADO DE CONCLUSÃO DE CURSO TÉCNICO'}
            </h1>
            <p class="text-xs text-slate-500 uppercase tracking-widest font-mono">
                ${isIC ? 'PADRÃO CFIC - COMISSÃO DE FORMAÇÃO EM INSTRUMENTAÇÃO CIRÚRGICA' : 'HOMOLOGAÇÃO SECRETARIA DE EDUCAÇÃO - GDAE'}
            </p>
            <p class="text-sm pt-4 leading-relaxed max-w-lg mx-auto">
                Certificamos que <strong>${aluno.nome_completo}</strong>, portador(a) do Prontuário Escolar nº <strong>${aluno.prontuario}</strong> e CPF <strong>${aluno.cpf}</strong>, concluiu com aproveitamento e total frequência exigida a carga horária teórico-prática e os campos de estágio hospitalar no curso de <strong>${aluno.codigo_turma}</strong>.
            </p>
            
            <div class="grid grid-cols-2 gap-4 pt-6 max-w-md mx-auto text-xs text-left bg-white p-3 rounded border border-slate-200">
                <div><strong>Média Final:</strong> ${aluno.media_modulo.toFixed(1)} / 10.0</div>
                <div><strong>Frequência Global:</strong> ${aluno.frequencia_acumulada}%</div>
                <div><strong>Fichas de Estágio:</strong> 100% Homologadas</div>
                <div><strong>Financeiro:</strong> Quitado</div>
            </div>

            <div class="pt-8 flex justify-around text-xs text-slate-600">
                <div class="border-t border-slate-400 pt-1 px-4">Coordenação Pedagógica CEPA</div>
                <div class="border-t border-slate-400 pt-1 px-4">Diretoria de Ensino</div>
            </div>
        </div>
    `;

    document.getElementById('certificado-conteudo-impresso').innerHTML = html;
    document.getElementById('modal-certificado-view').classList.remove('hidden');
}

function fecharModalCertificado() {
    document.getElementById('modal-certificado-view').classList.add('hidden');
}

// ==============================================================
// MÓDULO 1: CADASTRO & MOTOR DE REMATRÍCULA AUTOMÁTICA
// ==============================================================
async function cadastrarAluno(e) {
    e.preventDefault();
    const nome = document.getElementById('novo-aluno-nome').value;
    const cpf = document.getElementById('novo-aluno-cpf').value;
    const rg = document.getElementById('novo-aluno-rg').value;
    const zap = document.getElementById('novo-aluno-whatsapp').value;
    const turmaId = parseInt(document.getElementById('novo-aluno-turma').value);

    const turma = state.turmas.find(t => t.id_turma === turmaId) || state.turmas[0];
    const year = 2026;
    const seq = 100 + state.alunos.length + 1;
    const prontuario = `${year}-00${seq}`;

    const novo = {
        id: state.alunos.length + 1,
        prontuario,
        nome_completo: nome,
        cpf,
        rg,
        contato_whatsapp: zap,
        email: `${nome.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        turma_id: turma.id_turma,
        codigo_turma: turma.codigo_turma,
        status: 'Ativo',
        motivo_saida: null,
        media_modulo: 8.0,
        frequencia_acumulada: 100.0,
        fichas_validadas: false,
        parcelas_atraso: 0
    };

    state.alunos.push(novo);

    try {
        await fetch('/api/alunos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novo)
        });
    } catch (err) {}

    popularSelects();
    renderizarEscalas();
    renderizarChamadaTeorica();
    renderizarCertificados();

    document.getElementById('form-novo-aluno').reset();
    alert(`Aluno cadastrado com sucesso!\nProntuário gerado: ${prontuario}`);
}

// Motor de Diagnóstico de Rematrícula
function testarRematricula() {
    const alunoId = parseInt(document.getElementById('select-aluno-rematricula').value);
    const aluno = state.alunos.find(a => a.id === alunoId);
    if (!aluno) return;

    const resDiv = document.getElementById('resultado-rematricula');

    // 1. Financeiro
    const debito = state.financeiro.some(f => f.aluno_id === aluno.id && (f.status === 'Atrasado' || f.status === 'Pendente')) || aluno.parcelas_atraso > 0;
    // 2. Frequência
    const freqOk = aluno.frequencia_acumulada >= 75.0;
    // 3. Nota
    const notaOk = aluno.media_modulo >= 6.0;

    const liberado = !debito && freqOk && notaOk;

    let html = `
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
                <span class="font-bold text-slate-800 text-sm">${aluno.nome_completo}</span>
                <span class="font-mono text-xs text-slate-500">(${aluno.prontuario} / ${aluno.codigo_turma})</span>
            </div>
            ${liberado 
                ? `<span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-circle-check mr-1"></i> Rematrícula Liberada com 1 Clique</span>`
                : `<span class="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-lock mr-1"></i> Rematrícula Bloqueada</span>`
            }
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div class="p-2.5 rounded-lg border ${!debito ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}">
                <div class="font-bold flex items-center"><i class="fa-solid ${!debito ? 'fa-check' : 'fa-times'} mr-1.5"></i> 1. Financeiro</div>
                <div class="text-[11px] mt-1">${!debito ? 'Sem débitos em atraso' : 'Possui parcelas pendentes'}</div>
            </div>
            <div class="p-2.5 rounded-lg border ${freqOk ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}">
                <div class="font-bold flex items-center"><i class="fa-solid ${freqOk ? 'fa-check' : 'fa-times'} mr-1.5"></i> 2. Frequência (Min 75%)</div>
                <div class="text-[11px] mt-1">Acumulado: ${aluno.frequencia_acumulada}%</div>
            </div>
            <div class="p-2.5 rounded-lg border ${notaOk ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}">
                <div class="font-bold flex items-center"><i class="fa-solid ${notaOk ? 'fa-check' : 'fa-times'} mr-1.5"></i> 3. Nota (Mín 6.0)</div>
                <div class="text-[11px] mt-1">Média Atual: ${aluno.media_modulo.toFixed(1)}</div>
            </div>
        </div>
    `;

    if (liberado) {
        html += `
            <div class="pt-3 text-right">
                <button onclick="alert('Aluno rematriculado no próximo ciclo com sucesso!')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-lg shadow-sm">
                    Efetivar Rematrícula Agora
                </button>
            </div>
        `;
    }

    resDiv.innerHTML = html;
}

// Helpers
function formatarData(dataStr) {
    if (!dataStr) return '-';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
}

function imprimirEscala() {
    window.print();
}
