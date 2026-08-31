/* ==========================================
   LOGIN (login.html)
   ========================================== */
const MODO_TESTE = true; // troque para false quando o back-end estiver pronto

const senha = document.getElementById("password");
const toggle = document.getElementById("togglePassword");
const form = document.querySelector("form");
const emailInput = document.getElementById("email");
const emailLabelTipo = document.getElementById("emailLabelTipo");
const tipoContaInput = document.getElementById("tipoConta");

configurarTogglePassword(toggle, senha);

// ================================
// SELETOR DE TIPO DE CONTA (Estudante / Profissional)
// ================================
configurarSeletorTipoConta({
    onChange(tipo) {
        if (emailLabelTipo) {
            emailLabelTipo.textContent = tipo === "profissional" ? " profissional" : " institucional";
        }
    }
});

// Reforço independente do seletor no login
document.querySelectorAll(".account-type-btn").forEach((botao) => {
    botao.addEventListener("click", () => {
        document.querySelectorAll(".account-type-btn").forEach((b) => {
            b.classList.toggle("active", b === botao);
            b.setAttribute("aria-selected", b === botao ? "true" : "false");
        });
        if (tipoContaInput) tipoContaInput.value = botao.dataset.tipo;
        if (emailLabelTipo) {
            emailLabelTipo.textContent = botao.dataset.tipo === "profissional" ? " profissional" : " institucional";
        }
    });
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    limparErroFormulario(form);

    const email = emailInput.value.trim();
    const senhaDigitada = senha.value;
    const tipo = tipoContaInput ? tipoContaInput.value : "usuario";

    if (!email || !senhaDigitada) {
        mostrarErroFormulario(form, "Preencha e-mail e senha.");
        return;
    }

    if (MODO_TESTE) {
        // Sem back-end: qualquer login válido leva direto para a home
        entrar(email, tipo);
        return;
    }

    // Código real, para quando o back-end estiver pronto
    try {
        const response = await fetch("api/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha: senhaDigitada, tipo })
        });

        const data = await response.json();

        if (!response.ok) {
            mostrarErroFormulario(form, data.mensagem || "E-mail ou senha inválidos.");
            return;
        }

        entrar(email, tipo);

    } catch (erro) {
        console.error("Erro ao conectar com o servidor:", erro);
        mostrarErroFormulario(form, "Não foi possível conectar. Tente novamente.");
    }
});

// ================================
// REDIRECIONAMENTO PÓS-LOGIN
// Estudante -> home.html | Profissional -> home-profissional.html
// ================================
function entrar(email, tipo) {
    const botaoAtivo = document.querySelector(".account-type-btn.active");
    const tipoBotao = botaoAtivo && botaoAtivo.dataset.tipo;
    const tipoFinal = tipoBotao || tipo || "usuario";
    localStorage.setItem("cm_session", email);
    localStorage.setItem("cm_tipo", tipoFinal);
    window.location.href = tipoFinal === "profissional" ? "home-profissional.html" : "home.html";
}
