// ==========================================
// FORMULÁRIO 3
// ==========================================

const preferencesForm = document.getElementById("preferencesForm");
const successMessage = document.getElementById("successMessage");
const accessButton = document.getElementById("accessButton");

if (preferencesForm && successMessage) {

    preferencesForm.addEventListener("submit", function(e){

        e.preventDefault();

        // Esconde o formulário
        preferencesForm.style.display = "none";

        // Mostra a tela de sucesso
        successMessage.style.display = "block";

        // Faz a página subir suavemente até o topo
        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

}

const form = document.getElementById("preferencesForm");

form.addEventListener("submit", function (e) {

    e.preventDefault();

    window.location.href = "home.html";

});