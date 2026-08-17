// ==========================================
// PAINEL DO PROFISSIONAL (home-profissional.html)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // Se quem está logado é um estudante, leva para a home correta
    if (localStorage.getItem("cm_session") && localStorage.getItem("cm_tipo") !== "profissional") {
        window.location.href = "home.html";
        return;
    }

    const perfil = JSON.parse(localStorage.getItem("cm_profile_profissional")) || {};
    const sessao = localStorage.getItem("cm_session");

    const nome = (perfil.nome || "").trim();
    const primeiroNome = nome ? nome.split(" ")[0] : "";
    const area = perfil.areaAtuacao || "Área não informada";

    // ------- Saudação de acordo com o horário -------
    const hora = new Date().getHours();
    const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

    document.getElementById("saudacao").textContent = sessao && primeiroNome
        ? `${periodo}, ${primeiroNome}! 🌿`
        : `${periodo}!`;

    document.getElementById("mensagemPersonalizada").textContent = sessao
        ? "Aqui está um resumo do seu dia e das atividades recentes."
        : "Faça login como profissional para acessar seus dados.";

    // ------- Cabeçalho: avatar, nome e área -------
    document.getElementById("topoNomeUsuario").textContent = sessao && primeiroNome
        ? `Olá, ${primeiroNome}`
        : "Olá, Visitante";

    document.getElementById("topoAreaUsuario").textContent = area;

    const avatar = document.getElementById("avatarIniciais");
    if (avatar) {
        const iniciais = nome
            ? nome.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("")
            : "P";
        avatar.textContent = iniciais;
    }

    // ------- Busca de pacientes (filtro simples no lado do cliente) -------
    const busca = document.getElementById("buscaPaciente");
    const lista = document.getElementById("listaPacientes");
    const vazio = document.getElementById("pacientesVazio");

    if (busca && lista) {
        const itens = Array.from(lista.querySelectorAll("li"));

        busca.addEventListener("input", () => {
            const termo = busca.value.trim().toLowerCase();
            let algumVisivel = false;

            itens.forEach((item) => {
                const corresponde = item.dataset.nome.includes(termo);
                item.hidden = !corresponde;
                if (corresponde) algumVisivel = true;
            });

            if (vazio) vazio.hidden = algumVisivel;
        });
    }

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
