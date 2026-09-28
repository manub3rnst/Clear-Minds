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
    const pacientes = JSON.parse(localStorage.getItem("cm_pacientes") || "[]");
    const agenda = JSON.parse(localStorage.getItem("cm_agenda_profissional") || "[]");
    const atividades = JSON.parse(localStorage.getItem("cm_atividades_profissional") || "[]");
    const conteudos = JSON.parse(localStorage.getItem("cm_conteudos_profissional") || "[]");
    const movimentacoes = JSON.parse(localStorage.getItem("cm_movimentacoes") || "[]");

    const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    const set = (id, valor) => { const el = document.getElementById(id); if (el) el.textContent = valor; };
    const show = (id) => { const el = document.getElementById(id); if (el) el.hidden = false; };
    const hide = (id) => { const el = document.getElementById(id); if (el) el.hidden = true; };
    const limpar = (id) => { const el = document.getElementById(id); if (el) el.innerHTML = ""; };

    /* ---------- Identificação do usuário ---------- */
    set("saudacao", primeiroNome ? `${periodo}, ${primeiroNome}! 🌿` : `${periodo}!`);
    set("topoNomeUsuario", primeiroNome ? `Olá, ${primeiroNome}` : "Olá, Profissional");
    set("topoAreaUsuario", profissao);
    set("perfilNome", nome || "Profissional");
    set("perfilMeta", `${profissao}${perfil.registroProfissional ? ` • ${perfil.registroProfissional}` : ""}`);
    set("perfilLocal", perfil.cidade && perfil.estado ? `${perfil.cidade} • ${perfil.estado}` : "Localização não informada");
    set("perfilModalidade", perfil.modalidade || "Modalidade não informada");
    set("statusVerificacao", perfil.verificado ? "Perfil verificado" : "Verificação pendente");

    if (perfil.abordagem) { set("perfilAbordagem", perfil.abordagem); show("perfilAbordagem"); }
    if (perfil.faculdade) {
        set("perfilFormacao", `${perfil.faculdade}${perfil.anoFormacao ? ` • ${perfil.anoFormacao}` : ""}`);
        show("perfilFormacao");
    }
    if (perfil.atuaDesde) {
        const [ano, mes] = (perfil.atuaDesde || "").split("-");
        set("perfilAtuaDesde", `Atua desde ${MESES[Number(mes) - 1]}/${ano}`);
        show("perfilAtuaDesde");
    }
    if (perfil.especialidades) {
        show("perfilEspecialidades");
        document.querySelector("#perfilEspecialidades strong").textContent = perfil.especialidades;
    }
    if (perfil.disponibilidade) {
        show("perfilDisponibilidade");
        document.querySelector("#perfilDisponibilidade strong").textContent = perfil.disponibilidade;
    }
    if (perfil.valorSessao) {
        show("perfilValor");
        document.querySelector("#perfilValor strong").textContent = `R$ ${Number(perfil.valorSessao).toFixed(2)}`;
    }

    /* ---------- Foto / avatar ---------- */
    const avatarText = nome ? nome.split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("") : "P";
    const aplicarFoto = (el) => {
        if (!el) return;
        if (perfil.foto) el.innerHTML = `<img src="${perfil.foto}" alt="Foto de perfil">`;
        else el.textContent = avatarText;
    };
    aplicarFoto(document.getElementById("avatarIniciais"));
    aplicarFoto(document.getElementById("perfilAvatar"));

    /* ==========================================
       NAVEGAÇÃO ENTRE SEÇÕES (menu lateral)
    ========================================== */
    const botoesMenu = document.querySelectorAll(".cm-side-item[data-secao]");

    const alternarSecao = (alvo) => {
        botoesMenu.forEach(b => b.classList.toggle("active", b.dataset.secao === alvo));
        document.querySelectorAll(".cm-section").forEach(s => s.classList.remove("active"));
        const secao = document.getElementById(`sec-${alvo}`);
        if (secao) secao.classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    botoesMenu.forEach(btn => {
        btn.addEventListener("click", () => alternarSecao(btn.dataset.secao));
    });

    /* ==========================================
       PACIENTES
    ========================================== */
    const renderPacientes = () => {
        const lista = document.getElementById("listaPacientes");
        const vazio = document.getElementById("pacientesVazio");
        if (!lista) return;
        limpar("listaPacientes");
        if (!pacientes.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        pacientes.forEach(p => {
            const li = document.createElement("li");
            const ini = p.nome ? p.nome.split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("") : "?";
            li.innerHTML = `
                <span class="cm-avatar cm-avatar-sm">${ini}</span>
                <div class="cm-info">
                    <strong>${p.nome || "Paciente"}</strong>
                    <small>${p.ultimaSessao ? `Última sessão · ${p.ultimaSessao}` : "Aguardando primeira sessão"}</small>
                </div>`;
            lista.appendChild(li);
        });
    };
    renderPacientes();

    const busca = document.getElementById("buscaPaciente");
    if (busca) {
        busca.addEventListener("input", () => {
            const termo = busca.value.trim().toLowerCase();
            document.querySelectorAll("#listaPacientes li").forEach(item => {
                const ok = (item.dataset.nome || item.textContent || "").toLowerCase().includes(termo);
                item.hidden = !ok;
            });
        });
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
        agenda.forEach(a => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="cm-time-box">${a.horario || "--:--"}</span>
                <div class="cm-info">
                    <strong>${a.paciente || "Paciente"}</strong>
                    <small>${a.tipo || "Atendimento"}${a.duracao ? ` · ${a.duracao}` : ""}${a.modalidade ? ` · ${a.modalidade}` : ""}</small>
                </div>`;
            lista.appendChild(li);
        });
    };
    renderAgenda();

    /* ==========================================
       CONTEÚDOS
    ========================================== */
    const renderConteudos = () => {
        const lista = document.getElementById("listaConteudos");
        const vazio = document.getElementById("conteudosVazio");
        if (!lista) return;
        limpar("listaConteudos");
        if (!conteudos.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        conteudos.forEach(c => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="cm-avatar cm-avatar-sm" style="background:var(--secondary);color:var(--primary-dark);">
                    <i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>
                </span>
                <div class="cm-info">
                    <strong>${c.titulo || "Conteúdo"}</strong>
                    <small>${c.descricao || ""}</small>
                </div>`;
            lista.appendChild(li);
        });
    };
    renderConteudos();

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
       FINANCEIRO — GRÁFICO (DIA | MÊS | ANO)
    ========================================== */
    const normalizarData = (d) => {
        if (d instanceof Date) return d;
        if (typeof d === "string") {
            const p = d.split(/[\/\-]/);
            if (p.length === 3) return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
        }
        return new Date(d);
    };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const gerarPeriodos = (periodo) => {
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
            const anos = [...new Set(movimentacoes.map(m => m.data ? normalizarData(m.data).getFullYear() : null).filter(Boolean))];
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
        if (periodo === "dia") return "Atendimentos hoje";
        if (periodo === "mes") return "Atendimentos no mês";
        return "Atendimentos no ano";
    };

    const calcular = (periodo) => {
        const periodos = gerarPeriodos(periodo);
        const valores = periodos.map(p => {
            const movs = movimentacoes.filter(m => {
                if (!m.data) return false;
                const d = normalizarData(m.data);
                if (periodo === "dia") return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === p.chave;
                if (periodo === "mes") return `${d.getFullYear()}-${d.getMonth()}` === p.chave;
                return String(d.getFullYear()) === p.chave;
            });
            return {
                movimentacao: movs.length,
                ganho: movs.reduce((s, m) => s + (Number(m.valor) || 0), 0)
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
        const temDados = movimentacoes.length > 0;

        set(`${idBase}MetricLabel`, rotuloPeriodo(periodo));
        const elMov = document.getElementById(`${idBase}Movimentacao`);
        if (elMov) elMov.innerHTML = `${totalMov} <span>atendimento(s)</span>`;
        const elGanho = document.getElementById(`${idBase}Ganho`);
        if (elGanho) elGanho.innerHTML = `R$ ${totalGanho.toFixed(2).replace(".", ",")}`;

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

    /* ==========================================
       EXTRATO DE MOVIMENTAÇÕES
    ========================================== */
    const renderMovimentacoes = () => {
        const lista = document.getElementById("listaMovimentacoes");
        const vazio = document.getElementById("movimentacoesVazio");
        if (!lista) return;
        limpar("listaMovimentacoes");
        if (!movimentacoes.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        movimentacoes.slice().sort((a, b) => (a.data > b.data ? -1 : 1)).forEach(m => {
            const li = document.createElement("li");
            const valor = Number(m.valor) || 0;
            const data = m.data ? normalizarData(m.data) : null;
            const dataStr = data ? `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}` : "--/--/----";
            li.innerHTML = `
                <span class="cm-avatar cm-avatar-sm" style="background:var(--secondary);color:var(--primary-dark);">
                    <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
                </span>
                <div class="cm-info">
                    <strong>${m.descricao || "Atendimento"}</strong>
                    <small>${dataStr}${m.horario ? ` · ${m.horario}` : ""}</small>
                </div>
                <strong style="color:var(--primary-dark);font-size:.9rem;">+ R$ ${valor.toFixed(2).replace(".", ",")}</strong>`;
            lista.appendChild(li);
        });
    };
    renderMovimentacoes();

    /* ==========================================
       RESUMO RÁPIDO
    ========================================== */
    set("statPacientes", String(pacientes.length));
    set("statAtendimentos", String(movimentacoes.length));
    set("statGanho", `R$ ${movimentacoes.reduce((s, m) => s + (Number(m.valor) || 0), 0).toFixed(2).replace(".", ",")}`);

    /* ==========================================
       LOGOUT
    ========================================== */
    const btnSair = document.getElementById("btnSair");
    if (btnSair) btnSair.addEventListener("click", () => {
        localStorage.removeItem("cm_session");
        localStorage.removeItem("cm_tipo");
        window.location.href = "login-profissional.html";
    });

});