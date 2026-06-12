/* =========================================
   MOSTRAR / OCULTAR SENHA
========================================== */

const campoSenha = document.getElementById("senha");
const btnMostrarSenha = document.getElementById("mostrarSenha");

if (campoSenha && btnMostrarSenha) {

    btnMostrarSenha.addEventListener("click", () => {

        if (campoSenha.type === "password") {
            campoSenha.type = "text";
        } else {
            campoSenha.type = "password";
        }

    });

}

/* ==========================================
   CADASTRO
========================================== */

const cadastroForm = document.getElementById("cadastroForm");

if (cadastroForm) {

    cadastroForm.addEventListener("submit", function(event){

        event.preventDefault();

        const nome = document.getElementById("nome").value;
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;
        const confirmarSenha = document.getElementById("confirmarSenha").value;

        if (senha !== confirmarSenha) {

            alert("As senhas não coincidem.");
            return;

        }

        const usuario = {
            nome: nome,
             email: email,
            senha: senha
        };

    localStorage.setItem(
    email,
    JSON.stringify(usuario)
    );

    /* Mantém o usuário logado */
    localStorage.setItem(
    "usuarioLogado",
    nome
);

        localStorage.setItem(
            email,
            JSON.stringify(usuario)
        );

        const preencherAgora = confirm(
            "Conta criada com sucesso!\n\nDeseja preencher seu perfil agora?\n\nEssas informações ajudam a recomendar profissionais e conteúdos mais adequados."
        );

        if (preencherAgora) {

            window.location.href = "formulario.html";

        } else {

            window.location.href = "home.html";

        }

    });

}

/* ==========================================
   LOGIN
========================================== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function(event){

        event.preventDefault();

        const email = document.getElementById("email").value;
        const senhaDigitada = document.getElementById("senha").value;

        const usuarioSalvo = localStorage.getItem(email);

        if (!usuarioSalvo) {

            alert("Usuário não encontrado.");
            return;

        }

        const usuario = JSON.parse(usuarioSalvo);

        if (usuario.senha !== senhaDigitada) {

            alert("Senha incorreta.");
            return;

        }

        localStorage.setItem(
            "usuarioLogado",
            usuario.nome
        );

        alert("Login realizado com sucesso!");

        window.location.href = "home.html";

    });

}

/* ==========================================
   FORMULÁRIO DE PERFIL
========================================== */

const formularioUsuario =
document.getElementById("formularioUsuario");

if(formularioUsuario){

    /* Preenche automaticamente o nome */

    const usuarioLogado =
    localStorage.getItem("usuarioLogado");

    if(usuarioLogado){

        document.getElementById("nome").value =
        usuarioLogado;

    }

    formularioUsuario.addEventListener("submit", function(event){

        event.preventDefault();

        const perfil = {

            nome:
            document.getElementById("nome").value,

            nascimento:
            document.getElementById("nascimento").value,

            genero:
            document.getElementById("genero").value,

            telefone:
            document.getElementById("telefone").value,

            cidade:
            document.getElementById("cidade").value,

            estado:
            document.getElementById("estado").value,

            acompanhamento:
            document.getElementById("acompanhamento").value,

            necessidade:
            document.getElementById("necessidade").value,

            sobre:
            document.getElementById("sobre").value

        };

        localStorage.setItem(
            "perfilUsuario",
            JSON.stringify(perfil)
        );

        alert("Perfil salvo com sucesso!");

        window.location.href = "home.html";

    });

}