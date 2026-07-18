// ==========================================
// FORMULÁRIO — ETAPA 1 de 3 (Informações Pessoais)
// ==========================================

const personalForm = document.getElementById("personalForm");

if (personalForm) {

    personalForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const campos = personalForm.querySelectorAll("input, select, textarea");

        let valido = true;

        campos.forEach(campo => {
            if (campo.hasAttribute("required") && campo.value.trim() === "") {
                valido = false;
                campo.focus();
            }
        });

        if (!valido) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        // Salva os dados desta etapa
        const perfil = JSON.parse(localStorage.getItem("cm_profile")) || {};

        perfil.nome = document.getElementById("nome").value;
        perfil.nascimento = document.getElementById("nascimento").value;
        perfil.genero = document.getElementById("genero").value;
        perfil.telefone = document.getElementById("telefone").value;
        perfil.cidade = document.getElementById("cidade").value;
        perfil.estado = document.getElementById("estado").value;
        perfil.sobre = document.getElementById("sobre").value;
        perfil.acompanhamento = document.getElementById("acompanhamento").value;

        localStorage.setItem("cm_profile", JSON.stringify(perfil));

        // Segue para a Etapa 2
        window.location.href = "formulario2.html";

    });

}
