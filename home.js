// ==========================================
// PAINEL DO ESTUDANTE (home.html)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // Se quem está logado é um profissional, leva para o painel correto
    if (localStorage.getItem("cm_tipo") === "profissional") {
        window.location.href = "home-profissional.html";
        return;
    }

    const perfil = JSON.parse(localStorage.getItem("cm_profile")) || {};
    const sessao = localStorage.getItem("cm_session");

    const nome = (perfil.nome || "").trim();
    const primeiroNome = nome ? nome.split(" ")[0] : "";

    // ------- Saudação de acordo com o horário -------
    const hora = new Date().getHours();
    const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

    document.getElementById("saudacao").textContent = sessao && primeiroNome
        ? `${periodo}, ${primeiroNome}! 💙`
        : `${periodo}!`;

    // ------- Cabeçalho: avatar e nome -------
    document.getElementById("topoNomeUsuario").textContent = sessao && primeiroNome
        ? `Olá, ${primeiroNome}`
        : "Olá, Visitante";

    const avatar = document.getElementById("avatarIniciais");
    if (avatar) {
        const iniciais = nome
            ? nome.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("")
            : "E";
        avatar.textContent = iniciais;
    }

    // ------- Seletor de humor -------
    const botoesHumor = document.querySelectorAll(".stu-mood-btn");
    const humorRegistrado = document.getElementById("humorRegistrado");

    botoesHumor.forEach((botao) => {
        botao.addEventListener("click", () => {
            botoesHumor.forEach((b) => b.classList.remove("active"));
            botao.classList.add("active");

            if (humorRegistrado) humorRegistrado.textContent = botao.dataset.humor;
        });
    });

});

// ------- Logout -------
const btnSair = document.getElementById("btnSair");
if (btnSair) {
    btnSair.addEventListener("click", () => {
        localStorage.removeItem("cm_session");
        localStorage.removeItem("cm_tipo");
        window.location.href = "login.html";
    });
}
