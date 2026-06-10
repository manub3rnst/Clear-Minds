const botao = document.getElementById("mostrarSenha");

botao.addEventListener("click", () => {

    const senha = document.getElementById("senha");

    if(senha.type === "password"){
        senha.type = "text";
    }else{
        senha.type = "password";
    }

});