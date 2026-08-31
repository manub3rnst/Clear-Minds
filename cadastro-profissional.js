document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("professionalProfileForm");
  const success = document.getElementById("profileSuccess");
  const nomeInput = document.getElementById("nomeProfissional");
  const saved = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");

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
  if (voltar && (saved.perfilCompleto && saved.nome)) voltar.href = "home-profissional.html";

  const fill = (id, value) => { const el=document.getElementById(id); if (el && value && !el.value) el.value = value; };
  fill("nomeProfissional", saved.nome);
  fill("nomeSocial", saved.nomeSocial);
  fill("bioProfissional", saved.bio);
  fill("crp", saved.registroProfissional);
  fill("ufCrp", saved.ufCrp);
  fill("faculdade", saved.faculdade);
  fill("anoFormacao", saved.anoFormacao);
  fill("posGraduacao", saved.posGraduacao);
  fill("atuaDesde", saved.atuaDesde);
  fill("idiomas", saved.idiomas);
  fill("abordagem", saved.abordagem);
  fill("especialidades", saved.especialidades);
  (saved.faixasEtarias || []).forEach(f => {
    const chk = document.querySelector(`input[name="faixa"][value="${f}"]`);
    if (chk) chk.checked = true;
  });
  fill("cidadeProf", saved.cidade);
  fill("estadoProf", saved.estado);
  fill("modalidade", saved.modalidade);
  fill("duracao", saved.duracaoSessao);
  fill("endereco", saved.endereco);
  fill("valorSessao", saved.valorSessao);
  fill("disponibilidade", saved.disponibilidade);
  fill("telefoneProf", saved.telefone);
  fill("siteProf", saved.site);

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
      foto: fotoDataURL,
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