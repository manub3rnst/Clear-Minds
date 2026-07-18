/* ========================================== 
   CADASTRO (index.html)
   ========================================== */
const MODO_TESTE = true; // trocar para false quando o back-end estiver pronto

const form = document.getElementById("registerForm");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

// ================================
// MOSTRAR / OCULTAR SENHA
// ================================
function configurarToggle(botao, campo) {
    botao.addEventListener("click", () => {
        const icon = botao.querySelector("i");
        const isPassword = campo.type === "password";

        campo.type = isPassword ? "text" : "password";
        icon.classList.replace(
            isPassword ? "fa-eye" : "fa-eye-slash",
            isPassword ? "fa-eye-slash" : "fa-eye"
        );
        botao.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
    });
}

configurarToggle(togglePassword, password);
configurarToggle(toggleConfirmPassword, confirmPassword);

// ================================
// REMOVE BORDA VERMELHA AO DIGITAR
// ================================
confirmPassword.addEventListener("input", () => {
    confirmPassword.parentElement.style.borderColor = "";
});

// ================================
// ENVIO DO FORMULÁRIO
// ================================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validação: senhas coincidem
    if (password.value !== confirmPassword.value) {
        alert("As senhas não coincidem.");
        confirmPassword.focus();
        confirmPassword.parentElement.style.borderColor = "#dc3545";
        return;
    }

    const dados = {
        nome: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        curso: document.getElementById("curso").value,
        periodo: document.getElementById("periodo").value
    };

    if (MODO_TESTE) {
        finalizarCadastro(dados);
        return;
    }

    // Código real, para quando o back-end (PHP/Node) estiver pronto
    try {
        const response = await fetch("api/cadastro.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...dados, senha: password.value })
        });

        const resultado = await response.json();

        if (!response.ok) {
            alert(resultado.mensagem || "Erro ao criar conta.");
            return;
        }

        finalizarCadastro(dados);

    } catch (erro) {
        console.error("Erro ao conectar com o servidor:", erro);
        alert("Não foi possível conectar. Tente novamente.");
    }
});

// ================================
// REDIRECIONAMENTO PÓS-CADASTRO
// Cadastro concluído -> segue para o formulário (Etapa 1 de 3)
// ================================
function finalizarCadastro(dados) {
    const perfil = JSON.parse(localStorage.getItem("cm_profile")) || {};

    Object.assign(perfil, dados);

    localStorage.setItem("cm_profile", JSON.stringify(perfil));
    localStorage.setItem("cm_session", dados.email);

    window.location.href = "formulario.html";
}
