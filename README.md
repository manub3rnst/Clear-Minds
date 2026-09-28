# Clear Minds

Site do TCC "Clear Minds", uma plataforma de apoio à saúde mental de estudantes, com dois tipos de conta: **Estudante** e **Profissional**.

## Fluxo de navegação

```
                          index.html (Cadastro)
                         /                      \
              tipo = Estudante              tipo = Profissional
                    |                              |
                    v                              v
        formulario.html (Etapa 1/2)     cadastro-profissional.html (Etapa 1/2)
                    |                              |
                    v                              v
        formulario2.html (Etapa 2/2)     cadastro-profissional2.html (Etapa 2/2)
                    |                              |
                    v                              v
                home.html                  home-profissional.html
                    |                              |
                    +--------------> login.html   +-------------> login-profissional.html
```

- **index.html** (cadastro):
  - Se **Estudante**: pede nome, e-mail, curso e período; ao concluir, é direcionado para
    `formulario.html` (Etapa 1 de 2) para completar o perfil.
  - Se **Profissional**: botão "Criar conta profissional" leva para `cadastro-profissional.html`
    (Etapa 1 de 2 — identificação, registro/formação e acesso com e-mail/senha) e depois
    `cadastro-profissional2.html` (Etapa 2 de 2 — modalidade, localização, contato, valores e
    verificação). Ao concluir, vai para `home-profissional.html`.
- **login.html** (Estudante): quem já tem conta entra e vai para `home.html`. O botão
  "Acessar conta profissional" leva para `login-profissional.html`. Quem não tem conta clica em
  "Cadastre-se" e vai para `index.html`.
- **login-profissional.html**: autentica o profissional pelo e-mail e senha cadastrados
  (`cm_profile_profissional`); sem uma conta profissional salva na máquina, exibe aviso para
  cadastrar. **É a única forma de acessar `home-profissional.html`**.
- **formulario.html → formulario2.html**: formulário de perfil do Estudante em 2 etapas.
  A Etapa 2 (bem-estar emocional) é a última: ela inicia a sessão e redireciona para `home.html`.
- **home.html**: painel do Estudante — cabeçalho, menu lateral (Início, Meu diário, Comunidade,
  Meus profissionais, Mensagens, Agenda, Meu perfil, Configurações), registro de humor e diário,
  e **feed da comunidade** como elemento central: criar publicação (com humor opcional), curtir,
  comentar e compartilhar **somente com conexões** (`cm_amizades`). Sem conexões, o compartilhamento
  é desabilitado com aviso. Estruturas de dados prontas no `localStorage` (sem dados fictícios).
- **home-profissional.html**: painel do Profissional — cabeçalho, menu lateral (Início, Pacientes,
  Agenda, Conteúdos, Financeiro, Perfil), resumo rápido (pacientes ativos, atendimentos e ganho),
  lista de atividades recentes e **gráfico grande Dia | Mês | Ano** (movimentação de atendimentos e
  ganho líquido), alimentado por `cm_movimentacoes`. Nome e profissão/cargo vêm do cadastro
  profissional.

## Modo de teste (sem back-end)

Todos os formulários funcionam em `MODO_TESTE = true` (ver `cadastro.js`, `script.js`,
`cadastro-profissional.js` e `login-profissional.js`), ou seja, os dados são salvos no
`localStorage` do navegador para simular uma conta e alimentar as páginas internas, sem precisar de
um servidor/back-end. Quando o back-end estiver pronto, basta trocar `MODO_TESTE` para `false`.

Chaves usadas no `localStorage`:

- `cm_session` — e-mail da sessão ativa (presente em ambos os tipos de conta).
- `cm_tipo` — `"usuario"` ou `"profissional"`, define qual home é exibida.
- `cm_profile` — dados de perfil do Estudante (cadastro + formulário de 2 etapas).
- `cm_profile_profissional` — dados do perfil profissional (nome, profissão/cargo, CRP, e-mail,
  senha, formação, modalidade, abordagem, especialidades, cidade/estado, valor da sessão, etc.).
- `cm_humor_atual` — humor registrado mais recentemente.
- `cm_diario` — registros do diário do Estudante.
- `cm_postagens` — publicações do feed da comunidade.
- `cm_curtidas` — ids de postagens curtidas pelo usuário logado.
- `cm_amizades` — conexões do usuário (estrutura para compartilhamento futuro).
- `cm_compartilhamentos` — registros de compartilhamento de postagens.
- `cm_profissionais_usuario` — profissionais vinculados ao Estudante.
- `cm_consultas` — consultas/atendimentos agendados do Estudante.
- `cm_pacientes`, `cm_agenda_profissional`, `cm_atividades_profissional`,
  `cm_conteudos_profissional`, `cm_movimentacoes` — dados do painel profissional.
- `cm_config` — preferências (compartilhamento de diário e notificações).

## Estrutura de arquivos

- `index.html` / `cadastro.js` — Cadastro do Estudante
- `login.html` / `script.js` — Login do Estudante
- `login-profissional.html` / `login-profissional.js` — Login do Profissional
- `cadastro-profissional.html` / `cadastro-profissional.js` — Cadastro profissional (Etapa 1/2)
- `cadastro-profissional2.html` / `cadastro-profissional2.js` — Cadastro profissional (Etapa 2/2)
- `utils.js` — Funções compartilhadas: mostrar/ocultar senha, validação de campos obrigatórios e
  exibição de erros de formulário
- `formulario.html` / `formulario1.js` — Informações pessoais (Etapa 1, Estudante)
- `formulario2.html` / `formulario2.js` — Bem-estar emocional (Etapa 2, Estudante, última etapa)
- `home.html` / `home.js` — Página inicial do Estudante (sidebar + comunidade/diário)
- `home-profissional.html` / `home-profissional.js` — Painel do Profissional (sidebar + gráfico)
- `style.css` — Estilos de todo o site
- `imagem/` — Imagens e logotipo

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