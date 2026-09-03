document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("professionalProfileForm2");
  const success = document.getElementById("profileSuccess");
  const saved = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");

  const fill = (id, value) => { const el=document.getElementById(id); if (el && value && !el.value) el.value = value; };
  fill("cidadeProf", saved.cidade);
  fill("estadoProf", saved.estado);
  fill("modalidade", saved.modalidade);
  fill("duracao", saved.duracao);
  fill("endereco", saved.endereco);
  fill("valorSessao", saved.valorSessao);
  fill("disponibilidade", saved.disponibilidade);
  fill("telefoneProf", saved.telefoneProfissional);
  fill("siteProf", saved.siteProfissional);
  fill("abordagem", saved.abordagem);
  fill("especialidades", saved.especialidades);

  const faixasSalvas = saved.faixas || [];
  if (Array.isArray(faixasSalvas)) {
    document.querySelectorAll('input[name="faixa"]').forEach(cb => {
      if (faixasSalvas.includes(cb.value)) cb.checked = true;
    });
  }

  const voltar = document.getElementById("btnVoltarEtapa2");
  if (voltar) voltar.href = "cadastro-profissional.html";

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const faixas = Array.from(document.querySelectorAll('input[name="faixa"]:checked')).map(cb => cb.value);

    const profile = {
      ...saved,
      cidade: document.getElementById("cidadeProf").value.trim(),
      estado: document.getElementById("estadoProf").value,
      modalidade: document.getElementById("modalidade").value,
      duracao: document.getElementById("duracao").value,
      endereco: document.getElementById("endereco").value.trim(),
      valorSessao: document.getElementById("valorSessao").value,
      disponibilidade: document.getElementById("disponibilidade").value.trim(),
      telefoneProfissional: document.getElementById("telefoneProf").value.trim(),
      siteProfissional: document.getElementById("siteProf").value.trim(),
      abordagem: document.getElementById("abordagem").value,
      especialidades: document.getElementById("especialidades").value.trim(),
      faixas,
      perfilCompleto: true,
      etapa: 2
    };

    localStorage.setItem("cm_profile_profissional", JSON.stringify(profile));
    localStorage.setItem("cm_tipo", "profissional");
    localStorage.setItem("cm_session", profile.email || saved.email || "");

    form.hidden = true;
    success.classList.add("show");
    window.scrollTo({top:0, behavior:"smooth"});
  });
});
