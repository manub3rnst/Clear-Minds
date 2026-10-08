/* ==========================================
   CLEAR MINDS — TEMA E PREFERÊNCIAS
   ==========================================
   Arquivo único compartilhado pelas telas que
   já passaram pelo Login/Cadastro (as duas
   Homes e o painel administrativo).

   Objetivo: o tema escuro e o tamanho do
   texto têm UM só lugar onde são decididos,
   lidos e gravados. As páginas só consumption
   o que está aqui.

   O script é carregado no <head> para que o
   atributo data-tema já esteja no <html>
   antes da primeira pintura — sem "flash"
   de tema claro ao abrir em modo escuro.
   ========================================== */

(function () {
    "use strict";

    const CHAVE_TEMA = "cm_tema";
    const CHAVE_CONFIG = "cm_config";
    const CLARO = "claro";
    const ESCURO = "escuro";
    const ESCALA_TEXTO = { pequeno: "15px", normal: "16px", grande: "18px" };

    const PADRAO_CONFIG = {
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
        tema: CLARO,
        tamanhoTexto: "normal"
    };

    /* -----------------------------------------
       Armazenamento (pode não existir, ex.:
       navegação privada). Nunca interrompe a
       página por causa disso.
    ----------------------------------------- */

    function lerJson(chave) {
        try {
            return JSON.parse(localStorage.getItem(chave) || "{}") || {};
        } catch {
            return {};
        }
    }

    function gravarJson(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
            return true;
        } catch {
            return false;
        }
    }

    /* -----------------------------------------
       TEMA
    ----------------------------------------- */

    /** Tema salvo, normalizado para "claro" ou "escuro". */
    function temaSalvo() {
        const bruto = lerJson(CHAVE_CONFIG).tema
            || (localStorage.getItem(CHAVE_TEMA) || "");
        return bruto === ESCURO ? ESCURO : CLARO;
    }

    /** Escreve o tema no <html>. É o que o CSS lê. */
    function aplicarTema(tema) {
        const valor = tema === ESCURO ? ESCURO : CLARO;
        document.documentElement.setAttribute("data-tema", valor);
        return valor;
    }

    /**
     * Salva o tema nas duas chaves de propósito:
     * cm_config é o que a tela de Configurações já
     * mostra e cm_tema é a chave direta, útil para
     * quem só quer saber o tema.
     */
    function salvarTema(tema) {
        const valor = aplicarTema(tema);
        const config = lerJson(CHAVE_CONFIG);
        config.tema = valor;
        gravarJson(CHAVE_CONFIG, config);
        try { localStorage.setItem(CHAVE_TEMA, valor); } catch { /* ignora */ }
        /* Quem tiver um controle na tela (o painel administrativo,
           por exemplo) pode se sincronizar por aqui. */
        try {
            document.dispatchEvent(new CustomEvent("cm:tema", { detail: valor }));
        } catch { /* ignora */ }
        return valor;
    }

    const temaAtual = () => document.documentElement.getAttribute("data-tema") === ESCURO ? ESCURO : CLARO;

    function alternarTema() {
        return salvarTema(temaAtual() === ESCURO ? CLARO : ESCURO);
    }

    /* -----------------------------------------
       PREFERÊNCIAS GERAIS (usuário/profissional)
    ----------------------------------------- */

    const lerConfig = () => lerJson(CHAVE_CONFIG);

    const lerConfigCompleta = () => Object.assign({}, PADRAO_CONFIG, lerConfig());

    function salvarConfig(parcial) {
        const nova = Object.assign({}, lerConfig(), parcial);
        gravarJson(CHAVE_CONFIG, nova);
        aplicarAparencia(nova);
        return nova;
    }

    /** Escala da fonte + tema, tudo derivado de um só lugar. */
    function aplicarAparencia(config) {
        const cfg = Object.assign({}, PADRAO_CONFIG, config);
        document.documentElement.style.fontSize = ESCALA_TEXTO[cfg.tamanhoTexto] || "16px";
        aplicarTema(cfg.tema);
    }

    /** Preenche os [data-cfg] da página com a preferência salva. */
    function preencherControles() {
        const padrao = lerConfigCompleta();
        document.querySelectorAll("[data-cfg]").forEach((el) => {
            const valor = padrao[el.dataset.cfg];
            if (valor === undefined) return;
            if (el.type === "checkbox") el.checked = Boolean(valor);
            else el.value = valor;
        });
        return padrao;
    }

    /**
     * Deixa toda a página respondendo sozinha: qualquer
     * elemento [data-cfg] grava ao mudar. Assim não
     * existe um listener por campo em cada página.
     */
    function ligarControles() {
        document.querySelectorAll("[data-cfg]").forEach((el) => {
            el.addEventListener("change", () => {
                salvarConfig({ [el.dataset.cfg]: el.type === "checkbox" ? el.checked : el.value });
            });
        });
    }

    /** Alinha ícone e aria-pressed dos botões de troca rápida. */
    function pintarAlternadores(raiz) {
        const escuro = temaAtual() === ESCURO;
        (raiz || document).querySelectorAll("[data-tema-alvo]").forEach((botao) => {
            botao.setAttribute("aria-pressed", escuro ? "true" : "false");
            const icone = botao.querySelector("i");
            if (!icone) return;
            icone.classList.toggle("fa-sun", escuro);
            icone.classList.toggle("fa-moon", !escuro);
        });
    }

    /** Deixa o botão de troca rápida (ícone sol/lua) funcionando. */
    function ligarAlternador(raiz) {
        const alvo = raiz || document;
        pintarAlternadores(alvo);
        alvo.querySelectorAll("[data-tema-alvo]").forEach((botao) => {
            botao.addEventListener("click", () => {
                alternarTema();
                pintarAlternadores(alvo);
            });
        });
    }

    /** Atalho usado no boot das Homes: resolve tudo de uma vez. */
    function iniciarPreferencias() {
        const config = preencherControles();
        aplicarAparencia(config);
        ligarControles();
        ligarAlternador();
        return config;
    }

    /* -----------------------------------------
       API pública
    ----------------------------------------- */

    window.CMTema = {
        CHAVE_TEMA,
        CHAVE_CONFIG,
        CLARO,
        ESCURO,
        ESCALA_TEXTO,
        PADRAO_CONFIG,
        lerConfig,
        lerConfigCompleta,
        salvarConfig,
        aplicarAparencia,
        preencherControles,
        ligarControles,
        ligarAlternador,
        pintarAlternadores,
        iniciarPreferencias,
        temaAtual,
        temaSalvo,
        aplicarTema,
        salvarTema,
        alternarTema
    };

    /* Aplica antes de a página pintar; o CSS escuro já está
       carregado neste ponto. */
    aplicarTema(temaSalvo());
})();