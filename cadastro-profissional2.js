document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("professionalProfile2Form");
  const success = document.getElementById("profileSuccess2");
  const saved = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");

  // Etapa 2 só faz sentido após a Etapa 1
  if (!saved.nome && localStorage.getItem("cm_tipo") !== "profissional") {
    window.location.href = "cadastro-profissional.html";
    return;
  }

  const fill = (id, value) => { const el=document.getElementById(id); if (el && value && !el.value) el.value = value; };
  fill("modalidade", saved.modalidade);
  fill("abordagem", saved.abordagem);
  fill("especialidades", saved.especialidades);
  fill("faixaEtaria", saved.faixaEtaria);
  fill("cidade", saved.cidade);
  fill("estado", saved.estado);
  fill("telefone2", saved.telefone || "");
  fill("valorSessao", saved.valorSessao);
  fill("disponibilidade", saved.disponibilidade);

  if (saved.verificado) {
    const check = document.getElementById("verificadoInput");
    const termos = document.getElementById("termosInput");
    if (check) check.checked = true;
    if (termos) termos.checked = true;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    limparErroFormulario(form);

    if (!validarCamposObrigatorios(form)) {
      mostrarErroFormulario(form, "Preencha todos os campos obrigatórios.");
      return;
    }

    const verificado = document.getElementById("verificadoInput").checked;
    const termos = document.getElementById("termosInput").checked;

    if (!verificado || !termos) {
      mostrarErroFormulario(form, "Marque a declaração de verificação e os termos para concluir.");
      return;
    }

    const tel = document.getElementById("telefone2").value.trim();

    const profile = {
      ...saved,
      modalidade: document.getElementById("modalidade").value,
      abordagem: document.getElementById("abordagem").value.trim(),
      especialidades: document.getElementById("especialidades").value.trim(),
      faixaEtaria: document.getElementById("faixaEtaria").value,
      cidade: document.getElementById("cidade").value.trim(),
      estado: document.getElementById("estado").value,
      telefone: tel,
      valorSessao: document.getElementById("valorSessao").value,
      disponibilidade: document.getElementById("disponibilidade").value.trim(),
      verificado: true,
      etapa: 2,
      concluido: true
    };

    localStorage.setItem("cm_profile_profissional", JSON.stringify(profile));
    localStorage.setItem("cm_tipo", "profissional");
    localStorage.setItem("cm_session", profile.email || saved.email || "");

    form.hidden = true;
    success.classList.add("show");
    window.scrollTo({top:0, behavior:"smooth"});
  });
});