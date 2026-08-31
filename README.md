# Clear Minds

Site do TCC "Clear Minds", uma plataforma de apoio à saúde mental de estudantes, com dois tipos de conta: **Estudante** e **Profissional**.

## Fluxo de navegação

```
                          index.html (Cadastro)
                         /                      \
              tipo = Estudante              tipo = Profissional
                    |                              |
                    v                              v
        formulario.html (Etapa 1/3)      home-profissional.html
                    |
                    v
        formulario2.html (Etapa 2/3)
                    |
                    v
        formulario3.html (Etapa 3/3)
                    |
                    v
                home.html  <----------------->  login.html
                                                (Estudante ou Profissional)
```

- **login.html / index.html**: agora possuem um seletor **"Sou Estudante" / "Sou Profissional"**
  no topo do formulário. A escolha define quais campos aparecem e para onde o usuário é
  redirecionado após entrar/cadastrar.
- **login.html**: quem já tem conta entra e vai direto para `home.html` (Estudante) ou
  `home-profissional.html` (Profissional). Quem não tem conta pode clicar em "Cadastre-se" e vai
  para `index.html`.
- **index.html** (cadastro):
  - Se **Estudante**: pede Curso e Período; ao concluir, o usuário é direcionado para
    `formulario.html` (Etapa 1 de 3) para completar o perfil.
  - Se **Profissional**: pede Área de atuação, Registro profissional (CRP/CRM) e Telefone; ao
    concluir, vai direto para `home-profissional.html` (o formulário de bem-estar de 3 etapas é
    específico para estudantes).
- **formulario.html → formulario2.html → formulario3.html**: formulário de perfil em 3 etapas,
  exclusivo do fluxo de Estudante. Ao concluir a Etapa 3, é exibida uma tela de sucesso com o
  botão "Acessar plataforma", que leva para `home.html`.
- **home.html**: painel (dashboard) do Estudante — cabeçalho com navegação, menu lateral, seletor de
  humor, diário, próximo atendimento, comunidade, ferramentas, conteúdos e acompanhamento com o
  profissional. Layout baseado no mesmo padrão visual do painel do profissional.
- **home-profissional.html**: painel (dashboard) do Profissional — cabeçalho com navegação, menu
  lateral, resumo do dia, próximos atendimentos, diário compartilhado pelos pacientes, lista de
  pacientes com busca e acesso rápido.

## Modo de teste (sem back-end)

Todos os formulários funcionam em `MODO_TESTE = true` (ver `cadastro.js` e `script.js`), ou seja,
os dados são salvos no `localStorage` do navegador para simular uma conta e alimentar as páginas
internas, sem precisar de um servidor/back-end. Quando o back-end estiver pronto, basta trocar
`MODO_TESTE` para `false` em `cadastro.js` e `script.js`.

Chaves usadas no `localStorage`:

- `cm_session` — e-mail da sessão ativa (presente em ambos os tipos de conta).
- `cm_tipo` — `"usuario"` ou `"profissional"`, define qual home é exibida.
- `cm_profile` — dados de perfil do Estudante (cadastro + formulário de 3 etapas).
- `cm_profile_profissional` — dados de perfil do Profissional.

## Estrutura de arquivos

- `index.html` / `cadastro.js` — Cadastro (Estudante ou Profissional)
- `login.html` / `script.js` — Login (Estudante ou Profissional)
- `utils.js` — Funções compartilhadas: mostrar/ocultar senha, seletor de tipo de conta,
  validação de campos obrigatórios e exibição de erros de formulário
- `formulario.html` / `formulario1.js` — Informações pessoais (Etapa 1, Estudante)
- `formulario2.html` / `formulario2.js` — Bem-estar emocional (Etapa 2, Estudante)
- `formulario3.html` / `formulario3.js` — Preferências (Etapa 3, Estudante)
- `home.html` / `home.js` — Página inicial do Estudante
- `home-profissional.html` / `home-profissional.js` — Painel do Profissional
- `style.css` — Estilos de todo o site
- `imagem/` — Imagens e logotipo

## Melhorias realizadas nesta revisão

- **Divisor Estudante/Profissional**: novo seletor em `index.html` e `login.html`, com campos e
  redirecionamento próprios para cada tipo de conta (antes só existia cadastro/login de estudante).
- **Painéis (dashboards) redesenhados**: `home.html` (Estudante) e `home-profissional.html`
  (Profissional) foram reconstruídos no formato de painel administrativo (cabeçalho + menu lateral
  + cartões), usando somente as cores já definidas em `:root` no `style.css`, para manter a
  identidade visual do restante do site.
- **`utils.js`**: extração de código duplicado (toggle de senha, validação) que antes se repetia
  em `cadastro.js` e `script.js`.
- **Mensagens de erro inline** (`.form-erro`) substituindo `alert()` no cadastro e no login, mais
  acessíveis (`role="alert"`) e menos intrusivas.
- **Validação de senha**: exige mínimo de 6 caracteres no cadastro.
- **Redirecionamento automático**: se um profissional acessar `home.html` (ou um estudante acessar
  `home-profissional.html`), o site já leva para a página correta com base no tipo de conta salvo.
