/* ==========================================
   CADASTRO (index.html)
   ========================================== */
const MODO_TESTE = true; // trocar para false quando o back-end estiver pronto

const form = document.getElementById("registerForm");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const emailLabelTipo = document.getElementById("emailLabelTipo");
const tipoContaInput = document.getElementById("tipoConta");

// ================================
// MOSTRAR / OCULTAR SENHA
// ================================
configurarTogglePassword(togglePassword, password);
configurarTogglePassword(toggleConfirmPassword, confirmPassword);

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

    // Validação: campos obrigatórios visíveis (depende do tipo de conta)
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

    const tipo = tipoContaInput ? tipoContaInput.value : "usuario";

    const dados = {
        tipo,
        nome: document.getElementById("nome").value.trim(),
        email: document.getElementById("email").value.trim()
    };

    if (tipo === "profissional") {
        dados.areaAtuacao = document.getElementById("areaAtuacao").value;
        dados.registroProfissional = document.getElementById("registroProfissional").value.trim();
        dados.telefone = document.getElementById("telefoneProfissional").value.trim();
    } else {
        dados.curso = document.getElementById("curso").value;
        dados.periodo = document.getElementById("periodo").value;
    }

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
// Estudante -> segue para o formulário de perfil (Etapa 1 de 3)
// Profissional -> vai direto para o painel profissional
// ================================
function finalizarCadastro(dados) {
    const chavePerfil = dados.tipo === "profissional" ? "cm_profile_profissional" : "cm_profile";

    const perfil = JSON.parse(localStorage.getItem(chavePerfil)) || {};
    Object.assign(perfil, dados);

    localStorage.setItem(chavePerfil, JSON.stringify(perfil));
    localStorage.setItem("cm_session", dados.email);
    localStorage.setItem("cm_tipo", dados.tipo);

    window.location.href = dados.tipo === "profissional" ? "cadastro-profissional.html" : "formulario.html";
}
