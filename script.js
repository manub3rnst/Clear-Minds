/* ==========================================
   LOGIN (login.html)
   ========================================== */
const MODO_TESTE = true; // troque para false quando o back-end estiver pronto

const senha = document.getElementById("password");
const toggle = document.getElementById("togglePassword");
const icon = toggle.querySelector("i");
const form = document.querySelector("form");
const emailInput = document.getElementById("email");

toggle.addEventListener("click", () => {
    const isPassword = senha.type === "password";
    senha.type = isPassword ? "text" : "password";
    icon.classList.replace(
        isPassword ? "fa-eye" : "fa-eye-slash",
        isPassword ? "fa-eye-slash" : "fa-eye"
    );
    toggle.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const senhaDigitada = senha.value;

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
            alert(data.mensagem || "E-mail ou senha inválidos.");
            return;
        }

        entrar(email);

    } catch (erro) {
        console.error("Erro ao conectar com o servidor:", erro);
        alert("Não foi possível conectar. Tente novamente.");
    }
});

// ================================
// REDIRECIONAMENTO PÓS-LOGIN -> home
// ================================
function entrar(email) {
    localStorage.setItem("cm_session", email);
    window.location.href = "home.html";
}
