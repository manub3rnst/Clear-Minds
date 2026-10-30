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
    let emailUsuario = sessao;

    const perfil = JSON.parse(localStorage.getItem("cm_profile") || "{}");
    let nomeUsuario = (perfil.nome || "").trim() || "Estudante";

    const hora = new Date().getHours();
    const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

    /* ==========================================
       DADOS PERSISTENTES (estruturas prontas)
    ========================================== */
    const getLista = (chave) => JSON.parse(localStorage.getItem(chave) || "[]");
    const salvarLista = (chave, lista) => localStorage.setItem(chave, JSON.stringify(lista));

    // Public profile fields let community authors open a lightweight profile card.
    const registrarPerfilPublico = () => {
        const perfis = JSON.parse(localStorage.getItem("cm_public_profiles") || "{}");
        perfis[emailUsuario] = {
            nome: nomeUsuario,
            foto: perfil.foto || "",
            sobre: perfil.sobre || "",
            cidade: perfil.cidade || "",
            estado: perfil.estado || ""
        };
        localStorage.setItem("cm_public_profiles", JSON.stringify(perfis));
    };
    registrarPerfilPublico();

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

    // Conteúdo fictício, criado para demonstração em contas sem dados próprios.
    const demonstracaoEmail = "demo.paciente@clearminds.exemplo";
    const postsDemonstracao = [
        {id:"demo-post-1",autor:"Lia Demonstração",autorEmail:demonstracaoEmail,texto:"Tenho tentado fazer pequenas pausas entre os estudos. Hoje consegui respirar um pouco e voltar com mais calma. #Demonstração",humor:"Bem",data:new Date(Date.now()-3600000).toISOString(),curtidasCount:3,comentarios:[{autor:"Rafa Exemplo",autorEmail:"rafa@clearminds.exemplo",texto:"Que bom que encontrou um ritmo que funciona para você! #Demonstração",data:new Date(Date.now()-1800000).toISOString()}],ficticio:true},
        {id:"demo-post-2",autor:"Rafa Exemplo",autorEmail:"rafa@clearminds.exemplo",texto:"Uma coisa de cada vez também é progresso. Lembrete fictício para demonstração.",humor:"Neutro",data:new Date(Date.now()-86400000).toISOString(),curtidasCount:2,comentarios:[],ficticio:true}
    ];
    const idsPostsDemonstracao = new Set(postsDemonstracao.map(p => p.id));
    const idsPostsJaVistos = new Set();
    let postsAtualizados = false;
    const quantidadePostsAntes = postagens.length;
    postagens = postagens.filter(p => {
        const id = String(p.id);
        if (!idsPostsDemonstracao.has(id)) return true;
        if (idsPostsJaVistos.has(id)) return false;
        idsPostsJaVistos.add(id);
        return true;
    });
    if (postagens.length !== quantidadePostsAntes) postsAtualizados = true;
    postsDemonstracao.forEach(exemplo => {
        if (!postagens.some(p => String(p.id) === exemplo.id)) {
            postagens.push(exemplo);
            postsAtualizados = true;
        }
    });
    if (postsAtualizados) salvarLista("cm_postagens", postagens);
    if (!postagens.some(p => p.autorEmail === emailUsuario && p.id === `demo-own-${emailUsuario}`)) {
        postagens.push({id:`demo-own-${emailUsuario}`,autor:nomeUsuario,autorEmail:emailUsuario,texto:"Pequenos passos também contam. Publicação fictícia para demonstrar as interações da comunidade.",humor:"Bem",data:new Date(Date.now()-7200000).toISOString(),curtidasCount:1,comentarios:[{autor:"Lia Demonstração",autorEmail:demonstracaoEmail,texto:"Obrigada por compartilhar. Um lembrete acolhedor para hoje!",data:new Date(Date.now()-3600000).toISOString()}]}); salvarLista("cm_postagens",postagens);
    }
    const registrosDemonstracao = [
        {id:`demo-diario-1-${emailUsuario}`,autorEmail:emailUsuario,titulo:"Um dia mais leve",humor:"Bem",texto:"Hoje organizei minhas tarefas em etapas pequenas e fiz uma pausa para descansar. Registro fictício para demonstração.",data:new Date(Date.now()-86400000).toISOString(),ficticio:true},
        {id:`demo-diario-2-${emailUsuario}`,autorEmail:emailUsuario,titulo:"Uma reflexão",humor:"Neutro",texto:"Quero continuar praticando gentileza comigo nos dias corridos. Entrada fictícia de demonstração.",data:new Date(Date.now()-172800000).toISOString(),ficticio:true}
    ];
    let diarioAtualizado = false;
    registrosDemonstracao.forEach(exemplo => {
        if (!diario.some(r => String(r.id) === exemplo.id)) {
            diario.push(exemplo);
            diarioAtualizado = true;
        }
    });
    if (diarioAtualizado) salvarLista("cm_diario", diario);
    const profissionalDemo = {
        nome: "Dra. Marina Exemplo",
        email: "marina@clearminds.exemplo",
        profissao: "Psicóloga",
        area: "Psicologia",
        cidade: "São Paulo",
        estado: "SP",
        telefone: "(11) 90000-0000",
        especialidades: "Ansiedade, autoestima, regulação emocional e adolescência",
        abordagem: "Terapia cognitivo-comportamental (TCC), com práticas de atenção plena",
        modalidade: "Online e presencial",
        faixaEtaria: "Adolescentes e adultos",
        idiomas: "Português",
        bio: "Olá! Sou Marina, psicóloga fictícia criada para demonstrar o Clear Minds. Trabalho com escuta acolhedora e colaborativa, respeitando o ritmo e a história de cada pessoa. No processo, podemos identificar recursos, compreender emoções e construir estratégias possíveis para o cotidiano.",
        registroProfissional: "CRP 00/00000 (dado fictício)",
        faculdade: "Instituto Universitário Horizonte (instituição fictícia)",
        anoFormacao: "2018",
        posGraduacao: "Formação demonstrativa em saúde emocional de adolescentes (fictícia)",
        atuaDesde: "2019",
        valorSessao: "150",
        disponibilidade: "Segunda a quinta, das 9h às 18h (horários demonstrativos)",
        ficticio: true
    };
    const indiceProfissionalDemo = vinculados.findIndex(p => p.email === profissionalDemo.email);
    if (indiceProfissionalDemo < 0) {
        vinculados.push(profissionalDemo);
        salvarLista("cm_profissionais_usuario", vinculados);
    } else if (vinculados[indiceProfissionalDemo].ficticio) {
        vinculados[indiceProfissionalDemo] = { ...profissionalDemo, ...vinculados[indiceProfissionalDemo] };
        salvarLista("cm_profissionais_usuario", vinculados);
    }
    if (!consultas.some(c => c.id === "demo-consulta-marina")) {
        consultas.push({id:"demo-consulta-marina",profissional:"Dra. Marina Exemplo",profissionalEmail:"marina@clearminds.exemplo",data:new Date(Date.now()+86400000).toLocaleDateString("pt-BR"),horario:"14:00",tipo:"Atendimento",modalidade:"Online",nota:"Levar dúvidas para a próxima conversa. Nota fictícia de demonstração.",status:"Agendado",ficticio:true});
        salvarLista("cm_consultas", consultas);
    }


    const set = (id, valor) => { const el = document.getElementById(id); if (el) el.textContent = valor; };
    const show = (id) => { const el = document.getElementById(id); if (el) el.hidden = false; };
    const hide = (id) => { const el = document.getElementById(id); if (el) el.hidden = true; };
    const limpar = (id) => { const el = document.getElementById(id); if (el) el.innerHTML = ""; };
    /* Preferências (tema, tamanho do texto, privacidade…) ficam em
       tema.js, o arquivo compartilhado com a Home do profissional
       e com o painel. Aqui só usamos a leitura. */
    const getConfigObj = window.CMTema ? window.CMTema.lerConfig : () => JSON.parse(localStorage.getItem("cm_config") || "{}");
    const atualizarResumoDiario = () => set("resumoDiario", String(diario.filter(registro => registro.autorEmail === emailUsuario).length));

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
    const obterProfissionalVinculado = () => {
        const v = vinculados[0] || {};
        const salvo = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");
        // O navegador pode ter um login profissional salvo de outra conta. Só
        // usamos esse perfil se o e-mail for exatamente o do contato vinculado.
        const p = salvo.email && salvo.email === v.email ? salvo : {};
        return { ...v, ...p, nome:p.nome||v.nome||"Profissional", email:p.email||v.email||"marina@clearminds.exemplo", profissao:p.profissao||v.profissao||v.area||"Psicóloga", ficticio:!!(p.ficticio||v.ficticio) };
    };
    let contatoChatAtivo = null;
    const contatosPaciente = () => { const ms=getLista("cm_mensagens").filter(m=>m.fromEmail===emailUsuario||m.toEmail===emailUsuario),map=new Map();ms.forEach(m=>{const from=m.fromEmail===emailUsuario,email=from?m.toEmail:m.fromEmail,name=from?m.toNome:m.fromNome;if(email)map.set(email,{email,nome:name||"Contato",data:m.data,texto:m.texto,ficticio:!!(m.ficticio||email.endsWith(".exemplo")||(email===profContato.email&&profContato.ficticio))});});if(!map.has(profContato.email))map.set(profContato.email,{email:profContato.email,nome:profContato.nome,ficticio:!!profContato.ficticio});return [...map.values()].sort((a,b)=>new Date(b.data||0)-new Date(a.data||0)); };
    const renderHistoricoPaciente=()=>{const h=document.getElementById("patientChatHistory");if(!h)return;h.replaceChildren();if(!contatoChatAtivo){h.innerHTML='<p class="cm-chat-placeholder">Escolha uma conversa para ver as mensagens.</p>';return;}const ms=getLista("cm_mensagens").filter(m=>(m.fromEmail===emailUsuario&&m.toEmail===contatoChatAtivo.email)||(m.fromEmail===contatoChatAtivo.email&&m.toEmail===emailUsuario)).sort((a,b)=>new Date(a.data)-new Date(b.data));if(!ms.length){h.innerHTML='<p class="cm-chat-placeholder">Esta conversa ainda não tem mensagens.</p>';return;}ms.forEach(m=>{const b=document.createElement("article");b.className="cm-chat-bubble "+(m.fromEmail===emailUsuario?"is-outgoing":"is-incoming");b.innerHTML=`<p>${esc(m.texto)}</p><small>${m.ficticio?'<span class="cm-chat-demo">Demonstração</span> ':""}${new Date(m.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</small>`;h.appendChild(b);});h.scrollTop=h.scrollHeight;};
    const selecionarConversaPaciente=(c,draft)=>{contatoChatAtivo=c;const name=document.getElementById("patientChatName"),status=document.getElementById("patientChatStatus"),av=document.getElementById("patientChatAvatar"),profBtn=document.getElementById("patientChatProfile"),input=document.getElementById("patientChatDraft");if(name)name.textContent=c.nome||"Contato";if(status)status.textContent=c.ficticio?"Demonstração fictícia":"Conversa privada";if(av)av.textContent=(c.nome||"CM").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();if(profBtn)profBtn.hidden=c.email!==profContato.email;if(input){if(draft!==undefined)input.value=draft;document.getElementById("patientChatSend").disabled=!input.value.trim();}const profissional=c.email===profContato.email;const role=document.getElementById("patientChatDetailRole"),detailName=document.getElementById("patientChatDetailName"),detailLocation=document.getElementById("patientChatDetailLocation"),detailAvatar=document.getElementById("patientChatDetailAvatar");if(detailName)detailName.textContent=c.nome||"Contato";if(role)role.textContent=profissional?(profContato.profissao||"Profissional de saúde"):"Pessoa da comunidade";if(detailLocation)detailLocation.textContent=profissional?[profContato.cidade,profContato.estado].filter(Boolean).join(", ")||profContato.email:c.email||"Contato da comunidade";if(detailAvatar)detailAvatar.textContent=(c.nome||"CM").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();const thread=getLista("cm_mensagens").filter(m=>(m.fromEmail===emailUsuario&&m.toEmail===c.email)||(m.fromEmail===c.email&&m.toEmail===emailUsuario));const imgs=thread.filter(m=>m.midia?.tipo==="imagem").length,docs=thread.filter(m=>m.midia&&m.midia.tipo!=="imagem").length;["patientChatImageCount","patientChatPhotoCount"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=String(imgs);});const docEl=document.getElementById("patientChatDocCount");if(docEl)docEl.textContent=String(docs);document.querySelectorAll("#patientMessageList .cm-chat-contact").forEach(b=>b.classList.toggle("active",b.dataset.email===c.email));renderHistoricoPaciente();};
    const renderCaixaMensagens=()=>{const ul=document.getElementById("patientMessageList"),empty=document.getElementById("patientMessagesEmpty");if(!ul)return;const q=(document.getElementById("patientChatSearch")?.value||"").trim().toLowerCase();const contacts=contatosPaciente().filter(c=>!q||(c.nome||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q));ul.replaceChildren();if(empty)empty.hidden=contacts.length>0;contacts.forEach(c=>{const li=document.createElement("li"),b=document.createElement("button");b.type="button";b.className="cm-chat-contact"+(contatoChatAtivo?.email===c.email?" active":"");b.dataset.email=c.email;b.innerHTML=`<span class="cm-avatar cm-avatar-sm">${esc((c.nome||"C").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())}</span><span class="cm-chat-contact-copy"><strong>${esc(c.nome)}${c.ficticio?'<small class="cm-chat-demo">Demonstração</small>':""}</strong><small>${esc(c.texto||c.email)}</small></span>`;b.onclick=()=>selecionarConversaPaciente(c,"");li.appendChild(b);ul.appendChild(li);});if(!contatoChatAtivo||!contacts.some(c=>c.email===contatoChatAtivo.email))contatoChatAtivo=contacts.find(c=>c.email===profContato.email)||contacts[0]||null;if(contatoChatAtivo)selecionarConversaPaciente(contatoChatAtivo);else renderHistoricoPaciente();};
    const abrirConversa=(c,draft="")=>{abrirSecaoMensagens();const dest=contatosPaciente().find(x=>x.email===c.email)||c;selecionarConversaPaciente(dest,draft);document.getElementById("patientChatDraft")?.focus();};
    const profContato=obterProfissionalVinculado();
    const abrirFluxoDialogo = (titulo, conteudo) => {
        let overlay = document.getElementById("cmFlowOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "cmFlowOverlay";
            overlay.className = "cm-modal-overlay";
            overlay.setAttribute("aria-hidden", "true");
            overlay.innerHTML = `
                <div class="cm-modal cm-flow-modal" role="dialog" aria-modal="true" aria-labelledby="cmFlowTitle">
                    <button class="cm-flow-close" type="button" aria-label="Fechar">×</button>
                    <h3 id="cmFlowTitle"></h3>
                    <div class="cm-flow-content"></div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.addEventListener("click", event => {
                if (event.target === overlay || event.target.closest(".cm-flow-close")) {
                    overlay.classList.remove("show");
                    overlay.setAttribute("aria-hidden", "true");
                }
            });
            document.addEventListener("keydown", event => {
                if (event.key === "Escape" && overlay.classList.contains("show")) {
                    overlay.classList.remove("show");
                    overlay.setAttribute("aria-hidden", "true");
                }
            });
        }
        overlay.querySelector("#cmFlowTitle").textContent = titulo || "Detalhes";
        overlay.querySelector(".cm-flow-content").innerHTML = conteudo || "";
        overlay.classList.add("show");
        overlay.setAttribute("aria-hidden", "false");
        overlay.querySelector(".cm-flow-close")?.focus();
        return overlay;
    };
    {const ms=getLista("cm_mensagens"),exemplos=[{id:`demo-in-${emailUsuario}-1`,fromEmail:profContato.email,toEmail:emailUsuario,fromNome:profContato.nome,toNome:nomeUsuario,texto:"Olá! Estou à disposição para conversarmos sobre seu acompanhamento. Mensagem fictícia.",data:new Date(Date.now()-3600000).toISOString(),ficticio:true},{id:`demo-in-${emailUsuario}-2`,fromEmail:demonstracaoEmail,toEmail:emailUsuario,fromNome:"Lia Demonstração",toNome:nomeUsuario,texto:"Vi sua publicação na Comunidade. Obrigada por compartilhar! Mensagem fictícia.",data:new Date(Date.now()-7200000).toISOString(),ficticio:true}];let mudou=false;exemplos.forEach(exemplo=>{if(!ms.some(m=>m.id===exemplo.id)){ms.push(exemplo);mudou=true;}});if(mudou)salvarLista("cm_mensagens",ms);localStorage.setItem(`cm_demo_patient_messages_${emailUsuario}`,"1");}
    document.querySelector("#sec-mensagens > .cm-section-head")?.remove();const inboxPanel=document.querySelector("#sec-mensagens .home-inbox-panel");if(inboxPanel)document.querySelector("#sec-mensagens .cm-chat-contacts")?.appendChild(inboxPanel);const chatTitle=document.querySelector("#sec-mensagens .home-messages-panel .cm-panel-title");if(chatTitle)chatTitle.textContent="Chat";document.getElementById("patientChatUserName").textContent=nomeUsuario;document.getElementById("patientChatUserAvatar").textContent=(nomeUsuario||"CM").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();renderCaixaMensagens();document.getElementById("patientChatSearch")?.addEventListener("input",renderCaixaMensagens);document.getElementById("patientNewChatMini")?.addEventListener("click",()=>abrirConversa(profContato,""));document.getElementById("patientChatDraft")?.addEventListener("input",e=>{document.getElementById("patientChatSend").disabled=!e.target.value.trim();});document.getElementById("patientChatForm")?.addEventListener("submit",e=>{e.preventDefault();const input=document.getElementById("patientChatDraft"),texto=input.value.trim();if(!contatoChatAtivo||!texto)return;const ms=getLista("cm_mensagens");ms.push({id:`msg-${Date.now()}`,fromEmail:emailUsuario,toEmail:contatoChatAtivo.email,fromNome:nomeUsuario,toNome:contatoChatAtivo.nome,texto,data:new Date().toISOString()});salvarLista("cm_mensagens",ms);input.value="";document.getElementById("patientChatSend").disabled=true;renderCaixaMensagens();});document.getElementById("btnNovaMensagem")?.addEventListener("click",()=>abrirConversa(profContato,""));document.getElementById("patientChatProfile")?.addEventListener("click",()=>mostrarPerfilProfissional(profContato));window.addEventListener("storage",e=>{if(e.key==="cm_mensagens")renderCaixaMensagens();});    const mostrarPerfilProfissional=(prof)=>{const d={...profContato,...prof},full=JSON.parse(localStorage.getItem("cm_profile_profissional")||"{}");const fields=[["Profissão",d.profissao],["E-mail",d.email],["Telefone",d.telefone||full.telefone],["Cidade",d.cidade||full.cidade],["Estado",d.estado||full.estado],["Especialidades",d.especialidades||full.especialidades],["Abordagem",d.abordagem||full.abordagem],["Modalidade",d.modalidade||full.modalidade],["Faixa etária",d.faixaEtaria||full.faixaEtaria],["Formação",d.faculdade||full.faculdade],["Ano de formação",d.anoFormacao||full.anoFormacao],["Pós-graduação",d.posGraduacao||full.posGraduacao],["Idiomas",d.idiomas||full.idiomas],["Disponibilidade",d.disponibilidade||full.disponibilidade],["Valor da sessão",d.valorSessao?`R$ ${d.valorSessao}`:full.valorSessao],["Apresentação",d.bio||full.bio],["Registro",d.registroProfissional||full.registroProfissional]];const rows=fields.filter(x=>x[1]).map(x=>`<li><b>${esc(x[0])}:</b> ${esc(x[1])}</li>`).join("");const o=abrirFluxoDialogo(d.nome,`<p>${d.ficticio?'<span class="cm-demo-label">Perfil fictício de demonstração</span>':""}</p><ul class="cm-prof-profile-details">${rows||"<li>Dados profissionais não cadastrados ainda.</li>"}</ul><div class="cm-add-form-actions"><button class="cm-btn cm-btn-primary cm-btn-sm" data-profile-message>Enviar mensagem</button><button class="cm-btn cm-btn-soft cm-btn-sm" data-profile-rebook>Reagendar atendimento</button>${d.telefone?`<a class="cm-btn cm-btn-soft cm-btn-sm" href="tel:${esc(d.telefone)}">Ligar</a>`:""}</div>`);o.querySelector("[data-profile-message]").onclick=()=>{o.classList.remove("show");abrirConversa(d);};o.querySelector("[data-profile-rebook]").onclick=()=>{o.classList.remove("show");abrirConversa(d,"Gostaria de reagendar a data do atendimento!");};};
    document.getElementById("listaProfissionais")?.addEventListener("click",e=>{const b=e.target.closest("[data-view-professional]");if(b)mostrarPerfilProfissional(JSON.parse(decodeURIComponent(b.dataset.viewProfessional)));});
    const mostrarDetalhesConsulta=c=>{const cancelada=(c.status||"").toLowerCase()==="cancelado",o=abrirFluxoDialogo("Detalhes do atendimento",`<ul class="cm-prof-profile-details"><li><b>Profissional:</b> ${esc(c.profissional||profContato.nome)}</li><li><b>Dia:</b> ${esc(c.data||"Não informado")}</li><li><b>Horário:</b> ${esc(c.horario||"Não informado")}</li><li><b>Nota do profissional:</b> ${esc(c.nota||c.observacao||"Nenhuma nota registrada")}</li><li><b>Modalidade:</b> ${esc(c.modalidade||c.tipo||"Não informada")}</li><li><b>Situação:</b> ${esc(c.status||"Agendado")}</li></ul><div class="cm-add-form-actions"><button class="cm-btn cm-btn-danger cm-btn-sm" data-cancel-appointment ${cancelada?"disabled":""}>Cancelar atendimento</button><button class="cm-btn cm-btn-primary cm-btn-sm" data-reschedule-appointment>Reagendar atendimento</button></div>`);o.querySelector("[data-cancel-appointment]").onclick=()=>{if(!cancelada&&confirm("Deseja cancelar este atendimento?")){c.status="cancelado";salvarLista("cm_consultas",consultas);renderConsultas();o.classList.remove("show");}};o.querySelector("[data-reschedule-appointment]").onclick=()=>{o.classList.remove("show");const vinculado=vinculados.find(p=>p.email===c.profissionalEmail);const destino=vinculado?{...profContato,...vinculado,nome:c.profissional||vinculado.nome,email:c.profissionalEmail,ficticio:!!vinculado.ficticio}:{...profContato,nome:c.profissional||profContato.nome,email:c.profissionalEmail||profContato.email};abrirConversa(destino,"Gostaria de reagendar a data do atendimento!");};};
    const conteudosUsuario = [
        {
            id: 1,
            categoria: "Saúde mental",
            icone: "fa-solid fa-brain",
            titulo: "O que é o autocuidado e por onde começar",
            data: "2026",
            teaser: "Autocuidado é um conjunto de práticas que ajudam a manter saúde física, emocional e social de forma realista e sustentável.",
            videoUrl: "https://youtu.be/yMWFtSSSgfk?si=e9V8P_3PncQniu7A",
            fonte: "World Health Organization (WHO). Implementation of self-care interventions for health and well-being: guidance for health systems. 2024.",
            fonteLink: "https://www.who.int/publications/i/item/9789240084574",
            corpo: [
                { tipo: "p", texto: "Autocuidado não é um ‘luxo’ ou uma tarefa extra na rotina. Na orientação da Organização Mundial da Saúde (OMS), publicada em 2024, intervenções de autocuidado fazem parte de estratégias para fortalecer bem-estar e saúde, desde hábitos diários até apoio em saúde mental e relações sociais." },
                { tipo: "h3", texto: "O que você precisa saber" },
                { tipo: "p", texto: "Autocuidado significa cuidar de si com intenção, sem depender de perfeição. Isso inclui sono, alimentação, movimento, pausas, organização, comunicação e atenção ao que você sente." },
                { tipo: "h3", texto: "Autocuidado não é igual a “fazer tudo certo”" },
                { tipo: "p", texto: "Ele não significa negar cansaço, ignorar sofrimento, fingir que tudo está bem ou agir como se o estudante precisasse lidar sozinho com tudo. Também não é apenas atividades prazerosas isoladas: assistir a um vídeo, ouvir música ou tomar um banho podem ser úteis, mas não substituem hábitos que sustentem bem-estar ao longo do tempo." },
                { tipo: "h3", texto: "Autocuidado físico, emocional, social e de rotina" },
                { tipo: "ul", itens: ["Físico: sono regular, água, alimentação, pausas, movimento e redução de excesso de estímulos.", "Emocional: nomear sentimentos, pedir apoio e respeitar limites.", "Social: conviver com pessoas que respeitam você e dar espaço para o que te faz bem.", "Rotina: organizar tarefas, priorizar estudos e reconhecer o que é possível em cada momento."] },
                { tipo: "h3", texto: "Por onde começar" },
                { tipo: "ul", itens: ["Escolha uma ação simples, como dormir no horário certo, beber água durante o dia, registrar como está se sentindo ou organizar a semana.", "Comece pelo que cabe no seu ritmo, em vez de tentar fazer tudo de uma vez.", "Faça pequenas verificações: ‘Estou cansado(a)? Estou muito sobrecarregado(a)? Preciso de ajuda?’"] },
                { tipo: "h3", texto: "Quando é preciso buscar ajuda" },
                { tipo: "p", texto: "Autocuidado pode ser parte do cuidado com a saúde, mas não substitui acompanhamento profissional quando há sofrimento intenso, ansiedade frequente, isolamento, irritabilidade muito alta ou impacto na rotina, estudo e relações. Em situações mais desafiadoras, conversar com um adulto de confiança, professor(a), orientador(a) ou profissional de saúde é uma decisão responsável." },
                { tipo: "h3", texto: "O que as pesquisas mostram" },
                { tipo: "p", texto: "A OMS, em 2024 e 2025, destacou que hábitos relacionados ao sono, atividade física, enfrentamento de desafios, resolução de problemas e manejo das emoções são importantes para o bem-estar na adolescência. A orientação da OMS reforça que intervenções de autocuidado funcionam melhor quando são integradas ao contexto real de vida da pessoa e não tratadas como solução única para todos os problemas." },
                { tipo: "h3", texto: "Na prática" },
                { tipo: "p", texto: "Para estudantes do ensino médio, um autocuidado realista pode ser: dormir na hora, fazer pausas entre estudos, conversar com alguém confiável, reduzir comparações, limitar uso de telas antes de dormir e reservar tempo para descanso ou lazer sem culpa." }
            ]
        },
        {
            id: 2,
            categoria: "Ansiedade",
            icone: "fa-solid fa-wind",
            titulo: "Técnica 3-3-3 para momentos de ansiedade",
            data: "2026",
            teaser: "Uma estratégia simples de grounding para voltar a atenção para o presente, especialmente em momentos de sobrecarga ou ansiedade.",
            videoUrl: "",
            fonte: "Newport Healthcare. Grounding techniques for anxiety: 3-3-3 method. June 2024.",
            fonteLink: "https://www.newportacademy.com/resources/self-improvement/3-3-3-grounding-technique/",
            corpo: [
                { tipo: "p", texto: "A técnica 3-3-3 é uma estratégia de grounding bastante conhecida em contexto de saúde mental e bem-estar. Ela pode ajudar algumas pessoas a direcionar a atenção para o ambiente e para o momento presente em situações de ansiedade, sobrecarga ou sensação de aceleração mental." },
                { tipo: "h3", texto: "O que você precisa saber" },
                { tipo: "p", texto: "A técnica não tem como objetivo ‘curar’ a ansiedade nem substituir avaliação ou acompanhamento profissional. Ela é uma forma simples de redirecionar atenção, mas pode não funcionar do mesmo jeito para todas as pessoas." },
                { tipo: "h3", texto: "Passo 1 — 3 coisas que você vê" },
                { tipo: "p", texto: "Olhe ao redor e nomeie três objetos, detalhes ou pessoas que consegue ver. Pode ser a mochila, uma cadeira, uma janela, uma planta ou qualquer elemento do ambiente." },
                { tipo: "h3", texto: "Passo 2 — 3 coisas que você ouve" },
                { tipo: "p", texto: "Preste atenção a três sons presentes naquele momento: vento, passos, ventilador, conversas ao longe, clique do teclado ou um objeto vibrando." },
                { tipo: "h3", texto: "Passo 3 — 3 movimentos" },
                { tipo: "p", texto: "Ajuste o corpo de forma confortável e faça três movimentos: mexer os dedos, movimentar os ombros, erguer ou abaixar os pés, ou qualquer gesto leve que não cause desconforto." },
                { tipo: "h3", texto: "O que as pesquisas mostram" },
                { tipo: "p", texto: "Há materiais de saúde que descrevem a técnica 3-3-3 como uma estratégia de grounding, incluindo a Newport Healthcare em publicação de junho de 2024. Porém, não há evidência científica suficiente para afirmar que ela, isoladamente, tem eficácia clínica comprovada de forma generalizada. Por isso, a melhor forma de apresentar essa técnica é como um recurso de apoio e atenção para o presente, não como solução definitiva para ansiedade." },
                { tipo: "h3", texto: "Na prática" },
                { tipo: "p", texto: "Se a ansiedade for frequente, intensa ou estiver prejudicando sua rotina, procure um adulto de confiança e/ou um profissional de saúde. A técnica pode ser útil, mas não substitui cuidado adequado quando o sofrimento é persistente ou grave." }
            ]
        },
        {
            id: 3,
            categoria: "Rotina de estudos",
            icone: "fa-solid fa-book-open",
            titulo: "Como o sono afeta sua memória e suas notas",
            data: "2026",
            teaser: "Sono não é descanso perdido: ele ajuda o cérebro a organizar, consolidar e recuperar o que você aprendeu.",
            videoUrl: "https://youtu.be/4W16fpTlzac?si=Lv3krpbU9QIooKqT",
            fonte: "Alhola P, Polo-Kantola P. Sleep deprivation: impact on cognitive performance. Neuropsychiatr Dis Treat. 2007. Disponível em PubMed/NCBI.",
            fonteLink: "https://pubmed.ncbi.nlm.nih.gov/18047487/",
            corpo: [
                { tipo: "p", texto: "Dormir não é apenas uma pausa entre um dia e outro. Durante o sono, o cérebro continua trabalhando em processos importantes para aprendizagem, memória e atenção." },
                { tipo: "h3", texto: "O que você precisa saber" },
                { tipo: "p", texto: "A privação do sono prejudica a atenção, a memória de trabalho e a capacidade de aprender com rapidez. Isso não quer dizer que uma noite mal dormida vai arruinar sua vida acadêmica, mas ela pode afetar concentração e retenção de conteúdo." },
                { tipo: "h3", texto: "O que as pesquisas mostram" },
                { tipo: "p", texto: "Uma revisão sistemática e meta-análise publicada em 2024 na revista Neuroscience & Biobehavioral Reviews analisou 39 estudos e 1.234 participantes e encontrou que a restrição do sono prejudicou a formação de memórias, embora o efeito observado tenha sido pequeno. Em outras palavras, dormir pouco pode interferir na consolidação do que foi aprendido, especialmente quando a falta de sono é recorrente." },
                { tipo: "p", texto: "Além disso, revisões e estudos clássicos sobre privação de sono apontam que a falta de descanso afeta atenção, vigilância e tempo de reação — elementos diretamente ligados à aprendizagem e ao desempenho escolar. O impacto varia de pessoa para pessoa, mas o padrão geral é consistente: sono insuficiente diminui capacidade de processamento e memória." },
                { tipo: "h3", texto: "Na prática" },
                { tipo: "ul", itens: ["Manter um horário regular de sono ajuda o cérebro a trabalhar melhor no dia seguinte.", "Dormir bem favorece revisão, concentração e organização de ideias.", "Escala de estudo e descanso são complemento de aprendizagem, não competição."] },
                { tipo: "h3", texto: "Experimente" },
                { tipo: "p", texto: "Pergunte a si mesmo: ‘Eu dormi o suficiente para lembrar tudo com clareza? Como estou me sentindo na aula?’. Essas observações ajudam a perceber que sono também faz parte do rendimento escolar." }
            ]
        },
        {
            id: 4,
            categoria: "Relacionamentos",
            icone: "fa-solid fa-heart",
            titulo: "Amizades que fazem bem: sinais e limites",
            data: "2026",
            teaser: "Amizades saudáveis são aquelas que dão apoio, respeito e espaço para você ser quem é — sem desgastar sua energia.",
            videoUrl: "https://recordtv.r7.com/love-school-escola-amor/videos/amizades-que-ultrapassam-limites-e-entram-em-aspectos-pessoais-podem-abalar-relacionamentos-25032023",
            fonte: "Brenning, K. M. et al. Associations Between Adolescent Friends' Responses During Problem Talk and Depressive Symptoms. Developmental Psychology. 2024.",
            fonteLink: "https://psycnet.apa.org/record/2024-93984-001",
            corpo: [
                { tipo: "p", texto: "Amizades que fazem bem geralmente têm um eixo de cuidado, respeito e limites. Elas não exigem que você se anule para agradar ou se sinta sempre responsável por cuidar do outro sem receber cuidado em troca." },
                { tipo: "h3", texto: "O que você precisa saber" },
                { tipo: "p", texto: "Uma amizade saudável costuma ter espaço para ouvir, apoiar e respeitar o tempo do outro. Quando alguém minimiza o que você sente, muda de assunto sempre que você fala sobre algo importante ou te faz sentir culpa por estabelecer limites, é um sinal de que a relação pode não estar sendo acolhedora." },
                { tipo: "h3", texto: "O que as pesquisas mostram" },
                { tipo: "p", texto: "Um estudo publicado na Developmental Psychology em 2024 acompanhou 271 duplas de amigos adolescentes e encontrou associações entre respostas positivas e engajadas — como oferecer apoio, compartilhar experiências e fazer perguntas — e menores níveis de sintomas depressivos ao longo do tempo. Já respostas negativas ou desengajadas, como minimizar o problema ou mudar de assunto, foram associadas a níveis maiores de sofrimento emocional." },
                { tipo: "p", texto: "Em uma pesquisa publicada no Journal of Research on Adolescence em 2024, a qualidade da amizade também se relacionou com maior abertura para compartilhar aspectos pessoais e sentimentos. Isso mostra que vínculos saudáveis ajudam a desenvolver confiança e suporte emocional, e não apenas companhia na rotina." },
                { tipo: "h3", texto: "Na prática" },
                { tipo: "ul", itens: ["Você pode dizer ‘não’ sem se sentir culpado(a).", "Você pode pedir espaço quando precisa ficar em silêncio, descansar ou estudar.", "Você pode iniciar uma conversa sobre como se sente em relação a uma amizade, sem precisar transformar tudo em conflito imediato."] },
                { tipo: "h3", texto: "Experimente" },
                { tipo: "p", texto: "Observe: em suas amizades, alguém te escuta e respeita? Você se sente livre para dizer não? Quando uma conversa te deixa exausto(a), isso pode ser um sinal importante de que o vínculo não está sendo saudável para você." }
            ]
        },
        {
            id: 5,
            categoria: "Emoções",
            icone: "fa-solid fa-face-smile",
            titulo: "Por que nomear emoções ajuda a lidar com elas",
            data: "2026",
            teaser: "Reconhecer o que você sente com mais precisão pode ajudar a escolher uma resposta mais útil para aquilo que está vivendo.",
            videoUrl: "",
            fonte: "Preece, D. A. et al. Examining the association among adolescents' emotional clarity, emotion differentiation and the regulation of negative and positive affect using a daily diary approach. Emotion. 2024.",
            fonteLink: "https://pubmed.ncbi.nlm.nih.gov/39325939/",
            corpo: [
                { tipo: "p", texto: "Dar nome a uma emoção não é apenas uma questão de linguagem. É um passo importante para compreender melhor o que está acontecendo dentro de você e reduzir a sensação de que tudo é confuso ou avassalador." },
                { tipo: "h3", texto: "O que você precisa saber" },
                { tipo: "p", texto: "Diferenciar entre ‘estou mal’ e ‘estou frustrado(a), ansioso(a), triste, com vergonha ou preocupado(a)’ ajuda a criar mais clareza. Quando a emoção é nomeada, o cérebro consegue processar melhor a experiência e escolher uma resposta mais adequada." },
                { tipo: "h3", texto: "O que as pesquisas mostram" },
                { tipo: "p", texto: "Um estudo publicado na revista Emotion em 2024, com adolescentes e jovens adultos, utilizou registros diários para examinar a relação entre clareza emocional, diferenciação das emoções e regulação afetiva. Os resultados sugerem que compreender e diferenciar melhor as próprias emoções está relacionado a processos de regulação emocional mais funcionais." },
                { tipo: "p", texto: "Também há evidência de que adolescentes com maior diferenciação emocional tendem a ter uma experiência afetiva mais específica e menos generalizada, o que pode facilitar compreender melhor seus próprios sentimentos e escolher estratégias de enfrentamento mais adequadas." },
                { tipo: "h3", texto: "Na prática" },
                { tipo: "ul", itens: ["Em vez de dizer ‘estou mal’, tente identificar algo mais específico: ‘estou frustrado(a) por ter muitas tarefas’, ‘estou ansioso(a) porque tenho prova amanhã’, ‘estou triste porque me senti excluído(a)’.", "Usar palavras mais precisas ajuda a entender melhor a situação e o que precisa ser cuidado.", "Não julgar a emoção como certa ou errada: a emoção pode ser reconhecida sem ser ignorada."] },
                { tipo: "h3", texto: "Experimente" },
                { tipo: "p", texto: "No final do dia, faça uma mini-checagem: ‘O que senti hoje? Como isso apareceu? O que me ajudaria agora?’ Essa prática não resolve tudo sozinha, mas pode ser um primeiro passo importante para entender melhor o próprio estado emocional." }
            ]
        }
    ];

    const abrirLeitor = (c) => {
        const overlay = document.getElementById("cmReaderOverlay");
        if (!overlay) return;
        const fmt = (v) => esc(String(v));
        const setEl = (id, valor) => { const el = document.getElementById(id); if (el) el.innerHTML = valor; };
        const setHref = (id, href, label) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.href = href || "#";
            el.textContent = label || "Ver fonte";
            el.hidden = !href;
        };
        setEl("cmReaderCategoria", `<i class="${fmt(c.icone)}" aria-hidden="true"></i> ${fmt(c.categoria)}`);
        setEl("cmReaderData", fmt(c.data));
        setEl("cmReaderTitulo", fmt(c.titulo));
        setEl("cmReaderTeaser", fmt(c.teaser || ""));

        const videoWrap = document.getElementById("cmReaderVideo");
        if (videoWrap) {
            if (c.videoUrl) {
                const isYouTube = /(youtu\.be|youtube\.com)/i.test(c.videoUrl || "");
                if (isYouTube) {
                    const videoId = (c.videoUrl.match(/(?:v=|be\/)([A-Za-z0-9_-]{11})/) || [null, ""])[1];
                    const src = videoId ? `https://www.youtube.com/embed/${videoId}` : c.videoUrl;
                    videoWrap.innerHTML = `<iframe src="${src}" title="Vídeo do conteúdo" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                } else {
                    videoWrap.innerHTML = `<div class="cm-reader-video-placeholder"><p><strong>Vídeo disponível:</strong><br><a href="${esc(c.videoUrl)}" target="_blank" rel="noopener noreferrer">Abrir vídeo original</a></p></div>`;
                }
            } else {
                videoWrap.innerHTML = "";
            }
        }

        const corpo = (c.corpo || []).map(bloco => {
            if (bloco.tipo === "h3") return `<h3>${fmt(bloco.texto)}</h3>`;
            if (bloco.tipo === "ul") return `<ul>${bloco.itens.map(i => `<li>${fmt(i)}</li>`).join("")}</ul>`;
            return `<p>${fmt(bloco.texto)}</p>`;
        }).join("");

        if (c.id === 2) {
            const checklist = [
                "3 coisas que você vê",
                "3 coisas que você ouve",
                "3 movimentos que você consegue fazer agora"
            ];
            const passos = checklist.map((label, idx) => `
                <div class="cm-grounding-item">
                    <input id="ground-${idx}" type="checkbox">
                    <label for="ground-${idx}">${label}</label>
                </div>`).join("");
            setEl("cmReaderCorpo", `${corpo}<div class="cm-grounding-checklist">${passos}</div><p><strong>Fonte:</strong> ${fmt(c.fonte)}</p><p><strong>Observação:</strong> esta técnica é uma estratégia simples de grounding e não substitui acompanhamento profissional quando a ansiedade é frequente, intensa ou interfere na rotina.</p>`);
        } else {
            setEl("cmReaderCorpo", `${corpo}<p><strong>Fonte:</strong> ${fmt(c.fonte)}</p>`);
        }

        setHref("cmReaderFonte", c.fonteLink || "#", "Ver fonte");
        setHref("cmReaderVideoLink", c.videoUrl || "", c.videoUrl ? "Assistir ao vídeo" : "Assistir ao vídeo");
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
                <i class="fa-solid fa-chevron-right" style="color:#A8C6CB;flex-shrink:0;" aria-hidden="true"></i>`;
            li.addEventListener("click", () => abrirLeitor(c));
            li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirLeitor(c); } });
            lista.appendChild(li);
        });
    };
    renderConteudosUsuario();

    /* ---------- Identificação ---------- */
    set("saudacao", `${periodo}, ${nomeUsuario.split(" ")[0]}!`);
    set("topoNomeUsuario", `Olá, ${nomeUsuario.split(" ")[0]}`);
    set("sideNome", nomeUsuario);
    set("homeProfileName", nomeUsuario);
    set("homeProfileEmail", perfil.email || emailUsuario);
    set("composerNomeAut", `${nomeUsuario.split(" ")[0]}, como você está?`);
    set("composerNomeAut2", `${nomeUsuario.split(" ")[0]}, compartilhe com a comunidade`);

    const aplicarFoto = (el, nome) => {
        if (!el) return;
        const iniciais = nome.split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("");
        if (perfil.foto) el.innerHTML = `<img src="${perfil.foto}" alt="Foto de perfil">`;
        else el.innerHTML = iniciais;
    };

    const avatar = document.getElementById("avatarIniciais");
    aplicarFoto(avatar, nomeUsuario);
    aplicarFoto(document.getElementById("homeProfileAvatar"), nomeUsuario);
    aplicarFoto(document.getElementById("sideAvatar"), nomeUsuario);
    aplicarFoto(document.getElementById("composerAvatar"), nomeUsuario);
    aplicarFoto(document.getElementById("composerAvatar2"), nomeUsuario);
    aplicarFoto(document.getElementById("perfilAvatar"), nomeUsuario);

    const fotoPerfilInput = document.getElementById("fotoPerfil");
    const perfilAvatar = document.getElementById("perfilAvatar");
    if (fotoPerfilInput && perfilAvatar) {
        const abrirSeletorFoto = () => {
            fotoPerfilInput.value = "";
            fotoPerfilInput.click();
        };
        perfilAvatar.addEventListener("click", abrirSeletorFoto);
        document.getElementById("btnAlterarFoto")?.addEventListener("click", abrirSeletorFoto);
        fotoPerfilInput.addEventListener("change", () => {
            const arquivo = fotoPerfilInput.files && fotoPerfilInput.files[0];
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
                    localStorage.setItem("cm_profile", JSON.stringify(perfilAtualizado));
                    Object.assign(perfil, perfilAtualizado);
                    aplicarFoto(document.getElementById("avatarIniciais"), nomeUsuario);
                    aplicarFoto(document.getElementById("homeProfileAvatar"), nomeUsuario);
                    aplicarFoto(document.getElementById("sideAvatar"), nomeUsuario);
                    aplicarFoto(document.getElementById("composerAvatar"), nomeUsuario);
                    aplicarFoto(document.getElementById("composerAvatar2"), nomeUsuario);
                    aplicarFoto(perfilAvatar, nomeUsuario);
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
    const botoesMenu = document.querySelectorAll(
        ".cm-side-item[data-secao], .cm-side-avatar-button[data-secao]"
    );

    botoesMenu.forEach(btn => {
        btn.addEventListener("click", () => {
            const alvo = btn.dataset.secao;
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
        document.body.style.setProperty("--cm-rail-top", cmTopbar ? cmTopbar.offsetHeight + "px" : "0px");
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
    // Só sugere perfis de autores com publicações visíveis na comunidade.
    const conhecerPessoas = () => {
        const mapa = {};
        postagens.forEach(p => {
            if (p.autorEmail && p.autorEmail !== emailUsuario && p.autor) {
                mapa[p.autorEmail] = {
                    email: p.autorEmail,
                    nome: p.autor,
                    foto: p.autorFoto || "",
                    detalhe: "Pessoa da comunidade Clear Minds"
                };
            }
        });
        return Object.values(mapa);
    };

    // Quem o usuário já segue (estrutura cm_amizades)
    const seguirPessoa = (pessoa) => {
        if (!amizades.some(a => a.email === pessoa.email)) {
            amizades.push({ email: pessoa.email, nome: pessoa.nome, data: new Date().toISOString() });
            salvarLista("cm_amizades", amizades);
        }
    };

    const contatosParaCompartilhar = () => amizades.length ? amizades : [
        { email: demonstracaoEmail, nome: "Lia Demonstração" },
        { email: "rafa@clearminds.exemplo", nome: "Rafa Exemplo" }
    ];

    const renderListaSugestoes = (lista, vazio, pessoas, filtro = "", limite = Infinity) => {
        if (!lista) return;
        const jaSeguidas = amizades.map(a => a.email);
        const busca = (filtro || "").trim().toLowerCase();
        const exibir = pessoas
            .filter(p => !jaSeguidas.includes(p.email))
            .filter(p => !busca || p.nome.toLowerCase().includes(busca) || p.email.toLowerCase().includes(busca))
            .slice(0, limite);

        lista.replaceChildren();
        if (!exibir.length) { if (vazio) vazio.hidden = false; return; }
        if (vazio) vazio.hidden = true;

        exibir.forEach(p => {
            const li = document.createElement("li");
            const ini = (p.nome || "U").split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("");
            const avatar = p.foto
                ? `<img src="${esc(p.foto)}" alt="">`
                : esc(ini);
            li.innerHTML = `
                <span class="cm-avatar cm-avatar-sm" aria-hidden="true">${avatar}</span>
                <div class="cm-info">
                    <strong>${esc(p.nome)}</strong>
                    <small>${esc(p.detalhe || "Pessoa da comunidade Clear Minds")}</small>
                </div>
                <button type="button" class="cm-follow-btn" aria-label="Seguir ${esc(p.nome)}">Seguir <i class="fa-solid fa-user-plus" aria-hidden="true"></i></button>
            `;
            li.querySelector(".cm-follow-btn").addEventListener("click", () => {
                seguirPessoa(p);
                renderListaSeguidas();
                renderSugestoes(document.getElementById("buscaSugestoes")?.value);
                renderHomeActivity();
            });
            lista.appendChild(li);
        });
    };

    const renderSugestoes = (filtro) => {
        const pessoas = conhecerPessoas();
        renderListaSugestoes(
            document.getElementById("listaSugestoes"),
            document.getElementById("sugestoesVazio"),
            pessoas,
            filtro
        );
        renderListaSugestoes(
            document.getElementById("listaSugestoesPerfilPaciente"),
            document.getElementById("sugestoesPerfilPacienteVazio"),
            pessoas,
            "",
            3
        );
        renderListaSugestoes(
            document.getElementById("listaSugestoesInicio"),
            document.getElementById("sugestoesInicioVazio"),
            pessoas,
            "",
            4
        );
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
            const pollEditor = document.getElementById(`pollEditor${n}`);
            if (pollEditor) pollEditor.hidden = true;
            [`pollQuestion${n}`, `pollOption${n}A`, `pollOption${n}B`].forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = "";
            });
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

    document.querySelectorAll("[data-poll-btn]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const editor = document.getElementById(`pollEditor${btn.dataset.pollBtn}`);
            if (editor) editor.hidden = !editor.hidden;
        });
    });

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
        const pollEditor = document.getElementById(`pollEditor${n}`);
        const pollAberta = Boolean(pollEditor && !pollEditor.hidden);
        const pergunta = document.getElementById(`pollQuestion${n}`)?.value.trim() || "";
        const opcaoA = document.getElementById(`pollOption${n}A`)?.value.trim() || "";
        const opcaoB = document.getElementById(`pollOption${n}B`)?.value.trim() || "";
        let enquete = null;

        if (pollAberta) {
            if (!pergunta || !opcaoA || !opcaoB) {
                notificar("Preencha a pergunta e as duas opções da enquete.");
                return;
            }
            enquete = {
                pergunta,
                opcoes: [
                    { id: "a", texto: opcaoA },
                    { id: "b", texto: opcaoB }
                ],
                votos: {}
            };
        }

        if (!texto && !midiasPendentes[n] && !enquete) {
            notificar("Escreva algo, adicione uma mídia ou crie uma enquete.");
            return;
        }

        const moods = document.getElementById(idMoods);
        const humor = moods?.querySelector(".cm-mood-chip.active")?.dataset.humor || "";

        postagens.push({
            id: Date.now().toString(),
            autor: nomeUsuario,
            autorEmail: emailUsuario,
            autorFoto: perfil.foto || "",
            humor,
            texto,
            midia: (n ? midiasPendentes[n] : null) || null,
            enquete,
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
        if (Number.isNaN(d.getTime())) return "Data indisponível";
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    const avatarHtml = (nome, foto = "", tamanho = "cm-avatar-sm") => {
        const iniciais = (nome || "?").split(/\s+/).slice(0, 2).map(parte => parte[0].toUpperCase()).join("");
        return `<span class="cm-avatar ${tamanho}" aria-hidden="true">${
            foto ? `<img src="${esc(foto)}" alt="">` : esc(iniciais)
        }</span>`;
    };


    const renderFeed = (container) => {
        if (!container) return;
        limpar(container.id);

        const emptyEl = document.getElementById(container.id === "feedPosts" ? "feedVazio" : "feedVazio2");
        const postsOrdenados = postagens
            .filter(p => p && p.autor)
            .sort((a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime());

        if (!postsOrdenados.length) {
            if (emptyEl) emptyEl.hidden = false;
            return;
        }
        if (emptyEl) emptyEl.hidden = true;

        postsOrdenados.forEach(p => {
            const artigo = document.createElement("article");
            artigo.className = "cm-post";
            artigo.dataset.postId = String(p.id);

            const idPost = String(p.id);
            const euCurto = curtidas.includes(idPost);
            const ehMeuPost = (p.autorEmail || "") === emailUsuario;
            const fotoAutor = p.autorFoto || (ehMeuPost ? perfil.foto : "");
            const autorAvatar = avatarHtml(p.autor, fotoAutor);

            const midia = p.midia;
            const midiaHtml = midia && midia.url
                ? (midia.tipo === "imagem"
                    ? `<div class="cm-post-midia"><img src="${esc(midia.url)}" alt="Imagem da publicação"></div>`
                    : midia.tipo === "video"
                        ? `<div class="cm-post-midia"><video src="${esc(midia.url)}" controls preload="metadata"></video></div>`
                        : `<div class="cm-post-midia"><div class="cm-file-chip"><i class="fa-solid fa-paperclip"></i><span>${esc(midia.nome || "Arquivo anexado")}</span></div></div>`)
                : "";
            const enquete = p.enquete && Array.isArray(p.enquete.opcoes)
                ? `<div class="cm-poll" data-poll-post="${esc(idPost)}">
                    <strong class="cm-poll-question">${esc(p.enquete.pergunta || "Enquete")}</strong>
                    ${(() => {
                        const votos = p.enquete.votos || {};
                        const total = Object.keys(votos).length;
                        const votoAtual = votos[emailUsuario];
                        return p.enquete.opcoes.map(opcao => {
                            const quantidade = Object.values(votos).filter(voto => voto === opcao.id).length;
                            const percentual = total ? Math.round((quantidade / total) * 100) : 0;
                            return `<button type="button" class="cm-poll-option${votoAtual === opcao.id ? " selected" : ""}"
                                data-poll-vote="${esc(opcao.id)}" ${votoAtual ? "disabled" : ""}>
                                <span>${esc(opcao.texto)}</span>
                                ${votoAtual ? `<span class="cm-poll-results"><span style="width:${percentual}%"></span></span>
                                    <small>${percentual}% · ${quantidade}</small>` : ""}
                            </button>`;
                        }).join("");
                    })()}
                    <small class="cm-poll-total">${Object.keys(p.enquete.votos || {}).length} voto(s)</small>
                </div>`
                : "";

            const postAcoes = ehMeuPost
                ? `<button type="button" data-post-acao="excluir" data-post="${esc(idPost)}" class="cm-comm-danger"><i class="fa-regular fa-trash-can"></i> Excluir publicação</button>`
                : ((() => {
                    const jaSigo = p.autorEmail ? amizades.some(a => a.email === p.autorEmail) : false;
                    let html = "";
                    if (p.autorEmail) {
                        html += `<button type="button" data-post-acao="seguir" data-post="${esc(idPost)}" data-email="${esc(p.autorEmail)}" data-nome="${esc(p.autor)}">
                            <i class="fa-${jaSigo ? "solid" : "regular"} fa-user-${jaSigo ? "minus" : "plus"}"></i> ${jaSigo ? "Deixar de seguir" : "Seguir"}
                        </button>`;
                    }
                    html += `<button type="button" data-post-acao="denunciar" data-post="${esc(idPost)}" class="cm-comm-danger"><i class="fa-solid fa-flag"></i> Denunciar publicação</button>`;
                    return html;
                })());

            const comentariosHtml = (p.comentarios || []).map((c, i) => {
                const ehMeu = (c.autorEmail || "") === emailUsuario;
                const fotoComentario = c.autorFoto || (ehMeu ? perfil.foto : "");
                const acoes = ehMeu
                    ? `<button type="button" data-acao="editar"><i class="fa-solid fa-pen"></i> Editar comentário</button>
                       <button type="button" data-acao="excluir" class="cm-comm-danger"><i class="fa-regular fa-trash-can"></i> Excluir comentário</button>`
                    : `<button type="button" data-acao="denunciar" class="cm-comm-danger"><i class="fa-solid fa-flag"></i> Denunciar comentário</button>`;
                return `
                <div class="cm-comment-item" data-post="${esc(idPost)}" data-idx="${i}">
                    ${avatarHtml(c.autor, fotoComentario)}
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
                    ${autorAvatar}
                    <div class="cm-author">
                        <strong>${esc(p.autor)}${p.autorEmail && p.autorEmail.includes(".exemplo") ? ' <span class="cm-demo-label">Demonstração · fictício</span>' : ""}</strong>
                        <small>${formatarData(p.data)}${p.humor ? ` · ${esc(p.humor)}` : ""}</small>
                    </div>
                    <div class="cm-post-menu">
                        <button type="button" class="cm-post-dots" aria-label="Opções da publicação"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                        <div class="cm-post-dropdown">${postAcoes}</div>
                    </div>
                </div>
                <div class="cm-post-body">
                    ${p.texto ? `<p class="cm-post-text">${esc(p.texto)}</p>` : ""}
                    ${midiaHtml}
                    ${enquete}
                </div>
                <div class="cm-post-actions">
                    <button type="button" class="cm-post-btn post-like ${euCurto ? "active" : ""}" data-post="${esc(idPost)}">
                        <i class="fa-${euCurto ? "solid" : "regular"} fa-heart"></i> <span>${Number(p.curtidasCount) || 0}</span>
                    </button>
                    <button type="button" class="cm-post-btn post-comment" data-post="${esc(idPost)}">
                        <i class="fa-regular fa-comment"></i> <span>${(p.comentarios || []).length}</span>
                    </button>
                    <button type="button" class="cm-post-btn post-share" data-post="${esc(idPost)}">
                        <i class="fa-solid fa-share"></i> Compartilhar
                    </button>
                </div>
                <div class="cm-share-box" id="share-${esc(idPost)}-${esc(container.id)}">
                    ${contatosParaCompartilhar().length
                        ? `<p class="cm-share-note">${amizades.length ? "Escolha com quem compartilhar:" : "Exemplo: compartilhe com uma pessoa fictícia da comunidade."}</p>
                           <ul class="cm-share-list">${contatosParaCompartilhar().map(a => `
                                <li><label><input type="checkbox" value="${esc(a.id || a.email || a.nome)}"> ${esc(a.nome || a.email || "Conexão")}</label></li>`).join("")}
                           </ul>
                           <button type="button" class="cm-btn cm-btn-primary cm-btn-sm share-confirm" data-post="${esc(idPost)}">Enviar</button>`
                        : `<p class="cm-share-note">Você ainda não tem conexões para compartilhar.</p>`}
                </div>
                <div class="cm-comments" id="comments-${esc(idPost)}-${esc(container.id)}" style="display:none;">
                    ${comentariosHtml}
                    <form class="cm-comment-form" data-post="${esc(idPost)}">
                        ${avatarHtml(nomeUsuario, perfil.foto)}
                        <input type="text" placeholder="Escreva um comentário..." aria-label="Escreva um comentário" maxlength="200" required>
                        <button type="submit" class="cm-btn cm-btn-primary cm-btn-sm">Comentar</button>
                    </form>
                </div>`;

            container.appendChild(artigo);
        });

        // Eventos: curtir, votar, comentar, compartilhar
        container.querySelectorAll(".post-like").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.post;
                const post = postagens.find(x => String(x.id) === id);
                if (!post) return;

                const jaCurte = curtidas.includes(id);
                if (jaCurte) {
                    curtidas = curtidas.filter(c => c !== id);
                    post.curtidasCount = Math.max(0, (post.curtidasCount || 0) - 1);
                    if (Array.isArray(post.curtidasPor)) {
                        post.curtidasPor = post.curtidasPor.filter(item => item.email !== emailUsuario);
                    }
                } else {
                    curtidas.push(id);
                    post.curtidasCount = (post.curtidasCount || 0) + 1;
                    post.curtidasPor = Array.isArray(post.curtidasPor) ? post.curtidasPor : [];
                    post.curtidasPor = post.curtidasPor.filter(item => item.email !== emailUsuario);
                    post.curtidasPor.push({
                        email: emailUsuario,
                        nome: nomeUsuario,
                        data: new Date().toISOString()
                    });
                }

                salvarLista("cm_curtidas", curtidas);
                salvarLista("cm_postagens", postagens);
                atualizarFeeds();
            });

        });

        container.querySelectorAll(".cm-poll-option:not(:disabled)").forEach(btn => {
            btn.addEventListener("click", () => {
                const artigo = btn.closest(".cm-post");
                const post = artigo && postagens.find(item => String(item.id) === artigo.dataset.postId);
                if (!post || !post.enquete || !post.enquete.opcoes.some(opcao => opcao.id === btn.dataset.pollVote)) return;
                post.enquete.votos = post.enquete.votos || {};
                if (post.enquete.votos[emailUsuario]) return;
                post.enquete.votos[emailUsuario] = btn.dataset.pollVote;
                salvarLista("cm_postagens", postagens);
                atualizarFeeds();
            });
        });

        container.querySelectorAll(".post-comment").forEach(btn => {
            btn.addEventListener("click", () => {
                const box = btn.closest(".cm-post")?.querySelector(".cm-comments");
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

                const post = postagens.find(x => String(x.id) === id);
                if (!post) return;

                if (!post.comentarios) post.comentarios = [];
                post.comentarios.push({
                    autor: nomeUsuario,
                    autorEmail: emailUsuario,
                    autorFoto: perfil.foto || "",
                    texto,
                    data: new Date().toISOString()
                });
                salvarLista("cm_postagens", postagens);
                atualizarFeeds();
                const postAtualizado = [...container.querySelectorAll(".cm-post")]
                    .find(artigo => artigo.dataset.postId === id);
                const comentarios = postAtualizado?.querySelector(".cm-comments");
                if (comentarios) comentarios.style.display = "";
            });
        });

        container.querySelectorAll(".post-share").forEach(btn => {
            btn.addEventListener("click", () => {
                const box = btn.closest(".cm-post")?.querySelector(".cm-share-box");
                if (box) box.classList.toggle("open");
            });
        });

        container.querySelectorAll(".share-confirm").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.post;
                const box = btn.closest(".cm-post")?.querySelector(".cm-share-box");
                if (!box) return;
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
                if (acao === "denunciar" && coment.autorEmail === emailUsuario) return;
                if (acao !== "denunciar" && coment.autorEmail !== emailUsuario) return;

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
                    const salvar = bolha.querySelector(".cm-comm-save");
                    const cancelar = bolha.querySelector(".cm-comm-cancel");
                    if (inp) {
                        inp.value = coment.texto;
                        inp.focus();
                    }
                    salvar?.addEventListener("click", () => {
                        const texto = inp?.value.trim() || "";
                        const comentarioAtual = post.comentarios[idx];
                        if (!texto || !comentarioAtual || comentarioAtual.autorEmail !== emailUsuario) return;
                        comentarioAtual.texto = texto;
                        salvarLista("cm_postagens", postagens);
                        notificar("Comentário editado.");
                        atualizarFeeds();
                    });
                    cancelar?.addEventListener("click", () => atualizarFeeds());
                }
            });
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
                const postAtual = postagens.find(post => String(post.id) === id);

                fecharDropdowns();
                if (!postAtual) return;

                if (acao === "excluir") {
                    const post = postAtual;
                    if (post.autorEmail === emailUsuario) {
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
                    if (postAtual.autorEmail === emailUsuario) return;
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
                    const post = postAtual;
                    if (post.autorEmail === emailUsuario) return;
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

    const tempoRelativo = (valor) => {
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return "";
        const minutos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 60000));
        if (minutos < 1) return "agora";
        if (minutos < 60) return `há ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
        const horas = Math.floor(minutos / 60);
        if (horas < 24) return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
        const dias = Math.floor(horas / 24);
        if (dias < 7) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
        return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    };

    const pedidoPertencePaciente = (pedido) => {
        const emailPaciente = emailUsuario.trim().toLowerCase();
        if (pedido.pacienteEmail) return pedido.pacienteEmail.trim().toLowerCase() === emailPaciente;

        const nomePaciente = nomeUsuario.trim().toLowerCase();
        if ((pedido.pacienteNome || "").trim().toLowerCase() !== nomePaciente) return false;
        return getLista("cm_pacientes").some(paciente =>
            (paciente.email || "").trim().toLowerCase() === emailPaciente &&
            (paciente.nome || "").trim().toLowerCase() === nomePaciente &&
            paciente.diarioAcesso === "solicitado"
        );
    };

    const renderHomeActivity = () => {
        const lista = document.getElementById("homeActivityList");
        const vazio = document.getElementById("homeActivityEmpty");
        if (!lista) return;

        const pedidosEl = document.getElementById("homeDiaryRequests");
        const pedidosWrap = document.getElementById("homeDiaryRequestsWrap");
        const solicitacoes = getLista("cm_solicitacoes_diario");
        const pendentes = solicitacoes
            .map((pedido, indice) => ({ pedido, indice }))
            .filter(({ pedido }) => pedidoPertencePaciente(pedido) && !["aceita", "recusada"].includes(pedido.status));
        const inboxBadge = document.getElementById("homeInboxBadge");
        const inboxEmpty = document.getElementById("homeInboxEmpty");

        if (pedidosEl && pedidosWrap) {
            pedidosEl.replaceChildren();
            pedidosWrap.hidden = pendentes.length === 0;
            if (inboxEmpty) inboxEmpty.hidden = pendentes.length > 0;
            if (inboxBadge) {
                inboxBadge.textContent = String(pendentes.length);
                inboxBadge.hidden = pendentes.length === 0;
                inboxBadge.setAttribute("aria-label", `${pendentes.length} solicitações de diário pendentes`);
            }
            pendentes.forEach(({ pedido, indice }) => {
                const item = document.createElement("li");
                const nomeProfissional = pedido.profissionalNome || "Um profissional";
                const data = tempoRelativo(pedido.data);
                item.innerHTML = `<span class="home-diary-request-copy">
                        <strong>${esc(nomeProfissional)}</strong>
                        <span>solicita acesso ao seu diário</span>
                        ${data ? `<small>${esc(data)}</small>` : ""}
                    </span>
                    <span class="home-diary-request-actions">
                        <button type="button" class="cm-btn cm-btn-primary cm-btn-sm" data-diary-response="aceita" data-request-index="${indice}">Aceitar</button>
                        <button type="button" class="cm-btn cm-btn-soft cm-btn-sm" data-diary-response="recusada" data-request-index="${indice}">Recusar</button>
                    </span>`;
                pedidosEl.appendChild(item);
            });
        }

        const atividades = [];
        postagens
            .filter(post => post.autorEmail === emailUsuario)
            .forEach(post => {
                (post.comentarios || []).forEach(comentario => {
                    if (comentario.autorEmail === emailUsuario || comentario.autor === nomeUsuario) return;
                    atividades.push({
                        autor: comentario.autor || "Pessoa da comunidade",
                        texto: "comentou na sua publicação",
                        data: comentario.data || post.data,
                        icone: "fa-regular fa-comment"
                    });
                });
                (Array.isArray(post.curtidasPor) ? post.curtidasPor : []).forEach(curtida => {
                    if (!curtida.email || curtida.email === emailUsuario) return;
                    atividades.push({
                        autor: curtida.nome || "Pessoa da comunidade",
                        texto: "curtiu sua publicação",
                        data: curtida.data,
                        icone: "fa-regular fa-heart"
                    });
                });
            });

        const recentes = atividades
            .filter(atividade => atividade.data && !Number.isNaN(new Date(atividade.data).getTime()))
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .slice(0, 5);
        lista.replaceChildren();
        if (!recentes.length) {
            if (vazio) vazio.hidden = false;
            return;
        }
        if (vazio) vazio.hidden = true;

        recentes.forEach(atividade => {
            const item = document.createElement("li");
            item.innerHTML = `<span class="home-activity-icon"><i class="${atividade.icone}" aria-hidden="true"></i></span>
                <span class="home-activity-copy"><strong>${esc(atividade.autor)}</strong>
                <span>${esc(atividade.texto)}</span><small>${esc(tempoRelativo(atividade.data))}</small></span>`;
            lista.appendChild(item);
        });
    };

    document.getElementById("homeDiaryRequests")?.addEventListener("click", (event) => {
        const botao = event.target.closest("[data-diary-response]");
        if (!botao) return;
        const resposta = botao.dataset.diaryResponse;
        if (!["aceita", "recusada"].includes(resposta)) return;
        const indice = Number(botao.dataset.requestIndex);
        const solicitacoes = getLista("cm_solicitacoes_diario");
        const pedido = solicitacoes[indice];
        if (!pedido || !pedidoPertencePaciente(pedido) || ["aceita", "recusada"].includes(pedido.status)) {
            renderHomeActivity();
            return;
        }

        pedido.pacienteEmail = emailUsuario;
        pedido.pacienteNome = nomeUsuario;
        pedido.status = resposta;
        pedido.respondidaEm = new Date().toISOString();
        salvarLista("cm_solicitacoes_diario", solicitacoes);

        const pacientes = getLista("cm_pacientes");
        const emailPaciente = emailUsuario.trim().toLowerCase();
        const pacienteAlvo = pedido.pacienteId
            ? pacientes.find(paciente =>
                String(paciente.id) === String(pedido.pacienteId) &&
                (paciente.email || "").trim().toLowerCase() === emailPaciente
            )
            : pacientes.find(paciente => (paciente.email || "").trim().toLowerCase() === emailPaciente);
        if (pacienteAlvo) pacienteAlvo.diarioAcesso = pedido.status === "aceita" ? "liberado" : false;
        salvarLista("cm_pacientes", pacientes);

        if (pedido.profissionalEmail) {
            const atividadesProfissional = getLista("cm_atividades_profissional");
            atividadesProfissional.unshift({
                id: `notificacao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                tipo: "resposta_diario",
                profissionalEmail: pedido.profissionalEmail,
                data: pedido.respondidaEm,
                texto: `${nomeUsuario} ${pedido.status === "aceita" ? "aceitou" : "recusou"} a solicitação de acesso ao diário.`,
                tempo: "agora"
            });
            salvarLista("cm_atividades_profissional", atividadesProfissional);
        }

        renderHomeActivity();
        notificar(pedido.status === "aceita"
            ? "Acesso ao diário autorizado para o profissional."
            : "Solicitação de acesso ao diário recusada.");
    });

    window.addEventListener("storage", (event) => {
        if (event.key === "cm_solicitacoes_diario") renderHomeActivity();
        if (event.key === "cm_postagens") {
            postagens = JSON.parse(event.newValue || "[]");
            atualizarFeeds();
            atualizarSugestoes();
        }
    });

    const atualizarFeeds = () => {
        if (feed1) renderFeed(feed1);
        if (feed2) renderFeed(feed2);
        renderHomeActivity();
    };

    renderFeed(feed1);
    renderFeed(feed2);
    renderHomeActivity();

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
                    <div class="cm-diary-actions">
                        <button type="button" class="cm-diary-edit" title="Editar registro" aria-label="Editar registro"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="cm-diary-delete" title="Excluir registro" aria-label="Excluir registro"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </div>
                <div class="cm-diary-meta">
                    <i class="fa-regular fa-calendar" aria-hidden="true"></i> ${formatarData(r.data)}${r.humor ? ` · Humor: ${esc(r.humor)}` : ""}
                </div>
                <div class="cm-diary-body">
                    ${apenasHumor
                        ? `<div class="cm-diary-text"><em>Registro de humor apenas.</em></div>`
                        : `<div class="cm-diary-text${longo ? " cm-clamped" : ""}">${esc(texto)}</div>
                           ${longo ? `<button type="button" class="cm-diary-expand">Ver completo</button>` : ""}`}
                </div>
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
                        atualizarResumoDiario();
                        notificar("Registro excluído.");
                    }
                });
            });

            card.querySelector(".cm-diary-edit").addEventListener("click", () => {
                const body = card.querySelector(".cm-diary-body");
                if (!body) return;
                body.innerHTML = `
                    <div class="cm-post-edit-box">
                        <input type="text" class="cm-diary-edit-input" value="${esc(titulo)}" maxlength="120" aria-label="Editar título do diário">
                        <textarea class="cm-diary-edit-text" rows="4" maxlength="1000" aria-label="Editar texto do diário">${esc(texto)}</textarea>
                        <div class="cm-post-edit-actions">
                            <button type="button" class="cm-btn cm-btn-primary cm-btn-sm cm-diary-save">Salvar</button>
                            <button type="button" class="cm-btn cm-btn-soft cm-btn-sm cm-diary-cancel">Cancelar</button>
                        </div>
                    </div>
                `;

                const salvar = body.querySelector(".cm-diary-save");
                const cancelar = body.querySelector(".cm-diary-cancel");
                const inputTitulo = body.querySelector(".cm-diary-edit-input");
                const inputTexto = body.querySelector(".cm-diary-edit-text");

                salvar?.addEventListener("click", () => {
                    const novoTitulo = (inputTitulo?.value || "").trim();
                    const novoTexto = (inputTexto?.value || "").trim();
                    const item = diario.find(x => String(x.id) === idRef);
                    if (!item) return;
                    item.titulo = novoTitulo;
                    item.texto = novoTexto;
                    salvarLista("cm_diario", diario);
                    renderDiario();
                    notificar("Registro atualizado.");
                });

                cancelar?.addEventListener("click", () => renderDiario());
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
    atualizarResumoDiario();

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
            atualizarResumoDiario();
        });
    }

    /* ==========================================
       PROFISSIONAIS VINCULADOS
    ========================================== */
    const renderProfissionais = (filtro) => {
        const lista=document.getElementById("listaProfissionais"), vazio=document.getElementById("profissionaisVazio");if(!lista)return;limpar("listaProfissionais");if(!vinculados.length){vazio.hidden=false;return;}vazio.hidden=true;
        const busca=(filtro||"").trim().toLowerCase();vinculados.filter(p=>!busca||(p.nome||"").toLowerCase().includes(busca)||(p.area||p.profissao||"").toLowerCase().includes(busca)).forEach(prof=>{const li=document.createElement("li");const info=encodeURIComponent(JSON.stringify(prof));li.innerHTML=`<span class="cm-avatar cm-avatar-sm">${esc((prof.nome||"P").split(/\s+/).slice(0,2).map(x=>x[0]).join(""))}</span><div class="cm-info"><strong>${esc(prof.nome||"Profissional")}</strong><small>${esc(prof.area||prof.profissao||"Profissional")}${prof.ficticio?" · Demonstração":""}</small></div><button class="cm-btn cm-btn-soft cm-btn-sm" type="button" data-view-professional="${info}">Ver perfil</button>`;lista.appendChild(li);});if(!lista.children.length)vazio.hidden=false;
    };
    const buscaProfissional = document.getElementById("buscaProfissional");
    if (buscaProfissional) buscaProfissional.addEventListener("input", () => renderProfissionais(buscaProfissional.value));
    renderProfissionais();
    set("resumoProfissionais", String(vinculados.length));

    /* ==========================================
       AGENDA — CONSULTAS
    ========================================== */
    const renderConsultas = () => {
        const lista=document.getElementById("listaConsultas"),vazio=document.getElementById("consultasVazio");if(!lista)return;limpar("listaConsultas");if(!consultas.length){vazio.hidden=false;return;}vazio.hidden=true;
        consultas.forEach((c,i)=>{const li=document.createElement("li");li.className="cm-appointment-row";li.innerHTML=`<span class="cm-time-box">${esc(c.horario||"--:--")}</span><div class="cm-info"><strong>${esc(c.profissional||"Profissional")}</strong><small>${esc(c.data||"")}${c.tipo?` · ${esc(c.tipo)}`:""}${c.status?` · ${esc(c.status)}`:" · Agendado"}</small></div><button type="button" class="cm-btn cm-btn-soft cm-btn-sm">Detalhes</button>`;li.querySelector("button").addEventListener("click",()=>mostrarDetalhesConsulta(c));lista.appendChild(li);});
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
            grid.innerHTML = `<div class="cm-profile-item"><span class="cm-profile-label">Perfil</span><strong class="cm-profile-value">Informações não preenchidas</strong></div>`;
            } else {
                visiveis.forEach(([r, v]) => {
                    const d = document.createElement("div");
                    d.className = "cm-profile-item";
                    d.innerHTML = `<span class="cm-profile-label">${r}</span><strong class="cm-profile-value">${esc(String(v))}</strong>`;
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
        set("homeProfileName", nomeUsuario);
        set("homeProfileEmail", perfil.email || emailUsuario);
        set("topoNomeUsuario", `Olá, ${nomeUsuario.split(" ")[0]}`);
        set("sideNome", nomeUsuario);
        set("composerNomeAut", `${nomeUsuario.split(" ")[0]}, como você está?`);
        set("composerNomeAut2", `${nomeUsuario.split(" ")[0]}, compartilhe com a comunidade`);
        aplicarFoto(avatar, nomeUsuario);
        aplicarFoto(document.getElementById("homeProfileAvatar"), nomeUsuario);
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
       CONFIGURAÇÕES — PREFERÊNCIAS
    ==========================================
       Não há lista de campos nem função de salvar nesta página:
       o preenchimento dos [data-cfg], o salvamento e a aplicação
       (tema + tamanho do texto) ficam em tema.js, compartilhado
       com a Home do profissional e com o painel administrativo.
    ========================================== */
    window.CMTema.iniciarPreferencias();

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
        set("homeProfileName", v);
        set("homeProfileEmail", perfil.email || emailUsuario);
        set("perfilNome", v);
        set("topoNomeUsuario", `Olá, ${v.split(" ")[0]}`);
        set("sideNome", v);
        aplicarFoto(avatar, v);
        aplicarFoto(document.getElementById("homeProfileAvatar"), v);
        aplicarFoto(document.getElementById("perfilAvatar"), v);
        renderPerfil();
        notificar("Nome atualizado com sucesso.");
        if (document.getElementById("cfgNovoNome")) document.getElementById("cfgNovoNome").value = "";
    });

    if (btnCfgEmail) btnCfgEmail.addEventListener("click", () => {
        const v = document.getElementById("cfgNovoEmail")?.value.trim();
        if (!v || !v.includes("@")) { notificar("Digite um e-mail válido."); return; }
        const emailAnterior = emailUsuario;
        const posts = getLista("cm_postagens").map(p => {
            const atualizado = { ...p };
            if (atualizado.autorEmail === emailAnterior) atualizado.autorEmail = v;
            atualizado.comentarios = (atualizado.comentarios || []).map(c => c.autorEmail === emailAnterior ? { ...c, autorEmail: v } : c);
            atualizado.curtidasPor = (atualizado.curtidasPor || []).map(curtida => curtida.email === emailAnterior ? { ...curtida, email: v } : curtida);
            return atualizado;
        });
        salvarLista("cm_postagens", posts);
        diario = diario.map(registro => registro.autorEmail === emailAnterior ? { ...registro, autorEmail: v } : registro);
        salvarLista("cm_diario", diario);
        const pacientes = getLista("cm_pacientes").map(paciente => paciente.email === emailAnterior ? { ...paciente, email: v } : paciente);
        salvarLista("cm_pacientes", pacientes);
        const solicitacoes = getLista("cm_solicitacoes_diario").map(pedido =>
            pedido.pacienteEmail === emailAnterior ? { ...pedido, pacienteEmail: v } : pedido
        );
        salvarLista("cm_solicitacoes_diario", solicitacoes);
        if (localStorage.getItem("cm_session") === emailAnterior) localStorage.setItem("cm_session", v);
        emailUsuario = v;
        perfil.email = v;
        localStorage.setItem("cm_profile", JSON.stringify(perfil));
        set("homeProfileEmail", v);
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
            mensagem: "Ao confirmar a exclusão, sua conta e seus dados serão apagados definitivamente após 30 dias.",
            rotuloConfirmar: "Ciente",
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
