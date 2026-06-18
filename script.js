/* ==========================================
   PROTEÇÃO DE PÁGINAS
========================================== */

const paginaAtual = window.location.pathname;
const usuarioLogado = localStorage.getItem("usuarioLogado");

if (
    (paginaAtual.includes("home.html") ||
    paginaAtual.includes("formulario.html"))
    &&
    !usuarioLogado
){
    window.location.href = "login.html";
}

/* ==========================================
   MOSTRAR / OCULTAR SENHA
========================================== */

const campoSenha = document.getElementById("senha");
const btnMostrarSenha = document.getElementById("mostrarSenha");

if (campoSenha && btnMostrarSenha) {

    btnMostrarSenha.addEventListener("click", () => {

        if (campoSenha.type === "password") {

            campoSenha.type = "text";
            btnMostrarSenha.innerHTML = "🙈";

        } else {

            campoSenha.type = "password";
            btnMostrarSenha.innerHTML = "👁";

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

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;
        const confirmarSenha = document.getElementById("confirmarSenha").value;

        if(nome.length < 3){

            alert("Digite seu nome completo.");
            return;

        }

        if(senha.length < 8){

            alert("A senha deve ter pelo menos 8 caracteres.");
            return;

        }

        if(senha !== confirmarSenha){

            alert("As senhas não coincidem.");
            return;

        }

        if(localStorage.getItem(email)){

            alert("Já existe uma conta cadastrada com este e-mail.");
            return;

        }

        const usuario = {

            nome,
            email,
            senha

        };

        localStorage.setItem(
            email,
            JSON.stringify(usuario)
        );

        localStorage.setItem(
            "usuarioLogado",
            nome
        );

        const preencherAgora = confirm(
            "Conta criada com sucesso!\n\nDeseja preencher seu perfil agora?"
        );

        if(preencherAgora){

            window.location.href = "formulario.html";

        }else{

            window.location.href = "home.html";

        }

    });

}

/* ==========================================
   LOGIN
========================================== */

const loginForm = document.getElementById("loginForm");

if(loginForm){

    loginForm.addEventListener("submit", function(event){

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senhaDigitada = document.getElementById("senha").value;

        const usuarioSalvo = localStorage.getItem(email);

        if(!usuarioSalvo){

            alert("Usuário não encontrado.");
            return;

        }

        const usuario = JSON.parse(usuarioSalvo);

        if(usuario.senha !== senhaDigitada){

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
   MÁSCARA DE TELEFONE
========================================== */

const telefone = document.getElementById("telefone");

if(telefone){

    telefone.addEventListener("input", function(){

        let valor = telefone.value.replace(/\D/g,'');

        valor = valor.replace(/^(\d{2})(\d)/g,"($1) $2");
        valor = valor.replace(/(\d{5})(\d)/,"$1-$2");

        telefone.value = valor;

    });

}

/* ==========================================
   FORMULÁRIO DE PERFIL
========================================== */

const formularioUsuario =
document.getElementById("formularioUsuario");

if(formularioUsuario){

    const usuarioLogado =
    localStorage.getItem("usuarioLogado");

    if(usuarioLogado){

        document.getElementById("nome").value =
        usuarioLogado;

    }

    const perfilSalvo =
    JSON.parse(
        localStorage.getItem(
            "perfil_" + usuarioLogado
        )
    );

    if(perfilSalvo){

        document.getElementById("nome").value =
        perfilSalvo.nome || "";

        document.getElementById("nascimento").value =
        perfilSalvo.nascimento || "";

        document.getElementById("genero").value =
        perfilSalvo.genero || "";

        document.getElementById("telefone").value =
        perfilSalvo.telefone || "";

        document.getElementById("cidade").value =
        perfilSalvo.cidade || "";

        document.getElementById("estado").value =
        perfilSalvo.estado || "";

        document.getElementById("acompanhamento").value =
        perfilSalvo.acompanhamento || "";

        document.getElementById("necessidade").value =
        perfilSalvo.necessidade || "";

        document.getElementById("sobre").value =
        perfilSalvo.sobre || "";

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
            "perfil_" + usuarioLogado,
            JSON.stringify(perfil)
        );

        alert("Perfil salvo com sucesso!");

        window.location.href = "home.html";

    });

}

/* ==========================================
   HOME
========================================== */

const nomeUsuarioHome =
document.getElementById("nomeUsuario");

if(nomeUsuarioHome){

    const usuario =
    localStorage.getItem("usuarioLogado");

    if(usuario){

        nomeUsuarioHome.innerText = usuario;

    }

}

/* ==========================================
   SAUDAÇÃO AUTOMÁTICA
========================================== */

const saudacao =
document.getElementById("saudacao");

if(saudacao){

    const hora = new Date().getHours();

    if(hora < 12){

        saudacao.innerText =
        "Bom dia ☀️";

    }

    else if(hora < 18){

        saudacao.innerText =
        "Boa tarde 🌤️";

    }

    else{

        saudacao.innerText =
        "Boa noite 🌙";

    }

}

/* ==========================================
   PERFIL NA HOME
========================================== */

const usuarioPerfil =
localStorage.getItem("usuarioLogado");

const perfilSalvoHome =
JSON.parse(
    localStorage.getItem(
        "perfil_" + usuarioPerfil
    )
);

if(perfilSalvoHome){

    const perfilNome =
    document.getElementById("perfilNome");

    const perfilCidade =
    document.getElementById("perfilCidade");

    const perfilNecessidade =
    document.getElementById("perfilNecessidade");

    const perfilAcompanhamento =
    document.getElementById("perfilAcompanhamento");

    if(perfilNome){

        perfilNome.innerText =
        perfilSalvoHome.nome || "Não informado";

    }

    if(perfilCidade){

        perfilCidade.innerText =
        perfilSalvoHome.cidade || "Não informado";

    }

    if(perfilNecessidade){

        perfilNecessidade.innerText =
        perfilSalvoHome.necessidade || "Não informado";

    }

    if(perfilAcompanhamento){

        perfilAcompanhamento.innerText =
        perfilSalvoHome.acompanhamento || "Não informado";

    }

}

/* ==========================================
   LOGOUT
========================================== */

const btnSair =
document.getElementById("btnSair");

if(btnSair){

    btnSair.addEventListener("click", () => {

        const confirmar = confirm(
            "Deseja realmente sair da sua conta?"
        );

        if(confirmar){

            localStorage.removeItem(
                "usuarioLogado"
            );

            window.location.href =
            "login.html";

        }

    });

}