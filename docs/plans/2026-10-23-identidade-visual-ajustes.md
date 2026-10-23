# Identidade visual azul-petróleo e ajustes de experiência

- **Data:** 2026-10-23
- **Projeto:** Clear Minds
- **Status:** implementado (pendente apenas a chave do Google Maps)

## Objetivo

Aplicar a nova identidade visual azul-petróleo em todas as páginas do site e concluir cinco ajustes
de experiência solicitados:

1. Manter o seletor de tema apenas em Configurações.
2. Tornar o login e o cadastro profissional mais profissionais, com acesso por Google e Microsoft.
3. Exibir um mapa real do Google Maps na seção Localização do paciente.
4. Aumentar apenas a primeira seção da Home do paciente.
5. Substituir "Sair da conta" por "Excluir conta", com modal de confirmação.

## Identidade visual

Paleta adotada em todo o sistema:

| Token | Cor |
| --- | --- |
| Primária | `#264653` |
| Secundária | `#356B78` |
| Azul acinzentado | `#D9E5E7` |
| Lavanda de apoio | `#DCD8EA` |
| Fundo creme | `#F7F5F0` |
| Branco | `#FFFFFF` |
| Texto | `#263238` |
| Neutros | `#52676B`, `#E3EBEB`, `#EEF3F3` |
| Escuros | `#1F3A42`, `#14272B`, `#2B444A` |

Os blocos finais de sobreposição em `style.css` continuam sendo a fonte de verdade para os
componentes compartilhados; os estilos de página permanecem escopados.

## Alterações realizadas

### 1. Tema somente em Configurações

- Removido o botão de alternância de tema (sol/lua) do painel administrativo
  (`admin/public/admin.html`).
- O tema permanece configurável em `select[data-cfg="tema"]` nas duas Homes e em
  `#cfgTemaEscuro` no admin, com persistência em `cm_config.tema`/`cm_tema` via `tema.js`.

### 2. Login e cadastro profissional

- Adicionado divisor ("ou entrar com" / "ou cadastre-se com") e botões Google/Microsoft em
  `login-profissional.html` e `cadastro-profissional.html`.
- Botões usam `imagem/google.jpg` e `imagem/microsoft.jpg` e o padrão de aviso `data-aviso`
  já existente no projeto (recurso "em breve" no modo protótipo).

### 3. Google Maps na Localização

- `localizacao.js` reescrito para a Google Maps JavaScript API + Places:
  - carregamento dinâmico com `libraries=places`, `language=pt-BR`, `region=BR`;
  - geocodificação de cidade/região, busca de locais de saúde mental em até 25 km,
    `Marker` customizado, `InfoWindow`, `Circle` de privacidade (900 m) e `fitBounds`;
  - link direto para o Google Maps.
- Removidos Leaflet e OpenStreetMap de `home.html`, `home-layout.css` e créditos.
- Quando a chave não está configurada, a interface mostra um estado "Mapa indisponível" neutro
  (sem citar arquivos de código ao usuário) e registra o detalhe técnico no console.
- **Configuração necessária:** preencher `GOOGLE_MAPS_API_KEY` no topo de `localizacao.js` e
  habilitar "Maps JavaScript API" e "Places API" no Google Cloud. Sem a chave, o mapa permanece
  indisponível, mas o restante da seção continua funcional.

### 4. Primeira seção da Home do paciente

- Ajustes escopados em `.home-heading` e `.home-grid` (`home-layout.css`):
  - título `clamp(1.55rem, 2.6vw, 1.8rem)`;
  - subtítulo `.9rem` com `max-width: 760px`;
  - grade `minmax(180px, 215px) minmax(0, 1fr) minmax(240px, 285px)` e `gap: 18px`.
- As demais seções não foram ampliadas.

### 5. Excluir conta

- `#btnCfgSair` substituído por `#btnCfgExcluir` em `home.html` e `home-profissional.html`
  (`cm-btn cm-btn-danger cm-btn-sm`).
- Modal de confirmação com o texto:
  "Ao confirmar a exclusão, sua conta e seus dados serão apagados definitivamente após 30 dias."
- Ações **Cancelar** e **Ciente**; ao confirmar, os dados locais são limpos e o usuário é
  redirecionado para o login correspondente.
- O logout continua disponível pelo item "Sair" da barra lateral.

### 6. Ajustes de consistência

- Configurações: selects de privacidade passaram a usar o mesmo estilo dos selects de aparência
  (seta customizada) nas duas Homes; no mobile (`max-width: 600px`), as linhas de configuração
  empilham o controle abaixo do texto, evitando rótulos espremidos.
- Cores antigas remapeadas em `style.css`, `home-profissional-layout.css`, `pagina-publica.css`,
  `admin/public/admin.css` e `admin/public/admin.js`.

## Validação

- `node --check` em `localizacao.js`, `home.js`, `home-profissional.js`, `tema.js` e
  `admin/public/admin.js`.
- Chaves `{}`/`}` balanceadas nos CSS alterados.
- Screenshots em Chrome headless (Playwright com o Chrome do sistema) revisados em desktop e mobile:
  landing, login/cadastro profissional, Home do paciente (início, configurações, modal de exclusão,
  localização), Home do profissional (início, configurações, modal) e Configurações no mobile.
- Confirmado que não restam referências a Leaflet/OpenStreetMap, a `btnCfgSair` nem ao botão de tema
  no admin.

## Fora de escopo / pendências

- Chave real do Google Maps (bloqueio externo ao código).
- Integração real dos botões Google/Microsoft (mantido o aviso de recurso futuro).
- Exclusão de conta real no servidor: o protótipo limpa o `localStorage`.
