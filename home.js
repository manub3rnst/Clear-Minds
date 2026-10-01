/* ==========================================
   HOME DO ESTUDANTE (home.html)
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const sessao = localStorage.getItem("cm_session") || "";
    const tipo = localStorage.getItem("cm_tipo");

    /* ---------- GUARDA DE ACESSO ----------
       Estudante precisa estar logado; profissional vai para a sua home. */
    if (tipo === "profissional") {
        window.location.href = "home-profissional.html";
        return;
    }
    if (!sessao) {
        window.location.href = "login.html";
        return;
    }

    // Uso EFETIVO da sessão real (não é apenas para verificação):
    const emailUsuario = sessao;

    const perfil = JSON.parse(localStorage.getItem("cm_profile") || "{}");
    let nomeUsuario = (perfil.nome || "").trim() || "Estudante";

    const hora = new Date().getHours();
    const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

    /* ==========================================
       DADOS PERSISTENTES (estruturas prontas)
    ========================================== */
    const getLista = (chave) => JSON.parse(localStorage.getItem(chave) || "[]");
    const salvarLista = (chave, lista) => localStorage.setItem(chave, JSON.stringify(lista));

    // Feed da comunidade (postagens de todos)
    let postagens = getLista("cm_postagens");
    // Remoção de publicação inadequada registrada no sistema
    (() => {
        const antes = postagens.length;
        postagens = postagens.filter(p => !((p.texto || "").toLowerCase().includes("toma no cu")));
        if (postagens.length !== antes) salvarLista("cm_postagens", postagens);
    })();
    // Postagens curtidas pelo usuário logado
    let curtidas = getLista("cm_curtidas");
    // Conexões do usuário (estrutura pronta — amizades futuras)
    const amizades = getLista("cm_amizades");
    // Diário do usuário
    let diario = getLista("cm_diario");
    // Profissionais vinculados
    const vinculados = getLista("cm_profissionais_usuario");
    // Agenda de consultas
    const consultas = getLista("cm_consultas");

    const set = (id, valor) => { const el = document.getElementById(id); if (el) el.textContent = valor; };
    const show = (id) => { const el = document.getElementById(id); if (el) el.hidden = false; };
    const hide = (id) => { const el = document.getElementById(id); if (el) el.hidden = true; };
    const limpar = (id) => { const el = document.getElementById(id); if (el) el.innerHTML = ""; };
    const getConfigObj = () => JSON.parse(localStorage.getItem("cm_config") || "{}");

    /* Modal de confirmação reutilizável (Delete/Denunciar não usa confirmação, etc.) */
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

    /* Muda para uma seção do painel (usado por botões de atalho) */
    const irParaSecao = (nome) => {
        const item = document.querySelector(`.cm-side-item[data-secao="${nome}"]`);
        if (item) item.click();
    };

    /* Emoji correspondente ao humor (Diário) */
    const humorEmoji = (humor) => {
        const mapa = { "Ótimo": "😊", "Bem": "🙂", "Neutro": "😐", "Ansioso(a)": "😟", "Difícil": "😔" };
        return mapa[humor] || "📓";
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

    /* Escapa textos antes de inserir via innerHTML */
    const esc = (s) => String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    /* ==========================================
       CONTEÚDOS EDUCATIVOS (demonstrativos)
    ========================================== */
    const conteudosUsuario = [
        {
            id: 1,
            categoria: "Saúde mental",
            icone: "fa-solid fa-brain",
            titulo: "O que é o autocuidado e por onde começar",
            data: "Fevereiro de 2026",
            teaser: "Autocuidado vai muito além de skincare ou banho demorado. Entenda o que é, por que importa e como criar uma rotina simples.",
            corpo: [
                { tipo: "p", texto: "Autocuidado é a prática de cuidar ativamente da própria saúde física, emocional e social. Não é um luxo nem um item da agenda: é uma necessidade que ajuda a manter o equilíbrio no dia a dia." },
                { tipo: "h3", texto: "Por onde começar?" },
                { tipo: "ul", itens: ["Escolha um hábito pequeno e realista para esta semana.", "Reserve um tempo fixo do dia só para você.", "Preste atenção em como você se sente durante a atividade."] },
                { tipo: "p", texto: "O autocuidado é individual: o que funciona para outra pessoa pode não funcionar para você. A ideia não é ser perfeito, e sim ser constante." }
            ]
        },
        {
            id: 2,
            categoria: "Ansiedade",
            icone: "fa-solid fa-wind",
            titulo: "Técnica 3-3-3 para momentos de ansiedade",
            data: "Fevereiro de 2026",
            teaser: "Um exercício rápido de ancoragem para usar quando a ansiedade aparecer: 3-3-3.",
            corpo: [
                { tipo: "p", texto: "Quando a ansiedade chega de repente, o corpo acelera e a mente cria uma sensação de urgência. A técnica 3-3-3 ajuda a trazer a atenção de volta para o presente." },
                { tipo: "h3", texto: "Como fazer" },
                { tipo: "ul", itens: ["Nomeie 3 coisas que você consegue ver à sua volta.", "Identifique 3 sons que você consegue ouvir agora.", "Mexa 3 partes do corpo: pés, dedos e mãos." ] },
                { tipo: "p", texto: "Se a ansiedade for frequente ou intensa, procure um profissional de saúde mental. Técnicas rápidas ajudam, mas não substituem o acompanhamento." }
            ]
        },
        {
            id: 3,
            categoria: "Rotina de estudos",
            icone: "fa-solid fa-book-open",
            titulo: "Como o sono afeta sua memória e suas notas",
            data: "Janeiro de 2026",
            teaser: "Dormir bem não é 'perder tempo': é parte essencial do aprendizado.",
            corpo: [
                { tipo: "p", texto: "Durante o sono, o cérebro organiza e consolida o que você estudou durante o dia. Estudar a madrugada toda, sem dormir, costuma trazer mais prejuízo que benefício." },
                { tipo: "h3", texto: "O que ajuda" },
                { tipo: "ul", itens: ["Mantenha horários regulares de dormir e acordar.", "Evite telas até 30 ou 40 minutos antes de deitar.", "Prefira revisões curtas diárias a 'noites viradas' de véspera."] },
                { tipo: "p", texto: "Uma boa noite de sono melhora atenção, humor e memória — três fatores diretos no seu desempenho escolar." }
            ]
        },
        {
            id: 4,
            categoria: "Relacionamentos",
            icone: "fa-solid fa-heart",
            titulo: "Amizades que fazem bem: sinais e limites",
            data: "Janeiro de 2026",
            teaser: "Relações saudáveis precisam de cuidado mútuo — e de limites claros.",
            corpo: [
                { tipo: "p", texto: "Amizades boas trazem apoio e leveza. Mas nem todo vínculo faz bem. Perceber quando uma relação está te desgastando é um primeiro passo importante." },
                { tipo: "h3", texto: "Alguns sinais de uma relação saudável" },
                { tipo: "ul", itens: ["Você se sente ouvido(a) e respeitado(a).", "Há espaço para discordar sem medo de represália.", "O apoio é mútuo, não só de um lado."] },
                { tipo: "p", texto: "Estabelecer limites não é egoísmo — é cuidado consigo mesmo. Você pode escolher suas amizades." }
            ]
        },
        {
            id: 5,
            categoria: "Emoções",
            icone: "fa-solid fa-face-smile",
            titulo: "Por que nomear emoções ajuda a lidar com elas",
            data: "Janeiro de 2026",
            teaser: "Dar nome aos sentimentos reduz sua intensidade e aumenta o autoconhecimento.",
            corpo: [
                { tipo: "p", texto: "Estudos mostram que colocar em palavras o que sentimos (por exemplo: 'estou frustrado', 'estou inseguro') reduz a ativação emocional e ajuda o raciocínio." },
                { tipo: "h3", texto: "Como praticar" },
                { tipo: "ul", itens: ["Quando sentir algo forte, tente descrever em 1 ou 2 palavras.", "Escreva no diário o que aconteceu, o que sentiu e por quê.", "Não julgue a emoção: apenas reconheça que ela existe."] },
                { tipo: "p", texto: "Reconhecer emoções é o primeiro passo para lidar com elas de forma mais equilibrada." }
            ]
        }
    ];

    const abrirLeitor = (c) => {
        const overlay = document.getElementById("cmReaderOverlay");
        if (!overlay) return;
        const fmt = (v) => esc(String(v));
        const setEl = (id, valor) => { const el = document.getElementById(id); if (el) el.innerHTML = valor; };
        setEl("cmReaderCategoria", `<i class="${fmt(c.icone)}" aria-hidden="true"></i> ${fmt(c.categoria)}`);
        setEl("cmReaderData", fmt(c.data));
        setEl("cmReaderTitulo", fmt(c.titulo));
        setEl("cmReaderTeaser", fmt(c.teaser || ""));
        const corpo = (c.corpo || []).map(bloco => {
            if (bloco.tipo === "h3") return `<h3>${fmt(bloco.texto)}</h3>`;
            if (bloco.tipo === "ul") return `<ul>${bloco.itens.map(i => `<li>${fmt(i)}</li>`).join("")}</ul>`;
            return `<p>${fmt(bloco.texto)}</p>`;
        }).join("");
        setEl("cmReaderCorpo", corpo);
        overlay.classList.add("show");
    };

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

    const renderConteudosUsuario = (filtro) => {
        const lista = document.getElementById("listaConteudosUsuario");
        const vazio = document.getElementById("conteudosUsuarioVazio");
        if (!lista) return;
        limpar("listaConteudosUsuario");
        const termo = (filtro || "").trim().toLowerCase();
        const items = conteudosUsuario.filter(c => !termo ||
            c.titulo.toLowerCase().includes(termo) ||
            c.categoria.toLowerCase().includes(termo));
        if (!items.length) { if (vazio) vazio.hidden = false; return; }
        if (vazio) vazio.hidden = true;
        items.forEach(c => {
            const li = document.createElement("li");
            li.className = "cm-conteudo-item";
            li.setAttribute("role", "button");
            li.setAttribute("tabindex", "0");
            li.innerHTML = `
                <span class="cm-conteudo-card-icon" style="background:var(--secondary);color:var(--primary-dark);">
                    <i class="${esc(c.icone)}" aria-hidden="true"></i>
                </span>
                <div class="cm-info">
                    <strong>${esc(c.titulo)}</strong>
                    <small><span class="cm-tag" style="font-size:.68rem;">${esc(c.categoria)}</span> · ${esc(c.data)} · ${esc(c.teaser)}</small>
                </div>
                <i class="fa-solid fa-chevron-right" style="color:#C4D4E6;flex-shrink:0;" aria-hidden="true"></i>`;
            li.addEventListener("click", () => abrirLeitor(c));
            li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirLeitor(c); } });
            lista.appendChild(li);
        });
    };
    renderConteudosUsuario();

    /* ---------- Identificação ---------- */
    set("saudacao", `${periodo}, ${nomeUsuario.split(" ")[0]}! 🌿`);
    set("topoNomeUsuario", `Olá, ${nomeUsuario.split(" ")[0]}`);
    set("sideNome", nomeUsuario);
    set("composerNomeAut", `${nomeUsuario.split(" ")[0]}, como você está?`);
    set("composerNomeAut2", `${nomeUsuario.split(" ")[0]}, compartilhe com a comunidade`);

    const aplicarFoto = (el, nome) => {
        if (!el) return;
        const iniciais = nome.split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("");
        if (perfil.foto) el.innerHTML = `<img src="${perfil.foto}" alt="Foto de perfil">`;
        else el.textContent = iniciais;
    };

    const avatar = document.getElementById("avatarIniciais");
    aplicarFoto(avatar, nomeUsuario);
    aplicarFoto(document.getElementById("sideAvatar"), nomeUsuario);
    aplicarFoto(document.getElementById("composerAvatar"), nomeUsuario);
    aplicarFoto(document.getElementById("composerAvatar2"), nomeUsuario);
    aplicarFoto(document.getElementById("perfilAvatar"), nomeUsuario);

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

    /* Fecha os menus de três pontinhos ao clicar fora deles */
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".cm-comm-menu")) {
            document.querySelectorAll(".cm-comm-dropdown.show").forEach(d => d.classList.remove("show"));
        }
        if (!e.target.closest(".cm-post-menu")) {
            document.querySelectorAll(".cm-post-dropdown.show").forEach(d => d.classList.remove("show"));
        }
    });

    /* ==========================================
       NAVEGAÇÃO ENTRE SEÇÕES (menu lateral)
    ========================================== */
    const botoesMenu = document.querySelectorAll(".cm-side-item[data-secao]");

    botoesMenu.forEach(btn => {
        btn.addEventListener("click", () => {
            const alvo = btn.dataset.secao;
            botoesMenu.forEach(b => b.classList.toggle("active", b.dataset.secao === alvo));
            document.querySelectorAll(".cm-section").forEach(s => s.classList.remove("active"));
            const secao = document.getElementById(`sec-${alvo}`);
            if (secao) secao.classList.add("active");
            fecharMenu();
            recolherMenuLateral();
            btn.blur();
            window.scrollTo({ top: 0, behavior: "smooth" });
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

    /* ==========================================
       PESSOAS PARA SEGUIR (comunidade) + busca
    ========================================== */
    // Conjunto de pessoas conhecidas da comunidade (a partir de quem já publicou)
    const conhecerPessoas = () => {
        const mapa = {};
        postagens.forEach(p => {
            if (p.autorEmail && p.autorEmail !== emailUsuario && p.autor) {
                mapa[p.autorEmail] = { email: p.autorEmail, nome: p.autor };
            }
        });
        return Object.values(mapa);
    };

    // Quem o usuário já segue (estrutura cm_amizades)
    const seguirPessoa = (email) => {
        if (!amizades.some(a => a.email === email)) {
            amizades.push({ email, nome: "", data: new Date().toISOString() });
            salvarLista("cm_amizades", amizades);
        }
    };

    const renderSugestoes = (filtro) => {
        const lista = document.getElementById("listaSugestoes");
        const vazio = document.getElementById("sugestoesVazio");
        if (!lista) return;

        const pessoas = conhecerPessoas();
        const jaSeguidas = amizades.map(a => a.email);
        const sugestoes = pessoas.filter(p => !jaSeguidas.includes(p.email));
        const busca = (filtro || "").trim().toLowerCase();
        const exibir = sugestoes.filter(p =>
            !busca || p.nome.toLowerCase().includes(busca) || p.email.toLowerCase().includes(busca));

        limpar("listaSugestoes");
        if (!exibir.length) { if (vazio) vazio.hidden = false; return; }
        if (vazio) vazio.hidden = true;

        exibir.forEach(p => {
            const li = document.createElement("li");
            const ini = (p.nome || "U").split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("");
            li.innerHTML = `
                <span class="cm-avatar cm-avatar-sm">${ini}</span>
                <div class="cm-info">
                    <strong>${p.nome}</strong>
                    <small>${p.email}</small>
                </div>
                <button type="button" class="cm-follow-btn follow-${p.email}">Seguir <i class="fa-solid fa-user-plus" aria-hidden="true"></i></button>
            `;
            lista.appendChild(li);
        });

        lista.querySelectorAll(".cm-follow-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const email = btn.classList[1].replace("follow-", "");
                seguirPessoa(email);
                renderSugestoes(document.getElementById("buscaSugestoes")?.value);
            });
        });
    };

    const atualizarSugestoes = () => renderSugestoes(document.getElementById("buscaSugestoes")?.value || "");

    const buscaSugestoes = document.getElementById("buscaSugestoes");
    if (buscaSugestoes) buscaSugestoes.addEventListener("input", () => renderSugestoes(buscaSugestoes.value));
    renderSugestoes("");

    /* ==========================================
       SIDEBAR AUTOMÁTICA PARA DESTAQUES
    ========================================== */
    // Ao publicar, volta para a seção Início para o usuário ver a publicação.

    /* ==========================================
       COMUNIDADE — CRIAÇÃO DE POST
    ========================================== */
    const limparPost = (idTexto, idMoods, n) => {
        const texto = document.getElementById(idTexto);
        if (texto) texto.value = "";
        const moods = document.getElementById(idMoods);
        if (moods) moods.querySelectorAll(".cm-mood-chip").forEach(c => c.classList.remove("active"));
        if (n) {
            midiasPendentes[n] = null;
            renderPreviewMidia(n);
        }
    };

    /* ==========================================
       COMUNIDADE — MÍDIA NA CRIAÇÃO DE POST
    ========================================== */
    const midiasPendentes = { "1": null, "2": null };

    const ACCEPT_MIDIA = {
        foto: "image/*",
        imagem: "image/*",
        video: "video/*",
        arquivo: "image/*,video/*,.pdf,.doc,.docx,.txt,.csv"
    };

    const processarArquivo = (file, ok, erro) => {
        if (file.type.startsWith("image/")) {
            const leitor = new FileReader();
            leitor.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const MAX = 1000;
                    let w = img.width;
                    let h = img.height;
                    if (w > MAX || h > MAX) {
                        const escala = Math.min(MAX / w, MAX / h);
                        w = Math.round(w * escala);
                        h = Math.round(h * escala);
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
                    ok({ tipo: "imagem", url: canvas.toDataURL("image/jpeg", 0.82), nome: file.name });
                };
                img.onerror = () => erro("Não foi possível ler a imagem.");
                img.src = leitor.result;
            };
            leitor.onerror = () => erro("Erro ao ler o arquivo.");
            leitor.readAsDataURL(file);
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            erro("Arquivo muito grande no momento (máx. ~3MB).");
            return;
        }

        const leitor = new FileReader();
        leitor.onload = () => ok({ tipo: file.type.startsWith("video/") ? "video" : "arquivo", url: leitor.result, nome: file.name });
        leitor.onerror = () => erro("Erro ao ler o arquivo.");
        leitor.readAsDataURL(file);
    };

    const renderPreviewMidia = (n) => {
        const slot = document.getElementById(`midiaPreview${n}`);
        if (!slot) return;
        const pend = midiasPendentes[n];
        if (!pend || !pend.url) {
            slot.classList.remove("show");
            slot.innerHTML = "";
            return;
        }
        slot.classList.add("show");
        slot.innerHTML = (pend.tipo === "imagem"
                ? `<img src="${pend.url}" alt="Prévia da imagem">`
                : pend.tipo === "video"
                    ? `<video src="${pend.url}" controls preload="metadata"></video>`
                    : `<div class="cm-file-chip"><i class="fa-solid fa-paperclip"></i><span>${esc(pend.nome || "Arquivo anexado")}</span></div>`)
            + `<button type="button" class="cm-media-remove" data-midia-remove="${n}" aria-label="Remover mídia"><i class="fa-solid fa-xmark"></i></button>`;
    };

    const configurarMidia = (n) => {
        const composer = document.querySelector(`.cm-composer[data-composer="${n}"]`);
        if (!composer) return;

        const input = document.createElement("input");
        input.type = "file";
        input.style.display = "none";
        composer.appendChild(input);

        composer.querySelectorAll(".cm-media-btn[data-midia-btn]").forEach(btn => {
            btn.addEventListener("click", () => {
                input.accept = ACCEPT_MIDIA[btn.dataset.tipo] || "image/*";
                input.value = "";
                input.click();
            });
        });

        input.addEventListener("change", () => {
            const f = input.files && input.files[0];
            if (!f) return;
            const alvo = n;
            processarArquivo(f, (pend) => {
                midiasPendentes[alvo] = pend;
                renderPreviewMidia(alvo);
                notificar("Mídia adicionada a esta publicação.");
            }, (erro) => notificar(erro));
        });

        composer.addEventListener("click", (e) => {
            const rem = e.target.closest("[data-midia-remove]");
            if (!rem) return;
            const chave = rem.dataset.midiaRemove;
            midiasPendentes[chave] = null;
            renderPreviewMidia(chave);
        });
    };

    configurarMidia("1");
    configurarMidia("2");

    const ativarMood = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return null;
        container.querySelectorAll(".cm-mood-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                container.querySelectorAll(".cm-mood-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
            });
        });
        return container;
    };

    const publicar = (idTexto, idMoods, n) => {
        const textoEl = document.getElementById(idTexto);
        const texto = (textoEl?.value || "").trim();
        if (!texto) return;

        const moods = document.getElementById(idMoods);
        const humor = moods?.querySelector(".cm-mood-chip.active")?.dataset.humor || "";

        postagens.push({
            id: Date.now().toString(),
            autor: nomeUsuario,
            autorEmail: emailUsuario,
            humor,
            texto,
            midia: (n ? midiasPendentes[n] : null) || null,
            data: new Date().toISOString(),
            curtidasCount: 0,
            comentarios: []
        });

        salvarLista("cm_postagens", postagens);
        atualizarFeeds();
        limparPost(idTexto, idMoods, n);

        // Mostra uma confirmação discreta
        const confirm = document.getElementById("postConfirm");
        if (confirm) {
            confirm.hidden = false;
            setTimeout(() => { confirm.hidden = true; }, 2500);
        }
    };

    ativarMood("composerMoods");
    ativarMood("composerMoods2");

    const btnPub1 = document.getElementById("btnPublicar");
    const btnPub2 = document.getElementById("btnPublicar2");
    const feed1 = document.getElementById("feedPosts");
    const feed2 = document.getElementById("feedPosts2");

    if (btnPub1) btnPub1.addEventListener("click", () => publicar("composerTexto", "composerMoods", "1"));
    if (btnPub2) btnPub2.addEventListener("click", () => publicar("composerTexto2", "composerMoods2", "2"));

    /* ==========================================
       COMUNIDADE — RENDER DO FEED
    ========================================== */
    const formatarData = (iso) => {
        const d = new Date(iso);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    const renderFeed = (container) => {
        if (!container) return;
        limpar(container.id);

        const emptyEl = document.getElementById(container.id === "feedPosts" ? "feedVazio" : "feedVazio2");

        if (!postagens.length) {
            if (emptyEl) emptyEl.hidden = false;
            return;
        }
        if (emptyEl) emptyEl.hidden = true;

        const postsOrdenados = [...postagens]
            .filter(p => p && p.autor)
            .sort((a, b) => (a.data > b.data ? -1 : 1));

        postsOrdenados.forEach(p => {
            const artigo = document.createElement("article");
            artigo.className = "cm-post";
            artigo.dataset.postId = p.id;

            const euCurto = curtidas.includes(p.id);
            const inicial = (p.autor || "?").split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("");
            const ehMeuPost = (p.autorEmail || "") === emailUsuario;

            const midia = p.midia;
            const midiaHtml = midia && midia.url
                ? (midia.tipo === "imagem"
                    ? `<div class="cm-post-midia"><img src="${midia.url}" alt="Imagem da publicação"></div>`
                    : midia.tipo === "video"
                        ? `<div class="cm-post-midia"><video src="${midia.url}" controls preload="metadata"></video></div>`
                        : `<div class="cm-post-midia"><div class="cm-file-chip"><i class="fa-solid fa-paperclip"></i><span>${esc(midia.nome || "Arquivo anexado")}</span></div></div>`)
                : "";

            const postAcoes = ehMeuPost
                ? `<button type="button" data-post-acao="excluir" data-post="${esc(p.id)}" class="cm-comm-danger"><i class="fa-regular fa-trash-can"></i> Excluir publicação</button>`
                : ((() => {
                    const jaSigo = p.autorEmail ? amizades.some(a => a.email === p.autorEmail) : false;
                    let html = "";
                    if (p.autorEmail) {
                        html += `<button type="button" data-post-acao="seguir" data-post="${esc(p.id)}" data-email="${esc(p.autorEmail)}" data-nome="${esc(p.autor)}">
                            <i class="fa-${jaSigo ? "solid" : "regular"} fa-user-${jaSigo ? "minus" : "plus"}"></i> ${jaSigo ? "Deixar de seguir" : "Seguir"}
                        </button>`;
                    }
                    html += `<button type="button" data-post-acao="denunciar" data-post="${esc(p.id)}" class="cm-comm-danger"><i class="fa-solid fa-flag"></i> Denunciar publicação</button>`;
                    return html;
                })());

            const comentariosHtml = (p.comentarios || []).map((c, i) => {
                const ehMeu = (c.autorEmail || "") === emailUsuario;
                const inicial = (c.autor || "?").split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("");
                const acoes = ehMeu
                    ? `<button type="button" data-acao="editar"><i class="fa-solid fa-pen"></i> Editar comentário</button>
                       <button type="button" data-acao="excluir" class="cm-comm-danger"><i class="fa-regular fa-trash-can"></i> Excluir comentário</button>`
                    : `<button type="button" data-acao="denunciar" class="cm-comm-danger"><i class="fa-solid fa-flag"></i> Denunciar comentário</button>`;
                return `
                <div class="cm-comment-item" data-post="${esc(p.id)}" data-idx="${i}">
                    <span class="cm-avatar cm-avatar-sm">${esc(inicial)}</span>
                    <div class="cm-bubble">
                        <strong>${esc(c.autor)}</strong>
                        <p>${esc(c.texto)}</p>
                    </div>
                    <div class="cm-comm-menu">
                        <button type="button" class="cm-comm-dots" aria-label="Opções do comentário"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                        <div class="cm-comm-dropdown">${acoes}</div>
                    </div>
                </div>`;
            }).join("");

            artigo.innerHTML = `
                <div class="cm-post-head">
                    <span class="cm-avatar cm-avatar-sm">${inicial}</span>
                    <div class="cm-author">
                        <strong>${p.autor}</strong>
                        <small>${formatarData(p.data)}${p.humor ? ` · ${p.humor}` : ""}</small>
                    </div>
                    <div class="cm-post-menu">
                        <button type="button" class="cm-post-dots" aria-label="Opções da publicação"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                        <div class="cm-post-dropdown">${postAcoes}</div>
                    </div>
                </div>
                <div class="cm-post-body">
                    <p class="cm-post-text">${p.texto}</p>
                    ${midiaHtml}
                </div>
                <div class="cm-post-actions">
                    <button type="button" class="cm-post-btn post-like ${euCurto ? "active" : ""}" data-post="${p.id}">
                        <i class="fa-${euCurto ? "solid" : "regular"} fa-heart"></i> <span>${(p.curtidasCount || 0)}</span>
                    </button>
                    <button type="button" class="cm-post-btn post-comment" data-post="${p.id}">
                        <i class="fa-regular fa-comment"></i> <span>${(p.comentarios || []).length}</span>
                    </button>
                    <button type="button" class="cm-post-btn post-share" data-post="${p.id}">
                        <i class="fa-solid fa-share"></i> Compartilhar
                    </button>
                </div>
                <div class="cm-share-box" id="share-${p.id}">
                    ${amizades.length
                        ? `<p class="cm-share-note">Escolha com quem compartilhar:</p>
                           <ul class="cm-share-list">${amizades.map(a => `
                                <li><label><input type="checkbox" value="${a.id || a.email || a.nome}"> ${a.nome || a.email || "Conexão"}</label></li>`).join("")}
                           </ul>
                           <button type="button" class="cm-btn cm-btn-primary cm-btn-sm share-confirm" data-post="${p.id}">Enviar</button>`
                        : `<p class="cm-share-note">Você ainda não tem conexões para compartilhar.</p>`}
                </div>
                <div class="cm-comments" id="comments-${p.id}" style="display:none;">
                    ${comentariosHtml}
                    <form class="cm-comment-form" data-post="${p.id}">
                        <input type="text" placeholder="Escreva um comentário..." maxlength="200" required>
                        <button type="submit" class="cm-btn cm-btn-primary cm-btn-sm">Comentar</button>
                    </form>
                </div>`;

            container.appendChild(artigo);
        });

        // Eventos: curtir, comentar, compartilhar
        container.querySelectorAll(".post-like").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.post;
                const post = postagens.find(x => x.id === id);
                if (!post) return;

                const jaCurte = curtidas.includes(id);
                if (jaCurte) {
                    curtidas = curtidas.filter(c => c !== id);
                    post.curtidasCount = Math.max(0, (post.curtidasCount || 0) - 1);
                } else {
                    curtidas.push(id);
                    post.curtidasCount = (post.curtidasCount || 0) + 1;
                }

                salvarLista("cm_curtidas", curtidas);
                salvarLista("cm_postagens", postagens);
                atualizarFeeds();
            });
        });

        container.querySelectorAll(".post-comment").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.post;
                const box = document.getElementById(`comments-${id}`);
                if (box) box.style.display = box.style.display === "none" ? "" : "none";
            });
        });

        container.querySelectorAll(".cm-comment-form").forEach(form => {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const id = form.dataset.post;
                const input = form.querySelector("input");
                const texto = input.value.trim();
                if (!texto) return;

                const post = postagens.find(x => x.id === id);
                if (!post) return;

                if (!post.comentarios) post.comentarios = [];
                post.comentarios.push({ autor: nomeUsuario, autorEmail: emailUsuario, texto, data: new Date().toISOString() });
                salvarLista("cm_postagens", postagens);
                atualizarFeeds();
            });
        });

        container.querySelectorAll(".post-share").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.post;
                const box = document.getElementById(`share-${id}`);
                if (box) box.classList.toggle("open");
            });
        });

        container.querySelectorAll(".share-confirm").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.post;
                const box = document.getElementById(`share-${id}`);
                const selecionados = [...box.querySelectorAll("input:checked")].map(i => i.value);
                if (!selecionados.length) return;

                // Estrutura preparada: registra o compartilhamento (sem dados fictícios)
                const registros = getLista("cm_compartilhamentos");
                selecionados.forEach(dest => {
                    registros.push({ postId: id, de: emailUsuario, para: dest, data: new Date().toISOString() });
                });
                salvarLista("cm_compartilhamentos", registros);

                if (box) {
                    box.innerHTML = `<p class="cm-share-note">Compartilhado com sucesso! ✅</p>`;
                    setTimeout(() => { if (box) box.classList.remove("open"); }, 1800);
                }
            });
        });

        /* ---- Menu de três pontinhos dos comentários ---- */
        const fecharDropdowns = () => {
            container.querySelectorAll(".cm-comm-dropdown.show").forEach(d => d.classList.remove("show"));
            container.querySelectorAll(".cm-post-dropdown.show").forEach(d => d.classList.remove("show"));
        };

        container.querySelectorAll(".cm-comm-dots").forEach(dots => {
            dots.addEventListener("click", () => {
                const menu = dots.closest(".cm-comm-menu");
                const drop = menu ? menu.querySelector(".cm-comm-dropdown") : null;
                const estavaAberto = drop ? drop.classList.contains("show") : false;
                fecharDropdowns();
                if (drop && !estavaAberto) drop.classList.add("show");
            });
        });

        container.querySelectorAll(".cm-comm-dropdown button[data-acao]").forEach(btn => {
            btn.addEventListener("click", () => {
                const item = btn.closest(".cm-comment-item");
                if (!item) return;
                const post = postagens.find(x => String(x.id) === item.dataset.post);
                const idx = parseInt(item.dataset.idx, 10);
                const coment = (post && post.comentarios) ? post.comentarios[idx] : null;
                if (!post || !coment) return;
                const acao = btn.dataset.acao;

                if (acao === "excluir") {
                    if (confirm("Excluir este comentário?")) {
                        post.comentarios.splice(idx, 1);
                        salvarLista("cm_postagens", postagens);
                        notificar("Comentário excluído.");
                        atualizarFeeds();
                    }
                    return;
                }

                if (acao === "denunciar") {
                    const denuncias = getLista("cm_denuncias");
                    denuncias.push({
                        autor: coment.autor,
                        texto: coment.texto,
                        postId: post.id,
                        por: emailUsuario,
                        data: new Date().toISOString()
                    });
                    salvarLista("cm_denuncias", denuncias);
                    notificar("Comentário denunciado. Nossa equipe vai avaliar.");
                    fecharDropdowns();
                    return;
                }

                if (acao === "editar") {
                    fecharDropdowns();
                    const bolha = item.querySelector(".cm-bubble");
                    if (!bolha) return;
                    bolha.innerHTML = `
                        <input type="text" class="cm-comment-edit-input" maxlength="200" placeholder="Editar comentário">
                        <div class="cm-comment-edit-actions">
                            <button type="button" class="cm-btn cm-btn-primary cm-btn-sm cm-comm-save">Salvar</button>
                            <button type="button" class="cm-btn cm-btn-soft cm-btn-sm cm-comm-cancel">Cancelar</button>
                        </div>`;
                    const inp = bolha.querySelector(".cm-comment-edit-input");
                    if (inp) {
                        inp.value = coment.texto;
                        inp.focus();
                    }
                }
            });
        });

        container.querySelectorAll(".cm-comm-save").forEach(btn => {
            btn.addEventListener("click", () => {
                const item = btn.closest(".cm-comment-item");
                if (!item) return;
                const post = postagens.find(x => String(x.id) === item.dataset.post);
                const idx = parseInt(item.dataset.idx, 10);
                const inp = item.querySelector(".cm-comment-edit-input");
                const texto = inp ? inp.value.trim() : "";
                if (!post || !post.comentarios || !post.comentarios[idx] || !texto) return;
                post.comentarios[idx].texto = texto;
                salvarLista("cm_postagens", postagens);
                notificar("Comentário editado.");
                atualizarFeeds();
            });
        });

        container.querySelectorAll(".cm-comm-cancel").forEach(btn => {
            btn.addEventListener("click", () => atualizarFeeds());
        });

        /* ---- Menu de três pontinhos das publicações ---- */
        container.querySelectorAll(".cm-post-dots").forEach(dots => {
            dots.addEventListener("click", () => {
                const menu = dots.closest(".cm-post-menu");
                const drop = menu ? menu.querySelector(".cm-post-dropdown") : null;
                const estavaAberto = drop ? drop.classList.contains("show") : false;
                fecharDropdowns();
                if (drop && !estavaAberto) drop.classList.add("show");
            });
        });

        container.querySelectorAll(".cm-post-dropdown button[data-post-acao]").forEach(btn => {
            btn.addEventListener("click", () => {
                const item = btn.closest(".cm-post");
                if (!item) return;
                const id = btn.dataset.post;
                const acao = btn.dataset.postAcao;

                fecharDropdowns();

                if (acao === "excluir") {
                    const post = postagens.find(x => String(x.id) === id);
                    if (post) {
                        abrirConfirmacao({
                            titulo: "Excluir publicação",
                            mensagem: "Tem certeza que deseja excluir esta publicação? Essa ação não pode ser desfeita.",
                            rotuloConfirmar: "Excluir",
                            perigoso: true,
                            aoConfirmar: () => {
                                postagens = postagens.filter(x => String(x.id) !== id);
                                salvarLista("cm_postagens", postagens);
                                curtidas = curtidas.filter(c => c !== id);
                                salvarLista("cm_curtidas", curtidas);
                                notificar("Publicação excluída.");
                                atualizarFeeds();
                                atualizarSugestoes();
                            }
                        });
                    }
                    return;
                }

                if (acao === "seguir") {
                    const emailAlvo = btn.dataset.email;
                    const nomeAlvo = btn.dataset.nome || "";
                    if (!emailAlvo) return;
                    const i = amizades.findIndex(a => a.email === emailAlvo);
                    if (i === -1) {
                        amizades.push({ email: emailAlvo, nome: nomeAlvo, data: new Date().toISOString() });
                        notificar(`Agora você segue ${nomeAlvo || emailAlvo}.`);
                    } else {
                        amizades.splice(i, 1);
                        notificar(`Você deixou de seguir ${nomeAlvo || emailAlvo}.`);
                    }
                    salvarLista("cm_amizades", amizades);
                    atualizarFeeds();
                    atualizarSugestoes();
                    return;
                }

                if (acao === "denunciar") {
                    const post = postagens.find(x => String(x.id) === id);
                    if (!post) return;
                    const denuncias = getLista("cm_denuncias");
                    denuncias.push({
                        autor: post.autor,
                        texto: post.texto,
                        postId: post.id,
                        por: emailUsuario,
                        data: new Date().toISOString()
                    });
                    salvarLista("cm_denuncias", denuncias);
                    notificar("Publicação denunciada. Nossa equipe vai avaliar.");
                    return;
                }
            });
        });
    };

    const atualizarFeeds = () => {
        if (feed1) renderFeed(feed1);
        if (feed2) renderFeed(feed2);
    };

    renderFeed(feed1);
    renderFeed(feed2);

    /* ==========================================
       DIÁRIO — REGISTRO DE HUMOR E TEXTO
    ========================================== */
    const humorRegistrado = document.getElementById("humorRegistrado");
    const humorSalvo = localStorage.getItem("cm_humor_atual");

    document.querySelectorAll("#diaryMoods .cm-mood-btn").forEach(btn => {
        if (humorSalvo && btn.dataset.humor === humorSalvo) btn.classList.add("active");
        btn.addEventListener("click", () => {
            document.querySelectorAll("#diaryMoods .cm-mood-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            localStorage.setItem("cm_humor_atual", btn.dataset.humor);
            if (humorRegistrado) humorRegistrado.textContent = btn.dataset.humor;
            set("resumoHumor", btn.dataset.humor);
        });
    });
    if (humorSalvo && humorRegistrado) humorRegistrado.textContent = humorSalvo;
    set("resumoHumor", humorSalvo || "—");

    const renderDiario = () => {
        const lista = document.getElementById("listaDiario");
        const vazio = document.getElementById("diarioVazio");
        if (!lista) return;
        limpar("listaDiario");
        if (!diario.length) { if (vazio) vazio.hidden = false; return; }
        if (vazio) vazio.hidden = true;

        diario.slice().filter(r => (r.autorEmail || "") === emailUsuario).sort((a, b) => (a.data > b.data ? -1 : 1)).forEach(r => {
            const card = document.createElement("article");
            card.className = "cm-diary-entry";
            const titulo = (r.titulo || "").trim() ? r.titulo.trim() : (r.humor ? r.humor : "Registro do dia");
            const apenasHumor = !(r.texto || "").trim();
            const texto = (r.texto || "").trim();
            const longo = texto.length > 180;

            card.innerHTML = `
                <div class="cm-diary-head">
                    <span class="cm-diary-emoji">${humorEmoji(r.humor)}</span>
                    <h4>${esc(titulo)}</h4>
                    <button type="button" class="cm-diary-delete" title="Excluir registro" aria-label="Excluir registro"><i class="fa-regular fa-trash-can"></i></button>
                </div>
                <div class="cm-diary-meta">
                    <i class="fa-regular fa-calendar" aria-hidden="true"></i> ${formatarData(r.data)}${r.humor ? ` · Humor: ${esc(r.humor)}` : ""}
                </div>
                ${apenasHumor
                    ? `<div class="cm-diary-text"><em>Registro de humor apenas.</em></div>`
                    : `<div class="cm-diary-text${longo ? " cm-clamped" : ""}">${esc(texto)}</div>
                       ${longo ? `<button type="button" class="cm-diary-expand">Ver completo</button>` : ""}`}
            `;

            const idRef = String(r.id);
            card.querySelector(".cm-diary-delete").addEventListener("click", () => {
                abrirConfirmacao({
                    titulo: "Excluir registro",
                    mensagem: "Tem certeza que deseja excluir este registro do diário? Essa ação não pode ser desfeita.",
                    rotuloConfirmar: "Excluir",
                    perigoso: true,
                    aoConfirmar: () => {
                        diario = diario.filter(x => String(x.id) !== idRef);
                        salvarLista("cm_diario", diario);
                        renderDiario();
                        set("resumoDiario", String(diario.length));
                        notificar("Registro excluído.");
                    }
                });
            });

            const expandir = card.querySelector(".cm-diary-expand");
            if (expandir) {
                expandir.addEventListener("click", () => {
                    const txt = card.querySelector(".cm-diary-text");
                    const estavaClamp = txt.classList.contains("cm-clamped");
                    txt.classList.toggle("cm-clamped", !estavaClamp);
                    expandir.textContent = estavaClamp ? "Ver menos" : "Ver completo";
                });
            }

            lista.appendChild(card);
        });
    };
    const diarioDataHojeEl = document.getElementById("diarioDataHoje");
    if (diarioDataHojeEl) diarioDataHojeEl.textContent = new Date().toLocaleDateString("pt-BR");
    renderDiario();
    set("resumoDiario", String(diario.length));

    const btnSalvarDiario = document.getElementById("btnSalvarDiario");
    if (btnSalvarDiario) {
        btnSalvarDiario.addEventListener("click", () => {
            const titulo = document.getElementById("diarioTitulo")?.value.trim() || "";
            const texto = document.getElementById("diarioTexto")?.value.trim() || "";
            const humor = localStorage.getItem("cm_humor_atual") || "";
            if (!titulo && !texto && !humor) return;

            diario.push({
                id: Date.now().toString(),
                autorEmail: emailUsuario,
                titulo,
                humor,
                texto,
                data: new Date().toISOString()
            });
            salvarLista("cm_diario", diario);
            if (document.getElementById("diarioTitulo")) document.getElementById("diarioTitulo").value = "";
            if (document.getElementById("diarioTexto")) document.getElementById("diarioTexto").value = "";

            const status = document.getElementById("diarioStatus");
            if (status) {
                status.textContent = `Registro salvo em ${new Date().toLocaleString("pt-BR")}. ✓`;
                status.hidden = false;
                setTimeout(() => { status.hidden = true; }, 3500);
            }

            renderDiario();
            set("resumoDiario", String(diario.length));
        });
    }

    /* ==========================================
       PROFISSIONAIS VINCULADOS
    ========================================== */
    const renderProfissionais = (filtro) => {
        const lista = document.getElementById("listaProfissionais");
        const vazio = document.getElementById("profissionaisVazio");
        if (!lista) return;
        limpar("listaProfissionais");
        if (!vinculados.length) { vazio.hidden = false; return; }
        vazio.hidden = true;

        const busca = (filtro || "").trim().toLowerCase();
        vinculados
            .filter(p => !busca ||
                (p.nome || "").toLowerCase().includes(busca) ||
                (p.area || p.profissao || "").toLowerCase().includes(busca))
            .forEach(prof => {
                const li = document.createElement("li");
                const ini = (prof.nome || "P").split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("");
                li.innerHTML = `
                <span class="cm-avatar cm-avatar-sm">${ini}</span>
                <div class="cm-info">
                    <strong>${prof.nome || "Profissional"}</strong>
                    <small>${prof.area || prof.profissao || "Profissional"}</small>
                </div>`;
                lista.appendChild(li);
            });

        // Mantém o estado vazio se nenhum resultado corresponder
        if (!lista.children.length) vazio.hidden = false;
    };
    const buscaProfissional = document.getElementById("buscaProfissional");
    if (buscaProfissional) buscaProfissional.addEventListener("input", () => renderProfissionais(buscaProfissional.value));
    renderProfissionais();
    set("resumoProfissionais", String(vinculados.length));

    /* ==========================================
       AGENDA — CONSULTAS
    ========================================== */
    const renderConsultas = () => {
        const lista = document.getElementById("listaConsultas");
        const vazio = document.getElementById("consultasVazio");
        if (!lista) return;
        limpar("listaConsultas");
        if (!consultas.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        consultas.forEach(c => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="cm-time-box">${c.horario || "--:--"}</span>
                <div class="cm-info">
                    <strong>${c.profissional || "Profissional"}</strong>
                    <small>${c.data || ""}${c.tipo ? ` · ${c.tipo}` : ""}</small>
                </div>`;
            lista.appendChild(li);
        });
    };
    renderConsultas();

    /* ==========================================
       PERFIL — DADOS DO CADASTRO
    ========================================== */
    const renderPerfil = () => {
        const nome = (perfil.nome || "").trim() || "Estudante";
        const usuario = "@" + ((perfil.email || emailUsuario || "").split("@")[0] || "usuario");

        set("perfilNome", nome);
        set("perfilUsuario", usuario);
        set("perfilSobre", (perfil.sobre || "").trim() || "Que bom ter você por aqui! Escreva um pouco sobre você.");
        aplicarFoto(document.getElementById("perfilAvatar"), nome);

        const grid = document.getElementById("listaInfoPessoal");
        if (grid) {
            limpar("listaInfoPessoal");
            const itens = [
                ["Nome", nome],
                ["Usuário", usuario],
                ["E-mail", perfil.email || emailUsuario],
                ["Data de nascimento", perfil.nascimento || perfil.dataNascimento],
                ["Telefone", perfil.telefone],
                ["Cidade", perfil.cidade],
                ["Estado", perfil.estado]
            ];
            const visiveis = itens.filter(([, v]) => v && String(v).trim());
            if (!visiveis.length) {
                grid.innerHTML = `<div class="cm-profile-item"><span>Perfil</span><strong>Informações não preenchidas</strong></div>`;
            } else {
                visiveis.forEach(([r, v]) => {
                    const d = document.createElement("div");
                    d.className = "cm-profile-item";
                    d.innerHTML = `<span>${r}</span><strong>${esc(String(v))}</strong>`;
                    grid.appendChild(d);
                });
            }
        }

        const conta = document.getElementById("listaInfoConta");
        if (conta) {
            limpar("listaInfoConta");
            const criado = perfil.criadoEm || perfil.dataCadastro;
            const itensConta = [
                ["Conta criada em", criado ? new Date(criado).toLocaleDateString("pt-BR") : "—"],
                ["Status", `<span class="cm-status-badge">Ativa</span>`],
                ["Tipo de conta", perfil.tipo === "profissional" ? "Profissional" : "Estudante"]
            ];
            itensConta.forEach(([r, v]) => {
                const d = document.createElement("div");
                d.className = "cm-profile-item";
                d.innerHTML = `<span>${r}</span><strong>${v}</strong>`;
                conta.appendChild(d);
            });
        }

        const pref = document.getElementById("listaPreferencias");
        if (pref) {
            limpar("listaPreferencias");
            const cfg = getConfigObj();
            const itensPref = [
                ["Idioma", "Português (Brasil)"],
                ["Tema", cfg.tema === "escuro" ? "Escuro" : "Claro"],
                ["Tamanho do texto", cfg.tamanhoTexto && cfg.tamanhoTexto !== "normal" ? (cfg.tamanhoTexto === "grande" ? "Grande" : "Pequeno") : "Normal"],
                ["Notificações", cfg.notificacoes === false ? "Desativadas" : "Ativadas"],
                ["Diário compartilhado com profissionais", cfg.compartilharDiario === false ? "Não" : "Sim"]
            ];
            itensPref.forEach(([r, v]) => {
                const d = document.createElement("div");
                d.className = "cm-profile-item";
                d.innerHTML = `<span>${r}</span><strong>${v}</strong>`;
                pref.appendChild(d);
            });
        }
    };
    renderPerfil();

    /* ---------- Edição de perfil (simples, inline) ---------- */
    const editForm = document.getElementById("editForm");
    const btnEditarPerfil = document.getElementById("btnEditarPerfil");
    const btnCancelarPerfil = document.getElementById("btnCancelarPerfil");
    const btnSalvarPerfil = document.getElementById("btnSalvarPerfil");
    const perfilFeedback = document.getElementById("perfilFeedback");

    const preencherEdicao = () => {
        const val = (campo) => { const el = document.getElementById(campo); if (el) el.value = perfil[campo] || ""; };
        val("editNome"); val("editTelefone"); val("editCidade"); val("editEstado"); val("editSobre");
    };
    const abrirEdicao = () => {
        preencherEdicao();
        if (editForm) editForm.classList.add("open");
        if (perfilFeedback) perfilFeedback.classList.remove("show");
    };

    document.querySelectorAll("[data-abrir-edicao-perfil]").forEach(btn => btn.addEventListener("click", abrirEdicao));
    if (btnEditarPerfil) btnEditarPerfil.addEventListener("click", abrirEdicao);
    if (btnCancelarPerfil) btnCancelarPerfil.addEventListener("click", () => {
        if (editForm) editForm.classList.remove("open");
    });
    if (btnSalvarPerfil) btnSalvarPerfil.addEventListener("click", () => {
        const leia = (campo) => document.getElementById(campo)?.value.trim() || perfil[campo] || "";
        const novo = {
            ...perfil,
            nome: leia("editNome"),
            telefone: leia("editTelefone"),
            cidade: leia("editCidade"),
            estado: leia("editEstado"),
            sobre: leia("editSobre")
        };
        localStorage.setItem("cm_profile", JSON.stringify(novo));
        perfil.nome = novo.nome;

        nomeUsuario = novo.nome || "Estudante";
        set("topoNomeUsuario", `Olá, ${nomeUsuario.split(" ")[0]}`);
        set("sideNome", nomeUsuario);
        set("composerNomeAut", `${nomeUsuario.split(" ")[0]}, como você está?`);
        set("composerNomeAut2", `${nomeUsuario.split(" ")[0]}, compartilhe com a comunidade`);
        aplicarFoto(avatar, nomeUsuario);
        aplicarFoto(document.getElementById("sideAvatar"), nomeUsuario);
        aplicarFoto(document.getElementById("composerAvatar"), nomeUsuario);
        aplicarFoto(document.getElementById("composerAvatar2"), nomeUsuario);
        aplicarFoto(document.getElementById("perfilAvatar"), nomeUsuario);

        renderPerfil();
        if (editForm) editForm.classList.remove("open");
        if (perfilFeedback) {
            perfilFeedback.classList.add("show");
            setTimeout(() => perfilFeedback.classList.remove("show"), 2500);
        }
    });

    /* ==========================================
       CONFIGURAÇÕES — SALVAR PREFERÊNCIAS
    ========================================== */
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

    const salvarConfiguracao = (parcial) => {
        const nova = Object.assign({}, getConfigObj(), parcial);
        localStorage.setItem("cm_config", JSON.stringify(nova));
        aplicarAparencia(nova);
        return nova;
    };

    const aplicarAparencia = (cfg) => {
        const escala = { pequeno: "15px", normal: "16px", grande: "18px" };
        document.documentElement.style.fontSize = escala[cfg.tamanhoTexto] || "16px";
    };

    const cfgAtual = carregarConfiguracao();
    aplicarAparencia(cfgAtual);

    document.querySelectorAll("[data-cfg]").forEach(el => {
        el.addEventListener("change", () => {
            salvarConfiguracao({ [el.dataset.cfg]: el.type === "checkbox" ? el.checked : el.value });
        });
    });

    /* ---------- Contas seguidas (gerenciadas na Configuração) ---------- */
    const renderListaSeguidas = () => {
        const lista = document.getElementById("cfgListaSeguidas");
        if (!lista) return;
        limpar("cfgListaSeguidas");
        if (!amizades.length) {
            lista.innerHTML = `<li class="cm-settings-item" style="width:100%;justify-content:center;border:0;">
                <span class="cm-panel-sub">Você ainda não segue ninguém na Comunidade.</span>
            </li>`;
            return;
        }
        amizades.slice().forEach(a => {
            const li = document.createElement("li");
            const nome = (a.nome || "").trim() || a.email || "Usuário";
            const ini = nome.split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("");
            li.innerHTML = `
                <span class="cm-avatar cm-avatar-sm">${esc(ini)}</span>
                <div class="cm-info"><strong>${esc(nome)}</strong><small>${esc(a.email || "")}</small></div>
                <button type="button" class="cm-btn cm-btn-soft cm-btn-sm cm-follow-unfollow">Deixar de seguir</button>`;
            li.querySelector(".cm-follow-unfollow").addEventListener("click", () => {
                const i = amizades.findIndex(x => x.email === a.email);
                if (i > -1) amizades.splice(i, 1);
                salvarLista("cm_amizades", amizades);
                renderListaSeguidas();
                atualizarSugestoes();
                notificar(`Você deixou de seguir ${nome}.`);
            });
            lista.appendChild(li);
        });
    };
    renderListaSeguidas();

    /* ---------- Conta: nome, e-mail e senha ---------- */
    const btnCfgNome = document.getElementById("btnCfgNome");
    const btnCfgEmail = document.getElementById("btnCfgEmail");
    const btnCfgSenha = document.getElementById("btnCfgSenha");
    const cfgSenhaAtual = document.getElementById("cfgSenhaAtual");
    const cfgSenhaNova = document.getElementById("cfgSenhaNova");
    const cfgSenhaConf = document.getElementById("cfgSenhaConf");

    if (btnCfgNome) btnCfgNome.addEventListener("click", () => {
        const v = document.getElementById("cfgNovoNome")?.value.trim();
        if (!v) { notificar("Digite um novo nome."); return; }
        perfil.nome = v;
        perfil.email = perfil.email || emailUsuario;
        localStorage.setItem("cm_profile", JSON.stringify(perfil));
        nomeUsuario = v;
        set("perfilNome", v);
        set("topoNomeUsuario", `Olá, ${v.split(" ")[0]}`);
        set("sideNome", v);
        aplicarFoto(avatar, v);
        aplicarFoto(document.getElementById("perfilAvatar"), v);
        renderPerfil();
        notificar("Nome atualizado com sucesso.");
        if (document.getElementById("cfgNovoNome")) document.getElementById("cfgNovoNome").value = "";
    });

    if (btnCfgEmail) btnCfgEmail.addEventListener("click", () => {
        const v = document.getElementById("cfgNovoEmail")?.value.trim();
        if (!v || !v.includes("@")) { notificar("Digite um e-mail válido."); return; }
        const posts = getLista("cm_postagens").map(p => {
            if (p.autorEmail === emailUsuario) return { ...p, autorEmail: v };
            p.comentarios = (p.comentarios || []).map(c => c.autorEmail === emailUsuario ? { ...c, autorEmail: v } : c);
            return p;
        });
        salvarLista("cm_postagens", posts);
        const novasAmizades = amizades.map(a => a.email === emailUsuario ? { ...a, email: v } : a);
        salvarLista("cm_amizades", novasAmizades);
        if (localStorage.getItem("cm_session") === emailUsuario) localStorage.setItem("cm_session", v);
        perfil.email = v;
        localStorage.setItem("cm_profile", JSON.stringify(perfil));
        notificar("E-mail atualizado. Use-o no próximo login.");
        renderPerfil();
        if (document.getElementById("cfgNovoEmail")) document.getElementById("cfgNovoEmail").value = "";
    });

    if (btnCfgSenha) btnCfgSenha.addEventListener("click", () => {
        const atual = cfgSenhaAtual ? cfgSenhaAtual.value : "";
        const nova = cfgSenhaNova ? cfgSenhaNova.value : "";
        const conf = cfgSenhaConf ? cfgSenhaConf.value : "";
        if (nova.length < 6) { notificar("A nova senha precisa ter no mínimo 6 caracteres."); return; }
        if (nova !== conf) { notificar("A confirmação não confere com a nova senha."); return; }
        if (perfil.senha && atual !== perfil.senha) { notificar("A senha atual está incorreta."); return; }
        perfil.email = perfil.email || emailUsuario;
        perfil.senha = nova;
        localStorage.setItem("cm_profile", JSON.stringify(perfil));
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
        window.location.href = "login.html";
    });

    /* ---------- Dados e conta: exportar e excluir ---------- */
    const btnCfgExportar = document.getElementById("btnCfgExportar");
    if (btnCfgExportar) btnCfgExportar.addEventListener("click", () => {
        const dados = {
            exportadoEm: new Date().toISOString(),
            perfil,
            config: getConfigObj(),
            postagens: getLista("cm_postagens").filter(p => p.autorEmail === emailUsuario),
            diario: getLista("cm_diario").filter(r => r.autorEmail === emailUsuario),
            amizades,
            curtidas,
            humorAtual: localStorage.getItem("cm_humor_atual") || ""
        };
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "clear-minds-meus-dados.json";
        a.click();
        URL.revokeObjectURL(a.href);
        notificar("Dados exportados.");
    });

    const btnCfgExcluir = document.getElementById("btnCfgExcluir");
    if (btnCfgExcluir) btnCfgExcluir.addEventListener("click", () => {
        abrirConfirmacao({
            titulo: "Excluir conta",
            mensagem: "Finalizar e apagar os seus dados do Clear Minds neste dispositivo? Essa ação não pode ser desfeita.",
            rotuloConfirmar: "Excluir minha conta",
            perigoso: true,
            aoConfirmar: () => {
                const rest = getLista("cm_postagens").map(p => {
                    if (p.autorEmail === emailUsuario) return null;
                    p.comentarios = (p.comentarios || []).filter(c => (c.autorEmail || "") !== emailUsuario);
                    return p;
                }).filter(Boolean);
                salvarLista("cm_postagens", rest);
                salvarLista("cm_diario", getLista("cm_diario").filter(r => r.autorEmail !== emailUsuario));
                salvarLista("cm_amizades", amizades.filter(a => a.email !== emailUsuario));
                salvarLista("cm_curtidas", getLista("cm_curtidas").filter(c => c !== emailUsuario));
                localStorage.removeItem("cm_profile");
                localStorage.removeItem("cm_config");
                localStorage.removeItem("cm_humor_atual");
                localStorage.removeItem("resumoHumor");
                localStorage.removeItem("resumoDiario");
                localStorage.removeItem("cm_session");
                localStorage.removeItem("cm_tipo");
                window.location.href = "login.html";
            }
        });
    });

    /* ---------- Atalho para o perfil ---------- */
    const btnCfgIrPerfil = document.getElementById("btnCfgIrPerfil");
    if (btnCfgIrPerfil) btnCfgIrPerfil.addEventListener("click", () => irParaSecao("perfil"));

    /* ==========================================
       SAIR DA CONTA
    ========================================== */
    const btnSair = document.getElementById("btnSair");
    if (btnSair) btnSair.addEventListener("click", () => {
        localStorage.removeItem("cm_session");
        localStorage.removeItem("cm_tipo");
        window.location.href = "login.html";
    });
    const btnSairMenu = document.getElementById("btnSairMenu");
    if (btnSairMenu) btnSairMenu.addEventListener("click", () => {
        localStorage.removeItem("cm_session");
        localStorage.removeItem("cm_tipo");
        window.location.href = "login.html";
    });


});