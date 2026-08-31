document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("professionalProfileForm");
  const success = document.getElementById("profileSuccess");
  const nomeInput = document.getElementById("nomeProfissional");
  const saved = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");

  if (saved.nome && !nomeInput.value) nomeInput.value = saved.nome;
  if (saved.registroProfissional && !document.getElementById("crp").value) document.getElementById("crp").value = saved.registroProfissional;
  if (saved.telefone && !document.getElementById("telefoneProf").value) document.getElementById("telefoneProf").value = saved.telefone;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const faixas = [...document.querySelectorAll('input[name="faixa"]:checked')].map(i => i.value);
    if (!faixas.length) {
      alert("Selecione pelo menos uma faixa etária atendida.");
      return;
    }

    const profile = {
      ...saved,
      nome: nomeInput.value.trim(),
      nomeSocial: document.getElementById("nomeSocial").value.trim(),
      bio: document.getElementById("bioProfissional").value.trim(),
      registroProfissional: document.getElementById("crp").value.trim(),
      ufCrp: document.getElementById("ufCrp").value,
      faculdade: document.getElementById("faculdade").value.trim(),
      anoFormacao: document.getElementById("anoFormacao").value,
      posGraduacao: document.getElementById("posGraduacao").value.trim(),
      atuaDesde: document.getElementById("atuaDesde").value,
      idiomas: document.getElementById("idiomas").value.trim(),
      abordagem: document.getElementById("abordagem").value,
      especialidades: document.getElementById("especialidades").value.trim(),
      faixasEtarias: faixas,
      cidade: document.getElementById("cidadeProf").value.trim(),
      estado: document.getElementById("estadoProf").value,
      modalidade: document.getElementById("modalidade").value,
      duracaoSessao: document.getElementById("duracao").value,
      endereco: document.getElementById("endereco").value.trim(),
      valorSessao: document.getElementById("valorSessao").value,
      disponibilidade: document.getElementById("disponibilidade").value.trim(),
      telefone: document.getElementById("telefoneProf").value.trim(),
      site: document.getElementById("siteProf").value.trim(),
      perfilCompleto: true,
      verificado: false
    };

    localStorage.setItem("cm_profile_profissional", JSON.stringify(profile));
    localStorage.setItem("cm_tipo", "profissional");
    localStorage.setItem("cm_session", profile.email || saved.email || "");
    form.hidden = true;
    success.classList.add("show");
    window.scrollTo({top:0, behavior:"smooth"});
  });
});