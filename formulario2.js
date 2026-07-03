// ==========================================
// FORMULÁRIO 2
// ==========================================

const wellBeingForm = document.getElementById("wellBeingForm");

if (wellBeingForm) {

    wellBeingForm.addEventListener("submit", function(e){

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

        const form = document.getElementById("academicForm");

form.addEventListener("submit", function (e) {

    e.preventDefault();

    window.location.href = "formulario3.html";

});

    });

}