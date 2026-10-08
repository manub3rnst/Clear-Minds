/* ==========================================================
   CLEAR MINDS — Auditoria
   ==========================================================
   Regras:
   • Nunca gravar senha, hash, token ou credencial.
   • Nunca gravar conteúdo de diário ou dado sensível.
   • Toda ação administrativa destrutiva passa por aqui.
   ========================================================== */

import { db, agoraISO } from "./db.js";

/* Campos que jamais podem entrar na auditoria. */
const CAMPOS_BLOQUEADOS = new Set([
  "senha",
  "senha_hash",
  "senhaAtual",
  "senhaNova",
  "senhaConf",
  "password",
  "token",
  "sessao",
  "csrf",
  "authorization",
  "cookie",
  "diario",
  "diario_entries",
  "conteudo_diario",
  "anotacoes_privadas",
  "cpf",
  "documento",
]);

const LIMITE_DETALHE = 400;

/**
 * Fields explicitly whitelisted for auditing.
 * Anything not in this list is dropped, even if harmless.
 */
const CAMPOS_PERMITIDOS = new Set([
  "email",
  "telefone",
  "nome",
  "sobrenome",
  "status",
  "bloqueado",
  "motivo",
  "destino",
  "categoria",
  "publicado",
  "titulo",
  "tipo",
  "id",
  "quantidade",
  "periodo",
  "origem",
  "origem_id",
]);

function higienizar(detalhe) {
  if (detalhe == null) return null;
  if (typeof detalhe === "string") {
    return detalhe.slice(0, LIMITE_DETALHE);
  }
  if (typeof detalhe !== "object") return null;

  const saida = {};
  for (const [chave, valor] of Object.entries(detalhe)) {
    const baixo = chave.toLowerCase();

    // hard block regardless of whitelist
    if (CAMPOS_BLOQUEADOS.has(baixo)) continue;
    if (baixo.includes("senha") || baixo.includes("password")) continue;
    if (baixo.includes("token") || baixo.includes("secret")) continue;
    if (baixo.includes("diario") || baixo.includes("journal")) continue;

    // whitelist
    if (!CAMPOS_PERMITIDOS.has(chave)) continue;

    if (valor === null || valor === undefined) continue;
    if (typeof valor === "object") continue;

    saida[chave] = String(valor).slice(0, 120);
  }

  const texto = JSON.stringify(saida);
  return texto.length > LIMITE_DETALHE
    ? JSON.stringify({ truncado: true })
    : texto;
}

/**
 * Grava um evento de auditoria.
 * @param {object|null} sessao sessão do admin (pode ser null em falha de login)
 * @param {string} acao verbo no passado: "login.admin", "usuario.excluido"…
 * @param {string|null} recurso tipo de recurso afetado
 * @param {string|number|null} recursoId identificador
 * @param {"sucesso"|"falha"|"negado"} resultado
 * @param {object|null} detalhe campos permitidos
 */
export function registrarAuditoria(
  sessao,
  acao,
  recurso = null,
  recursoId = null,
  resultado = "sucesso",
  detalhe = null
) {
  db.prepare(
    `INSERT INTO auditoria (em, admin_id, admin_email, acao, recurso, recurso_id, resultado, detalhe)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    agoraISO(),
    sessao?.admin_id ?? null,
    sessao?.email ?? null,
    String(acao).slice(0, 80),
    recurso ? String(recurso).slice(0, 60) : null,
    recursoId == null ? null : String(recursoId).slice(0, 60),
    resultado,
    higienizar(detalhe)
  );
}

/* ------------------------------------------------------------
   LEITURA
   ------------------------------------------------------------ */

export function listarAuditoria({ limite = 200, offset = 0, filtro = "" } = {}) {
  const sql = `
    SELECT id, em, admin_email, acao, recurso, recurso_id, resultado, detalhe
      FROM auditoria
     WHERE (? = '' OR acao LIKE ? OR recurso LIKE ? OR admin_email LIKE ?)
     ORDER BY em DESC, id DESC
     LIMIT ? OFFSET ?`;
  const alvo = `%${filtro}%`;
  return db.prepare(sql).all(filtro, alvo, alvo, alvo, limite, offset);
}

export function contarAuditoria(filtro = "") {
  const alvo = `%${filtro}%`;
  return db
    .prepare(
      `SELECT COUNT(*) AS n FROM auditoria
        WHERE (? = '' OR acao LIKE ? OR recurso LIKE ? OR admin_email LIKE ?)`
    )
    .get(filtro, alvo, alvo, alvo).n;
}