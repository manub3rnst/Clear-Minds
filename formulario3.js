// ==========================================
// FORMULÁRIO — ETAPA 3 de 3 (Preferências)
// ==========================================

const preferencesForm = document.getElementById("preferencesForm");
const successMessage = document.getElementById("successMessage");

if (preferencesForm && successMessage) {

    preferencesForm.addEventListener("submit", function (e) {

        e.preventDefault();

        // Salva os dados desta etapa (última etapa do cadastro)
        const perfil = JSON.parse(localStorage.getItem("cm_profile")) || {};

        const preferencias = [];
        preferencesForm.querySelectorAll('input[type="checkbox"]:checked').forEach(chk => {
            preferencias.push(chk.name);
        });

        perfil.preferencias = preferencias;
        perfil.objetivo = document.getElementById("objetivo").value;

        localStorage.setItem("cm_profile", JSON.stringify(perfil));
        localStorage.setItem("cm_session", perfil.email || perfil.nome || "usuario");

        // Esconde o formulário
        preferencesForm.style.display = "none";

        // Mostra a tela de sucesso
        // (o botão "Acessar plataforma" já leva para home.html via href)
        successMessage.style.display = "block";

        // Faz a página subir suavemente até o topo
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}
