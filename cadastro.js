/* ==========================================
   CADASTRO DE PACIENTE/ESTUDANTE (index.html)
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
configurarTogglePassword(togglePassword, password);
configurarTogglePassword(toggleConfirmPassword, confirmPassword);

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

    limparErroFormulario(form);

    // Validação: campos obrigatórios
    if (!validarCamposObrigatorios(form)) {
        mostrarErroFormulario(form, "Preencha todos os campos obrigatórios.");
        return;
    }

    // Validação: senhas coincidem
    if (password.value !== confirmPassword.value) {
        mostrarErroFormulario(form, "As senhas não coincidem.");
        confirmPassword.focus();
        confirmPassword.parentElement.style.borderColor = "#dc3545";
        return;
    }

    // Validação: tamanho mínimo da senha
    if (password.value.length < 6) {
        mostrarErroFormulario(form, "A senha deve ter pelo menos 6 caracteres.");
        password.focus();
        return;
    }

    const dados = {
        tipo: "usuario",
        nome: document.getElementById("nome").value.trim(),
        email: document.getElementById("email").value.trim(),
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
            mostrarErroFormulario(form, resultado.mensagem || "Erro ao criar conta.");
            return;
        }

        finalizarCadastro(dados);

    } catch (erro) {
        console.error("Erro ao conectar com o servidor:", erro);
        mostrarErroFormulario(form, "Não foi possível conectar. Tente novamente.");
    }
});

// ================================
// REDIRECIONAMENTO PÓS-CADASTRO
// Paciente/Estudante -> formulário de perfil (Etapa 1 de 3)
// ================================
function finalizarCadastro(dados) {
    const perfil = JSON.parse(localStorage.getItem("cm_profile")) || {};
    Object.assign(perfil, dados);

    localStorage.setItem("cm_profile", JSON.stringify(perfil));
    localStorage.setItem("cm_session", dados.email);
    localStorage.setItem("cm_tipo", "usuario");

    window.location.href = "formulario.html";
}
