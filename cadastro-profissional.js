document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("professionalProfileForm");
  const success = document.getElementById("profileSuccess");
  const nomeInput = document.getElementById("nomeProfissional");
  const saved = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");

  // ================================
  // MOSTRAR / OCULTAR SENHA
  // ================================
  const senha = document.getElementById("senhaProfissional");
  const confirm = document.getElementById("confirmSenhaProfissional");
  configurarTogglePassword(document.getElementById("toggleSenhaProfissional"), senha);
  configurarTogglePassword(document.getElementById("toggleConfirmSenhaProfissional"), confirm);

  // Senha só é obrigatória quando ainda não há cadastro concluído.
  const editando = Boolean(saved.email && saved.senha);
  if (editando && senha) {
    senha.required = false;
    senha.placeholder = "Deixe em branco para manter a senha atual";
  }
  if (editando && confirm) confirm.required = false;

  document.getElementById("confirmSenhaProfissional").addEventListener("input", () => {
    confirm.parentElement.style.borderColor = "";
  });

  let fotoDataURL = saved.foto || "";
  const fotoInput = document.getElementById("fotoPerfil");
  const fotoPreview = document.getElementById("fotoPreview");
  if (fotoPreview && fotoDataURL) {
    fotoPreview.innerHTML = `<img src="${fotoDataURL}" alt="Foto de perfil">`;
  }
  if (fotoInput) {
    fotoInput.addEventListener("change", () => {
      const file = fotoInput.files && fotoInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) { alert("Selecione um arquivo de imagem."); return; }
      if (file.size > 3 * 1024 * 1024) { alert("A imagem deve ter no máximo 3 MB."); return; }
      const reader = new FileReader();
      reader.onload = () => {
        fotoDataURL = reader.result;
        if (fotoPreview) fotoPreview.innerHTML = `<img src="${fotoDataURL}" alt="Foto de perfil">`;
      };
      reader.readAsDataURL(file);
    });
  }

  const voltar = document.getElementById("btnVoltarPerfil");
  if (voltar && (localStorage.getItem("cm_tipo") === "profissional" || saved.nome)) {
    voltar.href = "home-profissional.html";
  }

  const fill = (id, value) => { const el=document.getElementById(id); if (el && value && !el.value) el.value = value; };
  fill("nomeProfissional", saved.nome);
  fill("nomeSocial", saved.nomeSocial);
  fill("profissao", saved.profissao);
  fill("bioProfissional", saved.bio);
  fill("crp", saved.registroProfissional);
  fill("ufCrp", saved.ufCrp);
  fill("faculdade", saved.faculdade);
  fill("anoFormacao", saved.anoFormacao);
  fill("posGraduacao", saved.posGraduacao);
  fill("atuaDesde", saved.atuaDesde);
  fill("idiomas", saved.idiomas);
  fill("emailProfissional", saved.email);
  if (!saved.senha) {
    // Nunca pré-preenche a senha caso já exista (por segurança no protótipo).
    if (senha) senha.value = "";
    if (confirm) confirm.value = "";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    limparErroFormulario(form);

    if (!validarCamposObrigatorios(form)) {
      mostrarErroFormulario(form, "Preencha todos os campos obrigatórios.");
      return;
    }

    if (!editando) {
      if (senha.value !== confirm.value) {
        mostrarErroFormulario(form, "As senhas não coincidem.");
        confirm.focus();
        confirm.parentElement.style.borderColor = "#dc3545";
        return;
      }
      if (senha.value.length < 6) {
        mostrarErroFormulario(form, "A senha deve ter pelo menos 6 caracteres.");
        senha.focus();
        return;
      }
    }

    const profile = {
      ...saved,
      nome: nomeInput.value.trim(),
      nomeSocial: document.getElementById("nomeSocial").value.trim(),
      profissao: document.getElementById("profissao").value,
      bio: document.getElementById("bioProfissional").value.trim(),
      registroProfissional: document.getElementById("crp").value.trim(),
      ufCrp: document.getElementById("ufCrp").value,
      faculdade: document.getElementById("faculdade").value.trim(),
      anoFormacao: document.getElementById("anoFormacao").value,
      posGraduacao: document.getElementById("posGraduacao").value.trim(),
      atuaDesde: document.getElementById("atuaDesde").value,
      idiomas: document.getElementById("idiomas").value.trim(),
      email: document.getElementById("emailProfissional").value.trim(),
      senha: senha.value || saved.senha || "",
      foto: fotoDataURL,
      etapa: 1
    };

    localStorage.setItem("cm_profile_profissional", JSON.stringify(profile));
    localStorage.setItem("cm_tipo", "profissional");
    localStorage.setItem("cm_session", profile.email || saved.email || "");

    form.hidden = true;
    success.classList.add("show");
    window.scrollTo({top:0, behavior:"smooth"});
  });
});
