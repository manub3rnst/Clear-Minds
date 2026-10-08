# Clear Minds — Ambiente administrativo

Painel de gestão separado do app de usuário e profissional. Roda em um
servidor próprio, com banco próprio, e **não altera** as páginas existentes:
elas continuam abrindo pelo navegador com `localStorage`, como sempre.

## Como subir

```bash
node admin/server.js
```

Depois abra:

```
http://127.0.0.1:4173/admin/login.html
```

Requer Node 22.5 ou superior (usa `node:sqlite`). Não há dependências
externas, então não é preciso `npm install`.

Variáveis opcionais:

| Variável | Padrão | Para que serve |
| --- | --- | --- |
| `PORT` | `4173` | Porta do servidor |
| `HOST` | `127.0.0.1` | Endereço de escuta |
| `CM_ADMIN_EMAIL` | `manu.bernst@icloud.com` | E-mail da conta inicial |
| `CM_DB` | `admin/data/clearminds.sqlite` | Caminho do banco |

## Primeiro acesso

O banco é criado vazio, com apenas o e-mail da conta administrativa e
**nenhuma senha**. No primeiro acesso, a tela de login detecta isso e abre a
etapa de criação de senha. A senha:

- é digitada no navegador e nunca aparece em HTML ou JavaScript;
- é gravada só como hash `scrypt$salt$hash`;
- pode ser trocada depois em **Meu perfil**.

## Autorização

O papel não vem do navegador. Toda rota da API passa por `exigirAdmin()`, que
lê a sessão do cookie, consulta o banco e exige `role = 'admin'`. Não existe
campo do front-end capaz de se autoconceder admin — a tentativa é recusada e
registrada na auditoria.

Além disso:

- sessão em cookie `HttpOnly` + `SameSite=Strict`, guardada **no servidor**;
- CSRF por double submit com assinatura do servidor (`cm_admin_csrf`);
- rate limit em login e setup;
- ações destrutivas exigem confirmação explícita e motivo;
- `/admin/admin.html` só é servido com sessão válida — sem ela, responde 302
  para a tela de login. Login, CSS e JS do login continuam públicos.

## Dados sensíveis (item 16)

O painel **não** tem tabela, rota nem função que leia diário, humor, sono,
ansiedade, lista de pacientes ou solicitações de acesso. Isso é verificado
automaticamente pela suíte de testes.

A tela **Configurações → Importar dados do navegador** é a ponte entre o
`localStorage` do app e o SQLite. Ela importa perfis, profissionais,
publicações, comentários, denúncias, consultas, conteúdos e movimentações, e
**recusa** na entrada estas chaves:

```
cm_diario, cm_solicitacoes_diario, cm_humor_atual, cm_pacientes,
cm_curtidas, cm_amizades, cm_compartilhamentos, cm_profissionais_usuario
```

Mesmo dentro de um perfil aceito, campos como `humor`, `sono`, `ansiedade`,
`estresse` e `nascimento` são descartados antes do SQL.

Duas formas de importar:

- **Importar direto deste navegador** — funciona quando o app foi aberto pela
  mesma origem do painel (`http://127.0.0.1:4173`).
- **Importar arquivo** — para quando o app foi aberto pelo duplo clique nos
  arquivos `.html` (origem `file://`), que tem outro armazenamento. Exporte as
  chaves `cm_*` para um `.json` e envie aqui.

Reimportar o mesmo conteúdo não duplica registros.

## Testes

```bash
cd admin
node testes/api.test.js
```

Sobe um servidor real com banco descartável e exercita setup, login, autorização
por papel, CRUDs, dados sensíveis, guarda do painel e a ponte de importação.
Resultado atual: **262 passaram · 0 falharam**.

## Tema

O painel usa o mesmo tema das Homes, servido pela raiz do site:
[`../tema.css`](../tema.css) e [`../tema.js`](../tema.js) são carregados por
`public/admin.html` no `<head>`, então a preferência já entra aplicada sem
piscar. O tema vive em `localStorage` (`cm_tema` e `cm_config`) e é
selecionável em **Configurações → Tema escuro** ou pelo botão do topo.

`localStorage` é separado por origem: abrir os arquivos por `file://` e pelo
servidor `http://127.0.0.1:4173` mantém duas preferências independentes.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `db.js` | Esquema SQLite, conta inicial, migrações |
| `security.js` | scrypt, sessões, cookies, CSRF, rate limit |
| `api.js` | Rotas e autorização |
| `dados.js` | Agregações do dashboard, relatórios e financeiro |
| `importar.js` | Ponte `localStorage` → SQLite |
| `audit.js` | Auditoria com redação de campos sensíveis |
| `server.js` | Servidor HTTP, cabeçalhos de segurança, arquivos estáticos |
| `public/` | Login e painel (SPA) |
| `testes/api.test.js` | Suíte automatizada |
| `../tema.css` / `../tema.js` | Tema compartilhado com as Homes |

O banco fica em `admin/data/` e está ignorado pelo versionamento: ele contém
hashes e dados pessoais.