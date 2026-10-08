/* ==========================================================
   CLEAR MINDS — API administrativa
   ==========================================================
   Porta única de entrada. TODA rota passa por exigirAdmin(),
   que decide lendo role no banco. Se o papel não for "admin",
   a resposta é 403 e a tentativa fica na auditoria.
   ========================================================== */

import { db, buscarAdminPorId, buscarAdminPorEmail, ehAdminAtivo, agoraISO } from "./db.js";
import {
  lerSessaoDoPedido,
  conferirSenha,
  gerarHashSenha,
  validarForcaSenha,
  criarSessao,
  salvarTokenSessao,
  destruirSessao,
  destruirSessoesDoAdmin,
  csrfValido,
  emitirCsrf,
  limparCookieSessao,
  limparCookieCsrf,
  definirCookieSessao,
  excedeuLimiteLogin,
  limparLimiteLogin,
} from "./security.js";
import { registrarAuditoria, listarAuditoria, contarAuditoria } from "./audit.js";
import {
  importarDoNavegador,
  CHAVES_BLOQUEADAS as CHAVES_SENSIVEIS_NAO_IMPORTADAS,
  CAMPOS_SENSIVEIS,
} from "./importar.js";

/* Chaves do navegador que a ponte sabe gravar em tabela. */
const CHAVES_IMPORTADAS = [
  "cm_profile", "cm_profile_profissional", "cm_postagens",
  "cm_denuncias", "cm_consultas", "cm_agenda_profissional",
  "cm_conteudos_profissional", "cm_movimentacoes",
];
import {
  resumoDashboard,
  atividadeRecente,
  crescimentoMensal,
  utilizacao30Dias,
  financeiro,
  listarMovimentacoes,
  resolverPeriodo,
  resolverPeriodoCustomizado,
  estatisticasConsultas,
} from "./dados.js";

/* ------------------------------------------------------------
   HELPERS DE RESPOSTA
   ------------------------------------------------------------ */

const json = (res, status, dados) => {
  const corpo = JSON.stringify(dados);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(corpo);
};

const erro = (res, status, mensagem) => json(res, status, { erro: mensagem });

const agora = () => new Date().toISOString();

/** Lê e valida o corpo JSON com limite de tamanho. */
function lerCorpo(req, limiteBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let bruto = "";
    let tamanho = 0;
    req.on("data", (pedaco) => {
      tamanho += pedaco.length;
      if (tamanho > limiteBytes) {
        reject(new Error("Corpo grande demais."));
        req.destroy();
        return;
      }
      bruto += pedaco;
    });
    req.on("end", () => {
      if (!bruto) return resolve({});
      try {
        resolve(JSON.parse(bruto));
      } catch {
        reject(new Error("JSON inválido."));
      }
    });
    req.on("error", reject);
  });
}

const texto = (v, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/**
 * req.url é uma string simples ("/api/admin/usuarios?q=ana"),
 * não um objeto URL. Este helper devolve os searchParams.
 */
function parametros(req) {
  try {
    return new URL(req.url, "http://localhost").searchParams;
  } catch {
    return new URLSearchParams();
  }
}

/* ------------------------------------------------------------
   GUARDA DE AUTORIZAÇÃO
   ------------------------------------------------------------ */

/**
 * Middleware. Lê a sessão do cookie, valida no banco e exige
 * role = 'admin'. Não existe parâmetro vindo do cliente que
 * possa contornar isto — o role é sempre o do banco.
 */
function exigirAdmin(req, res) {
  const sessao = lerSessaoDoPedido(req);

  if (!sessao) {
    erro(res, 401, "Sessão inexistente ou expirada. Faça login novamente.");
    return null;
  }

  const admin = buscarAdminPorId(sessao.admin_id);
  if (!ehAdminAtivo(admin)) {
    // conta desativada ou setup pendente: derruba a sessão
    destruirSessao(sessao.token);
    limparCookieSessao(res);
    registrarAuditoria(sessao, "acesso.negado", "sessao", null, "negado", {
      motivo: "conta inativa ou setup pendente",
    });
    erro(res, 403, "Acesso negado.");
    return null;
  }

  // prolonga a sessão a cada uso
  salvarTokenSessao(sessao.token);

  return { ...sessao, role: admin.role };
}

/** Mutações exigem CSRF além da sessão. */
function exigirCsrf(req, res, sessao) {
  if (csrfValido(req)) return true;
  registrarAuditoria(sessao, "csrf.rejeitado", req.url || null, null, "negado", {
    motivo: "token csrf ausente ou invalido",
  });
  erro(res, 403, "Requisição rejeitada (CSRF). Recarregue a página.");
  return false;
}

/* ------------------------------------------------------------
   ROTEADOR
   ------------------------------------------------------------ */

const rotas = [];
const rota = (metodo, caminho, manipulador, opcoes = {}) =>
  rotas.push({ metodo, caminho, manipulador, ...opcoes });

/* ============================================================
   AUTENTICAÇÃO
   ============================================================ */

/* Estado do setup: qual conta ainda não definiu senha. */
rota("GET", "/api/admin/estado", async (req, res) => {
  const admin = buscarAdminPorEmail(
    process.env.CM_ADMIN_EMAIL || "manu.bernst@icloud.com"
  );
  const jaExisteOutro = db
    .prepare("SELECT COUNT(*) AS n FROM admins WHERE setup_feito = 1 AND id <> ?")
    .get(admin?.id ?? 0).n;

  json(res, 200, {
    setupNecessario: Boolean(admin && admin.setup_feito === 0),
    emailInicial: admin ? admin.email : null,
    adminsCadastrados: jaExisteOutro,
  });
});

/* Passo 1 do primeiro acesso: confirma o e-mail da conta. */
rota("POST", "/api/admin/setup/identificar", async (req, res) => {
  const corpo = await lerCorpo(req);
  const email = texto(corpo.email, 160).toLowerCase();

  if (excedeuLimiteLogin(`setup:${email}`)) {
    registrarAuditoria(null, "setup.limite", "admin", null, "negado", { email });
    return erro(res, 429, "Muitas tentativas. Aguarde alguns minutos.");
  }

  const admin = buscarAdminPorEmail(email);
  if (!admin || admin.setup_feito === 1) {
    registrarAuditoria(null, "setup.negado", "admin", null, "negado", { email });
    return erro(res, 404, "E-mail não corresponde a uma conta em setup.");
  }

  emitirCsrf(res);
  json(res, 200, { email: admin.email, proximoPasso: "definir-senha" });
});

/* Passo 2: o admin cria a própria senha. Ela nunca é enviada
   por mim ao código — nasce aqui, direto no navegador dele,
   e o servidor guarda apenas o hash scrypt. */
rota("POST", "/api/admin/setup/definir-senha", async (req, res) => {
  const corpo = await lerCorpo(req);
  const email = texto(corpo.email, 160).toLowerCase();
  const senha = typeof corpo.senha === "string" ? corpo.senha : "";
  const confirmacao = typeof corpo.confirmacao === "string" ? corpo.confirmacao : "";

  if (excedeuLimiteLogin(`setup:${email}`)) {
    registrarAuditoria(null, "setup.limite", "admin", null, "negado", { email });
    return erro(res, 429, "Muitas tentativas. Aguarde alguns minutos.");
  }
  if (!csrfValido(req)) {
    return erro(res, 403, "Requisição rejeitada (CSRF). Recarregue a página.");
  }
  if (senha !== confirmacao) {
    return erro(res, 400, "As senhas não coincidem.");
  }
  const forca = validarForcaSenha(senha);
  if (forca) return erro(res, 400, forca);

  const admin = buscarAdminPorEmail(email);
  if (!admin || admin.setup_feito === 1) {
    registrarAuditoria(null, "setup.negado", "admin", null, "negado", { email });
    return erro(res, 404, "Conta indisponível para setup.");
  }

  const hash = gerarHashSenha(senha);
  db.prepare(
    "UPDATE admins SET senha_hash = ?, setup_feito = 1 WHERE id = ?"
  ).run(hash, admin.id);

  // nenhum campo de senha entra na auditoria
  registrarAuditoria({ admin_id: admin.id, email: admin.email },
    "setup.concluido", "admin", admin.id, "sucesso", { email: admin.email });

  limparLimiteLogin(`setup:${email}`);
  emitirCsrf(res);
  json(res, 200, { ok: true, mensagem: "Senha criada. Faça login." });
});

/* Login administrativo. */
rota("POST", "/api/admin/login", async (req, res) => {
  const corpo = await lerCorpo(req);
  const email = texto(corpo.email, 160).toLowerCase();
  const senha = typeof corpo.senha === "string" ? corpo.senha : "";

  if (excedeuLimiteLogin(`login:${email}`)) {
    registrarAuditoria(null, "login.limite", "admin", null, "negado", { email });
    return erro(res, 429, "Muitas tentativas. Aguarde alguns minutos.");
  }

  const admin = buscarAdminPorEmail(email);

  // resposta genérica: não revela se o e-mail existe
  const generico = () => erro(res, 401, "E-mail ou senha inválidos.");

  if (!admin || admin.setup_feito === 0 || admin.ativo !== 1) {
    registrarAuditoria(null, "login.falha", "admin", null, "falha", { email });
    return generico();
  }

  if (!conferirSenha(senha, admin.senha_hash)) {
    registrarAuditoria({ admin_id: admin.id, email: admin.email },
      "login.falha", "admin", admin.id, "falha", { email });
    return generico();
  }

  const { token, expira_em } = criarSessao(admin.id, req);
  definirCookieSessao(res, token, expira_em);
  emitirCsrf(res);

  db.prepare("UPDATE admins SET ultimo_login = ? WHERE id = ?").run(agora(), admin.id);
  registrarAuditoria({ admin_id: admin.id, email: admin.email },
    "login.admin", "sessao", null, "sucesso", { email });

  limparLimiteLogin(`login:${email}`);
  json(res, 200, { ok: true, email: admin.email, role: admin.role, expira_em });
});

rota("POST", "/api/admin/logout", async (req, res) => {
  const sessao = lerSessaoDoPedido(req);
  if (sessao) {
    registrarAuditoria(sessao, "logout.admin", "sessao", null, "sucesso", null);
    destruirSessao(sessao.token);
  }
  limparCookieSessao(res);
  limparCookieCsrf(res);
  json(res, 200, { ok: true });
});

/* Quem sou eu — usado pelo bootstrap do front-end. */
rota("GET", "/api/admin/eu", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

  const admin = buscarAdminPorId(sessao.admin_id);
  emitirCsrf(res);
  json(res, 200, {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    nome: admin.nome,
    sobrenome: admin.sobrenome,
    telefone: admin.telefone,
    foto: admin.foto,
    cargo: admin.cargo,
    descricao: admin.descricao,
    ultimo_login: admin.ultimo_login,
  });
});

/* ============================================================
   PERFIL DO ADMIN
   ============================================================ */

/* O role NÃO é editável por aqui, nem qualquer campo de
   permissão. O SQL só toca campos de perfil. */
const CAMPOS_PERFIL_EDITAVEIS = ["nome", "sobrenome", "telefone", "foto", "cargo", "descricao"];

rota("PUT", "/api/admin/perfil", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const admin = buscarAdminPorId(sessao.admin_id);

  const novo = {};
  for (const campo of CAMPOS_PERFIL_EDITAVEIS) {
    if (corpo[campo] === undefined) continue;
    novo[campo] = texto(corpo[campo], campo === "foto" ? 400000 : 300);
  }

  const emailNovo = corpo.email !== undefined
    ? texto(corpo.email, 160).toLowerCase()
    : admin.email;

  if (emailNovo !== admin.email) {
    const existente = buscarAdminPorEmail(emailNovo);
    if (existente) {
      return erro(res, 409, "Este e-mail já está em uso.");
    }
  }

  const sets = [];
  const valores = [];
  for (const campo of [...CAMPOS_PERFIL_EDITAVEIS, "email"]) {
    if (novo[campo] !== undefined) { sets.push(`${campo} = ?`); valores.push(novo[campo]); }
    else if (campo === "email") { sets.push("email = ?"); valores.push(emailNovo); }
  }

  db.prepare(`UPDATE admins SET ${sets.join(", ")} WHERE id = ?`)
    .run(...valores, admin.id);

  // Só grava o que mudou, e nunca email de sessão por acidente.
  const alterados = Object.keys(novo);
  if (alterados.length) {
    registrarAuditoria(sessao, "perfil.alterado", "admin", admin.id, "sucesso", {
      email: emailNovo,
      campos: alterados.join(","),
    });
  }

  const atualizado = buscarAdminPorId(admin.id);
  json(res, 200, { ok: true, admin: atualizado });
});

rota("PUT", "/api/admin/perfil/senha", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const admin = buscarAdminPorId(sessao.admin_id);
  const atual = typeof corpo.atual === "string" ? corpo.atual : "";
  const nova = typeof corpo.nova === "string" ? corpo.nova : "";
  const confirmacao = typeof corpo.confirmacao === "string" ? corpo.confirmacao : "";

  if (!conferirSenha(atual, admin.senha_hash)) {
    registrarAuditoria(sessao, "senha.troca", "admin", admin.id, "falha", {
      email: admin.email,
    });
    return erro(res, 401, "Senha atual incorreta.");
  }
  if (nova !== confirmacao) return erro(res, 400, "As senhas não coincidem.");
  const forca = validarForcaSenha(nova);
  if (forca) return erro(res, 400, forca);
  if (atual === nova) {
    return erro(res, 400, "A nova senha deve ser diferente da atual.");
  }

  db.prepare("UPDATE admins SET senha_hash = ? WHERE id = ?")
    .run(gerarHashSenha(nova), admin.id);

  // troca de senha encerra as outras sessões
  destruirSessoesDoAdmin(admin.id);
  const { token, expira_em } = criarSessao(admin.id, req);
  definirCookieSessao(res, token, expira_em);
  emitirCsrf(res);

  registrarAuditoria(sessao, "senha.troca", "admin", admin.id, "sucesso", {
    email: admin.email,
  });

  json(res, 200, { ok: true, mensagem: "Senha alterada." });
});

/* ============================================================
   DASHBOARD
   ============================================================ */

rota("GET", "/api/admin/dashboard", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  json(res, 200, {
    resumo: resumoDashboard(),
    atividade: atividadeRecente(8),
    /* item 16: nada de diário, nada de dado clínico aqui */
    dadosSensiveisExpostos: false,
  });
});

/* ============================================================
   USUÁRIOS
   ============================================================ */

rota("GET", "/api/admin/usuarios", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

  const q = texto(parametros(req).get("q"), 120);
  const status = texto(parametros(req).get("status"), 20);

  const condicoes = [];
  const params = [];
  if (q) {
    condicoes.push("(nome LIKE ? OR email LIKE ? OR IFNULL(sobrenome,'') LIKE ? OR IFNULL(telefone,'') LIKE ?)");
    const alvo = `%${q}%`;
    params.push(alvo, alvo, alvo, alvo);
  }
  if (["ativo", "inativo", "bloqueado"].includes(status)) {
    if (status === "bloqueado") condicoes.push("bloqueado = 1");
    else condicoes.push("status = ? AND bloqueado = 0");
    if (status !== "bloqueado") params.push(status);
  }
  const onde = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  const lista = db
    .prepare(
      `SELECT id, nome, sobrenome, email, telefone, foto, status, bloqueado, data_cadastro
         FROM usuarios ${onde} ORDER BY nome COLLATE NOCASE`
    )
    .all(...params);

  json(res, 200, { usuarios: lista });
});

/* Ações destrutivas exigem confirmação explícita no corpo. */
function exigirConfirmacao(corpo, res) {
  if (corpo.confirmar === true) return true;
  erro(res, 400, "Confirmação obrigatória para esta ação.");
  return false;
}

rota("POST", "/api/admin/usuarios", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const nome = texto(corpo.nome, 120);
  const email = texto(corpo.email, 160).toLowerCase();

  if (!nome) return erro(res, 400, "Informe o nome.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return erro(res, 400, "Informe um e-mail válido.");
  }
  if (buscarUsuarioPorEmail(email)) {
    return erro(res, 409, "Já existe um usuário com este e-mail.");
  }

  const info = db
    .prepare(
      `INSERT INTO usuarios (nome, sobrenome, email, telefone, foto, status, data_cadastro)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      nome,
      texto(corpo.sobrenome, 120) || null,
      email,
      texto(corpo.telefone, 40) || null,
      typeof corpo.foto === "string" && corpo.foto.startsWith("data:image/") ? corpo.foto.slice(0, 400000) : null,
      "ativo",
      agora()
    );

  registrarAuditoria(sessao, "usuario.criado", "usuario", info.lastInsertRowid, "sucesso", {
    email,
    nome,
  });
  json(res, 201, { ok: true, id: Number(info.lastInsertRowid) });
});

function buscarUsuarioPorEmail(email) {
  return db.prepare("SELECT * FROM usuarios WHERE email = ? COLLATE NOCASE").get(email);
}

rota("PUT", "/api/admin/usuarios/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const alvo = buscarUsuario(params.id);
  if (!alvo) return erro(res, 404, "Usuário não encontrado.");

  const permitidos = ["nome", "sobrenome", "telefone", "status", "bloqueado"];
  const sets = [];
  const valores = [];
  const alterados = [];

  for (const campo of permitidos) {
    if (corpo[campo] === undefined) continue;
    if (campo === "status" && !["ativo", "inativo"].includes(corpo[campo])) {
      return erro(res, 400, "Status inválido.");
    }
    let valor = corpo[campo];
    if (campo === "bloqueado") valor = valor ? 1 : 0;
    else valor = texto(valor, 160) || null;
    sets.push(`${campo} = ?`);
    valores.push(valor);
    alterados.push(campo);
  }

  if (corpo.email !== undefined) {
    const email = texto(corpo.email, 160).toLowerCase();
    if (email !== alvo.email) {
      const dup = buscarUsuarioPorEmail(email);
      if (dup && dup.id !== alvo.id) return erro(res, 409, "E-mail já em uso.");
      sets.push("email = ?");
      valores.push(email);
      alterados.push("email");
    }
  }

  if (!sets.length) return json(res, 200, { ok: true, semAlteracoes: true });

  db.prepare(`UPDATE usuarios SET ${sets.join(", ")} WHERE id = ?`)
    .run(...valores, alvo.id);

  registrarAuditoria(sessao, "usuario.alterado", "usuario", alvo.id, "sucesso", {
    email: alvo.email,
    campos: alterados.join(","),
  });
  json(res, 200, { ok: true });
});

function buscarUsuario(id) {
  return db.prepare("SELECT * FROM usuarios WHERE id = ?").get(Number(id));
}

rota("DELETE", "/api/admin/usuarios/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  if (!exigirConfirmacao(corpo, res)) return;

  const alvo = buscarUsuario(params.id);
  if (!alvo) return erro(res, 404, "Usuário não encontrado.");

  db.prepare("DELETE FROM usuarios WHERE id = ?").run(alvo.id);
  registrarAuditoria(sessao, "usuario.excluido", "usuario", alvo.id, "sucesso", {
    email: alvo.email,
    nome: alvo.nome,
  });
  json(res, 200, { ok: true });
});

/* Ativar/desativar e bloquear/desbloquear — verbos explícitos,
   não um PATCH genérico, para que a auditoria seja precisa. */
for (const [rotaNome, campo, acao, valor] of [
  ["ativar", "status", "usuario.ativado", "ativo"],
  ["desativar", "status", "usuario.desativado", "inativo"],
  ["bloquear", "bloqueado", "usuario.bloqueado", 1],
  ["desbloquear", "bloqueado", "usuario.desbloqueado", 0],
]) {
  rota("POST", `/api/admin/usuarios/:id/${rotaNome}`, async (req, res, params) => {
    const sessao = exigirAdmin(req, res);
    if (!sessao) return;
    if (!exigirCsrf(req, res, sessao)) return;

    const alvo = buscarUsuario(params.id);
    if (!alvo) return erro(res, 404, "Usuário não encontrado.");

    db.prepare(`UPDATE usuarios SET ${campo} = ? WHERE id = ?`).run(valor, alvo.id);
    registrarAuditoria(sessao, acao, "usuario", alvo.id, "sucesso", {
      email: alvo.email,
      status: valor,
    });
    json(res, 200, { ok: true });
  });
}

/* ============================================================
   PROFISSIONAIS
   ============================================================ */

rota("GET", "/api/admin/profissionais", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

  const q = texto(parametros(req).get("q"), 120);
  const status = texto(parametros(req).get("status"), 20);

  const condicoes = [];
  const params = [];
  if (q) {
    condicoes.push("(nome LIKE ? OR email LIKE ? OR IFNULL(registro,'') LIKE ? OR IFNULL(especialidade,'') LIKE ?)");
    const alvo = `%${q}%`;
    params.push(alvo, alvo, alvo, alvo);
  }
  if (["pendente", "aprovado", "rejeitado", "ativo", "inativo", "bloqueado"].includes(status)) {
    if (status === "bloqueado") condicoes.push("bloqueado = 1");
    else if (["aprovado", "ativo"].includes(status)) condicoes.push("status IN ('aprovado','ativo')");
    else { condicoes.push("status = ?"); params.push(status); }
  }
  const onde = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  const lista = db
    .prepare(
      `SELECT id, nome, email, telefone, foto, registro, especialidade, bio,
              status, bloqueado, data_cadastro
         FROM profissionais ${onde} ORDER BY nome COLLATE NOCASE`
    )
    .all(...params);

  json(res, 200, { profissionais: lista });
});

rota("PUT", "/api/admin/profissionais/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const alvo = db.prepare("SELECT * FROM profissionais WHERE id = ?").get(Number(params.id));
  if (!alvo) return erro(res, 404, "Profissional não encontrado.");

  const permitidos = ["nome", "email", "telefone", "registro", "especialidade", "bio"];
  const sets = [];
  const valores = [];
  const alterados = [];

  for (const campo of permitidos) {
    if (corpo[campo] === undefined) continue;
    sets.push(`${campo} = ?`);
    valores.push(texto(corpo[campo], campo === "bio" ? 1000 : 160) || null);
    alterados.push(campo);
  }
  if (!sets.length) return json(res, 200, { ok: true, semAlteracoes: true });

  db.prepare(`UPDATE profissionais SET ${sets.join(", ")} WHERE id = ?`)
    .run(...valores, alvo.id);

  registrarAuditoria(sessao, "profissional.alterado", "profissional", alvo.id, "sucesso", {
    email: alvo.email,
    campos: alterados.join(","),
  });
  json(res, 200, { ok: true });
});

function buscarProfissional(id) {
  return db.prepare("SELECT * FROM profissionais WHERE id = ?").get(Number(id));
}

/* Aprovar / rejeitar / ativar / inativar / bloquear / desbloquear. */
const TRANSICOES_PROF = [
  ["aprovar", "aprovado", "profissional.aprovado"],
  ["rejeitar", "rejeitado", "profissional.rejeitado"],
  ["ativar", "ativo", "profissional.ativado"],
  ["desativar", "inativo", "profissional.desativado"],
];

for (const [nomeRota, novoStatus, acao] of TRANSICOES_PROF) {
  rota("POST", `/api/admin/profissionais/:id/${nomeRota}`, async (req, res, params) => {
    const sessao = exigirAdmin(req, res);
    if (!sessao) return;
    if (!exigirCsrf(req, res, sessao)) return;

    const corpo = await lerCorpo(req);
    const alvo = buscarProfissional(params.id);
    if (!alvo) return erro(res, 404, "Profissional não encontrado.");

    if (novoStatus === "rejeitado") {
      const motivo = texto(corpo.motivo, 300);
      if (!motivo) return erro(res, 400, "Informe o motivo da rejeição.");
      db.prepare("UPDATE profissionais SET status = ?, bio = COALESCE(bio,'') WHERE id = ?")
        .run(novoStatus, alvo.id);
      registrarAuditoria(sessao, acao, "profissional", alvo.id, "sucesso", {
        email: alvo.email, status: novoStatus, motivo,
      });
    } else {
      db.prepare("UPDATE profissionais SET status = ? WHERE id = ?").run(novoStatus, alvo.id);
      registrarAuditoria(sessao, acao, "profissional", alvo.id, "sucesso", {
        email: alvo.email, status: novoStatus,
      });
    }
    json(res, 200, { ok: true });
  });
}

for (const [nomeRota, valor, acao] of [
  ["bloquear", 1, "profissional.bloqueado"],
  ["desbloquear", 0, "profissional.desbloqueado"],
]) {
  rota("POST", `/api/admin/profissionais/:id/${nomeRota}`, async (req, res, params) => {
    const sessao = exigirAdmin(req, res);
    if (!sessao) return;
    if (!exigirCsrf(req, res, sessao)) return;

    const alvo = buscarProfissional(params.id);
    if (!alvo) return erro(res, 404, "Profissional não encontrado.");

    db.prepare("UPDATE profissionais SET bloqueado = ? WHERE id = ?").run(valor, alvo.id);
    registrarAuditoria(sessao, acao, "profissional", alvo.id, "sucesso", { email: alvo.email });
    json(res, 200, { ok: true });
  });
}

rota("DELETE", "/api/admin/profissionais/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  if (!exigirConfirmacao(corpo, res)) return;

  const alvo = buscarProfissional(params.id);
  if (!alvo) return erro(res, 404, "Profissional não encontrado.");

  db.prepare("DELETE FROM profissionais WHERE id = ?").run(alvo.id);
  registrarAuditoria(sessao, "profissional.excluido", "profissional", alvo.id, "sucesso", {
    email: alvo.email, nome: alvo.nome,
  });
  json(res, 200, { ok: true });
});

/* ============================================================
   COMUNIDADE
   ============================================================ */

rota("GET", "/api/admin/comunidade", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

  const publicacoes = db
    .prepare(
      `SELECT p.id, p.autor_nome, p.autor_tipo, p.conteudo, p.criada_em, p.removida,
              (SELECT COUNT(*) FROM comentarios c
                WHERE c.publicacao_id = p.id AND c.removido = 0) AS comentarios
         FROM publicacoes p
        ORDER BY p.criada_em DESC`
    )
    .all();

  const comentarios = db
    .prepare(
      `SELECT id, publicacao_id, autor_nome, conteudo, criado_em, removido
         FROM comentarios ORDER BY criado_em DESC`
    )
    .all();

  json(res, 200, { publicacoes, comentarios });
});

/* Toda remoção exige motivo: o item 6 proíbe apagar em silêncio. */
function exigirMotivo(corpo, res) {
  const motivo = texto(corpo.motivo, 300);
  if (!motivo) {
    erro(res, 400, "Informe o motivo da remoção (obrigatório para auditoria).");
    return null;
  }
  return motivo;
}

rota("DELETE", "/api/admin/publicacoes/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const motivo = exigirMotivo(corpo, res);
  if (!motivo) return;

  const alvo = db.prepare("SELECT * FROM publicacoes WHERE id = ?").get(Number(params.id));
  if (!alvo) return erro(res, 404, "Publicação não encontrada.");

  db.prepare("UPDATE publicacoes SET removida = 1, removida_em = ? WHERE id = ?")
    .run(agora(), alvo.id);

  registrarAuditoria(sessao, "publicacao.removida", "publicacao", alvo.id, "sucesso", {
    motivo,
    autor: alvo.autor_nome,
  });
  json(res, 200, { ok: true });
});

rota("DELETE", "/api/admin/comentarios/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const motivo = exigirMotivo(corpo, res);
  if (!motivo) return;

  const alvo = db.prepare("SELECT * FROM comentarios WHERE id = ?").get(Number(params.id));
  if (!alvo) return erro(res, 404, "Comentário não encontrado.");

  db.prepare("UPDATE comentarios SET removido = 1, removido_em = ? WHERE id = ?")
    .run(agora(), alvo.id);

  registrarAuditoria(sessao, "comentario.removido", "comentario", alvo.id, "sucesso", {
    motivo, autor: alvo.autor_nome,
  });
  json(res, 200, { ok: true });
});

/* ============================================================
   DENÚNCIAS
   ============================================================ */

rota("GET", "/api/admin/denuncias", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  const lista = db
    .prepare("SELECT * FROM denuncias ORDER BY criada_em DESC")
    .all();
  json(res, 200, { denuncias: lista });
});

const STATUS_DENUNCIA = ["pendente", "em_analise", "resolvida", "arquivada"];

rota("PUT", "/api/admin/denuncias/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const alvo = db.prepare("SELECT * FROM denuncias WHERE id = ?").get(Number(params.id));
  if (!alvo) return erro(res, 404, "Denúncia não encontrada.");

  const status = corpo.status !== undefined ? texto(corpo.status, 20) : alvo.status;
  if (!STATUS_DENUNCIA.includes(status)) {
    return erro(res, 400, "Status de denúncia inválido.");
  }

  let acao = texto(corpo.acao, 300) || null;

  // "remover conteúdo" a partir da denúncia remove a publicação
  // citada e deixa rastro nos dois lados.
  if (corpo.removerConteudo === true) {
    const motivo = exigirMotivo(corpo, res);
    if (!motivo) return;
    if (alvo.tipo_alvo === "publicacao" && alvo.alvo_id) {
      db.prepare("UPDATE publicacoes SET removida = 1, removida_em = ? WHERE id = ?")
        .run(agora(), alvo.alvo_id);
      registrarAuditoria(sessao, "publicacao.removida", "publicacao", alvo.alvo_id, "sucesso", {
        motivo, origem: `denuncia:${alvo.id}`,
      });
    } else if (alvo.tipo_alvo === "comentario" && alvo.alvo_id) {
      db.prepare("UPDATE comentarios SET removido = 1, removido_em = ? WHERE id = ?")
        .run(agora(), alvo.alvo_id);
      registrarAuditoria(sessao, "comentario.removido", "comentario", alvo.alvo_id, "sucesso", {
        motivo, origem: `denuncia:${alvo.id}`,
      });
    }
    acao = acao || "conteudo removido";
  }

  if (corpo.bloquearAutor === true) {
    const nome = alvo.alvo_autor;
    if (nome) {
      db.prepare("UPDATE usuarios SET bloqueado = 1 WHERE nome = ?").run(nome);
      db.prepare("UPDATE profissionais SET bloqueado = 1 WHERE nome = ?").run(nome);
      registrarAuditoria(sessao, "autor.bloqueado", "usuario", nome, "sucesso", {
        nome, motivo: `denuncia:${alvo.id}`,
      });
      acao = acao || "autor bloqueado";
    }
  }

  const resolvida = status === "resolvida" ? agora() : null;
  db.prepare("UPDATE denuncias SET status = ?, acao = ?, resolvida_em = ? WHERE id = ?")
    .run(status, acao, resolvida, alvo.id);

  registrarAuditoria(sessao, "denuncia.atualizada", "denuncia", alvo.id, "sucesso", {
    status, motivo: alvo.motivo,
  });
  json(res, 200, { ok: true });
});

/* ============================================================
   CONTEÚDOS
   ============================================================ */

rota("GET", "/api/admin/conteudos", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  const conteudos = db
    .prepare(
      `SELECT c.id, c.titulo, c.corpo, c.categoria_id, c.destino, c.publicado,
              c.criado_em, c.atualizado_em, cat.nome AS categoria
         FROM conteudos c
         LEFT JOIN categorias cat ON cat.id = c.categoria_id
        ORDER BY c.criado_em DESC`
    )
    .all();
  const categorias = db.prepare("SELECT * FROM categorias ORDER BY destino, nome").all();
  json(res, 200, { conteudos, categorias });
});

rota("POST", "/api/admin/conteudos", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const titulo = texto(corpo.titulo, 200);
  const corpoTexto = texto(corpo.corpo, 20000);
  if (!titulo) return erro(res, 400, "Informe o título.");
  if (!corpoTexto) return erro(res, 400, "Informe o corpo do conteúdo.");

  const destino = corpo.destino === "profissionais" ? "profissionais" : "usuarios";
  const publicado = corpo.publicado ? 1 : 0;

  const info = db
    .prepare(
      `INSERT INTO conteudos (titulo, corpo, categoria_id, destino, publicado, criado_em)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(titulo, corpoTexto, Number(corpo.categoria_id) || null, destino, publicado, agora());

  registrarAuditoria(sessao, "conteudo.criado", "conteudo", info.lastInsertRowid, "sucesso", {
    titulo, destino, status: publicado ? "publicado" : "rascunho",
  });
  json(res, 201, { ok: true, id: Number(info.lastInsertRowid) });
});

rota("PUT", "/api/admin/conteudos/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const alvo = db.prepare("SELECT * FROM conteudos WHERE id = ?").get(Number(params.id));
  if (!alvo) return erro(res, 404, "Conteúdo não encontrado.");

  const sets = ["atualizado_em = ?"];
  const valores = [agora()];
  const alterados = [];

  if (corpo.titulo !== undefined) { sets.push("titulo = ?"); valores.push(texto(corpo.titulo, 200)); alterados.push("titulo"); }
  if (corpo.corpo !== undefined) { sets.push("corpo = ?"); valores.push(texto(corpo.corpo, 20000)); alterados.push("corpo"); }
  if (corpo.categoria_id !== undefined) { sets.push("categoria_id = ?"); valores.push(Number(corpo.categoria_id) || null); alterados.push("categoria"); }
  if (corpo.destino !== undefined) { sets.push("destino = ?"); valores.push(corpo.destino === "profissionais" ? "profissionais" : "usuarios"); alterados.push("destino"); }
  if (corpo.publicado !== undefined) { sets.push("publicado = ?"); valores.push(corpo.publicado ? 1 : 0); alterados.push("publicado"); }

  db.prepare(`UPDATE conteudos SET ${sets.join(", ")} WHERE id = ?`)
    .run(...valores, alvo.id);

  registrarAuditoria(sessao, "conteudo.alterado", "conteudo", alvo.id, "sucesso", {
    titulo: alvo.titulo, campos: alterados.join(","),
  });
  json(res, 200, { ok: true });
});

rota("DELETE", "/api/admin/conteudos/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  if (!exigirConfirmacao(corpo, res)) return;

  const alvo = db.prepare("SELECT * FROM conteudos WHERE id = ?").get(Number(params.id));
  if (!alvo) return erro(res, 404, "Conteúdo não encontrado.");

  db.prepare("DELETE FROM conteudos WHERE id = ?").run(alvo.id);
  registrarAuditoria(sessao, "conteudo.excluido", "conteudo", alvo.id, "sucesso", {
    titulo: alvo.titulo, destino: alvo.destino,
  });
  json(res, 200, { ok: true });
});

/* Categorias */
rota("POST", "/api/admin/categorias", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const nome = texto(corpo.nome, 120);
  if (!nome) return erro(res, 400, "Informe o nome da categoria.");
  const destino = corpo.destino === "profissionais" ? "profissionais" : "usuarios";

  try {
    const info = db
      .prepare("INSERT INTO categorias (nome, destino) VALUES (?, ?)")
      .run(nome, destino);
    registrarAuditoria(sessao, "categoria.criada", "categoria", info.lastInsertRowid, "sucesso", {
      nome, destino,
    });
    json(res, 201, { ok: true, id: Number(info.lastInsertRowid) });
  } catch {
    erro(res, 409, "Já existe uma categoria com este nome para este público.");
  }
});

rota("DELETE", "/api/admin/categorias/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  if (!exigirConfirmacao(corpo, res)) return;

  const alvo = db.prepare("SELECT * FROM categorias WHERE id = ?").get(Number(params.id));
  if (!alvo) return erro(res, 404, "Categoria não encontrada.");

  db.prepare("DELETE FROM categorias WHERE id = ?").run(alvo.id);
  registrarAuditoria(sessao, "categoria.excluida", "categoria", alvo.id, "sucesso", {
    nome: alvo.nome, destino: alvo.destino,
  });
  json(res, 200, { ok: true });
});

/* ============================================================
   AGENDAMENTOS
   ============================================================ */

rota("GET", "/api/admin/agendamentos", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  const consultas = db
    .prepare("SELECT * FROM consultas ORDER BY data DESC, hora DESC")
    .all();
  json(res, 200, { consultas, estatisticas: estatisticasConsultas() });
});

rota("PUT", "/api/admin/consultas/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const alvo = db.prepare("SELECT * FROM consultas WHERE id = ?").get(Number(params.id));
  if (!alvo) return erro(res, 404, "Consulta não encontrada.");

  const status = ["agendada", "realizada", "cancelada"].includes(corpo.status)
    ? corpo.status
    : alvo.status;

  db.prepare("UPDATE consultas SET status = ? WHERE id = ?").run(status, alvo.id);
  registrarAuditoria(sessao, "consulta.atualizada", "consulta", alvo.id, "sucesso", { status });
  json(res, 200, { ok: true });
});

/* ============================================================
   FINANCEIRO
   ============================================================ */

function periodoDaUrl(p) {
  const bruto = p?.get("periodo") || "mes";
  if (bruto === "personalizado") {
    return resolverPeriodoCustomizado(p.get("de"), p.get("ate"));
  }
  return resolverPeriodo(bruto);
}

rota("GET", "/api/admin/financeiro", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

  const { de, ate } = periodoDaUrl(parametros(req));
  const resumo = financeiro({ de, ate });
  const movimentacoes = listarMovimentacoes({ de, ate });

  json(res, 200, { periodo: { de, ate }, ...resumo, movimentacoes });
});

rota("POST", "/api/admin/movimentacoes", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const tipo = corpo.tipo === "despesa" ? "despesa" : "receita";
  const descricao = texto(corpo.descricao, 200);
  const valor = Number(corpo.valor);

  if (!descricao) return erro(res, 400, "Informe a descrição.");
  if (!Number.isFinite(valor) || valor <= 0) {
    return erro(res, 400, "Informe um valor maior que zero.");
  }

  const data = texto(corpo.data, 10) || agora().slice(0, 10);
  const status = corpo.status === "pendente" ? "pendente" : "pago";

  const info = db
    .prepare(
      `INSERT INTO movimentacoes (tipo, descricao, valor, data, categoria, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(tipo, descricao, valor, data, texto(corpo.categoria, 80) || null, status);

  registrarAuditoria(sessao, "movimentacao.criada", "financeiro", info.lastInsertRowid, "sucesso", {
    tipo, valor, status, periodo: data,
  });
  json(res, 201, { ok: true, id: Number(info.lastInsertRowid) });
});

rota("DELETE", "/api/admin/movimentacoes/:id", async (req, res, params) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  if (!exigirConfirmacao(corpo, res)) return;

  const alvo = db.prepare("SELECT * FROM movimentacoes WHERE id = ?").get(Number(params.id));
  if (!alvo) return erro(res, 404, "Movimentação não encontrada.");

  db.prepare("DELETE FROM movimentacoes WHERE id = ?").run(alvo.id);
  registrarAuditoria(sessao, "movimentacao.excluida", "financeiro", alvo.id, "sucesso", {
    tipo: alvo.tipo, valor: alvo.valor, periodo: alvo.data,
  });
  json(res, 200, { ok: true });
});

/* ============================================================
   RELATÓRIOS
   ============================================================ */

rota("GET", "/api/admin/relatorios", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

  const meses = Math.min(
    24,
    Math.max(3, Number(parametros(req).get("meses")) || 6)
  );

  json(res, 200, {
    crescimento: crescimentoMensal(meses),
    utilizacao: utilizacao30Dias(),
    resumo: resumoDashboard(),
  });
});

/* ============================================================
   AUDITORIA
   ============================================================ */

rota("GET", "/api/admin/auditoria", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

  const p = parametros(req);
  const filtro = texto(p?.get("filtro"), 120);
  const limite = Math.min(500, Math.max(1, Number(p?.get("limite")) || 200));
  const offset = Math.max(0, Number(p?.get("offset")) || 0);

  json(res, 200, {
    registros: listarAuditoria({ limite, offset, filtro }),
    total: contarAuditoria(filtro),
    limite,
    offset,
  });
});

/* ============================================================
   CONFIGURAÇÕES DO SISTEMA
   ============================================================ */

rota("GET", "/api/admin/config", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

  const linhas = db
    .prepare("SELECT chave, valor, atualizado_em, atualizado_por FROM config_sistema ORDER BY chave")
    .all();

  const categorias = db
    .prepare("SELECT * FROM categorias ORDER BY destino, nome")
    .all();

  json(res, 200, { config: Object.fromEntries(linhas.map((l) => [l.chave, l.valor])), metadados: linhas, categorias });
});

/* Prefixos que o admin pode editar. Qualquer outra chave é
   rejeitada — inclusive onde alguém tentaria mexer em permissão. */
const CHAVES_EDITAVEIS = new Set([
  "nome_sistema", "descricao_sistema", "contato_email",
  "permitir_cadastro_usuarios", "permitir_cadastro_profissionais",
  "regra_denuncia", "regra_sem_julgamento", "regra_privacidade",
  "max_denuncias_pendentes", "notificar_admin_denuncia",
]);

const CHAVES_BLOQUEADAS = new Set([
  "admin_email", "senha_hash", "role", "token", "sessao",
]);

rota("PUT", "/api/admin/config", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req);
  const entradas = Object.entries(corpo.config || {});

  if (!entradas.length) return erro(res, 400, "Nada para atualizar.");

  const alteradas = [];
  for (const [chave, valor] of entradas) {
    if (CHAVES_BLOQUEADAS.has(chave.toLowerCase())) {
      registrarAuditoria(sessao, "config.tentativa", "config", chave, "negado", {
        motivo: "chave protegida",
      });
      return erro(res, 403, `A chave "${chave}" não pode ser alterada por aqui.`);
    }
    if (!CHAVES_EDITAVEIS.has(chave)) {
      return erro(res, 400, `Chave desconhecida: ${chave}.`);
    }
    db.prepare(
      `INSERT INTO config_sistema (chave, valor, atualizado_em, atualizado_por)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(chave) DO UPDATE SET
         valor = excluded.valor,
         atualizado_em = excluded.atualizado_em,
         atualizado_por = excluded.atualizado_por`
    ).run(chave, texto(valor, 2000), agora(), sessao.email);
    alteradas.push(chave);
  }

  registrarAuditoria(sessao, "config.alterada", "config", alteradas.join(","), "sucesso", {
    campos: alteradas.join(",").slice(0, 300),
  });
  json(res, 200, { ok: true, alteradas });
});

/* ============================================================
   IMPORTAÇÃO DOS DADOS DO NAVEGADOR
   ============================================================
   O app existente vive em localStorage. Esta rota é a ponte:
   o navegador entrega o que tem e o servidor grava no SQLite.
   Chaves de diário, humor e bem-estar são recusadas na entrada.
   ============================================================ */

rota("GET", "/api/admin/importar/previa", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  json(res, 200, {
    chavesAceitas: CHAVES_IMPORTADAS,
    chavesBloqueadas: CHAVES_SENSIVEIS_NAO_IMPORTADAS,
    camposSensiveisIgnorados: CAMPOS_SENSIVEIS,
  });
});

rota("POST", "/api/admin/importar", async (req, res) => {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  if (!exigirCsrf(req, res, sessao)) return;

  const corpo = await lerCorpo(req, 2 * 1024 * 1024);
  const payload = corpo.dados;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return erro(res, 400, "Envie um objeto com as chaves do navegador.");
  }

  const resumo = importarDoNavegador(payload);

  registrarAuditoria(sessao, "dados.importados", "importacao", null, "sucesso", {
    usuarios: resumo.usuarios,
    profissionais: resumo.profissionais,
    publicacoes: resumo.publicacoes,
    comentarios: resumo.comentarios,
    denuncias: resumo.denuncias,
    consultas: resumo.consultas,
    conteudos: resumo.conteudos,
    movimentacoes: resumo.movimentacoes,
    chaves_rejeitadas: resumo.rejeitadas.join(",") || null,
  });

  /* Nenhum campo sensível volta na resposta, nem por acidente. */
  json(res, 200, { ok: true, resumo });
});

/* ============================================================
   GUARDA FINAL: rota desconhecida na API
   ============================================================ */

async function tratar(req, res, caminhoMetodo) {
  for (const r of rotas) {
    if (r.metodo !== req.method) continue;

    const params = {};
    const regex = new RegExp(
      "^" + r.caminho.replace(/:([A-Za-z_]+)/g, "(?<$1>[^/]+)") + "$"
    );
    const achou = caminhoMetodo.match(regex);
    if (!achou) continue;

    try {
      await r.manipulador(req, res, { ...params, ...achou.groups }, caminhoMetodo);
    } catch (e) {
      console.error("[api] erro em", req.method, caminhoMetodo, e);
      if (!res.headersSent) erro(res, 500, "Erro interno. Tente novamente.");
    }
    return true;
  }
  return false;
}

export { tratar };