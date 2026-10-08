/* ==========================================================
   CLEAR MINDS — Tela de login administrativo
   ==========================================================
   Segue o mesmo estilo de CLIENTE do resto do painel, mas a
   decisão de acesso é sempre do servidor: este arquivo só
   envia credenciais e reage ao que a API responde.
   ========================================================== */

(() => {
  "use strict";

  const telaLogin = document.getElementById("telaLogin");
  const telaSetup = document.getElementById("telaSetup");
  const alertaErro = document.getElementById("alertaErro");
  const alertaSetup = document.getElementById("alertaSetup");

  const formLogin = document.getElementById("formLogin");
  const formSetup = document.getElementById("formSetup");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const senhaNova = document.getElementById("senhaNova");
  const senhaConf = document.getElementById("senhaConf");
  const forcaSenha = document.getElementById("forcaSenha");
  const btnEntrar = document.getElementById("btnEntrar");
  const btnSalvarSenha = document.getElementById("btnSalvarSenha");

  let csrf = "";

  /* ------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------ */

  const mostrarAlerta = (el, mensagem, tipo = "erro") => {
    if (!mensagem) {
      el.dataset.visivel = "0";
      el.textContent = "";
      return;
    }
    el.className = "adm-alerta adm-alerta-" + tipo;
    el.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i><div>' + mensagem + "</div>";
    el.dataset.visivel = "1";
  };

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
    if (csrf) cabecalhos["X-CSRF-Token"] = csrf;

    const resp = await fetch(caminho, {
      method: opcoes.metodo || "GET",
      headers: cabecalhos,
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      credentials: "same-origin",
    });

    const texto = await resp.text();
    let dados = null;
    try { dados = texto ? JSON.parse(texto) : null; } catch { dados = null; }

    return { ok: resp.ok, status: resp.status, dados };
  }

  /* ------------------------------------------------------------
     MOSTRAR SENHA
     ------------------------------------------------------------ */

  document.querySelectorAll(".adm-toggle").forEach((botao) => {
    botao.addEventListener("click", () => {
      const campo = document.getElementById(botao.dataset.alvo);
      if (!campo) return;
      const visivel = campo.type === "text";
      campo.type = visivel ? "password" : "text";
      botao.innerHTML = visivel
        ? '<i class="fa-regular fa-eye"></i>'
        : '<i class="fa-regular fa-eye-slash"></i>';
    });
  });

  /* ------------------------------------------------------------
     FORÇA DA SENHA
     ------------------------------------------------------------ */

  function avaliarSenha(valor) {
    const criterios = [
      { ok: valor.length >= 8, texto: "8 caracteres" },
      { ok: /[A-Za-zÀ-ÿ]/.test(valor), texto: "letras" },
      { ok: /[0-9]/.test(valor), texto: "números" },
    ];
    const faltando = criterios.filter((c) => !c.ok).map((c) => c.texto);
    forcaSenha.textContent = faltando.length
      ? "Falta: " + faltando.join(", ") + "."
      : "Senha com bom formato.";
    return faltando.length === 0;
  }

  senhaNova.addEventListener("input", () => avaliarSenha(senhaNova.value));

  /* ------------------------------------------------------------
     PRIMEIRO ACESSO
     A API de login responde de forma genérica (401) para não
     revelar quais e-mails existem. Quem decide se é o primeiro
     acesso é o endpoint /api/admin/estado e a tentativa de
     identificação: só uma conta realmente em setup avança.
     ------------------------------------------------------------ */

  async function entrarNoSetup(email) {
    const s = await api("/api/admin/setup/identificar", {
      metodo: "POST",
      corpo: { email },
    });
    if (s.ok && s.dados && s.dados.email) {
      csrf = lerCookie("cm_admin_csrf");
      document.getElementById("setupEmail").textContent = s.dados.email;
      telaLogin.hidden = true;
      telaSetup.hidden = false;
      senhaNova.focus();
      return true;
    }
    return false;
  }

  /* ------------------------------------------------------------
     LOGIN
     ------------------------------------------------------------ */

  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mostrarAlerta(alertaErro, "");

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email || !senha) {
      mostrarAlerta(alertaErro, "Preencha e-mail e senha.");
      return;
    }

    btnEntrar.disabled = true;
    btnEntrar.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verificando…';

    try {
      const r = await api("/api/admin/login", {
        metodo: "POST",
        corpo: { email, senha },
      });

      if (r.ok && r.dados && r.dados.role === "admin") {
        csrf = lerCookie("cm_admin_csrf");
        window.location.href = "admin.html";
        return;
      }

      /* Se a senha ainda não foi criada, o login sempre falha com
         401 genérico — tentamos o primeiro acesso antes de
         mostrar erro. */
      if ((await entrarNoSetup(email))) {
        mostrarAlerta(alertaErro, "");
        return;
      }

      mostrarAlerta(
        alertaErro,
        (r.dados && r.dados.erro) || "Não foi possível entrar."
      );
      senhaInput.value = "";
      senhaInput.focus();
    } catch {
      mostrarAlerta(
        alertaErro,
        "Servidor indisponível. Inicie o ambiente administrativo com <code>node admin/server.js</code>."
      );
    } finally {
      btnEntrar.disabled = false;
      btnEntrar.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar';
    }
  });

  /* ------------------------------------------------------------
     SETUP INICIAL
     ------------------------------------------------------------ */

  document.getElementById("btnVoltarSetup").addEventListener("click", () => {
    telaSetup.hidden = true;
    telaLogin.hidden = false;
    senhaNova.value = "";
    senhaConf.value = "";
  });

  formSetup.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mostrarAlerta(alertaSetup, "");

    const email = document.getElementById("setupEmail").textContent.trim();
    const senha = senhaNova.value;
    const confirmacao = senhaConf.value;

    if (!avaliarSenha(senha)) {
      mostrarAlerta(alertaSetup, "A senha ainda não atende aos requisitos mínimos.");
      return;
    }
    if (senha !== confirmacao) {
      mostrarAlerta(alertaSetup, "As senhas não coincidem.");
      return;
    }

    btnSalvarSenha.disabled = true;
    btnSalvarSenha.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Criando…';

    try {
      const r = await api("/api/admin/setup/definir-senha", {
        metodo: "POST",
        corpo: { email, senha, confirmacao },
      });

      if (r.ok) {
        csrf = lerCookie("cm_admin_csrf");
        /* entra imediatamente, sem obrigar a digitar duas vezes */
        const login = await api("/api/admin/login", {
          metodo: "POST",
          corpo: { email, senha },
        });
        if (login.ok) {
          window.location.href = "admin.html";
          return;
        }
        mostrarAlerta(alertaSetup, "Senha criada. Faça login.", "ok");
        setTimeout(() => {
          telaSetup.hidden = true;
          telaLogin.hidden = false;
          senhaInput.value = "";
          emailInput.value = email;
          senhaInput.focus();
        }, 900);
        return;
      }

      mostrarAlerta(alertaSetup, (r.dados && r.dados.erro) || "Não foi possível criar a senha.");
    } catch {
      mostrarAlerta(alertaSetup, "Servidor indisponível.");
    } finally {
      btnSalvarSenha.disabled = false;
      btnSalvarSenha.innerHTML = '<i class="fa-solid fa-key"></i> Criar senha e entrar';
    }
  });

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */

  (async function iniciar() {
    csrf = lerCookie("cm_admin_csrf");

    /* Se já existe sessão válida, entra direto. */
    const eu = await api("/api/admin/eu").catch(() => ({ ok: false }));
    if (eu.ok && eu.dados && eu.dados.role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    /* Se o setup ainda está pendente, já abre direto a tela de
       criação de senha, com o e-mail da conta confirmado pelo
       servidor. */
    const estado = await api("/api/admin/estado").catch(() => null);
    if (estado && estado.ok && estado.dados && estado.dados.setupNecessario) {
      const email = estado.dados.emailInicial || "";
      if (email && (await entrarNoSetup(email).catch(() => false))) {
        return;
      }
      document.getElementById("setupEmail").textContent = email || "—";
    }

    emailInput.focus();
  })();
})();