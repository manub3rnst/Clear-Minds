/* ==========================================
   UTILITÁRIOS COMPARTILHADOS
   Funções usadas em mais de uma página
   (cadastro, login, formulários) para evitar
   código duplicado.
   ========================================== */

/**
 * Liga um botão de "olho" a um campo de senha,
 * alternando entre texto visível/oculto.
 */
function configurarTogglePassword(botao, campo) {
    if (!botao || !campo) return;

    botao.addEventListener("click", () => {
        const icon = botao.querySelector("i");
        const isPassword = campo.type === "password";

        campo.type = isPassword ? "text" : "password";

        if (icon) {
            icon.classList.replace(
                isPassword ? "fa-eye" : "fa-eye-slash",
                isPassword ? "fa-eye-slash" : "fa-eye"
            );
        }

        botao.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
    });
}

/**
 * Valida se todos os campos obrigatórios *visíveis* de um
 * formulário foram preenchidos. Campos dentro de um contêiner
 * com `display:none` (ex.: bloco de "Profissional" escondido
 * quando o tipo de conta é "Estudante") são ignorados.
 */
function validarCamposObrigatorios(form) {
    const campos = form.querySelectorAll("input, select, textarea");
    let primeiroInvalido = null;

    campos.forEach((campo) => {
        const escondido = campo.closest('[data-tipo-conta]') &&
            campo.closest('[data-tipo-conta]').style.display === "none";

        if (escondido) return;

        if (campo.hasAttribute("required") && campo.value.trim() === "") {
            if (!primeiroInvalido) primeiroInvalido = campo;
        }
    });

    if (primeiroInvalido) {
        primeiroInvalido.focus();
        return false;
    }

    return true;
}

/**
 * Exibe uma mensagem de erro simples abaixo de um formulário,
 * criando o elemento se ainda não existir. Evita o uso de
 * `alert()`, que interrompe o fluxo e é menos acessível.
 */
function mostrarErroFormulario(form, mensagem) {
    let erro = form.querySelector(".form-erro");

    if (!erro) {
        erro = document.createElement("p");
        erro.className = "form-erro";
        erro.setAttribute("role", "alert");
        form.appendChild(erro);
    }

    erro.textContent = mensagem;
}

function limparErroFormulario(form) {
    const erro = form.querySelector(".form-erro");
    if (erro) erro.textContent = "";
}

/**
 * Liga o seletor "Sou Estudante / Sou Profissional" presente no
 * cadastro e no login. Alterna a classe "active" dos botões,
 * mostra/esconde os blocos de campos específicos de cada tipo
 * e ajusta o input escondido #tipoConta usado no envio do formulário.
 */
function configurarSeletorTipoConta({ onChange } = {}) {
    const botoes = document.querySelectorAll(".account-type-btn");
    const tipoInput = document.getElementById("tipoConta");

    if (!botoes.length) return;

    botoes.forEach((botao) => {
        botao.addEventListener("click", () => {
            const tipo = botao.dataset.tipo;

            botoes.forEach((b) => {
                const ativo = b === botao;
                b.classList.toggle("active", ativo);
                b.setAttribute("aria-selected", ativo ? "true" : "false");
            });

            if (tipoInput) tipoInput.value = tipo;

            document.querySelectorAll("[data-tipo-conta]").forEach((bloco) => {
                const pertence = bloco.dataset.tipoConta === tipo;
                bloco.style.display = pertence ? "" : "none";

                bloco.querySelectorAll("[data-required-if-visible]").forEach((campo) => {
                    campo.required = pertence;
                });
            });

            if (typeof onChange === "function") onChange(tipo);
        });
    });
}
