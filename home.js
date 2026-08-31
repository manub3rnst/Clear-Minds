document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("cm_tipo") === "profissional") {
    window.location.href = "home-profissional.html";
    return;
  }

  const perfil = JSON.parse(localStorage.getItem("cm_profile")) || {};
  const sessao = localStorage.getItem("cm_session");
  const nome = (perfil.nome || "").trim();
  const primeiroNome = nome ? nome.split(" ")[0] : "";
  const hora = new Date().getHours();
  const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  document.getElementById("saudacao").textContent =
    sessao && primeiroNome ? `${periodo}, ${primeiroNome}! 💙` : `${periodo}!`;

  document.getElementById("topoNomeUsuario").textContent =
    sessao && primeiroNome ? `Olá, ${primeiroNome}` : "Olá, Visitante";

  const avatar = document.getElementById("avatarIniciais");
  if (avatar) {
    avatar.textContent = nome ? nome.split(/\s+/).slice(0,2).map(p=>p[0].toUpperCase()).join("") : "E";
  }

  document.querySelectorAll(".stu-mood-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".stu-mood-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mood = document.getElementById("humorRegistrado");
      if (mood) mood.textContent = btn.dataset.humor;
      localStorage.setItem("cm_humor_atual", btn.dataset.humor);
    });
  });

  const humorSalvo = localStorage.getItem("cm_humor_atual");
  if (humorSalvo) {
    const mood = document.getElementById("humorRegistrado");
    if (mood) mood.textContent = humorSalvo;
  }

  const aceitar = document.getElementById("aceitarDiario");
  const recusar = document.getElementById("recusarDiario");
  const request = document.getElementById("solicitacaoDiario");
  const result = document.getElementById("resultadoDiario");
  const status = document.getElementById("diarioStatus");

  function responderDiario(permitido) {
    localStorage.setItem("cm_diario_compartilhado", permitido ? "sim" : "nao");
    request.hidden = true;
    result.hidden = false;
    result.innerHTML = permitido
      ? '<i class="fa-solid fa-circle-check"></i><strong>Acesso permitido.</strong><span>A Dra. Camila Rocha poderá visualizar somente as entradas que você compartilhar.</span>'
      : '<i class="fa-solid fa-lock"></i><strong>Acesso recusado.</strong><span>Seu diário continuará privado e você poderá alterar essa decisão depois.</span>';
    status.textContent = permitido ? "Compartilhado" : "Privado";
  }
  if (aceitar) aceitar.addEventListener("click", () => responderDiario(true));
  if (recusar) recusar.addEventListener("click", () => responderDiario(false));

  const btnSair = document.getElementById("btnSair");
  if (btnSair) btnSair.addEventListener("click", () => {
    localStorage.removeItem("cm_session");
    localStorage.removeItem("cm_tipo");
    window.location.href = "login.html";
  });
});