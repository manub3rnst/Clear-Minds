/* ==========================================================
   CLEAR MINDS — Painel administrativo (aplicação)
   ==========================================================
   Princípio de segurança aplicado aqui: este arquivo não
   decide nenhuma permissão. Ele esconde botões por
   conveniência de interface, mas quem autoriza é o servidor.
   Se alguém remover um botão pelo DevTools, a API responde
   401/403 de qualquer forma.
   ========================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------
     ESTADO
     ------------------------------------------------------------ */

  const estado = {
    eu: null,
    pagina: "dashboard",
    csrf: "",
    filtroUsuario: { status: "" },
    filtroProf: { status: "" },
    filtroDen: { status: "" },
    filtroConteudo: { destino: "" },
    visaoComunidade: "publicacoes",
    periodo: "semana",
    dados: {},
  };

  const TITULOS = {
    dashboard: "Dashboard",
    usuarios: "Usuários",
    profissionais: "Profissionais",
    comunidade: "Comunidade",
    denuncias: "Denúncias",
    conteudos: "Conteúdos",
    agendamentos: "Agendamentos",
    financeiro: "Financeiro",
    relatorios: "Relatórios",
    auditoria: "Auditoria",
    perfil: "Meu perfil",
    config: "Configurações",
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* Chaves do app que a ponte sabe gravar no banco. */
  const CHAVES_IMPORTADAS = [
    "cm_profile", "cm_profile_profissional", "cm_postagens",
    "cm_denuncias", "cm_consultas", "cm_agenda_profissional",
    "cm_conteudos_profissional", "cm_movimentacoes",
  ];

  /* ------------------------------------------------------------
     API
     ------------------------------------------------------------ */

  const lerCookie = (nome) => {
    for (const parte of document.cookie.split(";")) {
      const [chave, ...resto] = parte.trim().split("=");
      if (chave === nome) return resto.join("=") || "";
    }
    return "";
  };

  async function api(caminho, opcoes = {}) {
    const cabecalhos = { ...(opcoes.headers || {}) };
    if (opcoes.corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
    if (estado.csrf) cabecalhos["X-CSRF-Token"] = estado.csrf;

    const resp = await fetch(caminho, {
      method: opcoes.metodo || "GET",
      headers: cabecalhos,
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      credentials: "same-origin",
    });

    /* Sessão recusada pelo servidor: volta para o login.
       Isto não é "esconder" nada, é o servidor recusando.
       403 (conta desativada ou CSRF inválido) também sai do
       painel — recarregar a si mesmo só geraria loop. */
    if (resp.status === 401 || resp.status === 403) {
      window.location.href = "login.html";
      throw new Error("sessão recusada");
    }

    const texto = await resp.text();
    let dados = null;
    try { dados = texto ? JSON.parse(texto) : null; } catch { dados = null; }

    if (!resp.ok) throw new Error((dados && dados.erro) || "Erro na requisição.");
    return dados;
  }

  /* ------------------------------------------------------------
     UI HELPERS
     ------------------------------------------------------------ */

  function toast(mensagem, tipo = "") {
    const el = document.createElement("div");
    el.className = "adm-toast" + (tipo ? " " + tipo : "");
    el.textContent = mensagem;
    $("#toasts").appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 250);
    }, 3200);
  }

  /** Escapa texto antes de colocar em innerHTML. */
  function esc(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const iniciais = (nome) =>
    String(nome || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();

  function avatar(url, nome, classe) {
    if (url && url.startsWith("data:image/")) {
      return `<div class="${classe}"><img src="${esc(url)}" alt=""></div>`;
    }
    return `<div class="${classe}">${esc(iniciais(nome))}</div>`;
  }

  function dataBR(iso, comHora) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return esc(iso);
    const data = d.toLocaleDateString("pt-BR");
    if (!comHora) return data;
    return data + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  const moeda = (v) =>
    (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const TAG_STATUS = {
    ativo: "verde", inativo: "cinza", bloqueado: "vermelho",
    pendente: "ambar", aprovado: "verde", rejeitado: "vermelho",
    em_analise: "azul", resolvida: "verde", arquivada: "cinza",
    realizada: "verde", agendada: "azul", cancelada: "cinza",
    publicada: "verde", rascunho: "ambar",
  };

  function tagStatus(valor) {
    const cor = TAG_STATUS[valor] || "cinza";
    return `<span class="adm-tag ${cor}">${esc(valor || "—")}</span>`;
  }

  function vazio(mensagem) {
    return `<div class="adm-vazio"><i class="fa-regular fa-folder-open" style="font-size:1.4rem;display:block;margin-bottom:8px"></i>${esc(mensagem)}</div>`;
  }

  function carregando() {
    return `<div class="adm-carregando"><span class="adm-spinner"></span> Carregando…</div>`;
  }

  /* ------------------------------------------------------------
     MODAL
     ------------------------------------------------------------ */

  const modal = {
    aberto: false,
    aoFechar: null,
    abrir(titulo, corpoHTML, botoesHTML, opcoes = {}) {
      $("#modalTitulo").textContent = titulo;
      $("#modalCorpo").innerHTML = corpoHTML;
      $("#modalPe").innerHTML = botoesHTML;
      $("#modalCaixa").classList.toggle("largo", !!opcoes.largo);
      $("#modal").dataset.aberto = "1";
      this.aberto = true;
      const foco = $("#modalCorpo").querySelector("input, select, textarea, button");
      if (foco) foco.focus();
    },
    fechar() {
      $("#modal").dataset.aberto = "0";
      $("#modalCorpo").innerHTML = "";
      $("#modalPe").innerHTML = "";
      this.aberto = false;
      if (this.aoFechar) { const f = this.aoFechar; this.aoFechar = null; f(); }
    },
  };

  $("#modalFechar").addEventListener("click", () => modal.fechar());
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") modal.fechar(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.aberto) modal.fechar(); });

  /**
   * Confirmação destrutiva. É o front exibindo a pergunta — a
   * exigência real está no servidor, que rejeita a ação sem
   * `confirmar: true`.
   */
  function confirmar(titulo, mensagem, rotuloBotao, aoConfirmar) {
    modal.abrir(
      titulo,
      `<p class="adm-muted">${esc(mensagem)}</p>
       <div class="adm-field" id="campoMotivo" hidden>
         <label for="inpMotivo">Motivo (obrigatório, fica na auditoria)</label>
         <input type="text" id="inpMotivo" placeholder="Descreva o motivo">
       </div>`,
      `<button type="button" class="adm-btn adm-btn-ghost" id="btnCancelar">Cancelar</button>
       <button type="button" class="adm-btn adm-btn-danger" id="btnConfirmar">${esc(rotuloBotao)}</button>`,
      { largo: false }
    );

    const precisaMotivo = typeof aoConfirmar === "object" && aoConfirmar.motivo;
    if (precisaMotivo) $("#campoMotivo").hidden = false;

    $("#btnCancelar").addEventListener("click", () => modal.fechar());
    $("#btnConfirmar").addEventListener("click", async () => {
      const motivo = $("#inpMotivo") ? $("#inpMotivo").value.trim() : "";
      if (precisaMotivo && !motivo) {
        toast("Informe o motivo.", "erro");
        return;
      }
      try {
        if (precisaMotivo) await aoConfirmar.funcao(motivo);
        else await aoConfirmar();
        modal.fechar();
        toast(precisaMotivo ? "Remoção registrada na auditoria." : "Ação concluída.", "ok");
      } catch (e) {
        toast(e.message, "erro");
      }
    });
  }

  /* ------------------------------------------------------------
     NAVEGAÇÃO
     ------------------------------------------------------------ */

  function irPara(pagina, naoAtualizar) {
    if (!TITULOS[pagina]) pagina = "dashboard";
    estado.pagina = pagina;

    $$(".adm-pagina").forEach((p) => p.classList.remove("ativa"));
    const alvo = $("#pag-" + pagina);
    if (alvo) alvo.classList.add("ativa");

    $$(".adm-side-item[data-pagina]").forEach((b) =>
      b.classList.toggle("ativo", b.dataset.pagina === pagina)
    );

    $("#topoTitulo").textContent = TITULOS[pagina];
    $("#side").dataset.aberta = "0";
    $(".adm-main").scrollTop = 0;

    if (!naoAtualizar) carregarPagina(pagina);
  }

  function carregarPagina(pagina) {
    const carregadores = {
      dashboard: carregarDashboard,
      usuarios: carregarUsuarios,
      profissionais: carregarProfissionais,
      comunidade: carregarComunidade,
      denuncias: carregarDenuncias,
      conteudos: carregarConteudos,
      agendamentos: carregarAgendamentos,
      financeiro: carregarFinanceiro,
      relatorios: carregarRelatorios,
      auditoria: carregarAuditoria,
      perfil: carregarPerfil,
      config: carregarConfig,
    };
    (carregadores[pagina] || (() => {}))();
  }

  $$(".adm-side-item[data-pagina]").forEach((botao) => {
    botao.addEventListener("click", () => irPara(botao.dataset.pagina));
  });

  $("#btnMenuMobile").addEventListener("click", () => {
    const side = $("#side");
    side.dataset.aberta = side.dataset.aberta === "1" ? "0" : "1";
  });

  /* ------------------------------------------------------------
     DASHBOARD
     ------------------------------------------------------------ */

  async function carregarDashboard() {
    $("#dashCards").innerHTML = carregando();

    let d;
    try {
      d = await api("/api/admin/dashboard");
    } catch (e) {
      $("#dashCards").innerHTML = "";
      return;
    }

    estado.dados.dashboard = d;
    const r = d.resumo;

    $("#dashSaudacao").textContent =
      "Visão geral do Clear Minds — " + dataBR(new Date().toISOString(), true);

    const cards = [
      { rot: "Usuários cadastrados", val: r.usuariosTotal, ic: "fa-users", cor: "" },
      { rot: "Profissionais cadastrados", val: r.profissionaisTotal, ic: "fa-user-doctor", cor: "" },
      { rot: "Usuários ativos", val: r.usuariosAtivos, ic: "fa-user-check", cor: "verde" },
      { rot: "Profissionais ativos", val: r.profissionaisAprovados, ic: "fa-user-doctor", cor: "verde" },
      { rot: "Denúncias pendentes", val: r.denunciasPendentes, ic: "fa-flag", cor: r.denunciasPendentes > 0 ? "vermelho" : "" },
      { rot: "Publicações", val: r.publicacoes, ic: "fa-comments", cor: "" },
      { rot: "Solicitações pendentes", val: r.solicitacoesPendentes, ic: "fa-hourglass-half", cor: r.solicitacoesPendentes > 0 ? "ambar" : "" },
      { rot: "Consultas / agendamentos", val: r.consultasTotal, ic: "fa-calendar-days", cor: "roxo" },
    ];

    $("#dashCards").innerHTML = cards.map((c) => `
      <div class="adm-card">
        <div class="adm-kpi">
          <div class="adm-kpi-icone ${c.cor}"><i class="fa-solid ${c.ic}"></i></div>
          <div>
            <div class="adm-kpi-valor">${c.val}</div>
            <div class="adm-kpi-rotulo">${esc(c.rot)}</div>
          </div>
        </div>
      </div>`).join("");

    /* atividade recente — vem da auditoria */
    $("#dashAtividade").innerHTML = d.atividade.length
      ? d.atividade.map((a) => {
          const ico = a.acao.includes("profissional") ? "fa-user-doctor"
            : a.acao.includes("denuncia") ? "fa-flag"
            : a.acao.includes("publicacao") || a.acao.includes("comentario") ? "fa-comment"
            : a.acao.includes("conteudo") ? "fa-book-open"
            : a.acao.includes("config") ? "fa-gear"
            : "fa-user";
          const rotulo = a.acao.replace(/[._]/g, " ");
          return `
            <div class="adm-atv-item">
              <div class="adm-atv-ponto"><i class="fa-solid ${ico}"></i></div>
              <div>
                <div class="adm-atv-texto">${esc(rotulo)}${a.recurso_id ? " · " + esc(a.recurso_id) : ""}</div>
                <div class="adm-atv-meta">${esc(dataBR(a.em, true))} · ${esc(a.admin_email || "sistema")}</div>
              </div>
            </div>`;
        }).join("")
      : vazio("Nenhuma ação registrada ainda.");

    /* pendências */
    const pendencias = [
      { n: r.profissionaisPendentes, rot: "Cadastros de profissionais aguardando análise", ic: "fa-user-doctor", cor: "ambar" },
      { n: r.denunciasPendentes, rot: "Denúncias aguardando decisão", ic: "fa-flag", cor: "vermelho" },
      { n: r.conteudosRascunho, rot: "Conteúdos em rascunho", ic: "fa-pen-ruler", cor: "" },
      { n: r.usuariosBloqueados, rot: "Usuários bloqueados", ic: "fa-ban", cor: "" },
    ].filter((p) => p.n > 0);

    $("#dashPendencias").innerHTML = pendencias.length
      ? pendencias.map((p) => `
          <div class="adm-barra-item" style="display:flex;align-items:center;gap:10px">
            <i class="fa-solid ${p.ic}" style="color:var(--azul-500)"></i>
            <span style="flex:1;font-size:.86rem">${esc(p.rot)}</span>
            <span class="adm-tag ${p.cor || "cinza"}">${p.n}</span>
          </div>`).join("")
      : vazio("Nada pendente no momento.");
  }

  $("#btnAtualizarDash").addEventListener("click", carregarDashboard);

  /* ------------------------------------------------------------
     USUÁRIOS
     ------------------------------------------------------------ */

  async function carregarUsuarios() {
    const corpo = $("#tabelaUsuarios");
    corpo.innerHTML = `<tr><td colspan="5">${carregando()}</td></tr>`;

    const q = encodeURIComponent($("#buscaUsuario").value.trim());
    const st = encodeURIComponent(estado.filtroUsuario.status);
    let d;
    try {
      d = await api(`/api/admin/usuarios?q=${q}&status=${st}`);
    } catch { return; }

    const lista = d.usuarios;
    estado.dados.usuarios = lista;

    if (!lista.length) {
      corpo.innerHTML = `<tr><td colspan="5">${vazio("Nenhum usuário encontrado.")}</td></tr>`;
      return;
    }

    corpo.innerHTML = lista.map((u) => {
      const bloqueado = u.bloqueado === 1;
      return `
        <tr>
          <td>
            <div class="adm-celula-pessoa">
              ${avatar(u.foto, u.nome, "adm-avatar-min")}
              <div>
                <strong>${esc((u.nome || "") + " " + (u.sobrenome || ""))}</strong>
                <span>${esc(u.email)}</span>
              </div>
            </div>
          </td>
          <td>${esc(u.telefone || "—")}</td>
          <td>${dataBR(u.data_cadastro)}</td>
          <td>${bloqueado ? '<span class="adm-tag vermelho">bloqueado</span>' : tagStatus(u.status)}</td>
          <td>
            <div class="adm-acoes">
              <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-ver="${u.id}">
                <i class="fa-regular fa-eye"></i>
              </button>
              <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-editar="${u.id}">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm"
                data-acao="${bloqueado ? "desbloquear" : "bloquear"}" data-id="${u.id}">
                <i class="fa-solid fa-${bloqueado ? "unlock" : "ban"}"></i>
              </button>
              <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm"
                data-acao="${u.status === "ativo" ? "desativar" : "ativar"}" data-id="${u.id}">
                <i class="fa-solid fa-power-off"></i>
              </button>
              <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-excluir="${u.id}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join("");

    ligarAcoesTabela(corpo, "usuario", recarregarUsuarios);
  }

  const recarregarUsuarios = () => carregarUsuarios();

  $("#buscaUsuario").addEventListener("input", debounce(carregarUsuarios, 260));
  $("#filtroStatusUsuario").addEventListener("change", (e) => {
    estado.filtroUsuario.status = e.target.value;
    carregarUsuarios();
  });

  $("#btnNovoUsuario").addEventListener("click", () => {
    modal.abrir(
      "Novo usuário",
      `<form id="fNovoUsuario" novalidate>
        <div class="adm-linha2">
          <div class="adm-field">
            <label for="nuNome">Nome</label>
            <input type="text" id="nuNome" required>
          </div>
          <div class="adm-field">
            <label for="nuSobrenome">Sobrenome</label>
            <input type="text" id="nuSobrenome">
          </div>
        </div>
        <div class="adm-field">
          <label for="nuEmail">E-mail</label>
          <input type="email" id="nuEmail" required>
        </div>
        <div class="adm-field">
          <label for="nuTelefone">Telefone</label>
          <input type="text" id="nuTelefone">
        </div>
        <p class="adm-muted" style="font-size:.78rem">
          A senha do usuário não é definida aqui. O usuário mantém a credencial
          que já possui no sistema.
        </p>
      </form>`,
      `<button type="button" class="adm-btn adm-btn-ghost" id="cancelar">Cancelar</button>
       <button type="submit" form="fNovoUsuario" class="adm-btn adm-btn-primary">
         <i class="fa-solid fa-user-plus"></i> Criar usuário
       </button>`
    );

    $("#cancelar").addEventListener("click", () => modal.fechar());
    $("#fNovoUsuario").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await api("/api/admin/usuarios", {
          metodo: "POST",
          corpo: {
            nome: $("#nuNome").value.trim(),
            sobrenome: $("#nuSobrenome").value.trim(),
            email: $("#nuEmail").value.trim(),
            telefone: $("#nuTelefone").value.trim(),
          },
        });
        modal.fechar();
        toast("Usuário criado.", "ok");
        carregarUsuarios();
      } catch (erro) {
        toast(erro.message, "erro");
      }
    });
  });

  /* ------------------------------------------------------------
     AÇÕES GENÉRICAS DE TABELA
     ------------------------------------------------------------ */

  /* O <tbody> é reutilizado entre recarregamentos, então o
     delegate de clique é registrado uma única vez por tabela.
     Sem isto, cada busca somaria um novo handler e a mesma
     ação dispararia várias vezes. */
  const tabelasLigadas = new WeakSet();

  function ligarAcoesTabela(tbody, tipo, recarregar) {
    if (tabelasLigadas.has(tbody)) return;
    tabelasLigadas.add(tbody);

    tbody.addEventListener("click", async (evento) => {
      const alvo = evento.target.closest("button");
      if (!alvo) return;

      /* ver */
      if (alvo.dataset.ver) {
        abrirDetalhe(tipo, Number(alvo.dataset.ver), recarregar);
        return;
      }

      /* editar */
      if (alvo.dataset.editar) {
        abrirEdicao(tipo, Number(alvo.dataset.editar), recarregar);
        return;
      }

      /* excluir */
      if (alvo.dataset.excluir) {
        const id = Number(alvo.dataset.excluir);
        confirmar(
          "Excluir registro",
          "Tem certeza que deseja excluir este registro? Esta ação é definitiva e fica registrada na auditoria.",
          "Excluir",
          async () => {
            await api(`/api/admin/${tipo === "usuario" ? "usuarios" : "profissionais"}/${id}`, {
              metodo: "DELETE",
              corpo: { confirmar: true },
            });
            recarregar();
          }
        );
        return;
      }

      /* ação com verbo explícito */
      if (alvo.dataset.acao && alvo.dataset.id) {
        const acao = alvo.dataset.acao;
        const id = Number(alvo.dataset.id);
        try {
          await api(`/api/admin/${tipo === "usuario" ? "usuarios" : "profissionais"}/${id}/${acao}`, {
            metodo: "POST",
            corpo: {},
          });
          toast("Ação aplicada.", "ok");
          recarregar();
        } catch (erro) {
          toast(erro.message, "erro");
        }
      }
    });
  }

  async function abrirDetalhe(tipo, id, recarregar) {
    const lista = estado.dados[tipo === "usuario" ? "usuarios" : "profissionais"] || [];
    const item = lista.find((x) => x.id === id);
    if (!item) return;

    const linhas = tipo === "usuario"
      ? [
          ["Nome", (item.nome || "") + " " + (item.sobrenome || "")],
          ["E-mail", item.email],
          ["Telefone", item.telefone],
          ["Data de cadastro", dataBR(item.data_cadastro, true)],
          ["Status", item.bloqueado ? "bloqueado" : item.status],
        ]
      : [
          ["Nome", item.nome],
          ["E-mail", item.email],
          ["Telefone", item.telefone],
          ["Registro", item.registro],
          ["Especialidade", item.especialidade],
          ["Bio", item.bio],
          ["Data de cadastro", dataBR(item.data_cadastro, true)],
          ["Status", item.bloqueado ? "bloqueado" : item.status],
        ];

    modal.aberto && modal.fechar();
    modal.abrir(
      tipo === "usuario" ? "Perfil do usuário" : "Perfil profissional",
      `<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">
         ${avatar(item.foto, item.nome, "adm-avatar-min")}
         <div><strong style="font-size:1rem">${esc(item.nome)}</strong>
         <div class="adm-muted" style="font-size:.8rem">${esc(item.email)}</div></div>
       </div>
       ${linhas.map(([k, v]) => `
         <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #eef3fa">
           <span class="adm-muted" style="width:130px;flex:0 0 130px;font-size:.82rem">${esc(k)}</span>
           <span style="font-size:.85rem">${esc(v || "—")}</span>
         </div>`).join("")}
       <p class="adm-muted" style="font-size:.76rem;margin-top:14px">
         Conteúdo privado e diários não são exibidos aqui: o painel administrativo
         não tem acesso a dados de saúde dos usuários.
       </p>`,
      `<button type="button" class="adm-btn adm-btn-ghost" id="fecharDetalhe">Fechar</button>`
    );
    $("#fecharDetalhe").addEventListener("click", () => modal.fechar());
    void recarregar;
  }

  async function abrirEdicao(tipo, id, recarregar) {
    const lista = estado.dados[tipo === "usuario" ? "usuarios" : "profissionais"] || [];
    const item = lista.find((x) => x.id === id);
    if (!item) return;

    const campos = tipo === "usuario"
      ? `<div class="adm-linha2">
           <div class="adm-field"><label>Nome</label><input type="text" id="edNome" value="${esc(item.nome || "")}"></div>
           <div class="adm-field"><label>Sobrenome</label><input type="text" id="edSobrenome" value="${esc(item.sobrenome || "")}"></div>
         </div>
         <div class="adm-linha2">
           <div class="adm-field"><label>E-mail</label><input type="email" id="edEmail" value="${esc(item.email)}"></div>
           <div class="adm-field"><label>Telefone</label><input type="text" id="edTelefone" value="${esc(item.telefone || "")}"></div>
         </div>
         <div class="adm-field"><label>Status</label>
           <select id="edStatus">
             <option value="ativo"${item.status === "ativo" ? " selected" : ""}>Ativo</option>
             <option value="inativo"${item.status === "inativo" ? " selected" : ""}>Inativo</option>
           </select>
         </div>`
      : `<div class="adm-field"><label>Nome</label><input type="text" id="edNome" value="${esc(item.nome || "")}"></div>
         <div class="adm-linha2">
           <div class="adm-field"><label>E-mail</label><input type="email" id="edEmail" value="${esc(item.email)}"></div>
           <div class="adm-field"><label>Telefone</label><input type="text" id="edTelefone" value="${esc(item.telefone || "")}"></div>
         </div>
         <div class="adm-linha2">
           <div class="adm-field"><label>Registro</label><input type="text" id="edRegistro" value="${esc(item.registro || "")}"></div>
           <div class="adm-field"><label>Especialidade</label><input type="text" id="edEspecialidade" value="${esc(item.especialidade || "")}"></div>
         </div>
         <div class="adm-field"><label>Bio</label><textarea id="edBio">${esc(item.bio || "")}</textarea></div>`;

    modal.abrir(
      "Editar " + (tipo === "usuario" ? "usuário" : "profissional"),
      `<form id="fEdicao" novalidate>${campos}</form>`,
      `<button type="button" class="adm-btn adm-btn-ghost" id="cancelarEd">Cancelar</button>
       <button type="submit" form="fEdicao" class="adm-btn adm-btn-primary">
         <i class="fa-solid fa-floppy-disk"></i> Salvar
       </button>`
    );

    $("#cancelarEd").addEventListener("click", () => modal.fechar());
    $("#fEdicao").addEventListener("submit", async (e) => {
      e.preventDefault();
      const corpo = { email: $("#edEmail").value.trim() };
      if (tipo === "usuario") {
        corpo.nome = $("#edNome").value.trim();
        corpo.sobrenome = $("#edSobrenome").value.trim();
        corpo.telefone = $("#edTelefone").value.trim();
        corpo.status = $("#edStatus").value;
      } else {
        corpo.nome = $("#edNome").value.trim();
        corpo.telefone = $("#edTelefone").value.trim();
        corpo.registro = $("#edRegistro").value.trim();
        corpo.especialidade = $("#edEspecialidade").value.trim();
        corpo.bio = $("#edBio").value.trim();
      }
      try {
        await api(`/api/admin/${tipo === "usuario" ? "usuarios" : "profissionais"}/${id}`, {
          metodo: "PUT", corpo,
        });
        modal.fechar();
        toast("Alterações salvas.", "ok");
        recarregar();
      } catch (erro) {
        toast(erro.message, "erro");
      }
    });
  }

  /* ------------------------------------------------------------
     PROFISSIONAIS
     ------------------------------------------------------------ */

  async function carregarProfissionais() {
    const corpo = $("#tabelaProfissionais");
    corpo.innerHTML = `<tr><td colspan="6">${carregando()}</td></tr>`;

    const q = encodeURIComponent($("#buscaProf").value.trim());
    const st = encodeURIComponent(estado.filtroProf.status);
    let d;
    try {
      d = await api(`/api/admin/profissionais?q=${q}&status=${st}`);
    } catch { return; }

    const lista = d.profissionais;
    estado.dados.profissionais = lista;

    if (!lista.length) {
      corpo.innerHTML = `<tr><td colspan="6">${vazio("Nenhum profissional encontrado.")}</td></tr>`;
      return;
    }

    corpo.innerHTML = lista.map((p) => {
      const b = p.bloqueado === 1;
      const acoes = [];
      if (p.status === "pendente") {
        acoes.push(`<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-prof-acao="aprovar" data-id="${p.id}" title="Aprovar"><i class="fa-solid fa-check"></i></button>`);
        acoes.push(`<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-prof-acao="rejeitar" data-id="${p.id}" title="Rejeitar"><i class="fa-solid fa-xmark"></i></button>`);
      }
      acoes.push(`<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-ver="${p.id}" title="Ver"><i class="fa-regular fa-eye"></i></button>`);
      acoes.push(`<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-editar="${p.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>`);
      acoes.push(`<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-prof-acao="${b ? "desbloquear" : "bloquear"}" data-id="${p.id}" title="${b ? "Desbloquear" : "Bloquear"}"><i class="fa-solid fa-${b ? "unlock" : "ban"}"></i></button>`);
      acoes.push(`<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-prof-acao="${p.status === "inativo" ? "ativar" : "desativar"}" data-id="${p.id}" title="${p.status === "inativo" ? "Ativar" : "Desativar"}"><i class="fa-solid fa-power-off"></i></button>`);
      acoes.push(`<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-excluir="${p.id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>`);

      return `
        <tr>
          <td>
            <div class="adm-celula-pessoa">
              ${avatar(p.foto, p.nome, "adm-avatar-min")}
              <div>
                <strong>${esc(p.nome)}</strong>
                <span>${esc(p.email)}</span>
              </div>
            </div>
          </td>
          <td>${esc(p.registro || "—")}</td>
          <td>${esc(p.especialidade || "—")}</td>
          <td>${dataBR(p.data_cadastro)}</td>
          <td>${b ? '<span class="adm-tag vermelho">bloqueado</span>' : tagStatus(p.status)}</td>
          <td><div class="adm-acoes">${acoes.join("")}</div></td>
        </tr>`;
    }).join("");

    ligarAcoesProfissionais(corpo);
    ligarAcoesTabela(corpo, "profissional", carregarProfissionais);
  }

  /* Aprovar/rejeitar/bloquear/ativar profissional. Registrado uma
     vez só: o `{ once: true }` original era consumido pelo
     primeiro clique e deixava a tabela sem ação no carregamento
     seguinte. */
  function ligarAcoesProfissionais(tbody) {
    if (tabelasLigadas.has(tbody)) return;
    tabelasLigadas.add(tbody);

    tbody.addEventListener("click", async (evento) => {
      const alvo = evento.target.closest("button");
      if (!alvo || !alvo.dataset.profAcao) return;
      const acao = alvo.dataset.profAcao;
      const id = Number(alvo.dataset.id);

      if (acao === "rejeitar") {
        modal.abrir(
          "Rejeitar cadastro",
          `<p class="adm-muted" style="margin-bottom:12px">
             O motivo é obrigatório e será registrado na auditoria.
           </p>
           <div class="adm-field">
             <label for="motivoRejeicao">Motivo da rejeição</label>
             <input type="text" id="motivoRejeicao" placeholder="Ex.: documentação incompleta">
           </div>`,
          `<button type="button" class="adm-btn adm-btn-ghost" id="cancelarRej">Cancelar</button>
           <button type="button" class="adm-btn adm-btn-danger" id="confirmarRej">Rejeitar cadastro</button>`
        );
        $("#cancelarRej").addEventListener("click", () => modal.fechar());
        $("#confirmarRej").addEventListener("click", async () => {
          const motivo = $("#motivoRejeicao").value.trim();
          if (!motivo) { toast("Informe o motivo.", "erro"); return; }
          try {
            await api(`/api/admin/profissionais/${id}/rejeitar`, { metodo: "POST", corpo: { motivo } });
            modal.fechar();
            toast("Cadastro rejeitado.", "ok");
            carregarProfissionais();
          } catch (e) { toast(e.message, "erro"); }
        });
        return;
      }

      try {
        await api(`/api/admin/profissionais/${id}/${acao}`, { metodo: "POST", corpo: {} });
        toast("Ação aplicada.", "ok");
        carregarProfissionais();
      } catch (e) { toast(e.message, "erro"); }
    });
  }

  $("#buscaProf").addEventListener("input", debounce(carregarProfissionais, 260));
  $("#chipsProf").addEventListener("click", (e) => {
    const chip = e.target.closest(".adm-chip");
    if (!chip) return;
    $("#chipsProf .adm-chip").forEach((c) => c.classList.remove("ativo"));
    chip.classList.add("ativo");
    estado.filtroProf.status = chip.dataset.status;
    carregarProfissionais();
  });

  /* ------------------------------------------------------------
     COMUNIDADE
     ------------------------------------------------------------ */

  async function carregarComunidade() {
    let d;
    try {
      d = await api("/api/admin/comunidade");
    } catch { return; }

    estado.dados.comunidade = d;
    $("#contPublicacoes").textContent = d.publicacoes.length;
    $("#contComentarios").textContent = d.comentarios.length;

    $("#listaPublicacoes").innerHTML = d.publicacoes.length
      ? d.publicacoes.map((p) => `
          <div class="adm-post ${p.removida ? "adm-post-removida" : ""}">
            <div class="adm-post-topo">
              <div class="adm-post-autor">${esc(p.autor_nome)}</div>
              <div class="adm-post-meta">${esc(dataBR(p.criada_em, true))} · ${p.comentarios} comentário(s)</div>
              <div class="adm-post-acao">
                ${p.removida
                  ? '<span class="adm-tag cinza">removida</span>'
                  : `<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-rem-pub="${p.id}"><i class="fa-solid fa-trash"></i> Remover</button>`}
              </div>
            </div>
            <div class="adm-post-texto">${esc(p.conteudo)}</div>
          </div>`).join("")
      : vazio("Nenhuma publicação.");

    $("#listaComentarios").innerHTML = d.comentarios.length
      ? d.comentarios.map((c) => `
          <div class="adm-comentario ${c.removido ? "adm-post-removida" : ""}">
            <div class="adm-post-topo">
              <div class="adm-post-autor">${esc(c.autor_nome)}</div>
              <div class="adm-post-meta">${esc(dataBR(c.criado_em, true))}</div>
              <div class="adm-post-acao">
                ${c.removido
                  ? '<span class="adm-tag cinza">removido</span>'
                  : `<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-rem-com="${c.id}"><i class="fa-solid fa-trash"></i> Remover</button>`}
              </div>
            </div>
            <div class="adm-post-texto">${esc(c.conteudo)}</div>
          </div>`).join("")
      : vazio("Nenhum comentário.");

    $("#listaPublicacoes").addEventListener("click", (e) => {
      const b = e.target.closest("[data-rem-pub]");
      if (!b) return;
      const id = Number(b.dataset.remPub);
      confirmar(
        "Remover publicação",
        "Tem certeza que deseja remover esta publicação da comunidade?",
        "Remover",
        {
          motivo: true,
          funcao: async (motivo) => {
            await api(`/api/admin/publicacoes/${id}`, { metodo: "DELETE", corpo: { motivo } });
            carregarComunidade();
          },
        }
      );
    });

    $("#listaComentarios").addEventListener("click", (e) => {
      const b = e.target.closest("[data-rem-com]");
      if (!b) return;
      const id = Number(b.dataset.remCom);
      confirmar(
        "Remover comentário",
        "Tem certeza que deseja remover este comentário?",
        "Remover",
        {
          motivo: true,
          funcao: async (motivo) => {
            await api(`/api/admin/comentarios/${id}`, { metodo: "DELETE", corpo: { motivo } });
            carregarComunidade();
          },
        }
      );
    });
  }

  $("#chipsComunidade").addEventListener("click", (e) => {
    const chip = e.target.closest(".adm-chip");
    if (!chip) return;
    $("#chipsComunidade .adm-chip").forEach((c) => c.classList.remove("ativo"));
    chip.classList.add("ativo");
    estado.visaoComunidade = chip.dataset.visao;
    const alvo = estado.visaoComunidade === "publicacoes" ? $("#listaPublicacoes") : $("#listaComentarios");
    const oculto = estado.visaoComunidade === "publicacoes" ? $("#listaComentarios") : $("#listaPublicacoes");
    alvo.parentElement.style.display = "";
    oculto.parentElement.style.display = "none";
  });

  /* ------------------------------------------------------------
     DENÚNCIAS
     ------------------------------------------------------------ */

  async function carregarDenuncias() {
    const corpo = $("#tabelaDenuncias");
    corpo.innerHTML = `<tr><td colspan="6">${carregando()}</td></tr>`;

    let d;
    try {
      d = await api("/api/admin/denuncias");
    } catch { return; }

    let lista = d.denuncias;
    if (estado.filtroDen.status) {
      lista = lista.filter((x) => x.status === estado.filtroDen.status);
    }
    estado.dados.denuncias = lista;

    if (!lista.length) {
      corpo.innerHTML = `<tr><td colspan="6">${vazio("Nenhuma denúncia encontrada.")}</td></tr>`;
      return;
    }

    corpo.innerHTML = lista.map((x) => `
      <tr>
        <td>${esc(x.tipo_alvo)} #${esc(x.alvo_id)}</td>
        <td>${esc(x.alvo_autor || "—")}</td>
        <td>${esc(x.motivo)}</td>
        <td>${dataBR(x.criada_em, true)}</td>
        <td>${tagStatus(x.status)}</td>
        <td>
          <div class="adm-acoes">
            <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-den-ver="${x.id}">
              <i class="fa-regular fa-eye"></i>
            </button>
            <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-den-status="${x.id}" data-novo="em_analise">
              <i class="fa-solid fa-magnifying-glass"></i> Analisar
            </button>
            <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-den-status="${x.id}" data-novo="resolvida">
              <i class="fa-solid fa-check"></i> Resolver
            </button>
            <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-den-status="${x.id}" data-novo="arquivada">
              <i class="fa-solid fa-box-archive"></i> Arquivar
            </button>
          </div>
        </td>
      </tr>`).join("");

    corpo.onclick = async (evento) => {
      const ver = evento.target.closest("[data-den-ver]");
      if (ver) {
        abrirDenuncia(Number(ver.dataset.denVer));
        return;
      }
      const st = evento.target.closest("[data-den-status]");
      if (!st) return;
      const id = Number(st.dataset.denStatus);
      const novo = st.dataset.novo;
      try {
        await api(`/api/admin/denuncias/${id}`, { metodo: "PUT", corpo: { status: novo } });
        toast("Denúncia atualizada.", "ok");
        carregarDenuncias();
      } catch (e) { toast(e.message, "erro"); }
    };
  }

  function abrirDenuncia(id) {
    const lista = estado.dados.denuncias || [];
    const x = lista.find((i) => i.id === id);
    if (!x) return;

    modal.abrir(
      "Detalhes da denúncia",
      `<div style="margin-bottom:14px">
         <span class="adm-muted" style="display:block;font-size:.78rem">Status</span>
         <div>${tagStatus(x.status)}</div>
       </div>
       <div style="margin-bottom:10px">
         <span class="adm-muted" style="display:block;font-size:.78rem">Motivo</span>
         <div style="font-size:.88rem">${esc(x.motivo)}</div>
       </div>
       <div style="margin-bottom:10px">
         <span class="adm-muted" style="display:block;font-size:.78rem">Detalhes</span>
         <div style="font-size:.85rem">${esc(x.detalhes || "—")}</div>
       </div>
       <div style="margin-bottom:10px">
         <span class="adm-muted" style="display:block;font-size:.78rem">Conteúdo acusado</span>
         <div style="font-size:.85rem">${esc(x.tipo_alvo)} #${esc(x.alvo_id)} — responsável: ${esc(x.alvo_autor || "—")}</div>
       </div>
       <div style="margin-bottom:6px">
         <span class="adm-muted" style="display:block;font-size:.78rem">Registrada em</span>
         <div style="font-size:.85rem">${dataBR(x.criada_em, true)}</div>
       </div>
       <div class="adm-aviso-sensivel" style="margin-top:14px">
         <i class="fa-solid fa-info-circle"></i>
         <div>Remover o conteúdo ou bloquear o autor só é possível com motivo, e cada
         uma dessas ações fica registrada na auditoria.</div>
       </div>
       ${x.acao ? `<p class="adm-muted" style="font-size:.8rem">Ação anterior: ${esc(x.acao)}</p>` : ""}`,
      `<button type="button" class="adm-btn adm-btn-ghost" id="fecharDen">Fechar</button>
       <button type="button" class="adm-btn adm-btn-ghost" id="manterDen">Manter conteúdo</button>
       <button type="button" class="adm-btn adm-btn-danger" id="removerDen">Remover conteúdo</button>`
    );

    $("#fecharDen").addEventListener("click", () => modal.fechar());
    $("#manterDen").addEventListener("click", async () => {
      try {
        await api(`/api/admin/denuncias/${x.id}`, {
          metodo: "PUT",
          corpo: { status: "resolvida", acao: "conteúdo mantido" },
        });
        modal.fechar();
        toast("Conteúdo mantido e denúncia resolvida.", "ok");
        carregarDenuncias();
      } catch (e) { toast(e.message, "erro"); }
    });
    $("#removerDen").addEventListener("click", () => {
      modal.aoFechar = null;
      confirmar(
        "Remover conteúdo denunciado",
        "Tem certeza que deseja remover este conteúdo da comunidade?",
        "Remover",
        {
          motivo: true,
          funcao: async (motivo) => {
            await api(`/api/admin/denuncias/${x.id}`, {
              metodo: "PUT",
              corpo: { status: "resolvida", removerConteudo: true, motivo },
            });
            carregarDenuncias();
          },
        }
      );
    });
  }

  $("#chipsDen").addEventListener("click", (e) => {
    const chip = e.target.closest(".adm-chip");
    if (!chip) return;
    $("#chipsDen .adm-chip").forEach((c) => c.classList.remove("ativo"));
    chip.classList.add("ativo");
    estado.filtroDen.status = chip.dataset.status;
    carregarDenuncias();
  });

  /* ------------------------------------------------------------
     CONTEÚDOS
     ------------------------------------------------------------ */

  async function carregarConteudos() {
    const corpo = $("#tabelaConteudos");
    corpo.innerHTML = `<tr><td colspan="5">${carregando()}</td></tr>`;

    let d;
    try {
      d = await api("/api/admin/conteudos");
    } catch { return; }

    estado.dados.conteudos = d.conteudos;
    estado.dados.categorias = d.categorias;

    let lista = d.conteudos;
    if (estado.filtroConteudo.destino) {
      lista = lista.filter((c) => c.destino === estado.filtroConteudo.destino);
    }

    if (!lista.length) {
      corpo.innerHTML = `<tr><td colspan="5">${vazio("Nenhum conteúdo cadastrado.")}</td></tr>`;
      return;
    }

    corpo.innerHTML = lista.map((c) => `
      <tr>
        <td>${esc(c.titulo)}</td>
        <td>${esc(c.categoria || "—")}</td>
        <td><span class="adm-tag ${c.destino === "profissionais" ? "roxo" : "azul"}">${c.destino === "profissionais" ? "Profissionais" : "Usuários"}</span></td>
        <td>${c.publicado ? '<span class="adm-tag verde">publicado</span>' : '<span class="adm-tag ambar">rascunho</span>'}</td>
        <td>
          <div class="adm-acoes">
            <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-con-editar="${c.id}"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-con-toggle="${c.id}" data-novo="${c.publicado ? 0 : 1}">
              <i class="fa-solid fa-${c.publicado ? "eye-slash" : "eye"}"></i>
            </button>
            <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-con-excluir="${c.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`).join("");

    corpo.onclick = async (evento) => {
      const ed = evento.target.closest("[data-con-editar]");
      if (ed) { abrirConteudo(Number(ed.dataset.conEditar)); return; }

      const tg = evento.target.closest("[data-con-toggle]");
      if (tg) {
        try {
          await api(`/api/admin/conteudos/${tg.dataset.conToggle}`, {
            metodo: "PUT",
            corpo: { publicado: Number(tg.dataset.novo) === 1 },
          });
          toast(Number(tg.dataset.novo) === 1 ? "Conteúdo publicado." : "Conteúdo despublicado.", "ok");
          carregarConteudos();
        } catch (e) { toast(e.message, "erro"); }
        return;
      }

      const ex = evento.target.closest("[data-con-excluir]");
      if (ex) {
        const id = Number(ex.dataset.conExcluir);
        confirmar("Excluir conteúdo", "Tem certeza que deseja excluir este conteúdo?",
          "Excluir", async () => {
            await api(`/api/admin/conteudos/${id}`, { metodo: "DELETE", corpo: { confirmar: true } });
            carregarConteudos();
          });
      }
    };
  }

  function abrirConteudo(id) {
    const lista = estado.dados.conteudos || [];
    const cats = estado.dados.categorias || [];
    const item = id ? lista.find((c) => c.id === id) : null;

    const opcoesCat = '<option value="">Sem categoria</option>' +
      cats.map((c) => `<option value="${c.id}"${item && item.categoria_id === c.id ? " selected" : ""}>${esc(c.nome)} (${c.destino === "profissionais" ? "prof" : "usu"})</option>`).join("");

    modal.abrir(
      item ? "Editar conteúdo" : "Novo conteúdo",
      `<form id="fConteudo" novalidate>
        <div class="adm-field">
          <label for="ctTitulo">Título</label>
          <input type="text" id="ctTitulo" required value="${esc(item ? item.titulo : "")}">
        </div>
        <div class="adm-field">
          <label for="ctCorpo">Conteúdo</label>
          <textarea id="ctCorpo" style="min-height:150px" required>${esc(item ? item.corpo : "")}</textarea>
        </div>
        <div class="adm-linha2">
          <div class="adm-field">
            <label for="ctDestino">Destinado a</label>
            <select id="ctDestino">
              <option value="usuarios"${item && item.destino === "profissionais" ? "" : " selected"}>Usuários / Pacientes</option>
              <option value="profissionais"${item && item.destino === "profissionais" ? " selected" : ""}>Profissionais</option>
            </select>
          </div>
          <div class="adm-field">
            <label for="ctCategoria">Categoria</label>
            <select id="ctCategoria">${opcoesCat}</select>
          </div>
        </div>
        <label class="adm-item-check">
          <input type="checkbox" id="ctPublicado"${item && !item.publicado ? "" : " checked"}>
          <span>Publicado (visível no sistema)</span>
        </label>
      </form>`,
      `<button type="button" class="adm-btn adm-btn-ghost" id="cancelarCt">Cancelar</button>
       <button type="submit" form="fConteudo" class="adm-btn adm-btn-primary">
         <i class="fa-solid fa-floppy-disk"></i> Salvar
       </button>`
    );

    $("#cancelarCt").addEventListener("click", () => modal.fechar());
    $("#fConteudo").addEventListener("submit", async (e) => {
      e.preventDefault();
      const corpo = {
        titulo: $("#ctTitulo").value.trim(),
        corpo: $("#ctCorpo").value.trim(),
        destino: $("#ctDestino").value,
        categoria_id: Number($("#ctCategoria").value) || null,
        publicado: $("#ctPublicado").checked,
      };
      try {
        if (item) await api(`/api/admin/conteudos/${item.id}`, { metodo: "PUT", corpo });
        else await api("/api/admin/conteudos", { metodo: "POST", corpo });
        modal.fechar();
        toast("Conteúdo salvo.", "ok");
        carregarConteudos();
      } catch (erro) { toast(erro.message, "erro"); }
    });
  }

  $("#btnNovoConteudo").addEventListener("click", () => abrirConteudo(null));

  $("#chipsDestino").addEventListener("click", (e) => {
    const chip = e.target.closest(".adm-chip");
    if (!chip) return;
    $("#chipsDestino .adm-chip").forEach((c) => c.classList.remove("ativo"));
    chip.classList.add("ativo");
    estado.filtroConteudo.destino = chip.dataset.destino;
    carregarConteudos();
  });

  $("#btnCategorias").addEventListener("click", () => {
    const cats = estado.dados.categorias || [];
    modal.abrir(
      "Categorias de conteúdo",
      `<div class="adm-field">
         <label for="novaCat">Nova categoria</label>
         <input type="text" id="novaCat" placeholder="Ex.: Ansiedade">
       </div>
       <div class="adm-field">
         <label for="destinoCat">Destino</label>
         <select id="destinoCat">
           <option value="usuarios">Usuários / Pacientes</option>
           <option value="profissionais">Profissionais</option>
         </select>
       </div>
       <div style="margin-top:18px">
         <h4 style="font-size:.86rem;margin-bottom:8px">Existentes</h4>
         ${cats.length ? cats.map((c) => `
           <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #eef3fa">
             <span style="flex:1;font-size:.85rem">${esc(c.nome)}</span>
             <span class="adm-tag ${c.destino === "profissionais" ? "roxo" : "azul"}">${c.destino === "profissionais" ? "Profissionais" : "Usuários"}</span>
             <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-del-cat="${c.id}">
               <i class="fa-solid fa-trash"></i>
             </button>
           </div>`).join("") : vazio("Nenhuma categoria.")}
       </div>`,
      `<button type="button" class="adm-btn adm-btn-primary" id="addCat">
         <i class="fa-solid fa-plus"></i> Adicionar
       </button>`
    );

    $("#addCat").addEventListener("click", async () => {
      const nome = $("#novaCat").value.trim();
      if (!nome) { toast("Informe o nome.", "erro"); return; }
      try {
        await api("/api/admin/categorias", {
          metodo: "POST",
          corpo: { nome, destino: $("#destinoCat").value },
        });
        modal.fechar();
        toast("Categoria criada.", "ok");
        carregarConteudos();
      } catch (e) { toast(e.message, "erro"); }
    });

    $("#modalCorpo").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-del-cat]");
      if (!b) return;
      const id = b.dataset.delCat;
      confirmar("Excluir categoria", "Tem certeza que deseja excluir esta categoria?", "Excluir",
        async () => {
          await api(`/api/admin/categorias/${id}`, { metodo: "DELETE", corpo: { confirmar: true } });
          carregarConteudos();
        });
    });
  });

  /* ------------------------------------------------------------
     AGENDAMENTOS
     ------------------------------------------------------------ */

  async function carregarAgendamentos() {
    const corpo = $("#tabelaConsultas");
    corpo.innerHTML = `<tr><td colspan="6">${carregando()}</td></tr>`;

    let d;
    try {
      d = await api("/api/admin/agendamentos");
    } catch { return; }

    const total = d.consultas.length;
    const stats = d.estatisticas.porStatus;
    const get = (s) => (stats.find((x) => x.status === s) || { n: 0, v: 0 });

    $("#cardsAgendamentos").innerHTML = [
      { rot: "Total de consultas", val: total, ic: "fa-calendar-days", cor: "" },
      { rot: "Agendadas", val: get("agendada").n, ic: "fa-clock", cor: "" },
      { rot: "Realizadas", val: get("realizada").n, ic: "fa-circle-check", cor: "verde" },
      { rot: "Canceladas", val: get("cancelada").n, ic: "fa-circle-xmark", cor: "vermelho" },
    ].map((c) => `
      <div class="adm-card">
        <div class="adm-kpi">
          <div class="adm-kpi-icone ${c.cor}"><i class="fa-solid ${c.ic}"></i></div>
          <div><div class="adm-kpi-valor">${c.val}</div><div class="adm-kpi-rotulo">${esc(c.rot)}</div></div>
        </div>
      </div>`).join("");

    if (!total) {
      corpo.innerHTML = `<tr><td colspan="6">${vazio("Nenhum agendamento registrado.")}</td></tr>`;
      return;
    }

    corpo.innerHTML = d.consultas.map((c) => `
      <tr>
        <td>${dataBR(c.data)}</td>
        <td>${esc(c.hora)}</td>
        <td>${esc(c.profissional)}</td>
        <td>${esc(c.paciente)}</td>
        <td>${tagStatus(c.status)}</td>
        <td style="text-align:right">${moeda(c.valor)}</td>
      </tr>`).join("");
  }

  /* ------------------------------------------------------------
     FINANCEIRO
     ------------------------------------------------------------ */

  async function carregarFinanceiro() {
    const cards = $("#cardsFinanceiro");
    cards.innerHTML = carregando();

    const p = estado.periodo;
    let url = `/api/admin/financeiro?periodo=${p}`;
    if (p === "personalizado") {
      const de = $("#finDe").value, ate = $("#finAte").value;
      if (!de || !ate) { toast("Escolha as duas datas do período.", "erro"); return; }
      url += `&de=${de}&ate=${ate}`;
    }

    let d;
    try {
      d = await api(url);
    } catch { return; }

    $("#finPeriodoTexto").textContent =
      `Movimentações de ${dataBR(d.periodo.de)} até ${dataBR(d.periodo.ate)}.`;

    cards.innerHTML = `
      <div class="adm-destaque">
        <small>Saldo do período</small>
        <strong>${moeda(d.saldo)}</strong>
        <span>receitas − despesas pagas</span>
      </div>
      <div class="adm-card"><div class="adm-kpi">
        <div class="adm-kpi-icone verde"><i class="fa-solid fa-arrow-trend-up"></i></div>
        <div><div class="adm-kpi-valor adm-valor pos">${moeda(d.receitas)}</div>
        <div class="adm-kpi-rotulo">Receitas recebidas</div>
        <div class="adm-kpi-nota">${moeda(d.recebido)} pagas · ${moeda(d.pendente)} pendentes</div></div>
      </div></div>
      <div class="adm-card"><div class="adm-kpi">
        <div class="adm-kpi-icone vermelho"><i class="fa-solid fa-arrow-trend-down"></i></div>
        <div><div class="adm-kpi-valor adm-valor neg">${moeda(d.despesas)}</div>
        <div class="adm-kpi-rotulo">Despesas</div></div>
      </div></div>
      <div class="adm-card"><div class="adm-kpi">
        <div class="adm-kpi-icone"><i class="fa-solid fa-money-bill-transfer"></i></div>
        <div><div class="adm-kpi-valor">${moeda(d.faturamentoRealizado)}</div>
        <div class="adm-kpi-rotulo">Faturamento de consultas realizadas</div>
        <div class="adm-kpi-nota">somado das consultas, não de estimativas</div></div>
      </div></div>`;

    const movs = d.movimentacoes || [];
    $("#contMovimentacoes").textContent = movs.length;
    $("#tabelaMovimentacoes").innerHTML = movs.length
      ? movs.map((m) => `
          <tr>
            <td>${dataBR(m.data)}</td>
            <td>${esc(m.descricao)}${m.categoria ? `<br><span class="adm-muted" style="font-size:.74rem">${esc(m.categoria)}</span>` : ""}</td>
            <td>${m.status === "pago" ? '<span class="adm-tag verde">pago</span>' : '<span class="adm-tag ambar">pendente</span>'}</td>
            <td style="text-align:right" class="adm-valor ${m.tipo === "receita" ? "pos" : "neg"}">
              ${m.tipo === "receita" ? "+" : "−"} ${moeda(m.valor)}
            </td>
            <td>
              <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-del-mov="${m.id}" title="Excluir">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="5">${vazio("Nenhuma movimentação neste período.")}</td></tr>`;

    $("#tabelaMovimentacoes").onclick = (e) => {
      const b = e.target.closest("[data-del-mov]");
      if (!b) return;
      const id = b.dataset.delMov;
      confirmar("Excluir movimentação", "Tem certeza que deseja excluir esta movimentação?",
        "Excluir", async () => {
          await api(`/api/admin/movimentacoes/${id}`, { metodo: "DELETE", corpo: { confirmar: true } });
          carregarFinanceiro();
        });
    };

    const cats = Object.entries(d.porCategoria || {});
    const maior = Math.max(1, ...cats.map(([, v]) => Math.abs(v)));
    $("#finCategorias").innerHTML = cats.length
      ? cats.map(([nome, valor]) => `
          <div class="adm-barra-item">
            <div class="adm-barra-topo"><span>${esc(nome)}</span><span>${moeda(valor)}</span></div>
            <div class="adm-barra"><div class="adm-barra-fill" style="width:${Math.round((Math.abs(valor) / maior) * 100)}%"></div></div>
          </div>`).join("")
      : vazio("Sem lançamentos pagos neste período.");
  }

  $("#chipsPeriodo").addEventListener("click", (e) => {
    const chip = e.target.closest(".adm-chip");
    if (!chip) return;
    $("#chipsPeriodo .adm-chip").forEach((c) => c.classList.remove("ativo"));
    chip.classList.add("ativo");
    estado.periodo = chip.dataset.periodo;

    const perso = estado.periodo === "personalizado";
    $("#finDe").hidden = !perso;
    $("#finAte").hidden = !perso;
    if (perso) {
      const hoje = new Date().toISOString().slice(0, 10);
      $("#finDe").value = hoje;
      $("#finAte").value = hoje;
      $("#finDe").focus();
    }
    carregarFinanceiro();
  });

  $("#btnNovaMovimentacao").addEventListener("click", () => {
    modal.abrir(
      "Nova movimentação",
      `<form id="fMov" novalidate>
        <div class="adm-field">
          <label for="mvTipo">Tipo</label>
          <select id="mvTipo">
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
        </div>
        <div class="adm-field">
          <label for="mvDescricao">Descrição</label>
          <input type="text" id="mvDescricao" required>
        </div>
        <div class="adm-linha2">
          <div class="adm-field">
            <label for="mvValor">Valor (R$)</label>
            <input type="number" id="mvValor" step="0.01" min="0.01" required>
          </div>
          <div class="adm-field">
            <label for="mvData">Data</label>
            <input type="date" id="mvData" required>
          </div>
        </div>
        <div class="adm-linha2">
          <div class="adm-field">
            <label for="mvCategoria">Categoria</label>
            <input type="text" id="mvCategoria">
          </div>
          <div class="adm-field">
            <label for="mvStatus">Status</label>
            <select id="mvStatus">
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
        </div>
      </form>`,
      `<button type="button" class="adm-btn adm-btn-ghost" id="cancelarMv">Cancelar</button>
       <button type="submit" form="fMov" class="adm-btn adm-btn-primary">
         <i class="fa-solid fa-plus"></i> Registrar
       </button>`
    );
    $("#mvData").value = new Date().toISOString().slice(0, 10);
    $("#cancelarMv").addEventListener("click", () => modal.fechar());
    $("#fMov").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await api("/api/admin/movimentacoes", {
          metodo: "POST",
          corpo: {
            tipo: $("#mvTipo").value,
            descricao: $("#mvDescricao").value.trim(),
            valor: Number($("#mvValor").value),
            data: $("#mvData").value,
            categoria: $("#mvCategoria").value.trim(),
            status: $("#mvStatus").value,
          },
        });
        modal.fechar();
        toast("Movimentação registrada.", "ok");
        carregarFinanceiro();
      } catch (erro) { toast(erro.message, "erro"); }
    });
  });

  /* ------------------------------------------------------------
     RELATÓRIOS
     ------------------------------------------------------------ */

  async function carregarRelatorios() {
    const meses = $("#mesesRelatorio").value;
    let d;
    try {
      d = await api(`/api/admin/relatorios?meses=${meses}`);
    } catch { return; }

    estado.dados.relatorios = d;

    $("#cardsRelatorio").innerHTML = [
      { rot: "Crescimento de usuários", val: d.crescimento.reduce((s, p) => s + p.usuarios, 0), ic: "fa-users", cor: "" },
      { rot: "Crescimento de profissionais", val: d.crescimento.reduce((s, p) => s + p.profissionais, 0), ic: "fa-user-doctor", cor: "" },
      { rot: "Consultas realizadas", val: d.resumo.consultasRealizadas, ic: "fa-circle-check", cor: "verde" },
      { rot: "Denúncias registradas", val: d.resumo.denunciasTotal, ic: "fa-flag", cor: "ambar" },
    ].map((c) => `
      <div class="adm-card"><div class="adm-kpi">
        <div class="adm-kpi-icone ${c.cor}"><i class="fa-solid ${c.ic}"></i></div>
        <div><div class="adm-kpi-valor">${c.val}</div><div class="adm-kpi-rotulo">${esc(c.rot)}</div></div>
      </div></div>`).join("");

    /* Gráfico de barras agrupado — alturas proporcionais reais. */
    const serie = d.crescimento;
    const maximo = Math.max(1, ...serie.flatMap((p) => [p.usuarios, p.profissionais]));

    $("#graficoCrescimento").innerHTML = serie.map((p) => {
      const hU = Math.round((p.usuarios / maximo) * 100);
      const hP = Math.round((p.profissionais / maximo) * 100);
      const rot = p.mes.split("-").reverse().join("/");
      return `
        <div class="adm-g-col" title="${esc(rot)} · ${p.usuarios} usuário(s), ${p.profissionais} profissional(is)">
          <div class="adm-g-barras">
            <div class="adm-g-barra" style="height:${Math.max(hU, p.usuarios > 0 ? 4 : 2)}%"></div>
            <div class="adm-g-barra b2" style="height:${Math.max(hP, p.profissionais > 0 ? 4 : 2)}%"></div>
          </div>
          <div class="adm-g-rotulo">${esc(rot)}</div>
        </div>`;
    }).join("");

    const u = d.utilizacao;
    const itensUtil = [
      ["Novos usuários", u.novosUsuarios], ["Novos profissionais", u.novosProfissionais],
      ["Novas publicações", u.novasPublicacoes], ["Novos comentários", u.novosComentarios],
      ["Novas denúncias", u.novasDenuncias], ["Consultas agendadas", u.consultasAgendadas],
    ];
    const maxUtil = Math.max(1, ...itensUtil.map((i) => i[1]));
    $("#relUtilizacao").innerHTML = itensUtil.map(([rot, val]) => `
      <div class="adm-barra-item">
        <div class="adm-barra-topo"><span>${esc(rot)}</span><span>${val}</span></div>
        <div class="adm-barra"><div class="adm-barra-fill" style="width:${Math.round((val / maxUtil) * 100)}%"></div></div>
      </div>`).join("");

    $("#relOutros").innerHTML = `
      <table class="adm-tabela" style="border:1px solid var(--borda);border-radius:var(--raio-sm)">
        <thead><tr><th>Mês</th><th style="text-align:right">Consultas</th><th style="text-align:right">Publicações</th><th style="text-align:right">Denúncias</th></tr></thead>
        <tbody>${serie.map((p) => `
          <tr>
            <td>${esc(p.mes.split("-").reverse().join("/"))}</td>
            <td style="text-align:right">${p.consultas}</td>
            <td style="text-align:right">${p.publicacoes}</td>
            <td style="text-align:right">${p.denuncias}</td>
          </tr>`).join("")}
        </tbody>
      </table>`;
  }

  $("#mesesRelatorio").addEventListener("change", carregarRelatorios);

  /* ------------------------------------------------------------
     AUDITORIA
     ------------------------------------------------------------ */

  async function carregarAuditoria() {
    const corpo = $("#tabelaAuditoria");
    corpo.innerHTML = `<tr><td colspan="6">${carregando()}</td></tr>`;

    const f = encodeURIComponent($("#buscaAuditoria").value.trim());
    let d;
    try {
      d = await api(`/api/admin/auditoria?filtro=${f}&limite=300`);
    } catch { return; }

    if (!d.registros.length) {
      corpo.innerHTML = `<tr><td colspan="6">${vazio("Nenhum registro encontrado.")}</td></tr>`;
      return;
    }

    corpo.innerHTML = d.registros.map((a) => {
      const dt = new Date(a.em);
      const data = dt.toLocaleDateString("pt-BR");
      const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const cor = a.resultado === "sucesso" ? "verde" : a.resultado === "negado" ? "vermelho" : "ambar";
      return `
        <tr>
          <td>${data}</td>
          <td>${hora}</td>
          <td>${esc(a.admin_email || "—")}</td>
          <td>${esc(a.acao)}${a.detalhe ? `<br><span class="adm-muted" style="font-size:.74rem">${esc(resumirDetalhe(a.detalhe))}</span>` : ""}</td>
          <td>${esc(a.recurso || "—")}${a.recurso_id ? " #" + esc(a.recurso_id) : ""}</td>
          <td><span class="adm-tag ${cor}">${esc(a.resultado)}</span></td>
        </tr>`;
    }).join("");
  }

  function resumirDetalhe(texto) {
    try {
      const o = JSON.parse(texto);
      if (o.truncado) return "detalhe omitido";
      return Object.entries(o)
        .filter(([k]) => k !== "motivo")
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
    } catch {
      return "";
    }
  }

  $("#buscaAuditoria").addEventListener("input", debounce(carregarAuditoria, 260));

  /* ------------------------------------------------------------
     MEU PERFIL
     ------------------------------------------------------------ */

  async function carregarPerfil() {
    let d;
    try {
      d = await api("/api/admin/eu");
    } catch { return; }

    estado.eu = d;
    $("#pfNome").value = d.nome || "";
    $("#pfSobrenome").value = d.sobrenome || "";
    $("#pfEmail").value = d.email || "";
    $("#pfTelefone").value = d.telefone || "";
    $("#pfCargo").value = d.cargo || "";
    $("#pfDescricao").value = d.descricao || "";

    const alvo = $("#topoAvatar");
    if (d.foto && d.foto.startsWith("data:image/")) {
      alvo.innerHTML = `<img src="${esc(d.foto)}" alt="">`;
    } else {
      alvo.textContent = iniciais((d.nome || "") + " " + (d.email || ""));
    }
  }

  $("#pfFoto").addEventListener("change", async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    if (arquivo.size > 2 * 1024 * 1024) {
      toast("Imagem maior que 2 MB.", "erro");
      e.target.value = "";
      return;
    }
    const leitor = new FileReader();
    leitor.onload = async () => {
      try {
        await api("/api/admin/perfil", { metodo: "PUT", corpo: { foto: leitor.result } });
        toast("Foto atualizada.", "ok");
        carregarPerfil();
      } catch (erro) { toast(erro.message, "erro"); }
    };
    leitor.readAsDataURL(arquivo);
  });

  $("#formPerfil").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("/api/admin/perfil", {
        metodo: "PUT",
        corpo: {
          nome: $("#pfNome").value.trim(),
          sobrenome: $("#pfSobrenome").value.trim(),
          email: $("#pfEmail").value.trim(),
          telefone: $("#pfTelefone").value.trim(),
          cargo: $("#pfCargo").value.trim(),
          descricao: $("#pfDescricao").value.trim(),
        },
      });
      toast("Perfil atualizado.", "ok");
      carregarPerfil();
    } catch (erro) { toast(erro.message, "erro"); }
  });

  $("#formSenha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nova = $("#pfSenhaNova").value;
    const conf = $("#pfSenhaConf").value;

    if (nova !== conf) { toast("As senhas não coincidem.", "erro"); return; }

    try {
      await api("/api/admin/perfil/senha", {
        metodo: "PUT",
        corpo: { atual: $("#pfSenhaAtual").value, nova, confirmacao: conf },
      });
      $("#formSenha").reset();
      toast("Senha alterada.", "ok");
    } catch (erro) { toast(erro.message, "erro"); }
  });

  /* ------------------------------------------------------------
     CONFIGURAÇÕES
     ------------------------------------------------------------ */

  /* O tema é preferência do navegador (CMTema), não uma chave do
     servidor: por isso o campo NÃO tem data-config e é salvo na hora,
     sem esperar o botão "Salvar configurações". */
  function sincronizarCampoTema() {
    const campo = $("#cfgTemaEscuro");
    if (campo) campo.checked = window.CMTema.temaAtual() === window.CMTema.ESCURO;
  }

  document.addEventListener("cm:tema", sincronizarCampoTema);

  $("#cfgTemaEscuro").addEventListener("change", (evento) => {
    window.CMTema.salvarTema(evento.target.checked ? "escuro" : "claro");
  });

  async function carregarConfig() {
    let d;
    try {
      d = await api("/api/admin/config");
    } catch { return; }

    $$("[data-config]").forEach((campo) => {
      const valor = d.config[campo.dataset.config];
      if (campo.type === "checkbox") campo.checked = valor === "true";
      else campo.value = valor ?? "";
    });

    sincronizarCampoTema();

    const cats = d.categorias || [];
    $("#infoAdmin").innerHTML = `
      <div class="adm-info-linha">
        <span class="adm-info-rotulo">Conta</span>
        <span class="adm-info-valor">${esc(estado.eu ? estado.eu.email : "—")}</span>
      </div>
      <div class="adm-info-linha">
        <span class="adm-info-rotulo">Papel</span>
        <span class="adm-info-valor"><span class="adm-tag azul">admin</span></span>
      </div>
      <div class="adm-info-linha">
        <span class="adm-info-rotulo">Categorias</span>
        <span class="adm-info-valor">${cats.length} cadastrada(s)</span>
      </div>`;
  }

  $("#btnSalvarConfig").addEventListener("click", async () => {
    const config = {};
    $$("[data-config]").forEach((campo) => {
      config[campo.dataset.config] = campo.type === "checkbox" ? String(campo.checked) : campo.value;
    });
    try {
      await api("/api/admin/config", { metodo: "PUT", corpo: { config } });
      toast("Configurações salvas.", "ok");
    } catch (e) { toast(e.message, "erro"); }
  });

  /* ------------------------------------------------------------
     IMPORTAÇÃO DOS DADOS DO NAVEGADOR
     ------------------------------------------------------------
     Lê um .json exportado do localStorage (ou o JSON colado) e
     envia para o servidor. As chaves de diário e bem-estar são
     recusadas lá atrás — aqui só mostramos o que foi recusado.
     ------------------------------------------------------------ */

  const ROTULO_IMPORTADO = {
    usuarios: "usuário(s)",
    profissionais: "profissional(is)",
    publicacoes: "publicação(ões)",
    comentarios: "comentário(s)",
    denuncias: "denúncia(s)",
    consultas: "consulta(s)",
    conteudos: "conteúdo(s)",
    movimentacoes: "movimentação(ões)",
  };

  async function importarDados(texto) {
    let payload;
    try {
      payload = JSON.parse(texto);
    } catch {
      toast("O JSON enviado não é válido.", "erro");
      return;
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      toast("O arquivo precisa conter um objeto com as chaves do navegador.", "erro");
      return;
    }

    const btn = $("#btnImportar");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Importando…';

    try {
      const d = await api("/api/admin/importar", { metodo: "POST", corpo: { dados: payload } });
      const r = d.resumo || {};

      const linhas = Object.entries(ROTULO_IMPORTADO)
        .filter(([chave]) => r[chave])
        .map(([chave, rotulo]) => `<li><strong>${r[chave]}</strong> ${rotulo}</li>`)
        .join("");

      /* Importar de novo não duplica nada: o que já existia no banco
         aparece aqui para o admin entender o que aconteceu. */
      const repetidas = r.duplicadas
        ? `<p class="adm-muted adm-mt-s adm-nota">
             ${r.duplicadas} registro(s) já existiam no banco e foram mantidos,
             sem duplicar.
           </p>`
        : "";

      const recusadas = (r.rejeitadas || []).length
        ? `<div class="adm-alerta adm-alerta-erro adm-mt" data-visivel="1">
             <i class="fa-solid fa-ban"></i>
             <div>
               Recusadas por conterem dado sensível:
               <strong>${esc((r.rejeitadas || []).join(", "))}</strong>.
               Nada disso foi gravado.
             </div>
           </div>`
        : "";

      $("#resultadoImportar").innerHTML = `
        <div class="adm-alerta adm-alerta-ok" data-visivel="1">
          <i class="fa-solid fa-circle-check"></i>
          <div>Importação concluída.</div>
        </div>
        ${linhas ? `<ul class="adm-lista-simples adm-mt-s">${linhas}</ul>` : ""}
        ${repetidas}
        ${recusadas}`;

      toast("Dados importados.", "ok");

      /* as contagens do topo do painel já mudaram */
      carregarDashboard();
    } catch (e) {
      toast(e.message, "erro");
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-import"></i> Importar arquivo';
    }
  }

  $("#btnImportar").addEventListener("click", async () => {
    const arquivo = $("#importarArquivo").files?.[0];
    if (arquivo) {
      if (arquivo.size > 4 * 1024 * 1024) {
        toast("O arquivo passa de 4 MB.", "erro");
        return;
      }
      importarDados(await arquivo.text());
      return;
    }
    const colado = $("#importarColado").value.trim();
    if (!colado) {
      toast("Selecione um arquivo ou cole o JSON.", "erro");
      return;
    }
    importarDados(colado);
  });

  /* Importação direto do armazenamento deste navegador. Só vale
     quando o app foi aberto pela mesma origem do painel; caso
     contrário não há nada aqui para ler, e avisamos. */
  $("#btnImportarLocal").addEventListener("click", async () => {
    const coletas = {};
    for (const chave of CHAVES_IMPORTADAS) {
      const bruto = localStorage.getItem(chave);
      if (!bruto) continue;
      try { coletas[chave] = JSON.parse(bruto); } catch { /* chave corrompida: ignora */ }
    }

    if (!Object.keys(coletas).length) {
      toast(
        "Nada encontrado nesta origem. Abra o app pelo servidor (http://127.0.0.1:4173) ou use o arquivo .json.",
        "erro"
      );
      return;
    }
    importarDados(JSON.stringify(coletas));
  });

  /* ------------------------------------------------------------
     LOGOUT
     ------------------------------------------------------------ */

  $("#btnSair").addEventListener("click", () => {
    confirmar("Sair do painel", "Deseja encerrar a sessão administrativa?", "Sair", async () => {
      try {
        await api("/api/admin/logout", { metodo: "POST", corpo: {} });
      } catch {
        /* mesmo que a sessão já tenha caído, o logout local vale */
      }
      window.location.href = "login.html";
    });
  });

  /* ------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------ */

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  /* ------------------------------------------------------------
     BOOT — o servidor decide se esta página abre
     ------------------------------------------------------------ */

  (async function iniciar() {
    estado.csrf = lerCookie("cm_admin_csrf");

    let eu = null;
    try {
      eu = await api("/api/admin/eu");
    } catch {
      /* api() já redirecionou quando o servidor recusou */
      return;
    }

    if (!eu || eu.role !== "admin") {
      window.location.href = "login.html";
      return;
    }

    estado.eu = eu;

    const alvo = $("#topoAvatar");
    alvo.textContent = iniciais((eu.nome || "") + " " + eu.email);

    const inicial = (window.location.hash || "").replace("#", "");
    irPara(TITULOS[inicial] ? inicial : "dashboard");
  })();
})();