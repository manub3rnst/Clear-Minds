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
    const nomeProfissional = primeiroNome || "profissional";
    document.getElementById("saudacao").textContent = `${periodo}, ${nomeProfissional}!`;
    document.getElementById("proHomeNome").textContent = nome || "Profissional";
    document.getElementById("proHomeProfissao").textContent = profissao;
    /* A Home segue a estrutura da Home do paciente (sem barra superior);
       os campos do topo só são preenchidos se existirem. */
    const topoNome = document.getElementById("topoNomeUsuario");
    const topoArea = document.getElementById("topoAreaUsuario");
    if (topoNome) topoNome.textContent = `Olá, ${nomeProfissional}`;
    if (topoArea) topoArea.textContent = profissao;
    const descricaoLateral = document.querySelector(".cm-side-user-info small");
    if (descricaoLateral) descricaoLateral.textContent = profissao;

/* ---------- DADOS (estruturas prontas, sem dados fictícios) ---------- */
    let pacientes = JSON.parse(localStorage.getItem("cm_pacientes") || "[]");
    let agenda = JSON.parse(localStorage.getItem("cm_agenda_profissional") || "[]");
    let atividades = JSON.parse(localStorage.getItem("cm_atividades_profissional") || "[]");
    const conteudos = JSON.parse(localStorage.getItem("cm_conteudos_profissional") || "[]");
    let movimentacoes = JSON.parse(localStorage.getItem("cm_movimentacoes") || "[]");
    let profissionaisSeguidos = JSON.parse(localStorage.getItem("cm_profissionais_seguidos") || "[]");

    const getLista = (chave) => JSON.parse(localStorage.getItem(chave) || "[]");
    const salvarLista = (chave, lista) => localStorage.setItem(chave, JSON.stringify(lista));

    // Registros fictícios para apresentação; nunca misturados a contas reais.
    if (!localStorage.getItem("cm_demo_profissional_seed")) {
        if (!pacientes.length) pacientes.push({nome:"Ana Demonstração",email:"ana.demo@clearminds.exemplo",ficticio:true,ultimaSessao:"22/10/2026"},{nome:"Caio Exemplo",email:"caio.demo@clearminds.exemplo",ficticio:true,ultimaSessao:"20/10/2026"},{nome:"Luna Fictícia",email:"luna.demo@clearminds.exemplo",ficticio:true,ultimaSessao:"17/10/2026"});
        if (!agenda.length) agenda.push({data:new Date(Date.now()+86400000).toISOString().slice(0,10),horario:"10:00",paciente:"Ana Demonstração",pacienteEmail:"ana.demo@clearminds.exemplo",tipo:"Consulta de acompanhamento",modalidade:"Online",nota:"Conversar sobre rotina e organização. Exemplo fictício.",status:"agendado",ficticio:true},{data:new Date(Date.now()+172800000).toISOString().slice(0,10),horario:"14:30",paciente:"Caio Exemplo",pacienteEmail:"caio.demo@clearminds.exemplo",tipo:"Atendimento",modalidade:"Presencial",nota:"Retorno de acompanhamento. Exemplo fictício.",status:"agendado",ficticio:true});
        if (!movimentacoes.length) movimentacoes.push({id:"demo-mov-1",descricao:"Atendimento · demonstração",tipo:"entrada",valor:180,data:new Date().toISOString().slice(0,10),status:"recebido",ficticio:true},{id:"demo-mov-2",descricao:"Plataforma · demonstração",tipo:"saida",valor:35,data:new Date().toISOString().slice(0,10),status:"recebido",ficticio:true});
        if (!atividades.length) atividades.push({id:"demo-notificacao",tipo:"resposta_diario",profissionalEmail:sessao,texto:"Ana Demonstração respondeu à solicitação de acesso ao diário. · Dado fictício de demonstração",data:new Date().toISOString()});
        salvarLista("cm_pacientes",pacientes); salvarLista("cm_agenda_profissional",agenda); salvarLista("cm_movimentacoes",movimentacoes); salvarLista("cm_atividades_profissional",atividades);
        localStorage.setItem("cm_demo_profissional_seed","1");
    }


    /* Modal de confirmação reutilizável (mesmo padrão da Home do estudante) */
    const abrirConfirmacao = ({ titulo = "Confirmar", mensagem = "", rotuloConfirmar = "Confirmar", perigoso = false, aoConfirmar }) => {
        let overlay = document.getElementById("cmConfirmOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "cmConfirmOverlay";
            overlay.className = "cm-modal-overlay";
            overlay.innerHTML = `
                <div class="cm-modal" role="dialog" aria-modal="true">
                    <div class="cm-modal-icon"><i class="fa-solid fa-circle-question"></i></div>
                    <h3 data-cm-titulo></h3>
                    <p data-cm-msg></p>
                    <div class="cm-modal-buttons">
                        <button type="button" class="cm-btn cm-btn-soft" data-cm-cancelar>Cancelar</button>
                        <button type="button" class="cm-btn cm-btn-primary" data-cm-ok>Confirmar</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector("[data-cm-cancelar]").addEventListener("click", () => overlay.classList.remove("show"));
            overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("show"); });
        }
        const okBtn = overlay.querySelector("[data-cm-ok]");
        okBtn.textContent = rotuloConfirmar;
        okBtn.classList.toggle("cm-btn-danger", !!perigoso);
        okBtn.classList.toggle("cm-btn-primary", !perigoso);
        overlay.querySelector("[data-cm-titulo]").textContent = titulo;
        overlay.querySelector("[data-cm-msg]").textContent = mensagem;
        okBtn.onclick = () => { overlay.classList.remove("show"); if (aoConfirmar) aoConfirmar(); };
        overlay.classList.add("show");
    };

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
        const nomeAtual = (perfil.nome || "").trim();
        const profissaoAtual = perfil.profissao || "Profissional de saúde";
        set("perfilNome", nomeAtual || "Profissional");
        set("perfilMeta", `${profissaoAtual}${perfil.registroProfissional ? ` • ${perfil.registroProfissional}${perfil.ufCrp ? ` (${perfil.ufCrp})` : ""}` : ""}`);
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
        ["listaInfoProfissional", "listaAtendimento"].forEach(id => {
            const grid = document.getElementById(id);
            if (grid) grid.closest(".cm-panel").hidden = grid.children.length === 0;
        });
    };

/* ---------- Foto / avatar ---------- */
    const aplicarFoto = (el) => {
        if (!el) return;
        const texto = (perfil.nome || "").trim();
        const ini = texto ? texto.split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("") : "P";
        el.innerHTML = perfil.foto
            ? `<img src="${perfil.foto}" alt="">${el.id === "perfilAvatar" ? '<span class="cm-profile-photo-hint"><i class="fa-solid fa-camera" aria-hidden="true"></i></span>' : ""}`
            : `${ini}${el.id === "perfilAvatar" ? '<span class="cm-profile-photo-hint"><i class="fa-solid fa-camera" aria-hidden="true"></i></span>' : ""}`;
    };
    const atualizarFotosPerfil = () => {
        aplicarFoto(document.getElementById("avatarIniciais"));
        aplicarFoto(document.getElementById("perfilAvatar"));
        aplicarFoto(document.getElementById("sideAvatar"));
        aplicarFoto(document.getElementById("proHomeAvatar"));
    };
    atualizarFotosPerfil();
    renderPerfilProf();

    const perfisProfissionaisDemo = [
        { email: "marina.alves@demo.clearminds.local", nome: "Marina Alves", detalhe: "Psicóloga · Perfil demonstrativo" },
        { email: "rafael.costa@demo.clearminds.local", nome: "Rafael Costa", detalhe: "Psicólogo clínico · Perfil demonstrativo" },
        { email: "juliana.rocha@demo.clearminds.local", nome: "Juliana Rocha", detalhe: "Terapeuta · Perfil demonstrativo" }
    ];
    const renderSugestoesProfissionais = () => {
        const lista = document.getElementById("listaSugestoesProfissionais");
        const vazio = document.getElementById("sugestoesProfissionaisVazio");
        if (!lista) return;
        lista.replaceChildren();

        perfisProfissionaisDemo.forEach(pessoa => {
            const seguindo = profissionaisSeguidos.some(p => p.email === pessoa.email);
            const item = document.createElement("li");
            const iniciais = pessoa.nome.split(/\s+/).slice(0, 2).map(parte => parte[0].toUpperCase()).join("");
            item.innerHTML = `
                <span class="cm-avatar cm-avatar-sm" aria-hidden="true">${esc(iniciais)}</span>
                <div class="cm-info">
                    <strong>${esc(pessoa.nome)}</strong>
                    <small>${esc(pessoa.detalhe)}</small>
                </div>
                <button type="button" class="cm-follow-btn${seguindo ? " following" : ""}" aria-pressed="${seguindo}">
                    ${seguindo ? "Seguindo" : "Seguir"}
                    <i class="fa-solid fa-user-${seguindo ? "check" : "plus"}" aria-hidden="true"></i>
                </button>`;

            item.querySelector(".cm-follow-btn").addEventListener("click", () => {
                const indice = profissionaisSeguidos.findIndex(p => p.email === pessoa.email);
                if (indice === -1) {
                    profissionaisSeguidos.push({ email: pessoa.email, nome: pessoa.nome, data: new Date().toISOString() });
                } else {
                    profissionaisSeguidos.splice(indice, 1);
                }
                try {
                    localStorage.setItem("cm_profissionais_seguidos", JSON.stringify(profissionaisSeguidos));
                } catch (erro) {
                    console.error("Não foi possível atualizar os profissionais seguidos.", erro);
                    notificar("Não foi possível atualizar a lista de perfis seguidos.");
                    return;
                }
                renderSugestoesProfissionais();
            });
            lista.appendChild(item);
        });
        if (vazio) vazio.hidden = perfisProfissionaisDemo.length > 0;
    };
    renderSugestoesProfissionais();

    const fotoPerfilProf = document.getElementById("fotoPerfilProf");
    const perfilAvatar = document.getElementById("perfilAvatar");
    if (fotoPerfilProf && perfilAvatar) {
        perfilAvatar.addEventListener("click", () => {
            fotoPerfilProf.value = "";
            fotoPerfilProf.click();
        });
        fotoPerfilProf.addEventListener("change", () => {
            const arquivo = fotoPerfilProf.files && fotoPerfilProf.files[0];
            if (!arquivo) return;
            if (!arquivo.type.startsWith("image/")) {
                notificar("Selecione um arquivo de imagem.");
                return;
            }
            if (arquivo.size > 3 * 1024 * 1024) {
                notificar("A imagem deve ter no máximo 3 MB.");
                return;
            }

            const leitor = new FileReader();
            leitor.onload = () => {
                if (typeof leitor.result !== "string") {
                    notificar("Não foi possível carregar a imagem selecionada.");
                    return;
                }
                const perfilAtualizado = { ...perfil, foto: leitor.result };
                try {
                    localStorage.setItem("cm_profile_profissional", JSON.stringify(perfilAtualizado));
                    Object.assign(perfil, perfilAtualizado);
                    atualizarFotosPerfil();
                    notificar("Foto de perfil atualizada.");
                } catch (erro) {
                    console.error("Não foi possível salvar a foto de perfil.", erro);
                    notificar("Não foi possível salvar a foto. Tente uma imagem menor.");
                }
            };
            leitor.onerror = () => notificar("Não foi possível ler a imagem selecionada.");
            leitor.readAsDataURL(arquivo);
        });
    }

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
    const botoesMenu = document.querySelectorAll(
        ".cm-side-item[data-secao], .cm-side-avatar-button[data-secao]"
    );

    const alternarSecao = (alvo) => {
        botoesMenu.forEach(b => {
            if (b.classList.contains("cm-side-item")) {
                b.classList.toggle("active", b.dataset.secao === alvo);
            }
        });
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
        btn.addEventListener("click", () => {
            alternarSecao(btn.dataset.secao);
            if (btn.dataset.secao === "mensagens") marcarNotificacoesLidas();
        });
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
            if (alvo === "mensagens") marcarNotificacoesLidas();
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

        alvo.id = alvo.id || `pac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        alvo.diarioAcesso = "solicitado";
        salvarLista("cm_pacientes", pacientes);

        // Registra a solicitação (estrutura preparada)
        const solicitacoes = getLista("cm_solicitacoes_diario");
        solicitacoes.push({
            profissionalEmail: sessao,
            profissionalNome: nome || "Profissional",
            pacienteId: alvo.id,
            pacienteEmail: alvo.email || "",
            pacienteNome: alvo.nome || "Paciente",
            data: new Date().toISOString(),
            status: "pendente"
        });
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


    const abrirPerfilAutorComunidade = post => {
        const email = post.autorEmail || "";
        const perfilPublico = JSON.parse(localStorage.getItem("cm_public_profiles") || "{}")[email] || {};
        const cadastro = pacientes.find(p => p.email === email) || {};
        const nomeAutor = post.autor || perfilPublico.nome || cadastro.nome || "Paciente";
        let overlay = document.getElementById("cmCommunityPatientOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "cmCommunityPatientOverlay";
            overlay.className = "cm-modal-overlay";
            document.body.appendChild(overlay);
        }
        const avatar = post.autorFoto || perfilPublico.foto;
        const detalhes = [
            ["Sobre", perfilPublico.sobre],
            ["Cidade", perfilPublico.cidade || cadastro.cidade],
            ["Estado", perfilPublico.estado || cadastro.estado]
        ].filter(item => item[1]);
        overlay.innerHTML = `<div class="cm-modal cm-flow-modal cm-community-profile-modal" role="dialog" aria-modal="true" aria-labelledby="cmCommunityPatientName"><button class="cm-flow-close" type="button" aria-label="Fechar">×</button><div class="cm-community-profile-hero"><span class="cm-avatar cm-avatar-lg">${avatar ? `<img src="${esc(avatar)}" alt="">` : esc(nomeAutor.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())}</span><h3 id="cmCommunityPatientName">${esc(nomeAutor)}</h3>${post.autorEmail?.includes(".exemplo") ? '<span class="pro-community-demo">Perfil fictício de demonstração</span>' : ""}</div><ul class="cm-prof-profile-details">${detalhes.length ? detalhes.map(([rotulo, valor]) => `<li><b>${esc(rotulo)}:</b> ${esc(valor)}</li>`).join("") : "<li>Este paciente ainda não adicionou informações públicas ao perfil.</li>"}</ul><div class="cm-add-form-actions"><button class="cm-btn cm-btn-primary cm-btn-sm" type="button" data-community-message><i class="fa-regular fa-message" aria-hidden="true"></i> Conversar</button><button class="cm-btn cm-btn-soft cm-btn-sm" type="button" data-community-profile-close>Fechar</button></div></div>`;
        overlay.classList.add("show");
        const fechar = () => overlay.classList.remove("show");
        overlay.onclick = event => { if (event.target === overlay || event.target.closest(".cm-flow-close,[data-community-profile-close]")) fechar(); };
        overlay.querySelector("[data-community-message]").onclick = () => { fechar(); abrirConversaProf({email, nome:nomeAutor}); };
    };

    const renderComunidadeProfissional = () => {
        const feed = document.getElementById("proCommunityFeed"), vazio = document.getElementById("proCommunityEmpty");
        if (!feed) return;
        const posts = JSON.parse(localStorage.getItem("cm_postagens") || "[]")
            .filter(post => post && post.autor && post.privacidade !== "somente-eu")
            .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
        feed.replaceChildren();
        if (vazio) vazio.hidden = posts.length > 0;

        posts.forEach(post => {
            const article = document.createElement("article");
            article.className = "cm-post pro-community-post";
            const header = document.createElement("div");
            header.className = "cm-post-head";
            const author = document.createElement("button");
            author.type = "button";
            author.className = "pro-community-author";
            author.setAttribute("aria-label", `Ver perfil de ${post.autor}`);
            const avatar = document.createElement("span");
            avatar.className = "cm-avatar cm-avatar-sm";
            const publicProfile = JSON.parse(localStorage.getItem("cm_public_profiles") || "{}")[post.autorEmail] || {};
            const foto = post.autorFoto || publicProfile.foto;
            avatar.innerHTML = foto ? `<img src="${esc(foto)}" alt="">` : esc((post.autor || "?").split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase());
            const authorInfo = document.createElement("span");
            authorInfo.className = "cm-author";
            authorInfo.innerHTML = `<strong>${esc(post.autor)}${post.autorEmail?.includes(".exemplo") ? ' <span class="cm-demo-label">Demonstração · fictício</span>' : ""}</strong><small>${post.data ? formatarData(post.data) : "Publicação da comunidade"}${post.humor ? ` · ${esc(post.humor)}` : ""}</small>`;
            author.append(avatar, authorInfo);
            author.addEventListener("click", () => abrirPerfilAutorComunidade(post));
            header.appendChild(author);

            const body = document.createElement("div");
            body.className = "cm-post-body";
            if (post.texto) {
                const text = document.createElement("p");
                text.className = "cm-post-text";
                text.textContent = post.texto;
                body.appendChild(text);
            }
            if (post.midia?.url) {
                const media = document.createElement("div");
                media.className = "cm-post-midia";
                if (post.midia.tipo === "imagem") {
                    const image = document.createElement("img"); image.src = post.midia.url; image.alt = "Imagem da publicação"; media.appendChild(image);
                } else if (post.midia.tipo === "video") {
                    const video = document.createElement("video"); video.src = post.midia.url; video.controls = true; video.preload = "metadata"; media.appendChild(video);
                } else {
                    const file = document.createElement("span"); file.className = "cm-file-chip"; file.textContent = post.midia.nome || "Arquivo anexado"; media.appendChild(file);
                }
                body.appendChild(media);
            }
            if (post.enquete?.opcoes?.length) {
                const poll = document.createElement("div"); poll.className = "cm-poll cm-community-poll";
                const question = document.createElement("strong"); question.className = "cm-poll-question"; question.textContent = post.enquete.pergunta || "Enquete"; poll.appendChild(question);
                const votes = Object.values(post.enquete.votos || {}), total = votes.length;
                post.enquete.opcoes.forEach(option => {
                    const count = votes.filter(vote => vote === option.id).length;
                    const row = document.createElement("div"); row.className = "cm-community-poll-row";
                    const label = document.createElement("span"); label.textContent = option.texto;
                    const countLabel = document.createElement("small"); countLabel.textContent = `${total ? Math.round(count / total * 100) : 0}% · ${count}`;
                    row.append(label, countLabel); poll.appendChild(row);
                });
                body.appendChild(poll);
            }
            article.append(header, body);

            const footer = document.createElement("div"); footer.className = "cm-post-actions pro-community-actions";
            const stats = document.createElement("span"); stats.className = "pro-community-stats";
            stats.innerHTML = `<span><i class="fa-regular fa-heart" aria-hidden="true"></i> ${Number(post.curtidasCount) || 0}</span><span><i class="fa-regular fa-comment" aria-hidden="true"></i> ${(post.comentarios || []).length}</span>`;
            const viewProfile = document.createElement("button"); viewProfile.type = "button"; viewProfile.className = "cm-post-btn"; viewProfile.innerHTML = '<i class="fa-regular fa-user" aria-hidden="true"></i> Ver perfil';
            viewProfile.addEventListener("click", () => abrirPerfilAutorComunidade(post));
            const message = document.createElement("button"); message.type = "button"; message.className = "cm-post-btn"; message.innerHTML = '<i class="fa-regular fa-message" aria-hidden="true"></i> Conversar';
            message.addEventListener("click", () => abrirConversaProf({email:post.autorEmail || "", nome:post.autor || "Paciente"}));
            footer.append(stats, viewProfile, message); article.appendChild(footer);

            const comments = post.comentarios || [];
            if (comments.length) {
                const commentList = document.createElement("div"); commentList.className = "pro-community-comments";
                comments.forEach(comment => {
                    const item = document.createElement("p");
                    const commentAuthor = document.createElement("strong"); commentAuthor.textContent = `${comment.autor || "Pessoa da comunidade"}: `;
                    item.append(commentAuthor, document.createTextNode(comment.texto || "")); commentList.appendChild(item);
                });
                article.appendChild(commentList);
            }
            feed.appendChild(article);
        });
    };
    renderComunidadeProfissional(); window.addEventListener("storage",e=>{if(e.key==="cm_postagens")renderComunidadeProfissional();});

    /* ==========================================
       AGENDA
    ========================================== */
    let contatoChatProfAtivo=null;
    const contatosProfissionais=()=>{const ms=getLista("cm_mensagens").filter(m=>m.fromEmail===sessao||m.toEmail===sessao),map=new Map();ms.forEach(m=>{const from=m.fromEmail===sessao,email=from?m.toEmail:m.fromEmail,name=from?m.toNome:m.fromNome;if(email)map.set(email,{email,nome:name||"Contato",data:m.data,texto:m.texto,ficticio:m.ficticio});});return [...map.values()].sort((a,b)=>new Date(b.data||0)-new Date(a.data||0));};
    const renderHistoricoProf=()=>{const h=document.getElementById("professionalChatHistory");if(!h)return;h.replaceChildren();if(!contatoChatProfAtivo){h.innerHTML='<p class="cm-chat-placeholder">Escolha uma conversa para ver as mensagens.</p>';return;}const ms=getLista("cm_mensagens").filter(m=>(m.fromEmail===sessao&&m.toEmail===contatoChatProfAtivo.email)||(m.fromEmail===contatoChatProfAtivo.email&&m.toEmail===sessao)).sort((a,b)=>new Date(a.data)-new Date(b.data));if(!ms.length){h.innerHTML='<p class="cm-chat-placeholder">Esta conversa ainda não tem mensagens.</p>';return;}ms.forEach(m=>{const b=document.createElement("article");b.className="cm-chat-bubble "+(m.fromEmail===sessao?"is-outgoing":"is-incoming");b.innerHTML=`<p>${esc(m.texto)}</p><small>${m.ficticio?'<span class="cm-chat-demo">Demonstração</span> ':""}${new Date(m.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</small>`;h.appendChild(b);});h.scrollTop=h.scrollHeight;};
    const selecionarConversaProf=(c,draft)=>{contatoChatProfAtivo=c;const n=document.getElementById("professionalChatName"),st=document.getElementById("professionalChatStatus"),av=document.getElementById("professionalChatAvatar"),input=document.getElementById("professionalChatDraft");if(n)n.textContent=c.nome||"Contato";if(st)st.textContent=c.ficticio?"Demonstração fictícia":"Conversa privada";if(av)av.textContent=(c.nome||"CM").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();if(input){if(draft!==undefined)input.value=draft;document.getElementById("professionalChatSend").disabled=!input.value.trim();}const patient=pacientes.find(x=>x.email===c.email||x.nome===c.nome);const dn=document.getElementById("professionalChatDetailName"),dr=document.getElementById("professionalChatDetailRole"),dl=document.getElementById("professionalChatDetailLocation"),da=document.getElementById("professionalChatDetailAvatar");if(dn)dn.textContent=c.nome||"Contato";if(dr)dr.textContent=patient?(patient.ficticio?"Paciente · demonstração":"Paciente"):"Profissional";if(dl)dl.textContent=patient?[patient.cidade,patient.estado].filter(Boolean).join(", ")||patient.email:c.email||"Contato";if(da)da.textContent=(c.nome||"CM").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();const thread=getLista("cm_mensagens").filter(m=>(m.fromEmail===sessao&&m.toEmail===c.email)||(m.fromEmail===c.email&&m.toEmail===sessao));const imgs=thread.filter(m=>m.midia?.tipo==="imagem").length,docs=thread.filter(m=>m.midia&&m.midia.tipo!=="imagem").length;["professionalChatImageCount","professionalChatPhotoCount"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=String(imgs);});const dc=document.getElementById("professionalChatDocCount");if(dc)dc.textContent=String(docs);document.querySelectorAll("#professionalMessageList .cm-chat-contact").forEach(b=>b.classList.toggle("active",b.dataset.email===c.email));renderHistoricoProf();};
    const renderMensagensProf=()=>{const ul=document.getElementById("professionalMessageList"),empty=document.getElementById("professionalMessagesEmpty");if(!ul)return;const q=(document.getElementById("professionalChatSearch")?.value||"").trim().toLowerCase();const contacts=contatosProfissionais().filter(c=>!q||(c.nome||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q));ul.replaceChildren();if(empty)empty.hidden=contacts.length>0;contacts.forEach(c=>{const li=document.createElement("li"),b=document.createElement("button");b.type="button";b.className="cm-chat-contact"+(contatoChatProfAtivo?.email===c.email?" active":"");b.dataset.email=c.email;b.innerHTML=`<span class="cm-avatar cm-avatar-sm">${esc((c.nome||"C").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())}</span><span class="cm-chat-contact-copy"><strong>${esc(c.nome)}${c.ficticio?'<small class="cm-chat-demo">Demonstração</small>':""}</strong><small>${esc(c.texto||c.email)}</small></span>`;b.onclick=()=>selecionarConversaProf(c,"");li.appendChild(b);ul.appendChild(li);});if(!contatoChatProfAtivo||!contacts.some(c=>c.email===contatoChatProfAtivo.email))contatoChatProfAtivo=contacts[0]||null;if(contatoChatProfAtivo)selecionarConversaProf(contatoChatProfAtivo);else renderHistoricoProf();};
    const abrirConversaProf=(contato,draft="")=>{alternarSecao("mensagens");const c=contatosProfissionais().find(x=>x.email===contato.email)||contato;selecionarConversaProf(c,draft);document.getElementById("professionalChatDraft")?.focus();};
    if(!localStorage.getItem(`cm_demo_prof_messages_${sessao}`)){const ms=getLista("cm_mensagens");ms.push({id:`demo-prof-${sessao}-1`,fromEmail:"ana.demo@clearminds.exemplo",toEmail:sessao,fromNome:"Ana Demonstração",toNome:nome||"Profissional",texto:"Olá! Gostaria de confirmar o horário do próximo atendimento. Mensagem fictícia.",data:new Date(Date.now()-3600000).toISOString(),ficticio:true},{id:`demo-prof-${sessao}-2`,fromEmail:"bia@clearminds.exemplo",toEmail:sessao,fromNome:"Dra. Bia Exemplo",toNome:nome||"Profissional",texto:"Compartilhei uma referência para a reunião. Mensagem fictícia.",data:new Date(Date.now()-7200000).toISOString(),ficticio:true});salvarLista("cm_mensagens",ms);localStorage.setItem(`cm_demo_prof_messages_${sessao}`,"1");}
    document.querySelector("#sec-mensagens > .cm-section-head")?.remove();const inboxPanel=document.querySelector("#sec-mensagens .pro-inbox-panel");if(inboxPanel)document.querySelector("#sec-mensagens .cm-chat-contacts")?.appendChild(inboxPanel);const chatTitle=document.querySelector("#sec-mensagens .home-messages-panel .cm-panel-title");if(chatTitle)chatTitle.textContent="Chat";document.getElementById("professionalChatUserName").textContent=nome||"Profissional";document.getElementById("professionalChatUserRole").textContent=profissao;document.getElementById("professionalChatUserAvatar").textContent=(nome||"P").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();renderMensagensProf();document.getElementById("professionalChatSearch")?.addEventListener("input",renderMensagensProf);document.getElementById("professionalChatDraft")?.addEventListener("input",e=>{document.getElementById("professionalChatSend").disabled=!e.target.value.trim();});document.getElementById("professionalChatForm")?.addEventListener("submit",e=>{e.preventDefault();const input=document.getElementById("professionalChatDraft"),texto=input.value.trim();if(!contatoChatProfAtivo||!texto)return;const ms=getLista("cm_mensagens");ms.push({id:`msg-${Date.now()}`,fromEmail:sessao,toEmail:contatoChatProfAtivo.email,fromNome:nome||"Profissional",toNome:contatoChatProfAtivo.nome,texto,data:new Date().toISOString()});salvarLista("cm_mensagens",ms);input.value="";document.getElementById("professionalChatSend").disabled=true;renderMensagensProf();});window.addEventListener("storage",e=>{if(e.key==="cm_mensagens")renderMensagensProf();});    const mostrarDetalheAgenda=a=>{let o=document.getElementById("cmFlowOverlay");if(!o){o=document.createElement("div");o.id="cmFlowOverlay";o.className="cm-modal-overlay";document.body.appendChild(o);}o.innerHTML=`<div class="cm-modal cm-flow-modal" role="dialog" aria-modal="true"><button class="cm-flow-close" type="button" aria-label="Fechar">×</button><h3>Detalhes do atendimento</h3><ul class="cm-prof-profile-details"><li><b>Paciente:</b> ${esc(a.paciente||"Paciente")}</li><li><b>Dia:</b> ${esc(a.data||"Não informado")}</li><li><b>Horário:</b> ${esc(a.horario||"Não informado")}</li><li><b>Nota do profissional:</b> ${esc(a.nota||a.observacao||"Nenhuma nota registrada")}</li><li><b>Modalidade:</b> ${esc(a.modalidade||"Não informada")}</li><li><b>Status:</b> ${esc(a.status||"Agendado")}</li></ul><div class="cm-add-form-actions"><button class="cm-btn cm-btn-danger cm-btn-sm" type="button" data-cancel>Cancelar atendimento</button><button class="cm-btn cm-btn-primary cm-btn-sm" type="button" data-rebook>Reagendar atendimento</button></div></div>`;o.classList.add("show");o.onclick=e=>{if(e.target===o||e.target.closest(".cm-flow-close"))o.classList.remove("show");};o.querySelector("[data-cancel]").onclick=()=>{if(confirm("Deseja cancelar este atendimento?")){a.status="cancelado";salvarLista("cm_agenda_profissional",agenda);renderAgenda();atualizarFinanceiro();atualizarResumo();o.classList.remove("show");}};o.querySelector("[data-rebook]").onclick=()=>{o.classList.remove("show");const pac=pacientes.find(p=>p.nome===a.paciente);abrirConversaProf({email:a.pacienteEmail||pac?.email||"",nome:a.paciente||"Paciente"},"Gostaria de reagendar a data do atendimento!");};};
    const renderAgenda = () => {
        const lista = document.getElementById("listaAgenda");
        const vazio = document.getElementById("agendaVazio");
        if (!lista) return;
        limpar("listaAgenda");
        if (!agenda.length) { vazio.hidden = false; return; }
        vazio.hidden = true;

        const grupos = new Map();

        agenda.slice().sort((a, b) => (a.data + (a.horario || "") > b.data + (b.horario || "") ? 1 : -1)).forEach(a => {
            const chave = a.data || "Sem data";
            if (!grupos.has(chave)) grupos.set(chave, []);
            grupos.get(chave).push(a);
        });

        grupos.forEach((itens, dataKey) => {
            const group = document.createElement("li");
            group.className = "cm-agenda-group";

            const dataLabel = document.createElement("div");
            dataLabel.className = "cm-agenda-date";

            const dateObj = dataKey !== "Sem data" ? new Date(dataKey + "T00:00:00") : null;
            const dia = dateObj ? dateObj.getDate() : "";
            const semana = dateObj ? dateObj.toLocaleDateString("pt-BR", { weekday: "short" }) : "Sem data";
            const mes = dateObj ? dateObj.toLocaleDateString("pt-BR", { month: "short" }) : "";

            dataLabel.innerHTML = `
                <span class="cm-agenda-weekday">${semana}</span>
                <strong>${dia || "--"}</strong>
                <small>${mes || ""}</small>`;

            const listaItens = document.createElement("div");
            listaItens.className = "cm-agenda-list";

            itens.forEach(a => {
                const status = a.status || "realizado";
                const badgeColor = status === "cancelado" ? "#E63946" : status === "agendado" ? "#E76F51" : "var(--primary-dark)";
                const badge = status === "cancelado" ? "Cancelado" : status === "agendado" ? "Agendado" : "Realizado";
                const linhaData = a.data ? new Date(a.data + "T" + (a.horario || "00:00")).toLocaleDateString("pt-BR") : "";
                const item = document.createElement("div");
                item.className = "cm-agenda-item cm-agenda-item-clickable";
                item.tabIndex = 0;
                item.setAttribute("role", "button");
                item.addEventListener("click", () => mostrarDetalheAgenda(a));
                item.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); mostrarDetalheAgenda(a); } });
                item.innerHTML = `
                    <span class="cm-time-box">${a.horario || "--:--"}</span>
                    <div class="cm-info">
                        <strong>${esc(a.paciente || "Paciente")}</strong>
                        <small>${esc(a.tipo || "Atendimento")} · ${linhaData}${a.modalidade ? ` · ${esc(a.modalidade)}` : ""}</small>
                    </div>
                    <span class="cm-tag" style="color:${badgeColor};">${badge}</span>`;
                listaItens.appendChild(item);
            });

            group.appendChild(dataLabel);
            group.appendChild(listaItens);
            lista.appendChild(group);
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
                <i class="fa-solid fa-chevron-right" style="color:#A8C6CB;flex-shrink:0;" aria-hidden="true"></i>`;
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
            const dot = document.createElement("span");
            dot.className = "cm-activity-dot";
            const conteudo = document.createElement("div");
            const texto = document.createElement("p");
            texto.textContent = a.texto || "";
            const tempo = document.createElement("small");
            tempo.textContent = a.tempo || "";
            conteudo.append(texto, tempo);
            li.append(dot, conteudo);
            lista.insertBefore(li, vazio);
        });
    };
    renderAtividades();

    const chavesLidas = "cm_notificacoes_lidas_profissional";
    const lerIdsLidos = () => {
        try {
            return new Set(JSON.parse(localStorage.getItem(chavesLidas) || "[]"));
        } catch (erro) {
            console.error("Não foi possível ler o estado das notificações.", erro);
            return new Set();
        }
    };
    let notificacoesLidas = lerIdsLidos();
    const obterNotificacoes = () => atividades
        .filter(a => a.tipo === "resposta_diario" && (!a.profissionalEmail || a.profissionalEmail.trim().toLowerCase() === (perfil.email || sessao).trim().toLowerCase()))
        .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

    const atualizarContagemNotificacoes = (quantidade) => {
        const badge = document.getElementById("notificacoesBadge");
        const resumo = document.getElementById("notificacoesResumoBadge");
        [badge, resumo].forEach(el => {
            if (!el) return;
            el.textContent = String(quantidade);
            el.hidden = quantidade === 0;
            el.setAttribute("aria-label", `${quantidade} notificações não lidas`);
        });
    };

    const renderListaNotificacoes = (lista, notificacoes) => {
        if (!lista) return;
        lista.replaceChildren();
        notificacoes.forEach(notificacao => {
            const item = document.createElement("li");
            item.className = "pro-inbox-item";
            if (!notificacoesLidas.has(notificacao.id)) item.classList.add("is-unread");
            const icone = document.createElement("span");
            icone.className = "pro-inbox-icon";
            icone.innerHTML = '<i class="fa-solid fa-book-open" aria-hidden="true"></i>';
            const conteudo = document.createElement("span");
            conteudo.className = "pro-inbox-copy";
            const texto = document.createElement("strong");
            texto.textContent = notificacao.texto || "Um paciente respondeu à solicitação de acesso ao diário.";
            const data = document.createElement("small");
            data.textContent = notificacao.data ? formatarData(notificacao.data) : (notificacao.tempo || "");
            conteudo.append(texto, data);
            item.append(icone, conteudo);
            lista.appendChild(item);
        });
    };

    const renderNotificacoes = () => {
        const notificacoes = obterNotificacoes();
        const naoLidas = notificacoes.filter(a => !notificacoesLidas.has(a.id));
        const listaCompleta = document.getElementById("listNotificacoes");
        const listaResumo = document.getElementById("listNotificacoesResumo");
        const vazioCompleto = document.getElementById("notificacoesVazio");
        const vazioResumo = document.getElementById("notificacoesResumoVazio");
        const marcarLidas = document.getElementById("btnMarcarNotificacoesLidas");

        renderListaNotificacoes(listaCompleta, notificacoes);
        renderListaNotificacoes(listaResumo, naoLidas.slice(0, 3));
        if (vazioCompleto) vazioCompleto.hidden = notificacoes.length > 0;
        if (vazioResumo) vazioResumo.hidden = naoLidas.length > 0;
        if (marcarLidas) marcarLidas.hidden = naoLidas.length === 0;
        atualizarContagemNotificacoes(naoLidas.length);
    };

    function marcarNotificacoesLidas() {
        const notificacoes = obterNotificacoes();
        notificacoes.forEach(a => notificacoesLidas.add(a.id));
        try {
            localStorage.setItem(chavesLidas, JSON.stringify([...notificacoesLidas]));
        } catch (erro) {
            console.error("Não foi possível salvar o estado das notificações.", erro);
            notificar("Não foi possível marcar as notificações como lidas.");
            return;
        }
        renderNotificacoes();
    }

    document.getElementById("btnMarcarNotificacoesLidas")?.addEventListener("click", marcarNotificacoesLidas);
    renderNotificacoes();

    window.addEventListener("storage", (event) => {
        if (event.key === "cm_pacientes") {
            pacientes = JSON.parse(event.newValue || "[]");
            renderPacientes(document.getElementById("buscaPaciente")?.value);
        }
        if (event.key === "cm_atividades_profissional") {
            atividades = JSON.parse(event.newValue || "[]");
            renderAtividades();
            renderNotificacoes();
        }
        if (event.key === chavesLidas) {
            notificacoesLidas = lerIdsLidos();
            renderNotificacoes();
        }
    });

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

    const abrirEdicaoPerfilProf = (focarApresentacao = false) => {
        Object.entries(mapearEditProf).forEach(([inputId, [campoObj]]) => {
            const el = document.getElementById(inputId);
            if (el) el.value = perfil[campoObj] || "";
        });
        if (editFormProf) editFormProf.classList.add("open");
        if (perfilProfFeedback) perfilProfFeedback.classList.remove("show");
        editFormProf?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (focarApresentacao) document.getElementById("editBioProf")?.focus({ preventScroll: true });
    };
    if (btnEditarPerfilProf) btnEditarPerfilProf.addEventListener("click", () => abrirEdicaoPerfilProf());
    document.querySelectorAll("[data-abrir-edicao-prof]").forEach(btn => {
        btn.addEventListener("click", () => abrirEdicaoPerfilProf(true));
    });
    if (btnCancelarPerfilProf) btnCancelarPerfilProf.addEventListener("click", () => {
        if (editFormProf) editFormProf.classList.remove("open");
    });
    if (btnSalvarPerfilProf) btnSalvarPerfilProf.addEventListener("click", () => {
        const lePrf = (inputId, alvo) => {
            const valor = document.getElementById(inputId)?.value.trim();
            return valor === undefined ? perfil[alvo] || "" : valor;
        };
        const valorSessaoInput = document.getElementById("editValorSessao")?.value.trim();
        const novo = {
            ...perfil,
            nome: lePrf("editNome", "nome"),
            telefone: lePrf("editTelefone", "telefone"),
            cidade: lePrf("editCidade", "cidade"),
            bio: lePrf("editBioProf", "bio"),
            valorSessao: valorSessaoInput ? Number(valorSessaoInput) : perfil.valorSessao || ""
        };
        try {
            localStorage.setItem("cm_profile_profissional", JSON.stringify(novo));
        } catch (erro) {
            console.error("Não foi possível salvar o perfil profissional.", erro);
            notificar("Não foi possível salvar os dados do perfil.");
            return;
        }

        Object.assign(perfil, novo);
        const novoNome = (novo.nome || "").trim();
        const labelNome = novoNome ? novoNome.split(" ")[0] : "Profissional";
        set("topoNomeUsuario", `Olá, ${labelNome}`);
        set("proHomeNome", novoNome || "Profissional");
        set("saudacao", `${periodo}, ${novoNome ? novoNome.split(" ")[0] : "profissional"}!`);
        set("sideNome", novoNome || "Profissional");
        renderPerfilProf();
        atualizarFotosPerfil();

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
            id: `pac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
        const nota = document.getElementById("addAtendNota")?.value.trim() || "";
        const pacienteEncontrado = pacientes.find(p => (p.nome || "").trim().toLowerCase() === paciente.toLowerCase());
        const data = document.getElementById("addAtendData").value;
        const horario = document.getElementById("addAtendHora").value;
        const status = document.getElementById("addAtendStatus").value || "realizado";
        if (!paciente || !data || !horario) return;
        agenda.push({
            paciente,
            pacienteEmail: pacienteEncontrado?.email || "",
            tipo,
            nota,
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
    ==========================================
       A tela de Configurações é a mesma do usuário: usa a
       chave única de preferências (cm_config) e o mesmo
       perfil do profissional (cm_profile_profissional).

       A parte repetitiva — preencher os [data-cfg], gravar a
       preferência e aplicar tema/tamanho do texto — é feita
       por tema.js, o arquivo compartilhado com a Home do
       paciente e com o painel administrativo.
    ========================================== */
    const getConfigObj = window.CMTema.lerConfig;

    window.CMTema.iniciarPreferencias();

    /* ---------- Conta: nome e e-mail ---------- */
    const atualizarNomeExibido = (novoNome) => {
        const n = (novoNome || "").trim();
        set("topoNomeUsuario", `Olá, ${n ? n.split(" ")[0] : "Profissional"}`);
        set("proHomeNome", n || "Profissional");
        set("saudacao", `${periodo}, ${n ? n.split(" ")[0] : "profissional"}!`);
        set("sideNome", n || "Profissional");
        renderPerfilProf();
        aplicarFoto(document.getElementById("avatarIniciais"));
        aplicarFoto(document.getElementById("sideAvatar"));
        aplicarFoto(document.getElementById("perfilAvatar"));
        aplicarFoto(document.getElementById("proHomeAvatar"));
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
        abrirConfirmacao({
            titulo: "Excluir conta",
            mensagem: "Ao confirmar a exclusão, sua conta e seus dados serão apagados definitivamente após 30 dias.",
            rotuloConfirmar: "Ciente",
            perigoso: true,
            aoConfirmar: () => {
                localStorage.removeItem("cm_profile_profissional");
                localStorage.removeItem("cm_pacientes");
                localStorage.removeItem("cm_agenda_profissional");
                localStorage.removeItem("cm_atividades_profissional");
                localStorage.removeItem("cm_movimentacoes");
                localStorage.removeItem("cm_conteudos_profissional");
                localStorage.removeItem("cm_session");
                localStorage.removeItem("cm_tipo");
                window.location.href = "login-profissional.html";
            }
        });
    });

    /* ---------- Atalho para o perfil ---------- */
    const btnCfgIrPerfil = document.getElementById("btnCfgIrPerfil");
    if (btnCfgIrPerfil) btnCfgIrPerfil.addEventListener("click", () => {
        const b = document.querySelector('.cm-side-avatar-button[data-secao="perfil"]');
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
