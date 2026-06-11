const senha = document.getElementById("senha");
const botao = document.getElementById("mostrarSenha");

botao.addEventListener("click", () => {

    if (senha.type === "password") {
        senha.type = "text";
    } else {
        senha.type = "password";
    }

});