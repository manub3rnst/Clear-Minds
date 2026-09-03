/* ==========================================
   LOGIN PACIENTE/ESTUDANTE (login.html)
   ========================================== */
const MODO_TESTE = true; // troque para false quando o back-end estiver pronto

const senha = document.getElementById("password");
const toggle = document.getElementById("togglePassword");
const form = document.querySelector("form");
const emailInput = document.getElementById("email");

configurarTogglePassword(toggle, senha);

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    limparErroFormulario(form);

    const email = emailInput.value.trim();
    const senhaDigitada = senha.value;

    if (!email || !senhaDigitada) {
        mostrarErroFormulario(form, "Preencha e-mail e senha.");
        return;
    }

    if (MODO_TESTE) {
        // Sem back-end: qualquer login válido leva direto para a home
        entrar(email);
        return;
    }

    // Código real, para quando o back-end estiver pronto
    try {
        const response = await fetch("api/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha: senhaDigitada })
        });

        const data = await response.json();

        if (!response.ok) {
            mostrarErroFormulario(form, data.mensagem || "E-mail ou senha inválidos.");
            return;
        }

        entrar(email);

    } catch (erro) {
        console.error("Erro ao conectar com o servidor:", erro);
        mostrarErroFormulario(form, "Não foi possível conectar. Tente novamente.");
    }
});

// ================================
// REDIRECIONAMENTO PÓS-LOGIN
// Paciente/Estudante -> home.html
// (Profissional acessa via "Acessar conta profissional")
// ================================
function entrar(email) {
    localStorage.setItem("cm_session", email);
    localStorage.setItem("cm_tipo", "usuario");
    window.location.href = "home.html";
}
