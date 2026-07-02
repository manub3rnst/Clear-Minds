/*Login*/
const senha = document.getElementById("senha");
const toggle = document.getElementById("togglePassword");
const icon = toggle.querySelector("i");

toggle.addEventListener("click", () => {

    if (senha.type === "password") {

        senha.type = "text";

        icon.classList.replace("fa-eye", "fa-eye-slash");

    } else {

        senha.type = "password";

        icon.classList.replace("fa-eye-slash", "fa-eye");

    }

});

/*Cadastro*/
// ================================
// CAMPOS
// ================================

const form = document.getElementById("registerForm");

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

// ================================
// MOSTRAR / OCULTAR SENHA
// ================================

togglePassword.addEventListener("click", () => {

    const icon = togglePassword.querySelector("i");

    if(password.type === "password"){

        password.type = "text";

        icon.classList.replace("fa-eye","fa-eye-slash");

    }else{

        password.type = "password";

        icon.classList.replace("fa-eye-slash","fa-eye");

    }

});

// ================================
// MOSTRAR / OCULTAR CONFIRMAÇÃO
// ================================

toggleConfirmPassword.addEventListener("click", () => {

    const icon = toggleConfirmPassword.querySelector("i");

    if(confirmPassword.type === "password"){

        confirmPassword.type = "text";

        icon.classList.replace("fa-eye","fa-eye-slash");

    }else{

        confirmPassword.type = "password";

        icon.classList.replace("fa-eye-slash","fa-eye");

    }

});

// ================================
// VALIDAÇÃO DAS SENHAS
// ================================

form.addEventListener("submit", function(e){

    if(password.value !== confirmPassword.value){

        e.preventDefault();

        alert("As senhas não coincidem.");

        confirmPassword.focus();

        confirmPassword.parentElement.style.borderColor = "#dc3545";

        return;

    }

});

// ================================
// REMOVE BORDA VERMELHA
// ================================

confirmPassword.addEventListener("input", () => {

    confirmPassword.parentElement.style.borderColor = "";

});

/*SUCESSO CRIAÇÃO DE CONTA*/
const form = document.getElementById("preferencesForm");
const success = document.getElementById("successMessage");

form.addEventListener("submit", function(e){

    e.preventDefault();

    form.style.display = "none";

    success.style.display = "block";

});

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

        window.location.href = "formulario2.html";

    });

}

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

        window.location.href = "formulario3.html";

    });

}

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