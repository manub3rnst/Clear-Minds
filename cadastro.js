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

const form = document.getElementById("registerForm");

form.addEventListener("submit", function (e) {

    e.preventDefault();

    window.location.href = "formulario1.html";

});