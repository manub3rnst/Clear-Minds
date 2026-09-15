document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("cm_tipo") === "profissional") {
    window.location.href = "home-profissional.html";
    return;
  }

  const set = (id, valor) => { const el = document.getElementById(id); if (el) el.textContent = valor; };

  const perfil = JSON.parse(localStorage.getItem("cm_profile")) || {};
  const sessao = localStorage.getItem("cm_session");
  const nome = (perfil.nome || "").trim();
  const primeiroNome = nome ? nome.split(" ")[0] : "";
  const hora = new Date().getHours();
  const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  set("saudacao", sessao && primeiroNome ? `${periodo}, ${primeiroNome}!` : "Olá! Que bom ter você aqui.");
  set("topoNomeUsuario", sessao && primeiroNome ? `Olá, ${primeiroNome}` : "Olá, Visitante");

  const avatar = document.getElementById("avatarIniciais");
  if (avatar) {
    avatar.textContent = nome ? nome.split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("") : "CM";
  }

  // ================================
  // REGISTRO DE HUMOR
  // ================================
  const humorRegistrado = document.getElementById("humorRegistrado");
  const humorSalvo = localStorage.getItem("cm_humor_atual");

  document.querySelectorAll(".cm-mood-btn").forEach(btn => {
    if (humorSalvo && btn.dataset.humor === humorSalvo) btn.classList.add("active");
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cm-mood-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      localStorage.setItem("cm_humor_atual", btn.dataset.humor);
      if (humorRegistrado) humorRegistrado.textContent = btn.dataset.humor;
    });
  });
  if (humorSalvo && humorRegistrado) humorRegistrado.textContent = humorSalvo;

  // ================================
  // ROLAGEM SUAVE PARA ÂNCORAS
  // ================================
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", (e) => {
      const sel = link.getAttribute("href");
      if (sel && sel.length > 1) {
        const alvo = document.querySelector(sel);
        if (alvo) {
          e.preventDefault();
          alvo.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  // ================================
  // SAIR DA CONTA
  // ================================
  const btnSair = document.getElementById("btnSair");
  if (btnSair) btnSair.addEventListener("click", () => {
    localStorage.removeItem("cm_session");
    localStorage.removeItem("cm_tipo");
    window.location.href = "login.html";
  });
});