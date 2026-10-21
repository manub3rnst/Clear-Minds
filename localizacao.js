document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("localizacaoForm");
    const busca = document.getElementById("localizacaoBusca");
    const botaoAtual = document.getElementById("localizacaoAtual");
    const status = document.getElementById("localizacaoStatus");
    const resultados = document.getElementById("localizacaoResultados");
    const resumo = document.getElementById("localizacaoResultadosResumo");
    const mapa = document.getElementById("localizacaoMapa");
    const mapaLink = document.getElementById("localizacaoMapaLink");
    const mapaDescricao = document.getElementById("localizacaoMapaDescricao");
    const perfilDialog = document.getElementById("localizacaoPerfilDialog");
    const filtroDistancia = document.getElementById("localizacaoFiltroDistancia");
    const filtroEspecialidade = document.getElementById("localizacaoFiltroEspecialidade");
    const raioMetros = 25000;
    let mapaLeaflet = null;
    let camadaMarcadores = null;
    const marcadoresPorIndice = new Map();
    let ultimosLocais = null;
    let ultimoCentro = null;
    let ultimoPerfilCadastrado = null;
    let termoBuscaProfissional = "";
    let buscaPerfilIniciada = false;
    const perfil = (() => {
        try {
            return JSON.parse(localStorage.getItem("cm_profile") || "{}");
        } catch (erro) {
            console.error("Não foi possível ler a localização salva no perfil.", erro);
            return {};
        }
    })();
    const perfilProfissional = (() => {
        try {
            const salvo = JSON.parse(localStorage.getItem("cm_profile_profissional") || "{}");
            return salvo.concluido && String(salvo.cidade || "").trim() ? salvo : null;
        } catch (erro) {
            console.error("Não foi possível ler o cadastro profissional salvo.", erro);
            return null;
        }
    })();

    if (!form || !busca || !status || !resultados || !resumo || !mapa || !mapaLink || !mapaDescricao || !perfilDialog) return;

    const localSalvo = [perfil.cidade, perfil.estado].filter(Boolean).join(", ");
    if (localSalvo) busca.value = localSalvo;

    const esc = (valor) => String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const formatarDistancia = (metros) => {
        if (metros < 1000) return `${Math.max(100, Math.round(metros / 100) * 100)} m`;
        return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
    };

    const distanciaEntre = (latA, lonA, latB, lonB) => {
        const rad = (graus) => graus * Math.PI / 180;
        const dLat = rad(latB - latA);
        const dLon = rad(lonB - lonA);
        const a = Math.sin(dLat / 2) ** 2
            + Math.cos(rad(latA)) * Math.cos(rad(latB)) * Math.sin(dLon / 2) ** 2;
        return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const buscarJson = async (url, opcoes = {}) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 30000);
        try {
            const resposta = await fetch(url, { ...opcoes, signal: controller.signal });
            if (!resposta.ok) throw new Error(`Serviço de localização respondeu com status ${resposta.status}.`);
            return await resposta.json();
        } finally {
            window.clearTimeout(timeout);
        }
    };

    const mostrarEstado = (mensagem) => {
        status.textContent = mensagem;
    };

    const mostrarVazio = (titulo, descricao) => {
        resultados.innerHTML = `<div class="cm-location-empty">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            <strong>${esc(titulo)}</strong>
            <span>${esc(descricao)}</span>
        </div>`;
    };

    const atualizarMapa = (lat, lon, descricao) => {
        if (!window.L) throw new Error("O mapa interativo não foi carregado.");
        if (!mapaLeaflet) {
            mapaLeaflet = window.L.map(mapa, { scrollWheelZoom: false }).setView([lat, lon], 12);
            window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            }).addTo(mapaLeaflet);
            camadaMarcadores = window.L.layerGroup().addTo(mapaLeaflet);
        }
        camadaMarcadores.clearLayers();
        marcadoresPorIndice.clear();
        mapaLeaflet.setView([lat, lon], 12);
        window.L.circle([lat, lon], {
            radius: 900,
            color: "#3D7CC9",
            weight: 2,
            fillColor: "#6FA8E8",
            fillOpacity: 0.12
        }).bindPopup("Região de busca aproximada").addTo(camadaMarcadores);
        mapaLeaflet.invalidateSize();
        mapaLink.href = `https://www.openstreetmap.org/?mlat=${lat.toFixed(2)}&mlon=${lon.toFixed(2)}#map=12/${lat.toFixed(2)}/${lon.toFixed(2)}`;
        mapaDescricao.textContent = descricao;
    };

    const obterCoordenadas = async (consulta) => {
        const params = new URLSearchParams({
            format: "jsonv2",
            limit: "1",
            countrycodes: "br",
            q: consulta
        });
        const locais = await buscarJson(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: { "Accept-Language": "pt-BR" }
        });
        const local = locais[0];
        if (!local) return null;
        const lat = Number(local.lat);
        const lon = Number(local.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return { lat, lon, descricao: local.display_name || consulta };
    };

    const obterLocais = async (lat, lon) => {
        const consulta = `[out:json][timeout:25];
(
  nwr(around:${raioMetros},${lat},${lon})["healthcare"~"^(psychologist|psychotherapist)$"];
  nwr(around:${raioMetros},${lat},${lon})["amenity"="psychotherapist"];
  nwr(around:${raioMetros},${lat},${lon})["office"~"^(psychologist|psychotherapist)$"];
);
out center tags;`;
        const dados = await buscarJson("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: `data=${encodeURIComponent(consulta)}`
        });
        return Array.isArray(dados.elements) ? dados.elements : [];
    };

    const coordenadasDoLocal = (local) => {
        const lat = Number(local.lat ?? local.center?.lat);
        const lon = Number(local.lon ?? local.center?.lon);
        return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
    };

    const categoriaDoLocal = (tags) => {
        const tipo = tags.healthcare || tags.amenity || tags.office;
        return /psychologist/i.test(tipo || "") ? "Psicólogo(a)" : "Psicoterapeuta";
    };

    const regiaoDoLocal = (tags, fallback) => tags["addr:neighbourhood"]
        || tags["addr:suburb"]
        || tags["addr:city"]
        || tags["addr:town"]
        || tags["addr:village"]
        || fallback;

    const especialidadeDoLocal = (tags) => tags["healthcare:speciality"]
        || tags.speciality
        || "Não informada publicamente";

    const obterLocalizacaoCadastrada = async () => {
        if (!perfilProfissional) return null;
        const consulta = [perfilProfissional.cidade, perfilProfissional.estado, "Brasil"]
            .filter(Boolean)
            .join(", ");
        const coordenadas = await obterCoordenadas(consulta);
        if (!coordenadas) {
            throw new Error("A cidade do cadastro profissional não foi encontrada no mapa.");
        }
        return coordenadas;
    };

    const dadosPublicosProfissional = (coordenadas, centro) => {
        if (!perfilProfissional || !coordenadas) return null;
        const nome = String(perfilProfissional.nomeSocial || perfilProfissional.nome || "Profissional").trim();
        const especialidades = String(perfilProfissional.especialidades || "").trim();
        const abordagem = String(perfilProfissional.abordagem || "").trim();
        const formacao = [
            [perfilProfissional.faculdade, perfilProfissional.anoFormacao].filter(Boolean).join(" · "),
            perfilProfissional.posGraduacao
        ].filter(Boolean).join(" — ");
        return {
            nome,
            categoria: String(perfilProfissional.profissao || "Profissional de saúde").trim(),
            especialidade: [abordagem, especialidades].filter(Boolean).join(" · ") || "Atuação não informada",
            regiao: [perfilProfissional.cidade, perfilProfissional.estado].filter(Boolean).join(", "),
            distancia: distanciaEntre(centro.lat, centro.lon, coordenadas.lat, coordenadas.lon),
            lat: coordenadas.lat,
            lon: coordenadas.lon,
            formacao,
            modalidade: String(perfilProfissional.modalidade || "").trim(),
            disponibilidade: String(perfilProfissional.disponibilidade || "").trim(),
            apresentacao: String(perfilProfissional.bio || "").trim(),
            cadastrado: true
        };
    };

    const normalizarNome = (nome) => String(nome || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLocaleLowerCase("pt-BR");

    const arredondarDistancia = (metros) => Math.max(500, Math.round(metros / 500) * 500);

    const deslocarMarcador = (lat, lon, id) => {
        const hash = String(id).split("").reduce((total, caractere) => total * 31 + caractere.charCodeAt(0), 7);
        const angulo = (Math.abs(hash) % 360) * Math.PI / 180;
        const metros = 180 + Math.abs(hash >> 3) % 220;
        const deltaLat = (metros * Math.cos(angulo)) / 111320;
        const deltaLon = (metros * Math.sin(angulo)) / (111320 * Math.cos(lat * Math.PI / 180));
        return [lat + deltaLat, lon + deltaLon];
    };

    const abrirPerfil = (indice) => {
        const profissional = marcadoresPorIndice.get(indice);
        if (!profissional) return;
        document.getElementById("localizacaoPerfilNome").textContent = profissional.nome;
        document.getElementById("localizacaoPerfilProfissao").textContent = profissional.categoria;
        document.getElementById("localizacaoPerfilEspecialidade").textContent = profissional.especialidade;
        document.getElementById("localizacaoPerfilRegiao").textContent = profissional.regiao;
        document.getElementById("localizacaoPerfilDistancia").textContent = profissional.cadastrado
            ? profissional.distancia < 1000
                ? "Mesma região aproximada"
                : `${formatarDistancia(profissional.distancia)} entre regiões`
            : formatarDistancia(profissional.distancia);
        const detalhes = [
            ["Formacao", profissional.formacao],
            ["Modalidade", profissional.modalidade],
            ["Disponibilidade", profissional.disponibilidade]
        ];
        detalhes.forEach(([campo, valor]) => {
            const linha = document.getElementById(`localizacaoPerfil${campo}Linha`);
            const conteudo = document.getElementById(`localizacaoPerfil${campo}`);
            linha.hidden = !valor;
            conteudo.textContent = valor || "";
        });
        const apresentacao = document.getElementById("localizacaoPerfilApresentacao");
        apresentacao.textContent = profissional.apresentacao || "";
        apresentacao.hidden = !profissional.apresentacao;
        if (!perfilDialog.open) perfilDialog.showModal();
    };

    const renderizarLocais = (locais, centro, perfilCadastrado) => {
        const unicos = new Map();
        locais.forEach((local) => {
            const coordenadas = coordenadasDoLocal(local);
            if (!coordenadas) return;
            const tags = local.tags || {};
            const distancia = distanciaEntre(centro.lat, centro.lon, coordenadas.lat, coordenadas.lon);
            if (distancia > raioMetros) return;
            unicos.set(`${local.type}/${local.id}`, { local, tags, ...coordenadas, distancia });
        });
        if (perfilCadastrado && perfilCadastrado.distancia <= raioMetros) {
            const id = `cadastro/${perfilProfissional.email || perfilCadastrado.nome}`;
            const nomeCadastrado = normalizarNome(perfilCadastrado.nome);
            const correspondente = [...unicos.values()].find(({ tags }) => (
                tags.name && normalizarNome(tags.name) === nomeCadastrado
            ));
            if (correspondente) {
                correspondente.perfil = perfilCadastrado;
            } else {
                unicos.set(id, {
                    local: { type: "cadastro", id },
                    tags: {
                        name: perfilCadastrado.nome,
                        speciality: perfilCadastrado.especialidade,
                        profession: perfilCadastrado.categoria
                    },
                    lat: perfilCadastrado.lat,
                    lon: perfilCadastrado.lon,
                    distancia: perfilCadastrado.distancia,
                    perfil: perfilCadastrado
                });
            }
        }
        const disponiveis = [...unicos.values()]
            .sort((a, b) => a.distancia - b.distancia)
            .slice(0, 30);
        const profissionaisFiltrados = termoBuscaProfissional
            ? disponiveis.filter(({ tags, perfil }) => {
                const termos = [
                    tags.name,
                    tags["name:pt"],
                    tags.profession,
                    tags["healthcare:speciality"],
                    tags.speciality,
                    perfil?.categoria,
                    perfil?.especialidade,
                    perfil?.abordagem
                ];
                return termos.some((termo) => normalizarNome(termo).includes(normalizarNome(termoBuscaProfissional)));
            })
            : disponiveis;
        const especialidades = [...new Set(profissionaisFiltrados
            .map(({ tags, perfil }) => perfil?.especialidade || especialidadeDoLocal(tags))
            .filter((especialidade) => especialidade !== "Não informada publicamente"))]
            .sort((a, b) => a.localeCompare(b, "pt-BR"));
        let especialidadeSelecionada = filtroEspecialidade?.value || "";

        if (filtroEspecialidade) {
            filtroEspecialidade.replaceChildren(new Option("Todas", ""));
            especialidades.forEach((especialidade) => {
                filtroEspecialidade.add(new Option(especialidade, especialidade));
            });
            if (especialidades.includes(especialidadeSelecionada)) {
                filtroEspecialidade.value = especialidadeSelecionada;
            } else {
                especialidadeSelecionada = "";
            }
        }

        const distanciaMaxima = Number(filtroDistancia?.value || raioMetros / 1000) * 1000;
        const ordenados = profissionaisFiltrados.filter(({ distancia, tags, perfil }) => (
            distancia <= distanciaMaxima
            && (!especialidadeSelecionada
                || (perfil?.especialidade || especialidadeDoLocal(tags)).toLocaleLowerCase("pt-BR")
                    === especialidadeSelecionada.toLocaleLowerCase("pt-BR"))
        ));

        camadaMarcadores.clearLayers();
        marcadoresPorIndice.clear();

        const filtroAplicado = especialidadeSelecionada
            ? ` · ${especialidadeSelecionada}`
            : "";
        const buscaAplicada = termoBuscaProfissional ? ` para "${termoBuscaProfissional}"` : "";
        resumo.textContent = `${ordenados.length} ${ordenados.length === 1 ? "profissional encontrado" : "profissionais encontrados"}${buscaAplicada} em até ${distanciaMaxima / 1000} km${filtroAplicado}`;
        if (!ordenados.length) {
            if (termoBuscaProfissional && !profissionaisFiltrados.length) {
                mostrarVazio(
                    "Nenhum profissional corresponde à pesquisa",
                    "Tente outro nome ou termo de especialidade."
                );
            } else if (!disponiveis.length) {
                mostrarVazio(
                    "Nenhum local mapeado por perto",
                    "Tente buscar outra cidade ou bairro. A base do mapa pode não ter todos os profissionais da região."
                );
            } else {
                mostrarVazio(
                    "Nenhum local corresponde aos filtros",
                    "Aumente a distância ou escolha outra especialidade."
                );
            }
            return;
        }

        const profissionais = ordenados.map(({ local, tags, lat, lon, distancia, perfil }, indice) => {
            const nome = tags.name || tags["name:pt"] || "Profissional de saúde mental";
            const categoria = perfil?.categoria || tags.profession || categoriaDoLocal(tags);
            const regiao = perfil?.regiao || regiaoDoLocal(tags, "Região próxima ao ponto de busca");
            const especialidade = perfil?.especialidade || especialidadeDoLocal(tags);
            const distanciaAproximada = arredondarDistancia(distancia);
            const marcador = deslocarMarcador(lat, lon, `${local.type}/${local.id}`);
            const profissional = {
                indice,
                nome,
                categoria,
                regiao,
                especialidade,
                distancia: distanciaAproximada,
                lat: marcador[0],
                lon: marcador[1],
                formacao: perfil?.formacao || "",
                modalidade: perfil?.modalidade || "",
                disponibilidade: perfil?.disponibilidade || "",
                apresentacao: perfil?.apresentacao || "",
                cadastrado: Boolean(perfil)
            };
            marcadoresPorIndice.set(indice, profissional);
            return profissional;
        });

        resultados.innerHTML = profissionais.map(({ indice, nome, categoria, regiao, especialidade, distancia, cadastrado }) => {
            const distanciaTexto = cadastrado && distancia < 1000
                ? "Mesma região"
                : `~${esc(formatarDistancia(distancia))}${cadastrado ? " entre regiões" : ""}`;
            return `<article class="cm-location-result">
                <div class="cm-location-result-icon"><i class="fa-solid fa-user-doctor" aria-hidden="true"></i></div>
                <div class="cm-location-result-content">
                    <div class="cm-location-result-heading">
                        <div>
                            <h3>${esc(nome)}</h3>
                            <span class="cm-location-specialty">${esc(categoria)} · ${esc(especialidade)}</span>
                        </div>
                        <span class="cm-location-distance">${distanciaTexto}</span>
                    </div>
                    <p class="cm-location-address">${esc(regiao)} · ${cadastrado ? "cidade informada no cadastro" : "localização aproximada"}</p>
                    <button type="button" class="cm-location-show-map" data-location-profile="${indice}">
                        <i class="fa-solid fa-map-location-dot" aria-hidden="true"></i>Ver no mapa
                    </button>
                    <button type="button" class="cm-location-profile-button" data-location-profile="${indice}">
                        Ver perfil
                    </button>
                </div>
            </article>`;
        }).join("");

        profissionais.forEach((profissional) => {
            const marcador = window.L.marker([profissional.lat, profissional.lon], {
                title: `${profissional.nome} — localização aproximada`,
                alt: `${profissional.categoria}, localização aproximada`
            });
            const popup = `<div class="cm-location-popup">
                <strong>${esc(profissional.nome)}</strong>
                <span>${esc(profissional.categoria)}</span>
                <span>Especialidade: ${esc(profissional.especialidade)}</span>
                <span>Região aproximada: ${esc(profissional.regiao)}</span>
                <span>${profissional.cadastrado ? "Distância aproximada entre regiões" : "Distância aproximada"}: ${profissional.cadastrado && profissional.distancia < 1000 ? "mesma região" : `~${esc(formatarDistancia(profissional.distancia))}`}</span>
                <button type="button" data-location-profile="${profissional.indice}">Ver perfil</button>
            </div>`;
            marcador.bindPopup(popup).addTo(camadaMarcadores);
            marcadoresPorIndice.get(profissional.indice).marcadorLeaflet = marcador;
        });

        resultados.querySelectorAll("[data-location-profile]").forEach((botao) => {
            botao.addEventListener("click", () => {
                const profissional = marcadoresPorIndice.get(Number(botao.dataset.locationProfile));
                if (!profissional) return;
                if (botao.classList.contains("cm-location-show-map")) {
                    mapaLeaflet.setView([profissional.lat, profissional.lon], 15);
                    profissional.marcadorLeaflet.openPopup();
                    return;
                }
                abrirPerfil(profissional.indice);
            });
        });
        mapaLeaflet.fitBounds(window.L.latLngBounds([
            [centro.lat - 0.23, centro.lon - 0.28],
            [centro.lat + 0.23, centro.lon + 0.28]
        ]), { padding: [12, 12], maxZoom: 10 });
        mapaLeaflet.invalidateSize();
    };

    const aplicarFiltros = () => {
        if (ultimosLocais && ultimoCentro) {
            renderizarLocais(ultimosLocais, ultimoCentro, ultimoPerfilCadastrado);
        }
    };

    filtroDistancia?.addEventListener("change", aplicarFiltros);
    filtroEspecialidade?.addEventListener("change", aplicarFiltros);

    const pesquisaEncontraProfissional = (consulta) => {
        const termo = normalizarNome(consulta);
        if (!termo || !ultimosLocais || !ultimoCentro) return false;
        const combina = (valores) => valores.some((valor) => normalizarNome(valor).includes(termo));
        const correspondeNosLocais = ultimosLocais.some((local) => {
            const tags = local.tags || {};
            return combina([
                tags.name,
                tags["name:pt"],
                tags.profession,
                tags["healthcare:speciality"],
                tags.speciality
            ]);
        });
        const correspondeNoCadastro = perfilProfissional && combina([
            perfilProfissional.nome,
            perfilProfissional.nomeSocial,
            perfilProfissional.profissao,
            perfilProfissional.especialidades,
            perfilProfissional.abordagem
        ]);
        return correspondeNosLocais || Boolean(correspondeNoCadastro);
    };

    document.addEventListener("click", (evento) => {
        const botao = evento.target.closest(".cm-location-popup [data-location-profile]");
        if (botao) abrirPerfil(Number(botao.dataset.locationProfile));
    });

    const pesquisarCoordenadas = async (centro, descricao, prefixo = "") => {
        ultimosLocais = null;
        ultimoCentro = null;
        ultimoPerfilCadastrado = null;
        try {
            const centroAproximado = {
                lat: Number(centro.lat.toFixed(2)),
                lon: Number(centro.lon.toFixed(2))
            };
            atualizarMapa(centroAproximado.lat, centroAproximado.lon, `${descricao} · região aproximada`);
            resumo.textContent = "Buscando locais próximos…";
            mostrarVazio("Buscando profissionais", "Estamos consultando os cadastros disponíveis e os locais públicos desta região.");
            mostrarEstado(`${prefixo}Consultando locais de saúde mental em até 25 km…`);
            let locais = [];
            let erroLocaisPublicos = false;
            try {
                locais = await obterLocais(centroAproximado.lat, centroAproximado.lon);
            } catch (erro) {
                console.error("Não foi possível buscar locais públicos de atendimento próximos.", erro);
                erroLocaisPublicos = true;
            }
            let perfilCadastrado = null;
            let erroLocalizacaoCadastro = false;
            if (perfilProfissional) {
                try {
                    const coordenadasCadastro = await obterLocalizacaoCadastrada();
                    perfilCadastrado = dadosPublicosProfissional(coordenadasCadastro, centroAproximado);
                } catch (erro) {
                    console.error("Não foi possível localizar o cadastro profissional no mapa.", erro);
                    erroLocalizacaoCadastro = true;
                }
            }
            ultimosLocais = locais;
            ultimoCentro = centroAproximado;
            ultimoPerfilCadastrado = perfilCadastrado;
            renderizarLocais(locais, centroAproximado, perfilCadastrado);
            const avisos = [];
            if (erroLocaisPublicos) avisos.push("Não foi possível carregar os locais públicos do mapa.");
            if (erroLocalizacaoCadastro) avisos.push("Não foi possível mapear a cidade informada no cadastro profissional.");
            mostrarEstado(`${prefixo}Busca concluída. Distâncias aproximadas a partir de ${descricao}.${avisos.length ? ` ${avisos.join(" ")}` : ""}`);
        } catch (erro) {
            console.error("Não foi possível exibir os resultados da busca por localização.", erro);
            resumo.textContent = "Não foi possível carregar os resultados.";
            mostrarVazio("Busca temporariamente indisponível", "Tente novamente em alguns instantes.");
            mostrarEstado("Não foi possível exibir os resultados da busca. Verifique sua conexão e tente novamente.");
        }
    };

    const pesquisarPorTexto = async (consulta, prefixo = "") => {
        const texto = consulta.trim();
        if (!texto) {
            mostrarEstado("Informe uma cidade ou bairro para iniciar a busca.");
            busca.focus();
            return;
        }

        ultimosLocais = null;
        ultimoCentro = null;
        ultimoPerfilCadastrado = null;
        mostrarEstado(`${prefixo}Localizando a região pesquisada…`);
        resumo.textContent = "Localizando a região…";
        try {
            const centro = await obterCoordenadas(texto);
            if (!centro) {
                resumo.textContent = "Região não encontrada.";
                mostrarVazio("Não encontramos essa região", "Confira o nome da cidade ou bairro e tente novamente.");
                mostrarEstado("Não encontramos essa região no mapa.");
                return;
            }
            await pesquisarCoordenadas(
                centro,
                texto,
                prefixo
            );
        } catch (erro) {
            console.error("Não foi possível localizar a região pesquisada.", erro);
            resumo.textContent = "Não foi possível localizar a região.";
            mostrarVazio("Busca temporariamente indisponível", "Tente novamente em alguns instantes.");
            mostrarEstado("Não foi possível consultar o serviço de mapas. Verifique sua conexão e tente novamente.");
        }
    };

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();
        if (pesquisaEncontraProfissional(busca.value)) {
            termoBuscaProfissional = busca.value.trim();
            renderizarLocais(ultimosLocais, ultimoCentro, ultimoPerfilCadastrado);
            mostrarEstado(`Exibindo profissionais correspondentes a "${termoBuscaProfissional}".`);
            return;
        }
        termoBuscaProfissional = "";
        pesquisarPorTexto(busca.value);
    });

    const pesquisarLocalSalvo = () => {
        if (localSalvo && !buscaPerfilIniciada) {
            buscaPerfilIniciada = true;
            pesquisarPorTexto(localSalvo, "Usando a cidade e o estado salvos no seu perfil. ");
        }
    };

    document.querySelectorAll('.cm-side-item[data-secao="localizacao"]').forEach((botao) => {
        botao.addEventListener("click", pesquisarLocalSalvo);
    });

    if (botaoAtual) {
        botaoAtual.addEventListener("click", () => {
            if (!navigator.geolocation) {
                mostrarEstado("Este navegador não permite acessar a localização. Você ainda pode buscar por cidade ou bairro.");
                if (localSalvo) pesquisarPorTexto(localSalvo, "Localização do dispositivo indisponível. ");
                return;
            }

            botaoAtual.disabled = true;
            mostrarEstado("Aguardando permissão para acessar sua localização…");
            navigator.geolocation.getCurrentPosition(
                (posicao) => {
                    botaoAtual.disabled = false;
                    pesquisarCoordenadas({
                        lat: posicao.coords.latitude,
                        lon: posicao.coords.longitude
                    }, "sua localização aproximada");
                },
                (erro) => {
                    botaoAtual.disabled = false;
                    const motivo = erro.code === erro.PERMISSION_DENIED
                        ? "A permissão de localização foi negada."
                        : "Não foi possível acessar a localização do dispositivo.";
                    if (localSalvo) {
                        pesquisarPorTexto(localSalvo, `${motivo} Usando a cidade e o estado salvos no seu perfil. `);
                    } else {
                        mostrarEstado(`${motivo} Você pode buscar por cidade ou bairro.`);
                    }
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
            );
        });
    }
});
