// ==========================================
// FORMULÁRIO 1
// ==========================================

const personalForm = document.getElementById("personalForm");

if (personalForm) {

    personalForm.addEventListener("submit", function(e){

        e.preventDefault();

        const campos = personalForm.querySelectorAll("input, select, textarea");

        let valido = true;

        campos.forEach(campo => {

            if(campo.hasAttribute("required") && campo.value.trim() === ""){

                valido = false;

                campo.focus();

            }

        });

        if(!valido){

            alert("Preencha todos os campos obrigatórios.");

            return;

        }

       const form = document.getElementById("profileForm");

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        window.location.href = "formulario2.html";

    });

    });

}
