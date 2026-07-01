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