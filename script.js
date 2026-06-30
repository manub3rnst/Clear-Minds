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