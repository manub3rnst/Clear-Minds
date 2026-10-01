/* ==========================================
   HOME PROFISSIONAL (home-profissional.html)
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const sessao = localStorage.getItem("cm_session");
    const tipo = localStorage.getItem("cm_tipo");

    /* ---------- GUARDA DE ACESSO ----------
       Profissional precisa estar logado como profissional. */
    if (!sessao || tipo !== "profissional") {
        window.location.href = "login-profissional.html";
        return;
    }

    const perfil = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");
    const nome = (perfil.nome || "").trim();
    const primeiroNome = nome ? nome.split(" ")[0] : "";
    const profissao = perfil.profissao || "Profissional de saúde";

    const hora = new Date().getHours();
    const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

/* ---------- DADOS (estruturas prontas, sem dados fictícios) ---------- */
    let pacientes = JSON.parse(localStorage.getItem("cm_pacientes") || "[]");
    let agenda = JSON.parse(localStorage.getItem("cm_agenda_profissional") || "[]");
    let atividades = JSON.parse(localStorage.getItem("cm_atividades_profissional") || "[]");
    const conteudos = JSON.parse(localStorage.getItem("cm_conteudos_profissional") || "[]");
    let movimentacoes = JSON.parse(localStorage.getItem("cm_movimentacoes") || "[]");

    const getLista = (chave) => JSON.parse(localStorage.getItem(chave) || "[]");
    const salvarLista = (chave, lista) => localStorage.setItem(chave, JSON.stringify(lista));

    /* ==========================================
       DADOS DE DEMONSTRAÇÃO (claramente fictícios)
    ========================================== */
    const PACIENTE_DEMO = {
        nome: "Paciente de Demonstração",
        email: "paciente.demo@clearminds.com",
        ficticio: true,
        ultimaSessao: "15/02/2026",
        diarioAcesso: "liberado"
    };
    const DIARIO_DEMO = [
        {
            id: "demo-1",
            autorEmail: PACIENTE_DEMO.email,
            titulo: "Meu primeiro registro",
            humor: "Neutro",
            texto: "Hoje comecei a usar o diário. Foi uma semana intensa, mas consegui organizar meus estudos pela manhã. Quero tentar manter essa rotina.",
            data: "2026-02-02T09:15:00"
        },
        {
            id: "demo-2",
            autorEmail: PACIENTE_DEMO.email,
            titulo: "Ansiedade antes da prova",
            humor: "Ansioso(a)",
            texto: "Senti ansiedade antes da prova de matemática. Usei a técnica 3-3-3 e ajudou a acalmar um pouco. Vou conversar sobre isso na próxima sessão.",
            data: "2026-02-06T20:40:00"
        },
        {
            id: "demo-3",
            autorEmail: PACIENTE_DEMO.email,
            titulo: "Fim de semana melhor",
            humor: "Bem",
            texto: "Passei o fim de semana com amigos e consegui dormir melhor. Percebi que quando durmo bem, acordo mais disposto(a) para estudar.",
            data: "2026-02-09T18:05:00"
        },
        {
            id: "demo-4",
            autorEmail: PACIENTE_DEMO.email,
            titulo: "Reflexão da semana",
            humor: "Calmo(a)",
            texto: "Olhando a semana, vejo que os pequenos hábitos fazem diferença. Objetivo para a próxima: reservar um tempo para descansar sem culpa.",
            data: "2026-02-13T21:30:00"
        }
    ];

    (function () {
        const jaTem = pacientes.some(p => p.email === PACIENTE_DEMO.email);
        if (!jaTem) {
            pacientes.push(PACIENTE_DEMO);
            salvarLista("cm_pacientes", pacientes);
        }
        const diarioAtual = getLista("cm_diario");
        const semelhantes = new Set(diarioAtual.filter(r => r.autorEmail === PACIENTE_DEMO.email).map(r => r.id));
        const novos = DIARIO_DEMO.filter(r => !semelhantes.has(r.id));
        if (novos.length) {
            diarioAtual.push(...novos);
            salvarLista("cm_diario", diarioAtual);
        }
    })();

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    const set = (id, valor) => { const el = document.getElementById(id); if (el) el.textContent = valor; };
    const show = (id) => { const el = document.getElementById(id); if (el) el.hidden = false; };
    const hide = (id) => { const el = document.getElementById(id); if (el) el.hidden = true; };
    const limpar = (id) => { const el = document.getElementById(id); if (el) el.innerHTML = ""; };
    const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    /* Emoji correspondente ao humor (Diário) */
    const humorEmoji = (humor) => {
        const mapa = { "Ótimo": "😊", "Bem": "🙂", "Neutro": "😐", "Ansioso(a)": "😟", "Difícil": "😔" };
        return mapa[humor] || "📓";
    };

    /* Formata data ISO para o padrão dd/mm às HH:MM */
    const formatarData = (iso) => {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return esc(String(iso || ""));
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    /* Aviso discreto no rodapé da tela */
    const notificar = (msg) => {
        let toast = document.querySelector(".cm-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "cm-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove("show"), 2400);
    };

    const formatarValorBRL = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) return null;
        return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    const formatarDesde = (atuaDesde) => {
        if (!atuaDesde) return null;
        const [ano, mes] = String(atuaDesde).split("-");
        return mes ? `${MESES_FULL[Number(mes) - 1] || mes} de ${ano}` : ano;
    };

    const addPerfilItem = (containerId, rotulo, valor, icone) => {
        const grid = document.getElementById(containerId);
        if (!grid) return false;
        if (valor === null || valor === undefined || String(valor).trim() === "") return false;
        const d = document.createElement("div");
        d.className = "cm-profile-item";
        d.innerHTML = `<span class="cm-profile-label">${icone ? `<i class="${icone}" aria-hidden="true"></i>` : ""}${esc(rotulo)}</span><span class="cm-profile-value">${esc(valor)}</span>`;
        grid.appendChild(d);
        return true;
    };

    const renderPerfilProf = () => {
        set("perfilNome", nome || "Profissional");
        set("perfilMeta", `${profissao}${perfil.registroProfissional ? ` • ${perfil.registroProfissional}${perfil.ufCrp ? ` (${perfil.ufCrp})` : ""}` : ""}`);
        set("statusVerificacao", perfil.verificado ? "Perfil verificado" : "Verificação pendente");
        set("perfilBio", (perfil.bio || "").trim() || "Nenhuma apresentação adicionada ainda.");

        limpar("listaInfoPessoalProf");
        addPerfilItem("listaInfoPessoalProf", "Nome profissional", perfil.nome, "fa-regular fa-user");
        addPerfilItem("listaInfoPessoalProf", "Nome social", perfil.nomeSocial, "fa-regular fa-id-card");
        addPerfilItem("listaInfoPessoalProf", "Profissão", perfil.profissao, "fa-solid fa-user-doctor");
        addPerfilItem("listaInfoPessoalProf", "E-mail", perfil.email, "fa-regular fa-envelope");
        addPerfilItem("listaInfoPessoalProf", "Telefone", perfil.telefone, "fa-brands fa-whatsapp");
        addPerfilItem("listaInfoPessoalProf", "Idiomas de atendimento", perfil.idiomas, "fa-solid fa-language");

        limpar("listaInfoProfissional");
        addPerfilItem("listaInfoProfissional", "Registro profissional", perfil.registroProfissional ? `${perfil.registroProfissional}${perfil.ufCrp ? ` (${perfil.ufCrp})` : ""}` : null, "fa-solid fa-stamp");
        addPerfilItem("listaInfoProfissional", "Instituição de graduação", perfil.faculdade, "fa-solid fa-building-columns");
        addPerfilItem("listaInfoProfissional", "Ano de conclusão", perfil.anoFormacao, "fa-regular fa-calendar");
        addPerfilItem("listaInfoProfissional", "Pós-graduação e cursos", perfil.posGraduacao, "fa-solid fa-graduation-cap");
        addPerfilItem("listaInfoProfissional", "Atua desde", formatarDesde(perfil.atuaDesde), "fa-regular fa-calendar-check");

        limpar("listaAtendimento");
        addPerfilItem("listaAtendimento", "Modalidade", perfil.modalidade, "fa-solid fa-video");
        addPerfilItem("listaAtendimento", "Abordagem teórica", perfil.abordagem, "fa-solid fa-brain");
        addPerfilItem("listaAtendimento", "Especialidades", perfil.especialidades, "fa-solid fa-list-check");
        addPerfilItem("listaAtendimento", "Faixa etária", perfil.faixaEtaria, "fa-solid fa-child-reaching");
        addPerfilItem("listaAtendimento", "Localização", perfil.cidade ? `${perfil.cidade}${perfil.estado ? ` • ${perfil.estado}` : ""}` : null, "fa-solid fa-location-dot");
        addPerfilItem("listaAtendimento", "Valor da sessão", formatarValorBRL(perfil.valorSessao), "fa-solid fa-brazilian-real-sign");
        addPerfilItem("listaAtendimento", "Disponibilidade", perfil.disponibilidade, "fa-solid fa-clock");

        if (!document.getElementById("listaInfoPessoalProf").children.length) {
            document.getElementById("listaInfoPessoalProf").innerHTML = `<div class="cm-profile-item"><span class="cm-profile-label">Perfil</span><span class="cm-profile-value">Informações não preenchidas.</span></div>`;
        }
    };

/* ---------- Foto / avatar ---------- */
    const aplicarFoto = (el) => {
        if (!el) return;
        const texto = (perfil.nome || "").trim();
        const ini = texto ? texto.split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("") : "P";
        if (perfil.foto) el.innerHTML = `<img src="${perfil.foto}" alt="Foto de perfil">`;
        else el.textContent = ini;
    };
aplicarFoto(document.getElementById("avatarIniciais"));
    aplicarFoto(document.getElementById("perfilAvatar"));
    aplicarFoto(document.getElementById("sideAvatar"));
    renderPerfilProf();

    /* ==========================================
       MENU HAMBÚRGUER (mobile)
    ========================================== */
    const btnMenu = document.getElementById("btnMenu");
    const menuLateral = document.getElementById("menuLateral");
    const menuOverlay = document.getElementById("menuOverlay");

    const fecharMenu = () => {
        if (!menuLateral || !btnMenu) return;
        menuLateral.classList.remove("open");
        btnMenu.classList.remove("open");
        btnMenu.setAttribute("aria-expanded", "false");
        if (menuOverlay) menuOverlay.classList.remove("show");
    };

    if (btnMenu && menuLateral) {
        btnMenu.addEventListener("click", () => {
            const aberto = menuLateral.classList.toggle("open");
            btnMenu.classList.toggle("open", aberto);
            btnMenu.setAttribute("aria-expanded", String(aberto));
            if (menuOverlay) menuOverlay.classList.toggle("show", aberto);
        });
        if (menuOverlay) menuOverlay.addEventListener("click", fecharMenu);
    }

    /* ==========================================
       NAVEGAÇÃO ENTRE SEÇÕES (menu lateral)
    ========================================== */
    const botoesMenu = document.querySelectorAll(".cm-side-item[data-secao]");

    const alternarSecao = (alvo) => {
        botoesMenu.forEach(b => b.classList.toggle("active", b.dataset.secao === alvo));
        document.querySelectorAll(".cm-section").forEach(s => s.classList.remove("active"));
        const secao = document.getElementById(`sec-${alvo}`);
        if (secao) secao.classList.add("active");
        fecharMenu();
        recolherMenuLateral();
        if (document.activeElement && menuLateral && menuLateral.contains(document.activeElement)) {
            document.activeElement.blur();
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    botoesMenu.forEach(btn => {
        btn.addEventListener("click", () => alternarSecao(btn.dataset.secao));
    });

    /* ==========================================
       MENU LATERAL — barra fixa na lateral esquerda
       (recolhida com só ícones; expande sobre o conteúdo
        quando o mouse entra, sem empurrar a página)
     ========================================== */

    function expandirMenuLateral() {
        if (menuLateral) menuLateral.classList.add("sidebar-expanded");
    }

    function recolherMenuLateral() {
        if (menuLateral) menuLateral.classList.remove("sidebar-expanded");
    }

    /* a barra começa logo abaixo do topo fixo */
    const cmTopbar = document.querySelector(".cm-topbar");

    function alinharMenuLateral() {
        if (!cmTopbar) return;
        document.body.style.setProperty("--cm-rail-top", cmTopbar.offsetHeight + "px");
    }

    alinharMenuLateral();
    window.addEventListener("resize", alinharMenuLateral);

    if (menuLateral) {
        menuLateral.addEventListener("mouseenter", expandirMenuLateral);
        menuLateral.addEventListener("mouseleave", recolherMenuLateral);
        menuLateral.addEventListener("focusin", expandirMenuLateral);
        menuLateral.addEventListener("focusout", (e) => {
            if (!menuLateral.contains(e.relatedTarget)) recolherMenuLateral();
        });
    }

    // Botões de ação rápida (Início) que levam à seção correspondente
    document.querySelectorAll("[data-ir]").forEach(btn => {
        btn.addEventListener("click", () => {
            const alvo = btn.dataset.ir;
            alternarSecao(alvo);
            if (btn.dataset.open === "0") return;
            const abrirForm = alvo === "pacientes" ? "addPacienteForm" :
                              alvo === "agenda" ? "addAtendimentoForm" :
                              alvo === "financeiro" ? "addMovimentacaoForm" : null;
            if (abrirForm) {
                const form = document.getElementById(abrirForm);
                if (form && !form.classList.contains("open")) form.classList.add("open");
            }
        });
    });

    /* ==========================================
       PACIENTES
    ========================================== */
const renderPacientes = (filtro) => {
        const lista = document.getElementById("listaPacientes");
        const vazio = document.getElementById("pacientesVazio");
        if (!lista) return;
        limpar("listaPacientes");
        if (!pacientes.length) { vazio.hidden = false; return; }
        vazio.hidden = true;

        const termo = (filtro || "").trim().toLowerCase();
        pacientes
            .filter(p => !termo ||
                (p.nome || "").toLowerCase().includes(termo) ||
                (p.email || "").toLowerCase().includes(termo))
            .forEach(p => {
                const li = document.createElement("li");
                const ini = p.nome ? p.nome.split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("") : "?";
                const estado = p.diarioAcesso === "solicitado" ? "pendente" : (p.diarioAcesso === "liberado" ? "liberado" : "sem-acesso");
                const labels = {
                    "liberado": "Acesso ao diário liberado",
                    "pendente": "Acesso solicitado · aguardando autorização",
                    "sem-acesso": (p.ultimaSessao ? `Última sessão · ${p.ultimaSessao}` : "Aguardando primeira sessão")
                };
                const botoes = {
                    "liberado": `<button type="button" class="cm-action-btn following btn-diario-access" data-email="${(p.email || "").replace(/"/g, "&quot;")}">
                                    <i class="fa-solid fa-book-open" aria-hidden="true"></i> Ver diário
                                </button>`,
                    "pendente": `<button type="button" class="cm-action-btn btn-diario-access" data-email="${(p.email || "").replace(/"/g, "&quot;")}">
                                    <i class="fa-solid fa-clock" aria-hidden="true"></i> Autorização pendente
                                </button>`,
                    "sem-acesso": `<button type="button" class="cm-action-btn btn-diario-access" data-email="${(p.email || "").replace(/"/g, "&quot;")}">
                                    <i class="fa-solid fa-lock" aria-hidden="true"></i> Solicitar acesso ao diário
                                </button>`
                };
                li.innerHTML = `
                <span class="cm-avatar cm-avatar-sm">${ini}</span>
                <div class="cm-info">
                    <strong>${p.nome || "Paciente"}${p.ficticio ? ` <span class="cm-tag cm-tag-demo">Demonstração</span>` : ""}</strong>
                    <small>${labels[estado]}</small>
                </div>
                <div class="cm-list-item-actions">
                    ${botoes[estado]}
                </div>`;
                lista.appendChild(li);
            });

        if (!lista.children.length) vazio.hidden = false;
    };
    renderPacientes();

    /* ---------- Diário do paciente (apenas com autorização) ---------- */
    const abrirDiarioPaciente = (email) => {
        const pac = pacientes.find(q => q.email === email);
        if (!pac) return;
        if (pac.diarioAcesso !== "liberado") {
            notificar("O acesso ao diário está pendente de autorização do paciente.");
            return;
        }
        const overlay = document.getElementById("cmDiarioOverlay");
        if (!overlay) return;
        set("cmDiarioPacNome", pac.nome || "Paciente");
        const lista = document.getElementById("listaDiarioPaciente");
        limpar("listaDiarioPaciente");
        const vazio = document.getElementById("diarioPacienteVazio");
        const entradas = getLista("cm_diario")
            .filter(r => (r.autorEmail || "") === pac.email)
            .sort((a, b) => (a.data > b.data ? -1 : 1));
        if (!entradas.length) { vazio.hidden = false; }
        else {
            vazio.hidden = true;
            entradas.forEach(r => {
                const item = document.createElement("article");
                item.className = "cm-diary-entry";
                const titulo = (r.titulo || "").trim() ? r.titulo.trim() : (r.humor ? r.humor : "Registro do dia");
                item.innerHTML = `
                    <div class="cm-diary-head">
                        <span class="cm-diary-emoji">${humorEmoji(r.humor)}</span>
                        <h4>${esc(titulo)}</h4>
                    </div>
                    <div class="cm-diary-meta">
                        <i class="fa-regular fa-calendar" aria-hidden="true"></i> ${formatarData(r.data)}${r.humor ? ` · Humor: ${esc(r.humor)}` : ""}
                    </div>
                    <div class="cm-diary-text">${esc((r.texto || "").trim() || "Registro de humor apenas.")}</div>`;
                lista.appendChild(item);
            });
        }
        overlay.classList.add("show");
    };

    /* ---------- Solicitar acesso / ver diário ---------- */
    document.getElementById("listaPacientes")?.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-diario-access");
        if (!btn) return;
        const email = btn.dataset.email || "";
        const alvo = pacientes.find(p => p.email === email || p.nome === email);
        if (!alvo) return;

        if (alvo.diarioAcesso === "liberado") {
            abrirDiarioPaciente(alvo.email);
            return;
        }
        if (alvo.diarioAcesso === "solicitado") {
            notificar("Autorização pendente do paciente. O diário só é liberado após a autorização.");
            return;
        }

        alvo.diarioAcesso = "solicitado";
        salvarLista("cm_pacientes", pacientes);

        // Registra a solicitação (estrutura preparada)
        const solicitacoes = getLista("cm_solicitacoes_diario");
        solicitacoes.push({ profissionalEmail: sessao, pacienteNome: alvo.nome || "Paciente", data: new Date().toISOString() });
        salvarLista("cm_solicitacoes_diario", solicitacoes);

        // Registra atividade
        atividades.unshift({
            texto: `Solicitação de acesso ao diário enviada para ${alvo.nome}.`,
            tempo: "agora"
        });
        salvarLista("cm_atividades_profissional", atividades);

        renderPacientes(document.getElementById("buscaPaciente")?.value);
        renderAtividades();
        notificar("Solicitação enviada. O diário será liberado após a autorização do paciente.");
    });

    const busca = document.getElementById("buscaPaciente");
    if (busca) {
        busca.addEventListener("input", () => renderPacientes(busca.value));
    }

    /* ==========================================
       AGENDA
    ========================================== */
const renderAgenda = () => {
        const lista = document.getElementById("listaAgenda");
        const vazio = document.getElementById("agendaVazio");
        if (!lista) return;
        limpar("listaAgenda");
        if (!agenda.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        agenda.slice().sort((a, b) => (a.data + (a.horario || "") > b.data + (b.horario || "") ? 1 : -1)).forEach(a => {
            const li = document.createElement("li");
            const status = a.status || "realizado";
            const badgeColor = status === "cancelado" ? "#E63946" : status === "agendado" ? "#E76F51" : "var(--primary-dark)";
            const badge = status === "cancelado" ? "Cancelado" : status === "agendado" ? "Agendado" : "Realizado";
            const linhaData = a.data ? new Date(a.data + "T" + (a.horario || "00:00")).toLocaleDateString("pt-BR") : "";
            li.innerHTML = `
                <span class="cm-time-box">${a.horario || "--:--"}</span>
                <div class="cm-info">
                    <strong>${esc(a.paciente || "Paciente")}</strong>
                    <small>${esc(a.tipo || "Atendimento")} · ${linhaData}${a.modalidade ? ` · ${esc(a.modalidade)}` : ""}</small>
                </div>
                <span class="cm-tag" style="color:${badgeColor};">${badge}</span>`;
            lista.appendChild(li);
        });
    };
    renderAgenda();

/* ==========================================
       CONTEÚDOS PROFISSIONAIS (demonstrativos)
    ========================================== */
    const conteudosPadrao = [
        {
            id: "p1",
            categoria: "Escuta ativa",
            icone: "fa-solid fa-ear-listen",
            titulo: "Escuta ativa na primeira sessão",
            data: "Fevereiro de 2026",
            teaser: "Como estruturar a escuta na avaliação inicial e fortalecer o vínculo terapêutico.",
            corpo: [
                { tipo: "p", texto: "A primeira sessão define o tom da relação. Escuta ativa vai além de ouvir: envolve acolher, validar e observar o que não é dito." },
                { tipo: "h3", texto: "Pontos de atenção" },
                { tipo: "ul", itens: ["Deixe espaço para silêncios sem pressa.", "Faça perguntas abertas e evite julgamentos.", "Observe linguagem corporal e afeto no discurso." ] },
                { tipo: "p", texto: "Registre hipóteses, mas mantenha a postura de investigação colaborativa com o paciente." }
            ]
        },
        {
            id: "p2",
            categoria: "Ansiedade",
            icone: "fa-solid fa-brain",
            titulo: "Psicoeducação em ansiedade: guia rápido",
            data: "Fevereiro de 2026",
            teaser: "Um roteiro de psicoeducação para compartilhar com pacientes com sintomas ansiosos.",
            corpo: [
                { tipo: "p", texto: "Explicar o que é ansiedade, suas funções e seus sintomas ajuda o paciente a se sentir mais no controle do próprio processo." },
                { tipo: "h3", texto: "O que abordar" },
                { tipo: "ul", itens: ["A ansiedade como resposta adaptativa.", "Diferença entre ansiedade comum e transtorno.", "Papel da evitação na manutenção do sintoma."] },
                { tipo: "p", texto: "Sugira a escrita de um diário de emoções como tarefa entre sessões." }
            ]
        },
        {
            id: "p3",
            categoria: "Adolescência",
            icone: "fa-solid fa-people-group",
            titulo: "Privacidade e confidencialidade no trabalho com adolescentes",
            data: "Janeiro de 2026",
            teaser: "O equilíbrio entre transparência com responsáveis e o espaço de confiança do adolescente.",
            corpo: [
                { tipo: "p", texto: "Trabalhar com adolescentes exige clareza sobre os limites da confidencialidade desde o início, envolvendo responsáveis e paciente." },
                { tipo: "h3", texto: "Boas práticas" },
                { tipo: "ul", itens: ["Alinhe as regras de sigilo com paciente e responsáveis no começo.", "Prefira conversas conjuntas a relatórios genéricos.", "Documente riscos e condutas com rigor ético."] },
                { tipo: "p", texto: "O sigilo é regra, mas a segurança do paciente vem primeiro sempre que houver risco real." }
            ]
        },
        {
            id: "p4",
            categoria: "Rotina clínica",
            icone: "fa-solid fa-book-medical",
            titulo: "Registro de evolução: o que não pode faltar",
            data: "Janeiro de 2026",
            teaser: "Um roteiro objetivo para registros de sessão que ajudam no acompanhamento e protegem sua prática.",
            corpo: [
                { tipo: "p", texto: "Registros de evolução claros facilitam a continuidade do cuidado e são a base da documentação profissional." },
                { tipo: "h3", texto: "Estrutura sugerida" },
                { tipo: "ul", itens: ["Queixa e contexto apresentados na sessão.", "Hipóteses e intervenções realizadas.", "Plano e tarefas combinadas para a próxima sessão."] },
                { tipo: "p", texto: "Escreva logo após a sessão, com dados objetivos e linguagem profissional." }
            ]
        },
        {
            id: "p5",
            categoria: "Autocuidado",
            icone: "fa-solid fa-heart-pulse",
            titulo: "Autocuidado para quem cuida",
            data: "Janeiro de 2026",
            teaser: "A supervisão e o cuidado do próprio profissional como parte da prática ética.",
            corpo: [
                { tipo: "p", texto: "Cuidar de muitos pacientes também desgasta o profissional. Supervisão, análise pessoal e descanso são instrumentos de trabalho." },
                { tipo: "h3", texto: "Práticas que ajudam" },
                { tipo: "ul", itens: ["Mantenha supervisão regular ou em grupos de pares.", "Respeite limites de carga de atendimentos.", "Inclua pausas e atividades de recuperação na rotina."] },
                { tipo: "p", texto: "Profissional esgotado atende mal. Cuidar de si também é cuidar do paciente." }
            ]
        },
        {
            id: "p6",
            categoria: "Crise",
            icone: "fa-solid fa-hand-holding-heart",
            titulo: "Acionamento de rede de apoio em risco",
            data: "Janeiro de 2026",
            teaser: "Roteiro de encaminhamento e acionamento de serviços quando há risco à integridade.",
            corpo: [
                { tipo: "p", texto: "Em situações de risco, agilidade e comunicação clara fazem a diferença. Conheça a rede disponível na sua região." },
                { tipo: "h3", texto: "Passos práticos" },
                { tipo: "ul", itens: ["Avalie risco imediato e garanta presença de alguém de confiança.", "Acione serviços de emergência quando necessário.", "Formalize encaminhamentos e orientações por escrito."] },
                { tipo: "p", texto: "Priorize a segurança da pessoa. Documente as medidas adotadas como parte do cuidado." }
            ]
        }
    ];

    if (!conteudos.length) {
        conteudos.push(...conteudosPadrao);
        salvarLista("cm_conteudos_profissional", conteudos);
    }

    const renderConteudos = () => {
        const lista = document.getElementById("listaConteudos");
        const vazio = document.getElementById("conteudosVazio");
        if (!lista) return;
        limpar("listaConteudos");
        if (!conteudos.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        conteudos.forEach(c => {
            const li = document.createElement("li");
            li.className = "cm-conteudo-item";
            li.setAttribute("role", "button");
            li.setAttribute("tabindex", "0");
            li.innerHTML = `
                <span class="cm-conteudo-card-icon" style="background:var(--secondary);color:var(--primary-dark);">
                    <i class="${esc(c.icone || "fa-solid fa-graduation-cap")}" aria-hidden="true"></i>
                </span>
                <div class="cm-info">
                    <strong>${esc(c.titulo || "Conteúdo")}</strong>
                    <small><span class="cm-tag" style="font-size:.68rem;">${esc(c.categoria || "Material")}</span> · ${esc(c.data || "")} · ${esc(c.teaser || c.descricao || "")}</small>
                </div>
                <i class="fa-solid fa-chevron-right" style="color:#C4D4E6;flex-shrink:0;" aria-hidden="true"></i>`;
            li.addEventListener("click", () => {
                const overlay = document.getElementById("cmReaderOverlay");
                if (!overlay) return;
                const fmt = (v) => esc(String(v == null ? "" : v));
                const setEl = (id, valor) => { const el = document.getElementById(id); if (el) el.innerHTML = valor; };
                setEl("cmReaderCategoria", `<i class="${fmt(c.icone || "fa-solid fa-graduation-cap")}" aria-hidden="true"></i> ${fmt(c.categoria || "Material")}`);
                setEl("cmReaderData", fmt(c.data || ""));
                setEl("cmReaderTitulo", fmt(c.titulo || "Conteúdo"));
                setEl("cmReaderTeaser", fmt(c.teaser || c.descricao || ""));
                const corpo = (c.corpo || c.conteudo || []).map(bloco => {
                    if (bloco.tipo === "h3") return `<h3>${fmt(bloco.texto)}</h3>`;
                    if (bloco.tipo === "ul") return `<ul>${bloco.itens.map(i => `<li>${fmt(i)}</li>`).join("")}</ul>`;
                    return `<p>${fmt(bloco.texto)}</p>`;
                }).join("");
                setEl("cmReaderCorpo", corpo || "<p>Conteúdo em construção.</p>");
                overlay.classList.add("show");
            });
            li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); } });
            lista.appendChild(li);
        });
    };
    renderConteudos();

    const fecharLeitor = () => {
        const overlay = document.getElementById("cmReaderOverlay");
        if (overlay) overlay.classList.remove("show");
    };
    const cmReaderClose = document.getElementById("cmReaderClose");
    if (cmReaderClose) cmReaderClose.addEventListener("click", fecharLeitor);
    document.getElementById("cmReaderOverlay")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("cmReaderOverlay")) fecharLeitor();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharLeitor(); });

    /* ---------- Fechar diário do paciente ---------- */
    const fecharDiarioPaciente = () => {
        const overlay = document.getElementById("cmDiarioOverlay");
        if (overlay) overlay.classList.remove("show");
    };
    const cmDiarioClose = document.getElementById("cmDiarioClose");
    if (cmDiarioClose) cmDiarioClose.addEventListener("click", fecharDiarioPaciente);
    document.getElementById("cmDiarioOverlay")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("cmDiarioOverlay")) fecharDiarioPaciente();
    });

    /* ==========================================
       ATIVIDADES RECENTES
    ========================================== */
    const renderAtividades = () => {
        const lista = document.getElementById("listAtividades");
        const vazio = document.getElementById("atividadesVazio");
        if (!lista) return;
        document.querySelectorAll(".cm-activity-item").forEach(el => el.remove());
        if (!atividades.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        atividades.slice(0, 6).forEach(a => {
            const li = document.createElement("li");
            li.className = "cm-activity-item";
            li.innerHTML = `
                <span class="cm-activity-dot"></span>
                <div>
                    <p>${a.texto || ""}</p>
                    <small>${a.tempo || ""}</small>
                </div>`;
            lista.insertBefore(li, vazio);
        });
    };
    renderAtividades();

/* ==========================================
       FINANCEIRO — FILTRO POR PERÍODO, RESUMO E GRÁFICO
    ========================================== */
    const normalizarData = (d) => {
        if (d instanceof Date) return d;
        if (typeof d === "string") {
            const p = d.split(/[\/\-]/);
            if (p.length === 3) {
                if (p[0].length === 4) return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
                return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
            }
        }
        return new Date(d);
    };

    const fimDoDia = (d) => {
        const c = new Date(d);
        c.setHours(23, 59, 59, 999);
        return c;
    };

    const normalizarMov = (m) => {
        const t = String(m.tipo || "").toLowerCase();
        const tipo = (t === "saida" || t === "saída" || t.includes("despesa") || t.includes("gasto")) ? "saida" : "entrada";
        const status = m.status === "pendente" ? "pendente" : "recebido";
        return { ...m, tipo, status, valor: Number(m.valor) || 0 };
    };

    /* ---------- Estado do filtro por período ---------- */
    const finFiltro = { alvo: "tudo", de: "", ate: "" };

    const periodoFiltrado = () => {
        if (finFiltro.alvo === "tudo") return null;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        let de = null, ate = null;
        if (finFiltro.alvo === "hoje") {
            de = hoje;
            ate = fimDoDia(hoje);
        } else if (finFiltro.alvo === "semana") {
            const dow = (hoje.getDay() + 6) % 7;
            de = new Date(hoje);
            de.setDate(de.getDate() - dow);
            ate = new Date(de);
            ate.setDate(ate.getDate() + 6);
            ate = fimDoDia(ate);
        } else if (finFiltro.alvo === "mes") {
            de = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            ate = fimDoDia(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));
        } else if (finFiltro.alvo === "ano") {
            de = new Date(hoje.getFullYear(), 0, 1);
            ate = fimDoDia(new Date(hoje.getFullYear(), 11, 31));
        } else if (finFiltro.alvo === "personalizado") {
            de = finFiltro.de ? new Date(finFiltro.de) : null;
            ate = finFiltro.ate ? fimDoDia(new Date(finFiltro.ate)) : null;
        }
        if (!de && !ate) return null;
        return { de, ate };
    };

    const dentroDoPeriodo = (data) => {
        const d = normalizarData(data);
        const r = periodoFiltrado();
        if (!r) return true;
        if (r.de && d < r.de) return false;
        if (r.ate && d > r.ate) return false;
        return true;
    };

    const filtrarMovs = () => movimentacoes.filter(m => m.data && dentroDoPeriodo(m.data));

    const rotuloFiltro = () => {
        if (finFiltro.alvo === "tudo") return "Exibindo os lançamentos de todo o período.";
        if (finFiltro.alvo === "hoje") return "Exibindo os lançamentos de hoje.";
        if (finFiltro.alvo === "semana") return "Exibindo os lançamentos desta semana.";
        if (finFiltro.alvo === "mes") return "Exibindo os lançamentos deste mês.";
        if (finFiltro.alvo === "ano") return "Exibindo os lançamentos deste ano.";
        if (finFiltro.de && finFiltro.ate) {
            return `Exibindo os lançamentos entre ${new Date(finFiltro.de).toLocaleDateString("pt-BR")} e ${new Date(finFiltro.ate).toLocaleDateString("pt-BR")}.`;
        }
        return "Exibindo os lançamentos do período personalizado.";
    };

    const marcarFiltroAtivo = (alvo) => {
        const barra = document.getElementById("finFilterBar");
        if (!barra) return;
        barra.querySelectorAll("[data-fin-periodo]").forEach(b => b.classList.toggle("active", b.dataset.finPeriodo === alvo));
        const custom = document.getElementById("finCustomRange");
        if (custom) custom.hidden = alvo !== "personalizado";
    };

    const atualizarFinanceiro = () => {
        renderResumoFin();
        renderMovimentacoes();
        atualizarGraficos();
    };

    /* ---------- Resumo financeiro (cards) ---------- */
    const renderResumoFin = () => {
        let recebido = 0, pendente = 0, despesas = 0;
        filtrarMovs().forEach(m => {
            const n = normalizarMov(m);
            if (n.tipo === "saida") despesas += n.valor;
            else if (n.status === "pendente") pendente += n.valor;
            else recebido += n.valor;
        });
        const previsto = recebido + pendente;
        const atendimentos = agenda.filter(a => a.data && a.status !== "cancelado" && dentroDoPeriodo(a.data)).length;
        const valorMedio = atendimentos ? recebido / atendimentos : 0;
        const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

        set("finTotalRecebido", brl(recebido));
        set("finTotalPendente", brl(pendente));
        set("finTotalPrevisto", brl(previsto));
        set("finAtendimentos", String(atendimentos));
        set("finValorMedio", brl(valorMedio));
        set("finDespesas", brl(despesas));
        set("finPeriodoLabel", rotuloFiltro());
    };

    /* ---------- Vinculação dos filtros ---------- */
    const finFilterBar = document.getElementById("finFilterBar");
    if (finFilterBar) finFilterBar.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-fin-periodo]");
        if (!btn) return;
        finFiltro.alvo = btn.dataset.finPeriodo;
        if (finFiltro.alvo === "personalizado") {
            document.getElementById("finDe").value = finFiltro.de || "";
            document.getElementById("finAte").value = finFiltro.ate || "";
        } else {
            finFiltro.de = "";
            finFiltro.ate = "";
        }
        marcarFiltroAtivo(finFiltro.alvo);
        atualizarFinanceiro();
    });
    const btnFinAplicar = document.getElementById("btnFinAplicar");
    if (btnFinAplicar) btnFinAplicar.addEventListener("click", () => {
        finFiltro.de = document.getElementById("finDe").value || "";
        finFiltro.ate = document.getElementById("finAte").value || "";
        if (!finFiltro.de && !finFiltro.ate) {
            finFiltro.alvo = "tudo";
            marcarFiltroAtivo("tudo");
        }
        atualizarFinanceiro();
    });

    marcarFiltroAtivo("tudo");
    renderResumoFin();

    /* ---------- Gráfico (DIA | MÊS | ANO) sobre o período filtrado ---------- */
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const gerarPeriodos = (periodo) => {
        const movs = filtrarMovs();
        const info = [];
        if (periodo === "dia") {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(hoje);
                d.setDate(d.getDate() - i);
                const rotulo = d.getDate();
                const chave = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                info.push({ rotulo, chave });
            }
        } else if (periodo === "mes") {
            const hojeMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            for (let i = 11; i >= 0; i--) {
                const d = new Date(hojeMes);
                d.setMonth(d.getMonth() - i);
                info.push({ rotulo: MESES[d.getMonth()], chave: `${d.getFullYear()}-${d.getMonth()}` });
            }
        } else {
            const anoAtual = hoje.getFullYear();
            const anos = [...new Set(movs.map(m => m.data ? normalizarData(m.data).getFullYear() : null).filter(Boolean))];
            if (!anos.length) {
                info.push({ rotulo: String(anoAtual), chave: `${anoAtual}` });
            } else {
                const min = Math.min(...anos, anoAtual);
                for (let a = min; a <= Math.max(anoAtual, ...anos); a++) {
                    info.push({ rotulo: String(a).slice(2), chave: `${a}` });
                }
            }
        }
        return info;
    };

    const rotuloPeriodo = (periodo) => {
        if (periodo === "dia") return "Movimentações de hoje";
        if (periodo === "mes") return "Movimentações do mês";
        return "Movimentações do ano";
    };

    const calcular = (periodo) => {
        const movs = filtrarMovs();
        const periodos = gerarPeriodos(periodo);
        const valores = periodos.map(p => {
            const noPeriodo = movs.filter(m => {
                if (!m.data) return false;
                const d = normalizarData(m.data);
                if (periodo === "dia") return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === p.chave;
                if (periodo === "mes") return `${d.getFullYear()}-${d.getMonth()}` === p.chave;
                return String(d.getFullYear()) === p.chave;
            });
            return {
                movimentacao: noPeriodo.length,
                ganho: noPeriodo.reduce((s, m) => {
                    const n = normalizarMov(m);
                    return n.tipo === "saida" ? s - n.valor : s + n.valor;
                }, 0)
            };
        });
        const totalMov = valores.reduce((s, v) => s + v.movimentacao, 0);
        const totalGanho = valores.reduce((s, v) => s + v.ganho, 0);
        return { periodos, valores, totalMov, totalGanho };
    };

    const renderBarras = (container, periodos, valores) => {
        limpar(container);
        const max = Math.max(6, ...valores.map(v => v.movimentacao));
        valores.forEach((v, i) => {
            const bar = document.createElement("div");
            bar.className = "cm-bar";
            const altura = v.movimentacao ? Math.max(6, Math.round((v.movimentacao / max) * 160)) : 0;
            bar.innerHTML = `
                <span class="bar-value">${v.movimentacao}</span>
                <div class="bar-fill" style="height:${altura}px" title="${periodos[i].rotulo}: ${v.movimentacao} atendimento(s)"></div>
                <span class="bar-label">${periodos[i].rotulo}</span>`;
            container.appendChild(bar);
        });
    };

const renderGrafico = (idBase, periodo) => {
        const { periodos, valores, totalMov, totalGanho } = calcular(periodo);
        const temDados = filtrarMovs().length > 0;

        set(`${idBase}MetricLabel`, rotuloPeriodo(periodo));
        const elMov = document.getElementById(`${idBase}Movimentacao`);
        if (elMov) elMov.innerHTML = `${totalMov} <span>lançamento(s)</span>`;
        const elGanho = document.getElementById(`${idBase}Ganho`);
        if (elGanho) elGanho.innerHTML = `R$ ${totalGanho.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const barsEl = document.getElementById(`${idBase}Bars`);
        const emptyEl = document.getElementById(`${idBase}Empty`);
        if (barsEl) renderBarras(barsEl, periodos, valores);
        if (emptyEl) emptyEl.hidden = temDados;
        if (barsEl) barsEl.style.display = temDados ? "" : "none";
    };

    const bindChart = (tabsId, idBase) => {
        const tabs = document.getElementById(tabsId);
        if (!tabs) return;
        tabs.addEventListener("click", (e) => {
            const tab = e.target.closest(".cm-chart-tab");
            if (!tab || !tabs.contains(tab)) return;
            tabs.querySelectorAll(".cm-chart-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            renderGrafico(idBase, tab.dataset.periodo);
        });
    };

    renderGrafico("chart", "dia");
    bindChart("chartTabs", "chart");
    renderGrafico("chartFull", "dia");
    bindChart("chartTabsFull", "chartFull");

    const periodosAtivos = { chart: "dia", chartFull: "dia" };

    const bindChartStateContent = (tabsId, idBase) => {
        const tabs = document.getElementById(tabsId);
        if (!tabs) return;
        tabs.querySelectorAll(".cm-chart-tab").forEach(t => {
            t.addEventListener("click", () => {
                periodosAtivos[idBase] = t.dataset.periodo;
            });
        });
    };
    bindChartStateContent("chartTabs", "chart");
    bindChartStateContent("chartTabsFull", "chartFull");

    const atualizarGraficos = () => {
        renderGrafico("chart", periodosAtivos.chart);
        renderGrafico("chartFull", periodosAtivos.chartFull);
    };

const atualizarResumo = () => {
        const entradas = movimentacoes.filter(m => normalizarMov(m).tipo === "entrada");
        const saidas = movimentacoes.filter(m => normalizarMov(m).tipo === "saida");
        const recebido = entradas.filter(m => normalizarMov(m).status !== "pendente").reduce((s, m) => s + (Number(m.valor) || 0), 0);
        const despesas = saidas.reduce((s, m) => s + (Number(m.valor) || 0), 0);
        const atendimentos = agenda.filter(a => a.status !== "cancelado").length;
        set("statPacientes", String(pacientes.length));
        set("statAtendimentos", String(atendimentos));
        set("statGanho", `R$ ${(recebido - despesas).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    };

    /* ==========================================
       PERFIL — EDIÇÃO SIMPLES (inline)
    ========================================== */
    const editFormProf = document.getElementById("editFormProf");
    const btnEditarPerfilProf = document.getElementById("btnEditarPerfilProf");
    const btnCancelarPerfilProf = document.getElementById("btnCancelarPerfilProf");
    const btnSalvarPerfilProf = document.getElementById("btnSalvarPerfilProf");
    const perfilProfFeedback = document.getElementById("perfilProfFeedback");

    const mapearEditProf = {
        editNome: ["nome"],
        editTelefone: ["telefone"],
        editCidade: ["cidade"],
        editValorSessao: ["valorSessao"],
        editBioProf: ["bio"]
    };

    if (btnEditarPerfilProf) btnEditarPerfilProf.addEventListener("click", () => {
        Object.entries(mapearEditProf).forEach(([inputId, [campoObj]]) => {
            const el = document.getElementById(inputId);
            if (el) el.value = perfil[campoObj] || "";
        });
        if (editFormProf) editFormProf.classList.add("open");
        if (perfilProfFeedback) perfilProfFeedback.classList.remove("show");
    });
    document.querySelectorAll("[data-abrir-edicao-prof]").forEach(btn => {
        btn.addEventListener("click", () => {
            const el = document.getElementById("editBioProf");
            if (el) el.value = perfil.bio || "";
            if (editFormProf) editFormProf.classList.add("open");
            if (perfilProfFeedback) perfilProfFeedback.classList.remove("show");
        });
    });
    if (btnCancelarPerfilProf) btnCancelarPerfilProf.addEventListener("click", () => {
        if (editFormProf) editFormProf.classList.remove("open");
    });
    if (btnSalvarPerfilProf) btnSalvarPerfilProf.addEventListener("click", () => {
        const lePrf = (inputId, alvo) => document.getElementById(inputId)?.value.trim() || perfil[alvo] || "";
        const novo = {
            ...perfil,
            nome: lePrf("editNome", "nome"),
            telefone: lePrf("editTelefone", "telefone"),
            cidade: lePrf("editCidade", "cidade"),
            bio: lePrf("editBioProf", "bio"),
            valorSessao: Number(document.getElementById("editValorSessao")?.value) || perfil.valorSessao || ""
        };
        localStorage.setItem("cm_profile_profissional", JSON.stringify(novo));

        perfil.nome = novo.nome;
        perfil.bio = novo.bio;
        perfil.valorSessao = novo.valorSessao;
        const novoNome = (novo.nome || "").trim();
        const labelNome = novoNome ? novoNome.split(" ")[0] : "Profissional";
        set("topoNomeUsuario", `Olá, ${labelNome}`);
        set("sideNome", novoNome || "Profissional");
        renderPerfilProf();

        const avatarSrc = document.getElementById("avatarIniciais");
        const avatarSide = document.getElementById("sideAvatar");
        const perfilAv = document.getElementById("perfilAvatar");
        const novoTxt = novoNome ? novoNome.split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("") : "P";
        aplicarFoto(avatarSrc);
        aplicarFoto(avatarSide);
        aplicarFoto(perfilAv);

        registrarAtividade(`Perfil atualizado (${novoNome || "profissional"}).`);
        if (editFormProf) editFormProf.classList.remove("open");
        if (perfilProfFeedback) {
            perfilProfFeedback.classList.add("show");
            setTimeout(() => perfilProfFeedback.classList.remove("show"), 2500);
        }
    });

    /* ==========================================
       EXTRATO DE MOVIMENTAÇÕES
    ========================================== */
const renderMovimentacoes = () => {
        const lista = document.getElementById("listaMovimentacoes");
        const vazio = document.getElementById("movimentacoesVazio");
        if (!lista) return;
        limpar("listaMovimentacoes");
        const visiveis = filtrarMovs();
        if (!visiveis.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        visiveis.slice().sort((a, b) => (a.data > b.data ? -1 : 1)).forEach(m => {
            const n = normalizarMov(m);
            const li = document.createElement("li");
            const data = m.data ? normalizarData(m.data) : null;
            const dataStr = data ? `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}` : "--/--/----";
            const entrada = n.tipo === "entrada";
            const sinal = entrada ? "+" : "−";
            const cor = entrada ? "var(--primary-dark)" : "#E63946";
            const statusTag = n.status === "pendente"
                ? `<small style="color:#E76F51;">Pendente</small>`
                : `<small>${dataStr}${m.horario ? ` · ${m.horario}` : ""}</small>`;
            li.innerHTML = `
                <span class="cm-avatar cm-avatar-sm" style="background:${entrada ? "var(--secondary)" : "#FDECEC"};color:${cor};">
                    <i class="${entrada ? "fa-solid fa-circle-arrow-down" : "fa-solid fa-circle-arrow-up"}" aria-hidden="true"></i>
                </span>
                <div class="cm-info">
                    <strong>${esc(m.descricao || "Atendimento")}</strong>
                    ${statusTag}
                </div>
                <strong style="color:${cor};font-size:.9rem;">${sinal} ${brl(n.valor)}</strong>`;
            lista.appendChild(li);
        });
    };
    renderMovimentacoes();

    /* ==========================================
       ADICIONAR DADOS (formulários dos painéis)
    ========================================== */
    const registrarAtividade = (texto) => {
        atividades.unshift({ texto, tempo: "agora" });
        salvarLista("cm_atividades_profissional", atividades);
        renderAtividades();
    };

const alternarForm = (formEl) => {
        formEl.classList.toggle("open");
    };

    /* --- Cancelar abertura de formulários (fecha e limpa) --- */
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-cancel-form");
        if (!btn) return;
        const form = btn.closest("form");
        if (!form) return;
        form.reset();
        form.classList.remove("open");
    });

    const mostrarFeedback = (id) => {
        const fb = document.getElementById(id);
        if (!fb) return;
        fb.classList.add("show");
        setTimeout(() => fb.classList.remove("show"), 2500);
    };

    /* --- Novo paciente --- */
    const btnNovoPaciente = document.getElementById("btnNovoPaciente");
    if (btnNovoPaciente) btnNovoPaciente.addEventListener("click", () => alternarForm(document.getElementById("addPacienteForm")));
    document.getElementById("addPacienteForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const nome = document.getElementById("addPacNome").value.trim();
        const email = document.getElementById("addPacEmail").value.trim();
        if (!nome) return;
        pacientes.push({
            nome,
            email,
            diarioAcesso: false,
            data: new Date().toISOString()
        });
        salvarLista("cm_pacientes", pacientes);
        document.getElementById("addPacienteForm").reset();
        document.getElementById("addPacienteForm").classList.remove("open");
        renderPacientes(document.getElementById("buscaPaciente")?.value);
        atualizarResumo();
        registrarAtividade(`Novo paciente adicionado: ${nome}.`);
        mostrarFeedback("pacAddFeedback");
    });

    /* --- Novo atendimento (agenda) --- */
    const btnNovoAtendimento = document.getElementById("btnNovoAtendimento");
    if (btnNovoAtendimento) btnNovoAtendimento.addEventListener("click", () => alternarForm(document.getElementById("addAtendimentoForm")));
document.getElementById("addAtendimentoForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const paciente = document.getElementById("addAtendPaciente").value.trim();
        const tipo = document.getElementById("addAtendTipo").value.trim() || "";
        const data = document.getElementById("addAtendData").value;
        const horario = document.getElementById("addAtendHora").value;
        const status = document.getElementById("addAtendStatus").value || "realizado";
        if (!paciente || !data || !horario) return;
        agenda.push({
            paciente,
            tipo,
            data,
            horario,
            status,
            modalidade: perfil.modalidade || ""
        });
        salvarLista("cm_agenda_profissional", agenda);
        document.getElementById("addAtendimentoForm").reset();
        document.getElementById("addAtendimentoForm").classList.remove("open");
        renderAgenda();
        atualizarFinanceiro();
        atualizarResumo();
        registrarAtividade(`Atendimento registrado: ${paciente} (${new Date(data + "T" + (horario || "00:00")).toLocaleDateString("pt-BR")}).`);
        mostrarFeedback("atendFeedback");
    });

    /* --- Nova movimentação (financeiro) --- */
    const btnNovaMovimentacao = document.getElementById("btnNovaMovimentacao");
    if (btnNovaMovimentacao) btnNovaMovimentacao.addEventListener("click", () => alternarForm(document.getElementById("addMovimentacaoForm")));
    document.getElementById("addMovimentacaoForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const descricao = document.getElementById("addMovDescricao").value.trim();
        const tipo = document.getElementById("addMovTipo").value || "entrada";
        const status = document.getElementById("addMovStatus").value || "recebido";
        const valor = Number(document.getElementById("addMovValor").value) || 0;
        const data = document.getElementById("addMovData").value;
        if (!descricao || !valor || !data) return;
        movimentacoes.push({
            descricao,
            tipo,
            status,
            valor,
            data,
            horario: ""
        });
        salvarLista("cm_movimentacoes", movimentacoes);
        document.getElementById("addMovimentacaoForm").reset();
        document.getElementById("addMovimentacaoForm").classList.remove("open");
        atualizarFinanceiro();
        atualizarResumo();
        registrarAtividade(`Movimentação registrada: ${descricao} (${tipo === "saida" ? "saída" : "entrada"}).`);
        mostrarFeedback("movFeedback");
    });

/* ==========================================
       RESUMO RÁPIDO
    ========================================== */
    atualizarResumo();

    /* ==========================================
       CONFIGURAÇÕES
       Mesma tela de Configurações já existente no ambiente do
       usuário, agora disponível também para o profissional.
       Usa a mesma chave de preferências (cm_config) e o mesmo
       perfil do profissional (cm_profile_profissional).
    ========================================== */
    const getConfigObj = () => JSON.parse(localStorage.getItem("cm_config") || "{}");

    const cfgDefaults = {
        compartilharDiario: true,
        notificacoes: true,
        profissionaisVeemProgresso: false,
        quemInterage: "todos",
        notifMensagens: true,
        notifComunidade: true,
        notifInteracoes: true,
        lembretesDiario: true,
        permitirInteracoes: true,
        mostrarSugestoes: true,
        visibilidadePerfil: "publico",
        tema: "claro",
        tamanhoTexto: "normal"
    };

    const aplicarAparencia = (cfg) => {
        const escala = { pequeno: "15px", normal: "16px", grande: "18px" };
        document.documentElement.style.fontSize = escala[cfg.tamanhoTexto] || "16px";
    };

    const salvarConfiguracao = (parcial) => {
        const nova = Object.assign({}, getConfigObj(), parcial);
        localStorage.setItem("cm_config", JSON.stringify(nova));
        aplicarAparencia(nova);
        return nova;
    };

    const carregarConfiguracao = () => {
        const padrao = Object.assign({}, cfgDefaults, getConfigObj());
        document.querySelectorAll("[data-cfg]").forEach(el => {
            const chave = el.dataset.cfg;
            const valor = padrao[chave];
            if (valor === undefined) return;
            if (el.type === "checkbox") el.checked = Boolean(valor);
            else el.value = valor;
        });
        return padrao;
    };

    carregarConfiguracao();
    aplicarAparencia(getConfigObj());

    document.querySelectorAll("[data-cfg]").forEach(el => {
        el.addEventListener("change", () => {
            salvarConfiguracao({ [el.dataset.cfg]: el.type === "checkbox" ? el.checked : el.value });
        });
    });

    /* ---------- Conta: nome e e-mail ---------- */
    const atualizarNomeExibido = (novoNome) => {
        const n = (novoNome || "").trim();
        set("topoNomeUsuario", `Olá, ${n ? n.split(" ")[0] : "Profissional"}`);
        set("sideNome", n || "Profissional");
        renderPerfilProf();
        aplicarFoto(document.getElementById("avatarIniciais"));
        aplicarFoto(document.getElementById("sideAvatar"));
        aplicarFoto(document.getElementById("perfilAvatar"));
    };

    const btnCfgNome = document.getElementById("btnCfgNome");
    if (btnCfgNome) btnCfgNome.addEventListener("click", () => {
        const v = document.getElementById("cfgNovoNome")?.value.trim();
        if (!v) { notificar("Digite um novo nome."); return; }
        perfil.nome = v;
        perfil.email = perfil.email || sessao;
        localStorage.setItem("cm_profile_profissional", JSON.stringify(perfil));
        atualizarNomeExibido(v);
        registrarAtividade("Nome atualizado.");
        notificar("Nome atualizado com sucesso.");
        document.getElementById("cfgNovoNome").value = "";
    });

    const btnCfgEmail = document.getElementById("btnCfgEmail");
    if (btnCfgEmail) btnCfgEmail.addEventListener("click", () => {
        const v = document.getElementById("cfgNovoEmail")?.value.trim();
        if (!v || !v.includes("@")) { notificar("Digite um e-mail válido."); return; }
        const emailAntigo = sessao;
        perfil.email = v;
        localStorage.setItem("cm_profile_profissional", JSON.stringify(perfil));
        if (localStorage.getItem("cm_session") === sessao) localStorage.setItem("cm_session", v);
        renderPerfilProf();
        registrarAtividade(`E-mail atualizado (${emailAntigo} → ${v}).`);
        notificar("E-mail atualizado. Use-o no próximo login.");
        document.getElementById("cfgNovoEmail").value = "";
    });

    /* ---------- Conta: senha ---------- */
    const cfgSenhaAtual = document.getElementById("cfgSenhaAtual");
    const cfgSenhaNova = document.getElementById("cfgSenhaNova");
    const cfgSenhaConf = document.getElementById("cfgSenhaConf");
    const btnCfgSenha = document.getElementById("btnCfgSenha");

    if (btnCfgSenha) btnCfgSenha.addEventListener("click", () => {
        const atual = cfgSenhaAtual ? cfgSenhaAtual.value : "";
        const nova = cfgSenhaNova ? cfgSenhaNova.value : "";
        const conf = cfgSenhaConf ? cfgSenhaConf.value : "";
        if (nova.length < 6) { notificar("A nova senha precisa ter no mínimo 6 caracteres."); return; }
        if (nova !== conf) { notificar("A confirmação não confere com a nova senha."); return; }
        if (perfil.senha && atual !== perfil.senha) { notificar("A senha atual está incorreta."); return; }
        perfil.email = perfil.email || sessao;
        perfil.senha = nova;
        localStorage.setItem("cm_profile_profissional", JSON.stringify(perfil));
        registrarAtividade("Senha alterada.");
        notificar("Senha alterada com sucesso.");
        if (cfgSenhaAtual) cfgSenhaAtual.value = "";
        if (cfgSenhaNova) cfgSenhaNova.value = "";
        if (cfgSenhaConf) cfgSenhaConf.value = "";
    });

    /* ---------- Sessão: sair da conta ---------- */
    const btnCfgSair = document.getElementById("btnCfgSair");
    if (btnCfgSair) btnCfgSair.addEventListener("click", () => {
        localStorage.removeItem("cm_session");
        localStorage.removeItem("cm_tipo");
        window.location.href = "login-profissional.html";
    });

    /* ---------- Dados: exportar e excluir ---------- */
    const btnCfgExportar = document.getElementById("btnCfgExportar");
    if (btnCfgExportar) btnCfgExportar.addEventListener("click", () => {
        const dados = {
            exportadoEm: new Date().toISOString(),
            perfil,
            config: getConfigObj(),
            pacientes,
            agenda,
            atividades,
            movimentacoes
        };
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "clear-minds-dados-profissional.json";
        a.click();
        URL.revokeObjectURL(a.href);
        notificar("Dados exportados.");
    });

    const btnCfgExcluir = document.getElementById("btnCfgExcluir");
    if (btnCfgExcluir) btnCfgExcluir.addEventListener("click", () => {
        if (!window.confirm("Finalizar e apagar os seus dados do Clear Minds neste dispositivo? Essa ação não pode ser desfeita.")) return;
        localStorage.removeItem("cm_profile_profissional");
        localStorage.removeItem("cm_pacientes");
        localStorage.removeItem("cm_agenda_profissional");
        localStorage.removeItem("cm_atividades_profissional");
        localStorage.removeItem("cm_movimentacoes");
        localStorage.removeItem("cm_conteudos_profissional");
        localStorage.removeItem("cm_session");
        localStorage.removeItem("cm_tipo");
        window.location.href = "login-profissional.html";
    });

    /* ---------- Atalho para o perfil ---------- */
    const btnCfgIrPerfil = document.getElementById("btnCfgIrPerfil");
    if (btnCfgIrPerfil) btnCfgIrPerfil.addEventListener("click", () => {
        const b = document.querySelector('.cm-side-item[data-secao="perfil"]');
        if (b) b.click();
    });

    /* ==========================================
       LOGOUT
    ========================================== */
    const btnSair = document.getElementById("btnSair");
    if (btnSair) btnSair.addEventListener("click", () => {
        localStorage.removeItem("cm_session");
        localStorage.removeItem("cm_tipo");
        window.location.href = "login-profissional.html";
    });
    const btnSairMenu = document.getElementById("btnSairMenu");
    if (btnSairMenu) btnSairMenu.addEventListener("click", () => {
        localStorage.removeItem("cm_session");
        localStorage.removeItem("cm_tipo");
        window.location.href = "login-profissional.html";
    });


});
