// ==========================================
// HOME (home.html)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // Se quem está logado é um profissional, leva para o painel correto
    if (localStorage.getItem("cm_tipo") === "profissional") {
        window.location.href = "home-profissional.html";
        return;
    }

    const perfil = JSON.parse(localStorage.getItem("cm_profile")) || {};
    const sessao = localStorage.getItem("cm_session");

    const nome = perfil.nome || "";
    const primeiroNome = nome ? nome.split(" ")[0] : "Visitante";

    // ------- Cabeçalho -------
    document.getElementById("nomeUsuario").textContent = sessao ? primeiroNome : "Visitante";

    // ------- Boas-vindas -------
    document.getElementById("saudacao").textContent = sessao
        ? `Olá, ${primeiroNome}!`
        : "Olá!";

    document.getElementById("mensagemPersonalizada").textContent = sessao
        ? "Estamos felizes em ter você de volta. Aqui está um resumo do seu perfil."
        : "Faça login ou cadastre-se para ter uma experiência personalizada.";

    // ------- Perfil -------
    document.getElementById("perfilNome").textContent = perfil.nome || "Não informado";
    document.getElementById("perfilCidade").textContent = perfil.cidade || "Não informado";

    let necessidade = "Não informado";
    if (perfil.ansiedade === "Frequentemente" || Number(perfil.estresse) >= 7) {
        necessidade = "Ansiedade e estresse";
    } else if (perfil.sono === "Ruim" || perfil.sono === "Regular") {
        necessidade = "Qualidade do sono";
    } else if (perfil.humor === "Ruim" || perfil.humor === "Regular") {
        necessidade = "Bem-estar emocional";
    } else if (perfil.objetivo) {
        necessidade = "Desenvolvimento pessoal";
    }
    document.getElementById("perfilNecessidade").textContent = necessidade;

    document.getElementById("perfilAcompanhamento").textContent = perfil.acompanhamento || "Não informado";

    // ------- Barra de progresso do perfil -------
    const camposConsiderados = [
        "nome", "email", "curso", "periodo",
        "nascimento", "genero", "telefone", "cidade", "estado", "sobre", "acompanhamento",
        "humor", "sono", "ansiedade", "atividade", "estresse",
        "objetivo"
    ];

    const preenchidos = camposConsiderados.filter(campo => {
        const valor = perfil[campo];
        return valor !== undefined && valor !== null && String(valor).trim() !== "";
    }).length;

    const porcentagem = Math.round((preenchidos / camposConsiderados.length) * 100);

    const barraPerfil = document.getElementById("barraPerfil");
    if (barraPerfil) barraPerfil.style.width = porcentagem + "%";

    document.getElementById("textoProgresso").textContent = porcentagem + "% preenchido";

    // ------- Recomendação -------
    const recomendacao = document.getElementById("recomendacaoUsuario");

    if (!sessao || porcentagem === 0) {
        recomendacao.textContent = "Complete seu perfil para receber recomendações personalizadas.";
    } else if (necessidade === "Ansiedade e estresse") {
        recomendacao.textContent = "Experimente os exercícios de Respiração Guiada para aliviar a ansiedade.";
    } else if (necessidade === "Qualidade do sono") {
        recomendacao.textContent = "Confira o conteúdo \"Sono e Saúde Mental\" para melhorar suas noites.";
    } else if (necessidade === "Bem-estar emocional") {
        recomendacao.textContent = "Utilize o Diário Emocional para acompanhar como você está se sentindo.";
    } else {
        recomendacao.textContent = "Explore a Meditação Guiada e os Materiais Educativos disponíveis para você.";
    }

    // ------- Botão "Explorar Recursos" -------
    const btnExplorar = document.querySelector(".btn-principal");
    if (btnExplorar) {
        btnExplorar.addEventListener("click", () => {
            document.querySelector(".secao").scrollIntoView({ behavior: "smooth" });
        });
    }

});

// ------- Logout -------
const btnSair = document.getElementById("btnSair");
if (btnSair) {
    btnSair.addEventListener("click", () => {
        localStorage.removeItem("cm_session");
        window.location.href = "login.html";
    });
}
