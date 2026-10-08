/* ==========================================================
   CLEAR MINDS — Camada de banco (SQLite nativo do Node)
   ==========================================================
   Usa node:sqlite (Node >= 22.5). Sem dependências externas.
   O banco fica em admin/data/clearminds.sqlite e é ignorado
   pelo versionamento (contém hashes e dados pessoais).
   ========================================================== */

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PASTA_DATA = join(__dirname, "data");
const CAMINHO_DB = process.env.CM_DB || join(PASTA_DATA, "clearminds.sqlite");

mkdirSync(PASTA_DATA, { recursive: true });

export const db = new DatabaseSync(CAMINHO_DB);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

/* ------------------------------------------------------------
   ESQUEMA
   ------------------------------------------------------------ */

db.exec(`
/* ---------- contas administrativas ---------- */
CREATE TABLE IF NOT EXISTS admins (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  role           TEXT    NOT NULL DEFAULT 'admin',
  senha_hash     TEXT,
  ativo          INTEGER NOT NULL DEFAULT 1,
  setup_feito    INTEGER NOT NULL DEFAULT 0,
  criado_em      TEXT    NOT NULL,
  ultimo_login   TEXT,
  nome           TEXT,
  sobrenome      TEXT,
  telefone       TEXT,
  foto           TEXT,
  cargo          TEXT,
  descricao      TEXT
);

/* ---------- sessões (token httpOnly, guardada no servidor) ---------- */
CREATE TABLE IF NOT EXISTS sessoes (
  token      TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  criado_em  TEXT NOT NULL,
  expira_em  TEXT NOT NULL,
  ip         TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessoes_admin ON sessoes(admin_id);

/* ---------- auditoria ---------- */
CREATE TABLE IF NOT EXISTS auditoria (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  em            TEXT NOT NULL,
  admin_id      INTEGER,
  admin_email   TEXT,
  acao          TEXT NOT NULL,
  recurso       TEXT,
  recurso_id    TEXT,
  resultado     TEXT NOT NULL DEFAULT 'sucesso',
  detalhe       TEXT
);
CREATE INDEX IF NOT EXISTS idx_auditoria_em ON auditoria(em DESC);

/* ---------- usuários / pacientes ---------- */
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  sobrenome     TEXT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  telefone      TEXT,
  foto          TEXT,
  status        TEXT NOT NULL DEFAULT 'ativo',
  bloqueado     INTEGER NOT NULL DEFAULT 0,
  data_cadastro TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

/* ---------- profissionais ---------- */
CREATE TABLE IF NOT EXISTS profissionais (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  telefone      TEXT,
  foto          TEXT,
  registro      TEXT,
  especialidade TEXT,
  bio           TEXT,
  status        TEXT NOT NULL DEFAULT 'pendente',
  bloqueado     INTEGER NOT NULL DEFAULT 0,
  data_cadastro TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prof_status ON profissionais(status);

/* ---------- comunidade ---------- */
CREATE TABLE IF NOT EXISTS publicacoes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  autor_nome    TEXT NOT NULL,
  autor_tipo    TEXT NOT NULL DEFAULT 'usuario',
  conteudo      TEXT NOT NULL,
  criada_em     TEXT NOT NULL,
  removida      INTEGER NOT NULL DEFAULT 0,
  removida_em   TEXT
);

CREATE TABLE IF NOT EXISTS comentarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  publicacao_id INTEGER REFERENCES publicacoes(id) ON DELETE CASCADE,
  autor_nome    TEXT NOT NULL,
  conteudo      TEXT NOT NULL,
  criado_em     TEXT NOT NULL,
  removido      INTEGER NOT NULL DEFAULT 0,
  removido_em   TEXT
);

/* ---------- denúncias ---------- */
CREATE TABLE IF NOT EXISTS denuncias (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_alvo     TEXT NOT NULL,
  alvo_id       INTEGER,
  alvo_autor    TEXT,
  motivo        TEXT NOT NULL,
  detalhes      TEXT,
  criada_em     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pendente',
  acao          TEXT,
  resolvida_em  TEXT
);
CREATE INDEX IF NOT EXISTS idx_den_status ON denuncias(status);

/* ---------- conteúdos / categorias ---------- */
CREATE TABLE IF NOT EXISTS categorias (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  nome     TEXT NOT NULL,
  destino  TEXT NOT NULL DEFAULT 'usuarios',
  UNIQUE (nome, destino)
);

CREATE TABLE IF NOT EXISTS conteudos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo       TEXT NOT NULL,
  corpo        TEXT NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  destino      TEXT NOT NULL DEFAULT 'usuarios',
  publicado    INTEGER NOT NULL DEFAULT 1,
  criado_em    TEXT NOT NULL,
  atualizado_em TEXT
);

/* ---------- agendamentos ---------- */
CREATE TABLE IF NOT EXISTS consultas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profissional  TEXT NOT NULL,
  paciente      TEXT NOT NULL,
  data          TEXT NOT NULL,
  hora          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'agendada',
  valor         REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_consultas_data ON consultas(data);

/* ---------- financeiro ---------- */
CREATE TABLE IF NOT EXISTS movimentacoes (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo     TEXT NOT NULL,           -- receita | despesa
  descricao TEXT NOT NULL,
  valor    REAL NOT NULL,
  data     TEXT NOT NULL,           -- ISO
  categoria TEXT,
  status   TEXT NOT NULL DEFAULT 'pago'   -- pago | pendente
);
CREATE INDEX IF NOT EXISTS idx_mov_data ON movimentacoes(data);

/* ---------- configuração do sistema ---------- */
CREATE TABLE IF NOT EXISTS config_sistema (
  chave        TEXT PRIMARY KEY,
  valor        TEXT NOT NULL,
  atualizado_em TEXT,
  atualizado_por TEXT
);
`);

/* ------------------------------------------------------------
   CONFIG INICIAL DE FABRICA
   ------------------------------------------------------------ */

const padraoConfig = [
  ["nome_sistema", "Clear Minds"],
  ["descricao_sistema", "Um sistema a favor da saúde mental no ensino médio."],
  ["contato_email", "contato@clearminds.com.br"],
  ["permitir_cadastro_usuarios", "true"],
  ["permitir_cadastro_profissionais", "true"],
  ["regra_denuncia", "Conteúdo que incite autoconhecimento, respeite os outros e não veicule dados pessoais."],
  ["regra_sem_julgamento", "Não diagnostique outros usuários; oriente a buscar ajuda profissional."],
  ["regra_privacidade", "Não exponha informações de saúde de terceiros."],
  ["max_denuncias_pendentes", "10"],
  ["notificar_admin_denuncia", "true"],
];

const inserirPadrao = db.prepare(
  "INSERT OR IGNORE INTO config_sistema (chave, valor) VALUES (?, ?)"
);
for (const [chave, valor] of padraoConfig) inserirPadrao.run(chave, valor);

/* ------------------------------------------------------------
   CONTA ADMINISTRATIVA INICIAL
   ------------------------------------------------------------
   Criada apenas com o e-mail. A senha NÃO existe ainda:
   o primeiro login com este e-mail abre a tela de definição
   de senha, que grava somente o hash scrypt.
   ------------------------------------------------------------ */

export const EMAIL_ADMIN_INICIAL =
  process.env.CM_ADMIN_EMAIL || "manu.bernst@icloud.com";

const agoraISO = () => new Date().toISOString();

const criarAdminInicial = db.prepare(
  `INSERT OR IGNORE INTO admins (email, role, criado_em) VALUES (?, 'admin', ?)`
);
criarAdminInicial.run(EMAIL_ADMIN_INICIAL, agoraISO());

/* ------------------------------------------------------------
   MIGRACOES
   ------------------------------------------------------------
   O painel ganhou campos de perfil no admin depois da primeira
   versão do esquema. Adicionamos coluna por coluna, ignorando
   as que já existem, para não quebrar bancos já criados.
   ------------------------------------------------------------ */

function adicionarColunaSeFaltar(tabela, coluna, definicao) {
  const existe = db
    .prepare(`PRAGMA table_info("${tabela}")`)
    .all()
    .some((c) => c.name === coluna);
  if (!existe) {
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
  }
}

adicionarColunaSeFaltar("admins", "nome", "TEXT");
adicionarColunaSeFaltar("admins", "sobrenome", "TEXT");
adicionarColunaSeFaltar("admins", "telefone", "TEXT");
adicionarColunaSeFaltar("admins", "foto", "TEXT");
adicionarColunaSeFaltar("admins", "cargo", "TEXT");
adicionarColunaSeFaltar("admins", "descricao", "TEXT");

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */

export const buscarAdminPorEmail = (email) =>
  db.prepare("SELECT * FROM admins WHERE email = ? COLLATE NOCASE").get(email);

export const buscarAdminPorId = (id) =>
  db.prepare("SELECT * FROM admins WHERE id = ?").get(id);

export const contarAdmins = () =>
  db.prepare("SELECT COUNT(*) AS n FROM admins").get().n;

/** Privilégio mínimo: o role vem do banco, nunca do navegador. */
export const ehAdminAtivo = (admin) =>
  Boolean(admin && admin.role === "admin" && admin.ativo === 1 && admin.setup_feito === 1);

export { agoraISO, CAMINHO_DB };