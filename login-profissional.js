/* ==========================================
   LOGIN PROFISSIONAL (login-profissional.html)
   ========================================== */
const MODO_TESTE = true; // troque para false quando o back-end estiver pronto

const form = document.getElementById("professionalLoginForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("password");
const toggle = document.getElementById("togglePassword");

if (toggle && senhaInput) configurarTogglePassword(toggle, senhaInput);

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    limparErroFormulario(form);

    const email = emailInput.value.trim();
    const senhaDigitada = senhaInput.value;

    if (!email || !senhaDigitada) {
        mostrarErroFormulario(form, "Preencha e-mail e senha.");
        return;
    }

    if (MODO_TESTE) {
        // Sem back-end: valida com o perfil profissional salvo no localStorage
        const perfil = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");

        if (!perfil.email) {
            mostrarErroFormulario(form, "Nenhuma conta profissional cadastrada nesta máquina. Cadastre-se primeiro.");
            return;
        }

        if (perfil.email !== email || perfil.senha !== senhaDigitada) {
            mostrarErroFormulario(form, "E-mail ou senha inválidos.");
            return;
        }

        localStorage.setItem("cm_session", perfil.email);
        localStorage.setItem("cm_tipo", "profissional");
        window.location.href = "home-profissional.html";
        return;
    }

    // Código real, para quando o back-end estiver pronto
    try {
        const response = await fetch("api/login-profissional.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha: senhaDigitada })
        });

        const data = await response.json();

        if (!response.ok) {
            mostrarErroFormulario(form, data.mensagem || "E-mail ou senha inválidos.");
            return;
        }

        localStorage.setItem("cm_session", email);
        localStorage.setItem("cm_tipo", "profissional");
        window.location.href = "home-profissional.html";

    } catch (erro) {
        console.error("Erro ao conectar com o servidor:", erro);
        mostrarErroFormulario(form, "Não foi possível conectar. Tente novamente.");
    }
});