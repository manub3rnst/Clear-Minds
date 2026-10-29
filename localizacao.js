/* ==========================================
   CLEAR MINDS — LOCALIZAÇÃO
   ==========================================
   Mapa e busca de profissionais com a API
   JavaScript do Google Maps + Places.

   CONFIGURAÇÃO OBRIGATÓRIA
   ------------------------
   Substitua o valor abaixo pela sua chave da
   API do Google Maps. No Google Cloud, habilite
   "Maps JavaScript API" e "Places API" para a
   chave e restrinja os domínios autorizados.

   Nenhuma chave é fornecida junto com o projeto.
   ========================================== */

const GOOGLE_MAPS_API_KEY = "COLE_SUA_CHAVE_DA_API_GOOGLE_MAPS_AQUI";
const GOOGLE_MAPS_LIBRARIES = "places";

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
    const centroPadrao = { lat: -15.793889, lon: -47.882778 };
    let mapaGoogle = null;
    let servicoLocais = null;
    let geocodificador = null;
    let infoWindow = null;
    let circuloBusca = null;
    let marcadoresGoogle = [];
    let promessaGoogleMaps = null;
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

    const chaveMapaConfigurada = () => Boolean(GOOGLE_MAPS_API_KEY)
        && !/^COLE_SUA_CHAVE/i.test(GOOGLE_MAPS_API_KEY);

    const mensagemErroMapa = (erro) => {
        if (erro && erro.message === "CHAVE_NAO_CONFIGURADA") {
            return "O mapa ainda não está disponível nesta versão. Tente novamente mais tarde.";
        }
        return "Não foi possível carregar o mapa agora. Verifique sua conexão e tente novamente.";
    };

    /** Substitui a área do mapa por um aviso quando a API não está disponível. */
    const mostrarMapaIndisponivel = (mensagem) => {
        if (!mapa) return;
        mapa.classList.add("is-unavailable");
        mapa.setAttribute("aria-label", "Mapa indisponível");
        mapa.innerHTML = `<iframe title="Mapa demonstrativo da região de Brasília" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.openstreetmap.org/export/embed.html?bbox=-47.94%2C-15.83%2C-47.82%2C-15.75&layer=mapnik&marker=-15.793889%2C-47.882778"></iframe><div class="cm-location-map-fallback"><strong>Mapa demonstrativo</strong><span>${esc(mensagem)} Os resultados exibidos usam localização de exemplo.</span></div>`;
    };

    /** Carrega a API JavaScript do Google Maps uma única vez. */
    const carregarGoogleMaps = () => {
        if (promessaGoogleMaps) return promessaGoogleMaps;
        promessaGoogleMaps = new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
                return;
            }
            if (!chaveMapaConfigurada()) {
                reject(new Error("CHAVE_NAO_CONFIGURADA"));
                return;
            }
            const nomeCallback = "__cmGoogleMapsCallback";
            window[nomeCallback] = () => {
                try { delete window[nomeCallback]; } catch { /* ignora */ }
                resolve(window.google.maps);
            };
            const script = document.createElement("script");
            script.src = "https://maps.googleapis.com/maps/api/js"
                + `?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`
                + `&libraries=${GOOGLE_MAPS_LIBRARIES}`
                + "&language=pt-BR&region=BR&loading=async"
                + `&callback=${nomeCallback}`;
            script.async = true;
            script.defer = true;
            script.onerror = () => reject(new Error("FALHA_AO_CARREGAR"));
            document.head.appendChild(script);
        });
        return promessaGoogleMaps;
    };

    const garantirMapa = async () => {
        await carregarGoogleMaps();
        if (!mapaGoogle) {
            mapaGoogle = new google.maps.Map(mapa, {
                center: { lat: centroPadrao.lat, lng: centroPadrao.lon },
                zoom: 4,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                clickableIcons: false,
                gestureHandling: "cooperative"
            });
            infoWindow = new google.maps.InfoWindow({ maxWidth: 320 });
            servicoLocais = new google.maps.places.PlacesService(mapaGoogle);
            geocodificador = new google.maps.Geocoder();
        }
        return mapaGoogle;
    };

    const limparMarcadores = () => {
        marcadoresGoogle.forEach((marcador) => {
            google.maps.event.clearInstanceListeners(marcador);
            marcador.setMap(null);
        });
        marcadoresGoogle = [];
        if (infoWindow) infoWindow.close();
    };

    const atualizarMapa = async (lat, lon, descricao) => {
        await garantirMapa();
        limparMarcadores();
        if (circuloBusca) {
            circuloBusca.setMap(null);
            circuloBusca = null;
        }
        const centro = { lat, lng: lon };
        mapaGoogle.setCenter(centro);
        mapaGoogle.setZoom(12);
        circuloBusca = new google.maps.Circle({
            center: centro,
            radius: 900,
            strokeColor: "#356B78",
            strokeOpacity: 0.65,
            strokeWeight: 2,
            fillColor: "#356B78",
            fillOpacity: 0.1,
            map: mapaGoogle,
            title: "Região de busca aproximada"
        });
        mapaLink.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        mapaDescricao.textContent = descricao;
    };

    const obterCoordenadas = async (consulta) => {
        await garantirMapa();
        return new Promise((resolve, reject) => {
            geocodificador.geocode({
                address: consulta,
                componentRestrictions: { country: "BR" },
                language: "pt-BR",
                region: "BR"
            }, (locais, situacao) => {
                if (situacao === google.maps.GeocoderStatus.ZERO_RESULTS) {
                    resolve(null);
                    return;
                }
                if (situacao !== google.maps.GeocoderStatus.OK || !locais || !locais.length) {
                    reject(new Error(`Geocoding: ${situacao}`));
                    return;
                }
                const local = locais[0];
                resolve({
                    lat: local.geometry.location.lat(),
                    lon: local.geometry.location.lng(),
                    descricao: local.formatted_address || consulta
                });
            });
        });
    };

    const obterLocais = async (lat, lon) => {
        await garantirMapa();
        return new Promise((resolve, reject) => {
            servicoLocais.nearbySearch({
                location: { lat, lng: lon },
                radius: raioMetros,
                keyword: "psicólogo psicoterapeuta saúde mental",
                language: "pt-BR"
            }, (locais, situacao) => {
                if (situacao === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resolve([]);
                    return;
                }
                if (situacao !== google.maps.places.PlacesServiceStatus.OK || !Array.isArray(locais)) {
                    reject(new Error(`Places: ${situacao}`));
                    return;
                }
                resolve(locais.slice(0, 40).map((local) => {
                    const posicao = local.geometry.location;
                    return {
                        id: `google/${local.place_id || local.name}`,
                        nome: local.name || "Profissional de saúde mental",
                        categoria: "Profissional de saúde",
                        especialidade: "Atuação não informada publicamente",
                        regiao: local.vicinity || local.formatted_address || "Região próxima ao ponto de busca",
                        lat: posicao.lat(),
                        lon: posicao.lng()
                    };
                }));
            });
        });
    };

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

    const especialidadeValida = (valor) => Boolean(valor)
        && valor !== "Atuação não informada"
        && valor !== "Atuação não informada publicamente"
        && valor !== "Não informada publicamente";

    const renderizarLocais = (locais, centro, perfilCadastrado) => {
        const unicos = new Map();
        (locais || []).forEach((local) => {
            const lat = Number(local.lat);
            const lon = Number(local.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
            const distancia = distanciaEntre(centro.lat, centro.lon, lat, lon);
            if (distancia > raioMetros) return;
            unicos.set(local.id, { ...local, lat, lon, distancia });
        });
        if (perfilCadastrado && perfilCadastrado.distancia <= raioMetros) {
            const id = `cadastro/${perfilProfissional.email || perfilCadastrado.nome}`;
            const nomeCadastrado = normalizarNome(perfilCadastrado.nome);
            const correspondente = [...unicos.values()].find((item) => (
                normalizarNome(item.nome) === nomeCadastrado
            ));
            if (correspondente) {
                correspondente.perfil = perfilCadastrado;
            } else {
                unicos.set(id, {
                    id,
                    nome: perfilCadastrado.nome,
                    categoria: perfilCadastrado.categoria,
                    especialidade: perfilCadastrado.especialidade,
                    regiao: perfilCadastrado.regiao,
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
            ? disponiveis.filter((item) => {
                const termos = [
                    item.nome,
                    item.categoria,
                    item.especialidade,
                    item.regiao,
                    item.perfil?.categoria,
                    item.perfil?.especialidade
                ];
                return termos.some((termo) => normalizarNome(termo).includes(normalizarNome(termoBuscaProfissional)));
            })
            : disponiveis;
        const especialidades = [...new Set(profissionaisFiltrados
            .map((item) => item.perfil?.especialidade || item.especialidade)
            .filter(especialidadeValida))]
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
        const ordenados = profissionaisFiltrados.filter((item) => {
            const especialidade = item.perfil?.especialidade || item.especialidade;
            return item.distancia <= distanciaMaxima
                && (!especialidadeSelecionada
                    || String(especialidade).toLocaleLowerCase("pt-BR")
                        === especialidadeSelecionada.toLocaleLowerCase("pt-BR"));
        });

        limparMarcadores();
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

        const profissionais = ordenados.map((item, indice) => {
            const [lat, lon] = deslocarMarcador(item.lat, item.lon, item.id);
            const profissional = {
                indice,
                nome: item.nome,
                categoria: item.perfil?.categoria || item.categoria,
                regiao: item.perfil?.regiao || item.regiao,
                especialidade: item.perfil?.especialidade || item.especialidade,
                distancia: arredondarDistancia(item.distancia),
                lat,
                lon,
                formacao: item.perfil?.formacao || "",
                modalidade: item.perfil?.modalidade || "",
                disponibilidade: item.perfil?.disponibilidade || "",
                apresentacao: item.perfil?.apresentacao || "",
                cadastrado: Boolean(item.perfil)
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

        const iconeMarcador = {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">'
                + '<path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 25 17 25s17-12.2 17-25C34 7.6 26.4 0 17 0Z" fill="#356B78"/>'
                + '<circle cx="17" cy="16.5" r="6.5" fill="#F7F5F0"/></svg>'
            ),
            scaledSize: new google.maps.Size(34, 42),
            anchor: new google.maps.Point(17, 42)
        };

        profissionais.forEach((profissional) => {
            const marcador = new google.maps.Marker({
                position: { lat: profissional.lat, lng: profissional.lon },
                map: mapaGoogle,
                title: `${profissional.nome} — localização aproximada`,
                icon: iconeMarcador
            });
            const popup = `<div class="cm-location-popup">
                <strong>${esc(profissional.nome)}</strong>
                <span>${esc(profissional.categoria)}</span>
                <span>Especialidade: ${esc(profissional.especialidade)}</span>
                <span>Região aproximada: ${esc(profissional.regiao)}</span>
                <span>${profissional.cadastrado ? "Distância aproximada entre regiões" : "Distância aproximada"}: ${profissional.cadastrado && profissional.distancia < 1000 ? "mesma região" : `~${esc(formatarDistancia(profissional.distancia))}`}</span>
                <button type="button" data-location-profile="${profissional.indice}">Ver perfil</button>
            </div>`;
            marcador.addListener("click", () => {
                infoWindow.setContent(popup);
                infoWindow.open({ anchor: marcador, map: mapaGoogle });
            });
            profissional.marcadorGoogle = marcador;
            marcadoresGoogle.push(marcador);
        });

        resultados.querySelectorAll("[data-location-profile]").forEach((botao) => {
            botao.addEventListener("click", () => {
                const profissional = marcadoresPorIndice.get(Number(botao.dataset.locationProfile));
                if (!profissional) return;
                if (botao.classList.contains("cm-location-show-map")) {
                    mapaGoogle.panTo({ lat: profissional.lat, lng: profissional.lon });
                    mapaGoogle.setZoom(15);
                    if (profissional.marcadorGoogle) {
                        google.maps.event.trigger(profissional.marcadorGoogle, "click");
                    }
                    return;
                }
                abrirPerfil(profissional.indice);
            });
        });

        const limites = new google.maps.LatLngBounds();
        limites.extend({ lat: centro.lat - 0.23, lng: centro.lon - 0.28 });
        limites.extend({ lat: centro.lat + 0.23, lng: centro.lon + 0.28 });
        mapaGoogle.fitBounds(limites, 12);
        google.maps.event.addListenerOnce(mapaGoogle, "idle", () => {
            if (mapaGoogle.getZoom() > 10) mapaGoogle.setZoom(10);
        });
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
        const correspondeNosLocais = ultimosLocais.some((local) => combina([
            local.nome,
            local.categoria,
            local.especialidade,
            local.regiao
        ]));
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
        const centroAproximado = {
            lat: Number(centro.lat.toFixed(2)),
            lon: Number(centro.lon.toFixed(2))
        };
        try {
            await atualizarMapa(
                centroAproximado.lat,
                centroAproximado.lon,
                `${descricao} · região aproximada`
            );
        } catch (erro) {
            console.error("Não foi possível carregar o mapa do Google.", erro);
            const mensagem = mensagemErroMapa(erro);
            resumo.textContent = "Mapa indisponível.";
            mostrarMapaIndisponivel(mensagem);
            mostrarVazio("Mapa indisponível", mensagem);
            mostrarEstado(`${prefixo}${mensagem}`);
            return;
        }
        try {
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
            const mensagem = erro && (erro.message === "CHAVE_NAO_CONFIGURADA" || erro.message === "FALHA_AO_CARREGAR")
                ? mensagemErroMapa(erro)
                : "Não foi possível consultar o serviço de mapas. Verifique sua conexão e tente novamente.";
            resumo.textContent = "Não foi possível localizar a região.";
            mostrarVazio("Busca temporariamente indisponível", mensagem);
            mostrarEstado(mensagem);
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

    const mostrarMapaInicial = async () => {
        try {
            await garantirMapa();
            google.maps.event.trigger(mapaGoogle, "resize");
            mapaGoogle.setCenter({ lat: centroPadrao.lat, lng: centroPadrao.lon });
            mapaGoogle.setZoom(4);
            mapaDescricao.textContent = "Pesquise uma cidade ou use sua localização atual.";
            mapaLink.href = "https://www.google.com/maps";
        } catch (erro) {
            console.error("Não foi possível carregar o mapa do Google.", erro);
            const mensagem = mensagemErroMapa(erro);
            resumo.textContent = "Mapa indisponível.";
            mostrarMapaIndisponivel(mensagem);
            mostrarVazio("Mapa indisponível", mensagem);
            mostrarEstado(mensagem);
        }
    };

    const pesquisarLocalSalvo = () => {
        if (localSalvo && !buscaPerfilIniciada) {
            buscaPerfilIniciada = true;
            pesquisarPorTexto(localSalvo, "Usando a cidade e o estado salvos no seu perfil. ");
            return;
        }
        if (mapaGoogle) {
            google.maps.event.trigger(mapaGoogle, "resize");
            return;
        }
        mostrarMapaInicial();
    };

    document.querySelectorAll('.cm-side-item[data-secao="localizacao"]').forEach((botao) => {
        botao.addEventListener("click", () => {
            window.setTimeout(pesquisarLocalSalvo, 220);
        });
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
