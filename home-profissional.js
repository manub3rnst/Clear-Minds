document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("cm_session") && localStorage.getItem("cm_tipo") !== "profissional") {
    window.location.href = "home.html";
    return;
  }

  const perfil = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");
  const sessao = localStorage.getItem("cm_session");
  const nome = (perfil.nome || "").trim();
  const primeiroNome = nome ? nome.split(" ")[0] : "";
  const area = perfil.areaAtuacao || "Psicólogo(a)";
  const hora = new Date().getHours();
  const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const set = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=value; };
  const show = (id) => { const el=document.getElementById(id); if(el) el.hidden=false; };
  set("saudacao", sessao && primeiroNome ? `${periodo}, ${primeiroNome}! 🌿` : `${periodo}!`);
  set("topoNomeUsuario", sessao && primeiroNome ? `Olá, ${primeiroNome}` : "Olá, Profissional");
  set("topoAreaUsuario", area);
  set("perfilNome", nome || "Profissional");
  set("perfilMeta", `Psicólogo(a) • CRP ${perfil.registroProfissional || "não informado"}`);
  set("perfilLocal", perfil.cidade && perfil.estado ? `${perfil.cidade} • ${perfil.estado}` : "Localização não informada");
  set("perfilModalidade", perfil.modalidade || "Modalidade não informada");
  set("statusVerificacao", perfil.verificado ? "Perfil verificado" : "Verificação pendente");

  if (perfil.abordagem) { set("perfilAbordagem", perfil.abordagem); show("perfilAbordagem"); }
  if (perfil.faculdade) {
    const formacao = `${perfil.faculdade}${perfil.anoFormacao ? ` • ${perfil.anoFormacao}` : ""}`;
    set("perfilFormacao", formacao); show("perfilFormacao");
  }
  if (perfil.atuaDesde) {
    const [ano, mes] = (perfil.atuaDesde || "").split("-");
    const meses = ["", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    set("perfilAtuaDesde", `Atua desde ${meses[Number(mes)]}/${ano}`); show("perfilAtuaDesde");
  }
  if (perfil.especialidades) { show("perfilEspecialidades"); document.querySelector("#perfilEspecialidades strong").textContent = perfil.especialidades; }
  if (perfil.disponibilidade) { show("perfilDisponibilidade"); document.querySelector("#perfilDisponibilidade strong").textContent = perfil.disponibilidade; }
  if (perfil.valorSessao) { show("perfilValor"); document.querySelector("#perfilValor strong").textContent = `R$ ${Number(perfil.valorSessao).toFixed(2)}`; }

  const avatarText = nome ? nome.split(/\s+/).slice(0,2).map(p=>p[0].toUpperCase()).join("") : "P";
  const aplicarFoto = (el) => {
    if (!el) return;
    if (perfil.foto) { el.innerHTML = `<img src="${perfil.foto}" alt="Foto de perfil">`; }
    else { el.textContent = avatarText; }
  };
  aplicarFoto(document.getElementById("avatarIniciais"));
  aplicarFoto(document.getElementById("perfilAvatar"));

  const busca = document.getElementById("buscaPaciente");
  const lista = document.getElementById("listaPacientes");
  const vazio = document.getElementById("pacientesVazio");
  if (busca && lista) {
    const itens = [...lista.querySelectorAll("li")];
    busca.addEventListener("input", () => {
      const termo = busca.value.trim().toLowerCase();
      let found=false;
      itens.forEach(item => {
        const ok = (item.dataset.nome || "").includes(termo);
        item.hidden=!ok; if(ok) found=true;
      });
      if(vazio) vazio.hidden=found;
    });
  }

  document.querySelectorAll(".pro-accept").forEach(btn => {
    btn.addEventListener("click", () => {
      const request=btn.closest(".pro-request");
      if(request) {
        request.classList.add("request-done");
        btn.textContent="Concluído";
        btn.disabled=true;
        const actions=request.querySelector(".pro-request-actions");
        if(actions) actions.querySelectorAll("button").forEach(b=>{ if(b!==btn){b.disabled=true;} });
        const pending=document.getElementById("pendenciasNumero");
        if(pending) pending.textContent=Math.max(0, Number(pending.textContent)-1).toString().padStart(2,"0");
      }
    });
  });

  document.querySelectorAll(".pro-reject").forEach(btn => {
    btn.addEventListener("click", () => {
      const request=btn.closest(".pro-request");
      if(request) {
        request.classList.add("request-done");
        request.innerHTML='<i class="fa-solid fa-circle-check request-result-icon"></i><div class="pro-feed-info"><strong>Solicitação recusada</strong><small>A decisão foi registrada neste protótipo.</small></div>';
      }
    });
  });

  const btnSair=document.getElementById("btnSair");
  if(btnSair) btnSair.addEventListener("click",()=>{
    localStorage.removeItem("cm_session"); localStorage.removeItem("cm_tipo"); window.location.href="login.html";
  });
});