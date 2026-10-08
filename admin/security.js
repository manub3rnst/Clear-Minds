/* ==========================================================
   CLEAR MINDS — Segurança: hash de senha, sessões, CSRF
   ==========================================================
   Tudo aqui roda no servidor. O navegador nunca envia role,
   nunca envia "sou admin", nunca define permissão.
   ========================================================== */

import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";

import { db, agoraISO } from "./db.js";

/* ------------------------------------------------------------
   SENHA — scrypt com salt aleatório por conta
   ------------------------------------------------------------ */

const TAM_SALT = 16;
const TAM_HASH = 64;
const NOME_HASH = "scrypt";

/** Gera "scrypt$<saltHex>$<hashHex>". Só isto é persistido. */
export function gerarHashSenha(senha) {
  if (typeof senha !== "string" || senha.length === 0) {
    throw new Error("Senha obrigatória.");
  }
  const salt = randomBytes(TAM_SALT);
  const hash = scryptSync(senha.normalize("NFKC"), salt, TAM_HASH, {
    // parâmetros defaults do Node para scrypt (N=16384, r=8, p=1)
    maxmem: 64 * 1024 * 1024,
  });
  return `${NOME_HASH}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Comparação em tempo constante. Nunca lança. */
export function conferirSenha(senha, armazenado) {
  if (typeof senha !== "string" || !armazenado) return false;
  const partes = armazenado.split("$");
  if (partes.length !== 3 || partes[0] !== NOME_HASH) return false;

  let salt, esperado;
  try {
    salt = Buffer.from(partes[1], "hex");
    esperado = Buffer.from(partes[2], "hex");
  } catch {
    return false;
  }
  if (salt.length !== TAM_SALT || esperado.length !== TAM_HASH) return false;

  const obtido = scryptSync(senha.normalize("NFKC"), salt, TAM_HASH, {
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(obtido, esperado);
}

export function validarForcaSenha(senha) {
  if (typeof senha !== "string") return "Informe a senha.";
  if (senha.length < 8) return "A senha precisa ter ao menos 8 caracteres.";
  if (senha.length > 200) return "Senha longa demais.";
  if (!/[A-Za-zÀ-ÿ]/.test(senha)) return "Inclua ao menos uma letra.";
  if (!/[0-9]/.test(senha)) return "Inclua ao menos um número.";
  return null;
}

/* ------------------------------------------------------------
   COOKIES
   ------------------------------------------------------------ */

const OPCOES_BASE = {
  httpOnly: true,          // JS da página não consegue ler
  sameSite: "strict",      // não acompanha POST de outro site
  path: "/",
};

export const NOME_COOKIE_SESSAO = "cm_admin_sessao";

/**
 * Anexa um cookie. Usa array porque a resposta pode já ter
 * recebido outro Set-Cookie (ex.: sessão + CSRF) e o Node
 * sobrescreveria o anterior serecvêssemos uma string.
 */
export function anexarCookie(res, partes) {
  const anteriores = res.getHeader("Set-Cookie");
  const lista = anteriores
    ? (Array.isArray(anteriores) ? anteriores : [anteriores])
    : [];
  lista.push(partes.join("; "));
  res.setHeader("Set-Cookie", lista);
}

export function definirCookieSessao(res, token, expiraEm) {
  const maxAge = Math.max(
    0,
    Math.floor((new Date(expiraEm).getTime() - Date.now()) / 1000)
  );
  const partes = [
    `${NOME_COOKIE_SESSAO}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAge}`,
  ];
  // Secure é obrigatório em produção (https). Em localhost o
  // navegador recusaria o cookie, então só ativamos fora do dev.
  if (process.env.NODE_ENV === "production") partes.push("Secure");
  anexarCookie(res, partes);
}

export function limparCookieSessao(res) {
  anexarCookie(res, [
    `${NOME_COOKIE_SESSAO}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
  ]);
}

export function lerCookie(req, nome) {
  const bruto = req.headers.cookie;
  if (!bruto) return null;
  for (const parte of bruto.split(";")) {
    const [chave, ...resto] = parte.trim().split("=");
    if (chave === nome) return resto.join("=") || null;
  }
  return null;
}

/* ------------------------------------------------------------
   SESSÕES
   ------------------------------------------------------------ */

const VALOR_MS = 8 * 60 * 60 * 1000;      // 8 horas
const LIMITE_MS = 15 * 60 * 1000;         // 15 min sem atividade

export function criarSessao(adminId, req) {
  const token = randomBytes(32).toString("base64url");
  const criado = new Date();
  const expira = new Date(criado.getTime() + VALOR_MS);

  db.prepare(
    `INSERT INTO sessoes (token, admin_id, criado_em, expira_em, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    token,
    adminId,
    criado.toISOString(),
    expira.toISOString(),
    req.socket.remoteAddress || null,
    String(req.headers["user-agent"] || "").slice(0, 200)
  );

  return { token, expira_em: expira.toISOString() };
}

export function salvarTokenSessao(token) {
  const expira = new Date(Date.now() + VALOR_MS).toISOString();
  db.prepare("UPDATE sessoes SET expira_em = ? WHERE token = ?").run(expira, token);
  return expira;
}

export function destruirSessao(token) {
  if (token) db.prepare("DELETE FROM sessoes WHERE token = ?").run(token);
}

export function destruirSessoesDoAdmin(adminId) {
  db.prepare("DELETE FROM sessoes WHERE admin_id = ?").run(adminId);
}

export function limparSessoesExpiradas() {
  db.prepare("DELETE FROM sessoes WHERE expira_em < ?").run(agoraISO());
}

/* ------------------------------------------------------------
   LEITURA DO PEDIDO — a origem da verdade
   ------------------------------------------------------------
   O role é lido da tabela admins via sessoes. Nada do que o
   cliente envie (corpo, query, header) participa da decisão.
   ------------------------------------------------------------ */

export function lerSessaoDoPedido(req) {
  const token = lerCookie(req, NOME_COOKIE_SESSAO);
  if (!token) return null;

  const linha = db
    .prepare(
      `SELECT s.token, s.expira_em, a.id, a.email, a.role, a.ativo, a.setup_feito
         FROM sessoes s
         JOIN admins a ON a.id = s.admin_id
        WHERE s.token = ?`
    )
    .get(token);

  if (!linha) return null;
  if (new Date(linha.expira_em) < new Date()) {
    destruirSessao(token);
    return null;
  }

  return {
    token,
    admin_id: linha.id,
    email: linha.email,
    role: linha.role,
    ativo: linha.ativo,
    setup_feito: linha.setup_feito,
  };
}

/* ------------------------------------------------------------
   CSRF — double submit com assinatura do servidor
   ------------------------------------------------------------ */

const segredoCsrf = randomBytes(32);

export function emitirCsrf(res) {
  const csrf = createHash("sha256")
    .update(segredoCsrf)
    .update(String(Date.now()))
    .digest("base64url")
    .slice(0, 32);
  anexarCookie(res, [
    `cm_admin_csrf=${csrf}`,
    "SameSite=Strict",
    "Path=/",
    "Max-Age=28800",
  ]);
  return csrf;
}

export function limparCookieCsrf(res) {
  anexarCookie(res, ["cm_admin_csrf=", "SameSite=Strict", "Path=/", "Max-Age=0"]);
}

export function csrfValido(req) {
  const esperado = lerCookie(req, "cm_admin_csrf");
  const recebido = req.headers["x-csrf-token"];
  if (!esperado || !recebido) return false;
  const a = Buffer.from(String(esperado));
  const b = Buffer.from(String(recebido));
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ------------------------------------------------------------
   RATE LIMIT — tentativas de login
   ------------------------------------------------------------ */

const tentativas = new Map();
const JANELA_MS = 15 * 60 * 1000;
const MAXIMO = 8;

export function excedeuLimiteLogin(chave) {
  const agora = Date.now();
  const registro = tentativas.get(chave) || [];
  const recente = registro.filter((t) => agora - t < JANELA_MS);
  if (recente.length >= MAXIMO) {
    tentativas.set(chave, recente);
    return true;
  }
  recente.push(agora);
  tentativas.set(chave, recente);
  return false;
}

export function limparLimiteLogin(chave) {
  tentativas.delete(chave);
}

export { randomBytes };