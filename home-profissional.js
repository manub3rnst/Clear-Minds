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

    const nome = perfil.nome || "";
    const primeiroNome = nome ? nome.split(" ")[0] : "Visitante";

    // ------- Cabeçalho -------
    document.getElementById("nomeUsuario").textContent = sessao ? primeiroNome : "Visitante";

    // ------- Boas-vindas -------
    document.getElementById("saudacao").textContent = sessao
        ? `Olá, Dr(a). ${primeiroNome}!`
        : "Olá!";

    document.getElementById("mensagemPersonalizada").textContent = sessao
        ? "Estamos felizes em ter você de volta. Aqui está um resumo do seu perfil profissional."
        : "Faça login ou cadastre-se como profissional para acessar o painel.";

    // ------- Perfil -------
    document.getElementById("perfilNome").textContent = perfil.nome || "Não informado";
    document.getElementById("perfilArea").textContent = perfil.areaAtuacao || "Não informado";
    document.getElementById("perfilRegistro").textContent = perfil.registroProfissional || "Não informado";
    document.getElementById("perfilTelefone").textContent = perfil.telefone || "Não informado";

    // ------- Botão "Ver Solicitações" -------
    const btnExplorar = document.querySelector(".btn-principal");
    if (btnExplorar) {
        btnExplorar.addEventListener("click", () => {
            document.getElementById("listaSolicitacoes").scrollIntoView({ behavior: "smooth" });
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
