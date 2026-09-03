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
  if (voltar && (localStorage.getItem("cm_tipo") === "profissional" || saved.nome)) {
    voltar.href = "home-profissional.html";
  }

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

  form.addEventListener("submit", (event) => {
    event.preventDefault();

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
