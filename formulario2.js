// ==========================================
// FORMULÁRIO — ETAPA 2 de 3 (Bem-estar Emocional)
// ==========================================

const wellBeingForm = document.getElementById("wellBeingForm");

if (wellBeingForm) {

    wellBeingForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const campos = wellBeingForm.querySelectorAll("input, select, textarea");

        let valido = true;

        for (const campo of campos) {
            if (campo.hasAttribute("required") && campo.value.trim() === "") {
                valido = false;
                campo.focus();
                break;
            }
        }

        if (!valido) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        // Salva os dados desta etapa
        const perfil = JSON.parse(localStorage.getItem("cm_profile")) || {};

        perfil.humor = document.getElementById("humor").value;
        perfil.sono = document.getElementById("sono").value;
        perfil.ansiedade = document.getElementById("ansiedade").value;
        perfil.atividade = document.getElementById("atividade").value;
        perfil.estresse = document.getElementById("estresse").value;
        perfil.comentario = document.getElementById("comentario").value;

        localStorage.setItem("cm_profile", JSON.stringify(perfil));

        // Segue para a Etapa 3
        window.location.href = "formulario3.html";

    });

}
