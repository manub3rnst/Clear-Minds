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
    const nomeUsuario = (perfil.nome || "").trim() || "Estudante";

    const hora = new Date().getHours();
    const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

    /* ==========================================
       DADOS PERSISTENTES (estruturas prontas)
    ========================================== */
    const getLista = (chave) => JSON.parse(localStorage.getItem(chave) || "[]");
    const salvarLista = (chave, lista) => localStorage.setItem(chave, JSON.stringify(lista));

    // Feed da comunidade (postagens de todos)
    let postagens = getLista("cm_postagens");
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

    /* ---------- Identificação ---------- */
    set("saudacao", `${periodo}, ${nomeUsuario.split(" ")[0]}! 🌿`);
    set("topoNomeUsuario", `Olá, ${nomeUsuario.split(" ")[0]}`);

    const avatar = document.getElementById("avatarIniciais");
    if (avatar) {
        avatar.textContent = nomeUsuario.split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("");
    }

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
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    /* ==========================================
       SIDEBAR AUTOMÁTICA PARA DESTAQUES
    ========================================== */
    // Ao publicar, volta para a seção Início para o usuário ver a publicação.

    /* ==========================================
       COMUNIDADE — CRIAÇÃO DE POST
    ========================================== */
    const limparPost = (idTexto, idMoods) => {
        const texto = document.getElementById(idTexto);
        if (texto) texto.value = "";
        const moods = document.getElementById(idMoods);
        if (moods) moods.querySelectorAll(".cm-mood-chip").forEach(c => c.classList.remove("active"));
    };

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

    const publicar = (idTexto, idMoods, feedEl) => {
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
            data: new Date().toISOString(),
            curtidasCount: 0,
            comentarios: []
        });

        salvarLista("cm_postagens", postagens);
        renderFeed(feedEl);
        limparPost(idTexto, idMoods);

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

    if (btnPub1) btnPub1.addEventListener("click", () => publicar("composerTexto", "composerMoods", feed1));
    if (btnPub2) btnPub2.addEventListener("click", () => publicar("composerTexto2", "composerMoods2", feed2));

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

            const comentariosHtml = (p.comentarios || []).map(c => `
                <div class="cm-comment-item">
                    <span class="cm-avatar cm-avatar-sm">${(c.autor || "?").split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("")}</span>
                    <div class="cm-bubble">
                        <strong>${c.autor}</strong>
                        <p>${c.texto}</p>
                    </div>
                </div>`).join("");

            artigo.innerHTML = `
                <div class="cm-post-head">
                    <span class="cm-avatar cm-avatar-sm">${inicial}</span>
                    <div class="cm-author">
                        <strong>${p.autor}</strong>
                        <small>${formatarData(p.data)}${p.humor ? ` · ${p.humor}` : ""}</small>
                    </div>
                </div>
                <p class="cm-post-text">${p.texto}</p>
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
                renderFeed(container);
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
                renderFeed(container);
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
        if (!diario.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        diario.slice().sort((a, b) => (a.data > b.data ? -1 : 1)).forEach(r => {
            const li = document.createElement("li");
            const d = new Date(r.data);
            const str = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
            li.innerHTML = `
                <span class="cm-time-box">${str}</span>
                <div class="cm-info">
                    <strong>${r.humor ? `${r.humor}` : "Registro"}</strong>
                    <small>${r.texto || ""}</small>
                </div>`;
            lista.appendChild(li);
        });
    };
    renderDiario();
    set("resumoDiario", String(diario.length));

    const btnSalvarDiario = document.getElementById("btnSalvarDiario");
    if (btnSalvarDiario) {
        btnSalvarDiario.addEventListener("click", () => {
            const texto = document.getElementById("diarioTexto")?.value.trim() || "";
            const humor = localStorage.getItem("cm_humor_atual") || "";
            if (!texto && !humor) return;

            diario.push({
                id: Date.now().toString(),
                autorEmail: emailUsuario,
                humor,
                texto,
                data: new Date().toISOString()
            });
            salvarLista("cm_diario", diario);
            if (document.getElementById("diarioTexto")) document.getElementById("diarioTexto").value = "";

            const status = document.getElementById("diarioStatus");
            if (status) {
                status.textContent = `Registro salvo em ${new Date().toLocaleDateString("pt-BR")}. ✓`;
                status.hidden = false;
                setTimeout(() => { status.hidden = true; }, 3000);
            }

            renderDiario();
            set("resumoDiario", String(diario.length));
        });
    }

    /* ==========================================
       PROFISSIONAIS VINCULADOS
    ========================================== */
    const renderProfissionais = () => {
        const lista = document.getElementById("listaProfissionais");
        const vazio = document.getElementById("profissionaisVazio");
        if (!lista) return;
        limpar("listaProfissionais");
        if (!vinculados.length) { vazio.hidden = false; return; }
        vazio.hidden = true;
        vinculados.forEach(prof => {
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
    };
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
        const lista = document.getElementById("listaDadosPerfil");
        if (!lista) return;
        limpar("listaDadosPerfil");
        const itens = [
            ["Nome", perfil.nome],
            ["Data de nascimento", perfil.nascimento],
            ["Gênero", perfil.genero],
            ["Telefone", perfil.telefone],
            ["Cidade", perfil.cidade],
            ["Estado", perfil.estado],
            ["Sobre", perfil.sobre],
            ["Acompanhamento", perfil.acompanhamento]
        ];
        itens.filter(([, v]) => v).forEach(([rotulo, valor]) => {
            const li = document.createElement("li");
            li.innerHTML = `<span><i class="fa-solid fa-circle-info" aria-hidden="true"></i> ${rotulo}:</span> <strong>${valor}</strong>`;
            lista.appendChild(li);
        });
        if (!lista.children.length) {
            lista.innerHTML = `<li><span>Perfil:</span> <strong>Informações não preenchidas</strong></li>`;
        }
    };
    renderPerfil();

    /* ==========================================
       CONFIGURAÇÕES — SALVAR PREFERÊNCIAS
    ========================================== */
    const cfgDiario = document.getElementById("cfgCompartilharDiario");
    const cfgNotif = document.getElementById("cfgNotificacoes");

    const carregarConfig = () => {
        const cfg = JSON.parse(localStorage.getItem("cm_config") || "{}");
        if (cfgDiario) cfgDiario.checked = cfg.compartilharDiario !== false;
        if (cfgNotif) cfgNotif.checked = cfg.notificacoes !== false;
    };
    const salvarConfig = () => {
        localStorage.setItem("cm_config", JSON.stringify({
            compartilharDiario: cfgDiario ? cfgDiario.checked : true,
            notificacoes: cfgNotif ? cfgNotif.checked : true
        }));
    };
    carregarConfig();
    if (cfgDiario) cfgDiario.addEventListener("change", salvarConfig);
    if (cfgNotif) cfgNotif.addEventListener("change", salvarConfig);

    /* ==========================================
       SAIR DA CONTA
    ========================================== */
    const btnSair = document.getElementById("btnSair");
    if (btnSair) btnSair.addEventListener("click", () => {
        localStorage.removeItem("cm_session");
        localStorage.removeItem("cm_tipo");
        window.location.href = "login.html";
    });

});