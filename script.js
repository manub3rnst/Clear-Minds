/*Login*/
const senha = document.getElementById("password");
const toggle = document.getElementById("togglePassword");
const icon = toggle.querySelector("i");

toggle.addEventListener("click", () => {

    if (senha.type === "password") {

        senha.type = "text";
        icon.classList.replace("fa-eye","fa-eye-slash");

    } else {

        senha.type = "password";
        icon.classList.replace("fa-eye-slash","fa-eye");

    }

    const form = document.querySelector("form");

        form.addEventListener("submit", function(e){

            e.preventDefault();

            window.location.href="home.html";

        });

});