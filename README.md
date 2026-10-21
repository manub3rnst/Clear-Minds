# Clear Minds

Site do TCC "Clear Minds", uma plataforma de apoio à saúde mental de estudantes, com dois tipos de conta: **Estudante** e **Profissional**.

## Fluxo de navegação

```
index.html (página pública)
        |
        +-- Cadastrar --> cadastro-escolha.html
        |                     |
        |                     +-- Estudante ----> cadastro-estudante.html -> formulario.html -> formulario2.html -> home.html
        |                     |
        |                     +-- Profissional -> cadastro-profissional.html -> cadastro-profissional2.html -> home-profissional.html
        |
        +-- Login -----> login-escolha.html
                              |
                              +-- Estudante ----> login.html -> home.html
                              |
                              +-- Profissional -> login-profissional.html -> home-profissional.html
```

- **index.html** (página pública inicial):
  - É a primeira página do site e não exige login. Apresenta o Clear Minds, dados com fontes,
    espaços da plataforma, conteúdos, comunidade, privacidade e o fluxo de uso.
  - No topo, **Cadastrar** leva a `cadastro-escolha.html` e **Login** leva a
    `login-escolha.html`.
  - Os links de conteúdos e "Explorar localização" direcionam para `login-escolha.html`, pois
    essas áreas exigem uma conta.
- **cadastro-escolha.html**: escolha entre conta de Estudante e conta Profissional.
  - Estudante -> `cadastro-estudante.html` (cadastro inicial) -> `formulario.html` (Etapa 1/2)
    -> `formulario2.html` (Etapa 2/2) -> `home.html`.
  - Profissional -> `cadastro-profissional.html` (Etapa 1/2) -> `cadastro-profissional2.html`
    (Etapa 2/2) -> `home-profissional.html`.
- **login-escolha.html**: escolha entre login de Estudante e login Profissional.
  - Estudante -> `login.html` -> `home.html`.
  - Profissional -> `login-profissional.html` -> `home-profissional.html`.
- **cadastro-estudante.html** / `cadastro.js`: cria a conta do Estudante e, ao concluir, segue
  para `formulario.html`.
- **login.html** (Estudante): autentica e vai para `home.html`. O botão "Acessar conta
  profissional" leva para `login-profissional.html`. A troca entre login e cadastro não aparece
  nesta tela; o cadastro é acessado pela página pública (`index.html`).
- **login-profissional.html**: autentica o profissional pelo e-mail e senha cadastrados
  (`cm_profile_profissional`); sem uma conta profissional salva na máquina, exibe aviso para
  cadastrar. **É a única forma de acessar `home-profissional.html`**.
- **formulario.html → formulario2.html**: formulário de perfil do Estudante em 2 etapas.
  A Etapa 2 (bem-estar emocional) é a última: ela inicia a sessão e redireciona para `home.html`.
- **home.html**: painel do Estudante — cabeçalho, menu lateral (Início, Meu diário, Comunidade,
  Meus profissionais, Mensagens, Agenda, Conteúdos, Meu perfil, Configurações), registro de humor
  e diário, **feed da comunidade** como elemento central: criar publicação (com humor opcional),
  curtir, comentar e compartilhar **somente com conexões** (`cm_amizades`). A seção **Conteúdos**
  traz **5 artigos demonstrativos** (autocuidado, ansiedade, sono, amizades e emoções) abrindo em
  um leitor próprio. Sem conexões, o compartilhamento é desabilitado com aviso. Estruturas de dados
  prontas no `localStorage` (sem dados fictícios além dos conteúdos, claramente rotulados como
  informativos).
- **home-profissional.html**: painel do Profissional — cabeçalho, menu lateral (Início, Pacientes,
  Agenda, Conteúdos, Financeiro, Perfil), resumo rápido (pacientes ativos, atendimentos e ganho),
  lista de atividades recentes e **gráfico grande Dia | Mês | Ano** (movimentação de atendimentos e
  ganho líquido), alimentado por `cm_movimentacoes`. Nome e profissão/cargo vêm do cadastro
  profissional.
  - **Pacientes**: lista com busca e adição manual. Inclui um **paciente de demonstração
    claramente marcado** ("Demonstração") com **4 registros fictícios de diário**; o acesso aos
    registros depende da **autorização do paciente** (estados: sem acesso → pendente → liberado),
    e somente pacientes autorizados têm o botão "Ver diário" ativo.
  - **Conteúdos**: **6 materiais demonstrativos** (escuta ativa, ansiedade, confidencialidade,
    registro de evolução, autocuidado do terapeuta e ação em crise) com leitor próprio.
  - **Financeiro**: filtro por período (hoje, semana, mês, ano ou personalizado), 6 cards de
    resumo (recebido, a receber, previsto, despesas, atendimentos e valor médio), extrato com
    entradas/saídas e status, e gráfico Dia | Mês | Ano atualizado sobre o filtro ativo.
  - **Perfil**: apresentação em cards (bio, informações pessoais, registro e formação, atendimento)
    com edição que reflete nos resumos do painel.
- **Avisos de demonstrativo**: botões e links de funcionalidades ainda não implementadas
  (entrar com Google/Microsoft, "Esqueceu sua senha?", Termos de Uso e Política de Privacidade)
  exibem um aviso discreto ("toast") em vez de parecerem inativos, via `utils.js` e `[data-aviso]`.

## Modo de teste (sem back-end)

Todos os formulários funcionam em `MODO_TESTE = true` (ver `cadastro.js`, `script.js`,
`cadastro-profissional.js` e `login-profissional.js`), ou seja, os dados são salvos no
`localStorage` do navegador para simular uma conta e alimentar as páginas internas, sem precisar de
um servidor/back-end. Quando o back-end estiver pronto, basta trocar `MODO_TESTE` para `false`.

Dados de demonstração são semeados automaticamente na primeira visita ao painel profissional
(paciente fictício, diário fictício e 6 conteúdos) e exibidos em `home.html` (5 conteúdos do
Estudante): todos são **claramente fictícios/informativos** e não representam pacientes, registros
ou profissionais reais.

Chaves usadas no `localStorage`:

- `cm_session` — e-mail da sessão ativa (presente em ambos os tipos de conta).
- `cm_tipo` — `"usuario"` ou `"profissional"`, define qual home é exibida.
- `cm_profile` — dados de perfil do Estudante (cadastro + formulário de 2 etapas).
- `cm_profile_profissional` — dados do perfil profissional (nome, profissão/cargo, CRP, e-mail,
  senha, formação, modalidade, abordagem, especialidades, cidade/estado, valor da sessão, etc.).
- `cm_humor_atual` — humor registrado mais recentemente.
- `cm_diario` — registros do diário (do Estudante e do paciente de demonstração, filtrados por autor).
- `cm_postagens` — publicações do feed da comunidade.
- `cm_curtidas` — ids de postagens curtidas pelo usuário logado.
- `cm_amizades` — conexões do usuário (estrutura para compartilhamento futuro).
- `cm_compartilhamentos` — registros de compartilhamento de postagens.
- `cm_profissionais_usuario` — profissionais vinculados ao Estudante.
- `cm_consultas` — consultas/atendimentos agendados do Estudante.
- `cm_pacientes`, `cm_agenda_profissional`, `cm_atividades_profissional`,
  `cm_conteudos_profissional`, `cm_movimentacoes` — dados do painel profissional.
- `cm_solicitacoes_diario` — solicitações de acesso ao diário enviadas (pendentes de autorização).
- `cm_config` — preferências (compartilhamento de diário e notificações).

## Estrutura de arquivos

- `index.html` — Página pública inicial (landing page)
- `pagina-publica.css` — Estilos da página pública e das páginas de escolha de cadastro/login
- `cadastro-escolha.html` — Escolha do tipo de cadastro
- `login-escolha.html` — Escolha do tipo de login
- `cadastro-estudante.html` / `cadastro.js` — Cadastro do Estudante
- `login.html` / `script.js` — Login do Estudante
- `login-profissional.html` / `login-profissional.js` — Login do Profissional
- `cadastro-profissional.html` / `cadastro-profissional.js` — Cadastro profissional (Etapa 1/2)
- `cadastro-profissional2.html` / `cadastro-profissional2.js` — Cadastro profissional (Etapa 2/2)
- `utils.js` — Funções compartilhadas: mostrar/ocultar senha, validação de campos obrigatórios,
  exibição de erros de formulário e avisos de demonstração (`[data-aviso]`)
- `formulario.html` / `formulario1.js` — Informações pessoais (Etapa 1, Estudante)
- `formulario2.html` / `formulario2.js` — Bem-estar emocional (Etapa 2, Estudante, última etapa)
- `home.html` / `home.js` / `home-layout.css` — Página inicial do Estudante (sidebar + comunidade/diário)
- `home-profissional.html` / `home-profissional.js` / `home-profissional-layout.css` — Painel do
  Profissional (sidebar + gráfico)
- `style.css` — Estilos base e das páginas internas
- `login-layout.css` — Estilos específicos das telas de login/cadastro
- `tema.css` / `tema.js` — Tema escuro e preferências visuais
- `localizacao.js` — Mapa e recursos de localização usados nas Homes
- `imagem/` — Imagens e logotipo
- `admin/` — API e painel administrativo do projeto (documentação em `admin/README.md`)

## Melhorias realizadas nesta revisão

- **Login profissional separado** (`login-profissional.html`): profissionais só acessam a home
  com e-mail e senha válidos; sem isso, são redirecionados para o login. Antes havia acesso direto
  à `home-profissional.html` sem autenticação.
- **Cadastro profissional em 2 etapas**: Etapa 1 (identificação, formação e acesso) + Etapa 2
  (atuação, localização, contato e verificação), com progresso "Etapa X de 2". Inclui novos campos
  de profissão/cargo, e-mail e senha (com toggle de exibição).
- **Formulário do Estudante reduzido a 2 etapas**: `formulario3.html`/`formulario3.js` (Preferências)
  foram **removidos**; a Etapa 2 agora conclui o cadastro e segue direto para `home.html`.
- **Homes com menu lateral**: `home.html` e `home-profissional.html` agora usam layout com sidebar
  e troca de seções sem recarregar, mantendo só os menus que correspondem a funcionalidades reais.
- **Comunidade no home do Estudante**: feed central com criar publicação, curtir, comentar e
  compartilhar apenas com conexões (`cm_amizades`).
- **Gráfico profissional Dia | Mês | Ano**: painel financeiro grande com movimentação (contagem de
  atendimentos) e ganho líquido por período, a partir de `cm_movimentacoes`.
- **Correção do ícone de olho**: todos os botões de mostrar/ocultar senha usam a classe `.toggle-btn`
  (sem borda/quadrado padrão do navegador), inclusive o confirmar-senha do cadastro.
- **Guarda de acesso**: `home-profissional.js` redireciona para `login-profissional.html` sem sessão;
  `home.js` redireciona para `login.html` (Estudante) e para a home profissional quando o tipo é
  profissional.

## Melhorias realizadas nesta revisão (2ª rodada)

- **Correção do cadastro profissional**: os campos de e-mail/senha/confirmação foram retirados do
  grid de 2 colunas e empilhados em largura total, corrigindo o alinhamento inconsistente de
  "Confirmar senha".
- **Perfil do Profissional em cards**: `sec-perfil` reescrita com hero (avatar grande, nome,
  profissão/CRP), cards de Apresentação, Informações pessoais, Registro e formação e Atendimento,
  e edição funcional que atualiza os resumos do painel (formatos de data e moeda em pt-BR).
- **Financeiro funcional**: filtro por período (tudo/hoje/semana/mês/ano/personalizado), 6 cards
  de resumo com os cálculos reais (recebido, a receber, previsto, despesas, atendimentos e valor
  médio), extrato com entradas/saídas e status, e suporte a movimentações antigas
  (`normalizarMov`).
- **Conteúdos (Estudante e Profissional)**: seções próprias no menu lateral, com 5 e 6 materiais
  demonstrativos respectivamente, abertos em um **leitor de conteúdo** (overlay com bloco de
  texto, recomendações e aviso de que não substitui acompanhamento profissional).
- **Acesso ao diário dependente de autorização**: botão com ícones de cadeado/relógio/livro nos
  estados sem-acesso, pendente e liberado; apenas pacientes autorizados podem ter o diário
  visualizado (overlay dedicado), e as solicitações são persistidas em `cm_solicitacoes_diario`.
- **Paciente e diário de demonstração**: um paciente fictício ("Demonstração", claramente rotulado)
  e 4 registros fictícios de diário são semeados na primeira visita, para facilitar a demonstração.
  O diário do Estudante filtra por autor, então os registros fictícios não aparecem para o usuário.
- **Botões "Cancelar" dos formulários**: os três formulários do painel profissional (paciente,
  atendimento e movimentação) agora fecham e limpam com o botão "Cancelar".
- **Avisos de funcionalidades futuras**: entrar com Google/Microsoft, "Esqueceu sua senha?", Termos
  de Uso e Política de Privacidade exibem um toast informativo em vez de parecerem botões mortos.

## Redesign visual (tema azul)

- **Nova paleta sofisticada**: azul-marinho `#0F2438`/`#16324A` (painel de identidade e menu lateral),
  azul-médio `#3D7CC9` (botões principais, ícones, ativos), azul-profundo `#1B4B7A` (acentos e hovers),
  azul-claro `#A9C8E8`/`#DCECFB` (fundos suaves, badges) e off-white azulado `#F1F6FC`/`#F2F6FB`
  (fundos das páginas). Os tons verdes anteriores foram substituídos pela família azul.
- **Redesign estrutural (não é apenas troca de cor)**: as páginas de autenticação foram reorganizadas em
  **duas áreas** — à esquerda, um **painel de identidade** azul-escuro com a logo, uma frase curta e
  formas orgânicas decorativas (sem informação desnecessária); à direita, o **formulário** em card.
  Os dashboards usam **sidebar azul-escura + topo fixo + cards em grade**, com o conteúdo ocupando
  melhor o espaço horizontal (`.cm-dash` em tela cheia, sem `max-width`).
- **Sidebar recolhida por padrão**: no desktop, o menu lateral começa apenas com os ícones (**82px**) e
  expande para **286px** quando o mouse passa por cima ou quando um item recebe foco. Os rótulos ficam
  **completamente ocultos** (`opacity:0`, `width:0`) quando recolhido, e os ícones e o avatar ficam
  centralizados na barra (a barra também esconde a própria barra de rolagem, que desviaria o eixo).
- **A sidebar é overlay, não uma coluna**: ela é `position:fixed` e começa logo abaixo do cabeçalho
  (`.cm-topbar`). Ao expandir no hover ela **passa por cima do conteúdo** — o `main` não muda de
  largura e **nada é empurrado**. Por isso **não existe calha reservada** para a expansão: o painel
  reserva apenas a largura **recolhida** (`padding-left: calc(82px + 24px)`) e centraliza o conteúdo
  com `max-width:1280px`. A posição do conteúdo é idêntica com o menu fechado e aberto. A pequena
  sobreposição do menu sobre o texto durante o hover é intencional. Ao clicar em um comando, o menu
  volta a ficar só com os ícones imediatamente, mesmo com o cursor ainda sobre a barra. No mobile
  (abaixo de 992px) continua o menu lateral deslizante de 280px.
- **Ícone e texto próximos**: os itens usam `gap:9px` e o ícone não recebe `margin:auto`, para que
  **icone + nome leiam como um bloco só** quando expandidos.
- **Ações do usuário no fim da barra**: em `.cm-side-bottom` ficam **Meu perfil, Configurações e
  Sair**, separados do restante por uma divisória com respiro curto (**18px**, sem vão exagerado).
  O painel do profissional tem a mesma estrutura: **Perfil, Configurações e Sair**.
- **Configurações também no painel do profissional**: a seção de Configurações (`#sec-config`) que já
  existia no Home do usuário foi disponibilizada também no Home do profissional, com os mesmos
  componentes e a mesma chave de preferências (`cm_config`). Nenhuma página nova foi criada e o
  `home.html`, o login e as regras de acesso não foram alterados.
- **Aproveitamento total da tela**: as páginas de autenticação usam o contêiner em largura quase total
  (até 1800px), com o painel de identidade e o card do formulário esticados à altura da janela; os
  dashboards usam todo o espaço vertical e horizontal disponíveis, com cards e tipografia maiores.
- **Formulários compactos**: campos relacionados ficam **lado a lado** (Nome|E-mail, Senha|Confirmar,
  Curso|Período no cadastro; Nome|Nascimento, Gênero|Telefone, Cidade|Estado nas etapas; Humor|Sono,
  Ansiedade|Atividade na etapa emocional), empilhando no celular (`.field-pair`).
- **Inputs com respiro**: padding interno confortável (14px) e altura de 54px em todos os campos de
  login, cadastro, perfil e configurações, com foco em anel azul.
- **Etapas do cadastro profissional**: indicador de etapa destacado com medalhão numerado (01/02),
  brilho de anel no passo atual e título da etapa legível (`.progress .step-number` + `.step-info`).
- **Setas de voltar corrigidas**: nenhum botão "Voltar" de autenticação leva mais ao Home.
  O "Voltar" do cadastro profissional (etapa 1) vai agora para `login-profissional.html`; as demais
  voltam ao passo anterior do fluxo (etapa 2 → etapa 1; formulário → cadastro; login profissional → login).
- **Componentes padronizados**: botões, inputs, listas, estatísticas, humor/diário, comunidade,
  financeiro, perfis, configurações, conteúdos, leitor de conteúdos, modais, toasts e footer seguem a
  mesma linguagem azul em todo o sistema.
- **Importante**: o redesign foi feito **via CSS** (`style.css`: variáveis `:root` + bloco de sobreposição
  "TEMA AZUL" ao final) com pequenos ajustes de **estrutura HTML** apenas nas páginas de autenticação
  (wrappers `.field-pair`, medalhão de etapa e o destino das setas de voltar). **Nenhuma funcionalidade,
  regra de negócio, banco de dados, validação ou rota foi alterada.** A imagem de referência não pôde
  ser inspecionada (modelo sem suporte a imagem); o layout foi aplicado a partir da descrição escrita e
  validado com Chrome headless (formulários, homes com dados semeados, troca de seções e setas de voltar).

## Landing page: identidade visual e imagens

- A página pública (`index.html`) usa a paleta azul-petróleo (`#264653`/`#356B78`), creme (`#F7F5F0`),
  azul acinzentado (`#D9E5E7`), lavanda (`#DCD8EA`) e grafite (`#263238`). Os estilos ficam no bloco
  final de `pagina-publica.css`, escopados em `.public-page`; as páginas de escolha de cadastro/login
  mantêm o tema anterior.
- Os ícones da landing são **SVG inline** (sprite no início de `index.html`), sem dependência do
  Font Awesome para renderizar.
- As fotos ficam em `imagem/landing/` e foram obtidas no **Pexels**, sob a licença Pexels (uso gratuito,
  sem atribuição obrigatória):

| Arquivo | ID no Pexels |
| --- | --- |
| `hero-estudos.jpg` | 5124880 |
| `entender-reflexao.jpg` | 8005646 |
| `cotidiano-estudo.jpg` | 8199761 |
| `conteudo-autocuidado.jpg` | 6690217 |
| `conteudo-ansiedade.jpg` | 35463710 |
| `conteudo-sono.jpg` | 7241262 |
| `conteudo-relacoes.jpg` | 12886931 |
| `conteudo-emocoes.jpg` | 8419181 |
| `espaco-conteudos.jpg` | 5797899 |
| `espaco-diario.jpg` | 4841704 |
| `espaco-comunidade.jpg` | 8199199 |
| `espaco-profissionais.jpg` | 6502730 |
| `espaco-localizacao.jpg` | 7634201 |
| `espaco-apoio.jpg` | 8373963 |
| `ajuda-acolhimento.jpg` | 8419620 |
| `fechamento-natureza.jpg` | 29162696 |