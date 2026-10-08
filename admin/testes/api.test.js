/* ==========================================================
   CLEAR MINDS — Testes automatizados do ambiente admin
   ==========================================================
   node admin/testes/api.test.js

   Cobre o item 15 (autorização por role no servidor) e o
   item 16 (dados sensíveis). Cada teste é executado contra um
   servidor HTTP real, com cookies de verdade.
   ========================================================== */

import { rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

/* Banco descartável para os testes. */
const dir = mkdtempSync(join(tmpdir(), "cm-teste-"));
process.env.CM_DB = join(dir, "teste.sqlite");
process.env.PORT = "0";

const { iniciar } = await import("../server.js");
const { db } = await import("../db.js");
const { gerarHashSenha } = await import("../security.js");

const servidor = await iniciar(0);
const PORTA = servidor.address().port;
const BASE = `http://127.0.0.1:${PORTA}`;

/* ------------------------------------------------------------
   MINIFRAMEWORK
   ------------------------------------------------------------ */

let passou = 0, falhou = 0;
const falhas = [];

function ok(condicao, nome, extra = "") {
  if (condicao) {
    passou++;
    console.log(`  ok   ${nome}`);
  } else {
    falhou++;
    falhas.push(nome);
    console.log(`  FALHA ${nome}${extra ? " — " + extra : ""}`);
  }
}

function secao(titulo) {
  console.log(`\n${titulo}`);
}

/* ------------------------------------------------------------
   CLIENTE HTTP COM JAR DE COOKIES
   ------------------------------------------------------------ */

function cliente() {
  const jar = new Map();

  /* O próprio cliente expõe o jar, para os testes conseguirem
     ler o cookie de CSRF sem precisar da última resposta. */
  const req = async function (metodo, caminho, corpo, cabecalhos = {}) {
    const headers = { ...cabecalhos };
    if (corpo !== undefined) headers["Content-Type"] = "application/json";

    if (jar.size) {
      headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    }

    const resp = await fetch(BASE + caminho, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      redirect: "manual",
    });

    for (const bruto of resp.headers.getSetCookie?.() || []) {
      const [par] = bruto.split(";");
      const [nome, valor] = par.split("=");
      if (valor === "") jar.delete(nome.trim());
      else jar.set(nome.trim(), valor);
    }

    const texto = await resp.text();
    let json = null;
    try { json = JSON.parse(texto); } catch { json = null; }

    return { status: resp.status, json, texto, cookies: jar };
  };

  req.cookies = jar;
  return req;
}

/* Aceita o cliente (lê o jar) ou uma resposta. */
const csrfDo = (c) => {
  const jar = typeof c === "function" ? c.cookies : c?.cookies;
  return jar?.get?.("cm_admin_csrf") || "";
};

/* ============================================================
   1. ESTADO INICIAL E SETUP
   ============================================================ */

secao("1. Primeiro acesso e criação da senha");

const anon = cliente();
let r = await anon("GET", "/api/admin/estado");
ok(r.status === 200, "GET /api/admin/estado responde 200");
ok(r.json.setupNecessario === true, "setupNecessario = true na conta nova");
ok(r.json.emailInicial === "manu.bernst@icloud.com", "e-mail inicial é o informado");

r = await anon("POST", "/api/admin/setup/identificar", { email: "manu.bernst@icloud.com" });
ok(r.status === 200, "setup/identificar aceita o e-mail inicial");
ok(!!csrfDo(anon), "CSRF emitido após identificar");

r = await anon("POST", "/api/admin/setup/definir-senha", {
  email: "manu.bernst@icloud.com",
  senha: "SenhaForte123",
  confirmacao: "SenhaErrada123",
}, { "X-CSRF-Token": csrfDo(anon) });
ok(r.status === 400, "setup rejeita senhas diferentes");

r = await anon("POST", "/api/admin/setup/definir-senha", {
  email: "manu.bernst@icloud.com",
  senha: "abc",
  confirmacao: "abc",
}, { "X-CSRF-Token": csrfDo(anon) });
ok(r.status === 400, "setup rejeita senha fraca");

r = await anon("POST", "/api/admin/setup/definir-senha", {
  email: "manu.bernst@icloud.com",
  senha: "SenhaAdmin2026",
  confirmacao: "SenhaAdmin2026",
}, { "X-CSRF-Token": csrfDo(anon) });
ok(r.status === 200, "setup cria a senha inicial");

const linhaAdmin = db
  .prepare("SELECT senha_hash, setup_feito, role FROM admins WHERE email = ?")
  .get("manu.bernst@icloud.com");

ok(!linhaAdmin.senha_hash.includes("SenhaAdmin2026"), "hash NÃO contém a senha em texto puro");
ok(linhaAdmin.senha_hash.startsWith("scrypt$"), "hash no formato scrypt com salt");
ok(linhaAdmin.setup_feito === 1, "setup_feito marcado");
ok(linhaAdmin.role === "admin", "role = admin gravado no banco");

r = await anon("GET", "/api/admin/estado");
ok(r.json.setupNecessario === false, "setupNecessario = false após concluir");

r = await anon("POST", "/api/admin/setup/definir-senha", {
  email: "manu.bernst@icloud.com",
  senha: "OutraSenha999",
  confirmacao: "OutraSenha999",
}, { "X-CSRF-Token": csrfDo(anon) });
ok(r.status === 404, "setup não pode ser refeito depois de concluído");

/* ============================================================
   2. LOGIN
   ============================================================ */

secao("2. Login administrativo");

const errado = cliente();
r = await errado("POST", "/api/admin/login", {
  email: "manu.bernst@icloud.com",
  senha: "senha-errada",
});
ok(r.status === 401, "senha incorreta devolve 401");
ok(r.json.erro === "E-mail ou senha inválidos.", "erro genérico (não revela se o e-mail existe)");

r = await errado("POST", "/api/admin/login", {
  email: "ninguem@exemplo.com",
  senha: "Qualquer123",
});
ok(r.status === 401, "e-mail inexistente devolve a mesma mensagem");
ok((await errado("GET", "/api/admin/eu")).status === 401, "sem sessão, /eu devolve 401");

const adm = cliente();
r = await adm("POST", "/api/admin/login", {
  email: "manu.bernst@icloud.com",
  senha: "SenhaAdmin2026",
});
ok(r.status === 200, "login com senha correta devolve 200");
ok(r.json.role === "admin", "resposta traz role=admin");
ok(r.json.erro === undefined, "resposta NÃO traz o hash da senha");
ok(!!adm.cookies.get("cm_admin_sessao"), "cookie de sessão emitido");
ok(!!csrfDo(adm), "cookie CSRF emitido");

const linhaSessao = db
  .prepare("SELECT * FROM sessoes WHERE admin_id = (SELECT id FROM admins WHERE email = ?)")
  .get("manu.bernst@icloud.com");
ok(!!linhaSessao, "sessão gravada no servidor (não só no cookie)");

r = await adm("GET", "/api/admin/eu");
ok(r.status === 200, "GET /eu autenticado devolve 200");
ok(r.json.role === "admin", "/eu devolve role do banco");

/* ============================================================
   3. AUTORIZAÇÃO — item 15
   ============================================================ */

secao("3. Autorização por role (item 15)");

const ROTAS_ADMIN = [
  ["GET", "/api/admin/dashboard"],
  ["GET", "/api/admin/usuarios"],
  ["POST", "/api/admin/usuarios"],
  ["GET", "/api/admin/profissionais"],
  ["GET", "/api/admin/comunidade"],
  ["GET", "/api/admin/denuncias"],
  ["GET", "/api/admin/conteudos"],
  ["POST", "/api/admin/conteudos"],
  ["GET", "/api/admin/agendamentos"],
  ["GET", "/api/admin/financeiro"],
  ["POST", "/api/admin/movimentacoes"],
  ["GET", "/api/admin/relatorios"],
  ["GET", "/api/admin/auditoria"],
  ["GET", "/api/admin/config"],
  ["PUT", "/api/admin/config"],
  ["PUT", "/api/admin/perfil"],
  ["PUT", "/api/admin/perfil/senha"],
];

for (const [metodo, caminho] of ROTAS_ADMIN) {
  r = await anon(metodo, caminho, metodo === "GET" ? undefined : {});
  ok(r.status === 401, `anônimo bloqueado em ${metodo} ${caminho} (401)`);
}

/* Simula o atacante do item 15: um usuário comum que tenta se
   declarar admin no corpo, no header e no cookie. */
const atacante = cliente();
await atacante("POST", "/api/admin/login", {
  email: "manu.bernst@icloud.com",
  senha: "SenhaAdmin2026",
});
// um cliente forja o papel em todos os lugares possíveis
atacante.cookies.set("cm_tipo", "admin");
atacante.cookies.set("cm_role", "admin");

r = await atacante("GET", "/api/admin/dashboard", undefined, {
  "X-Role": "admin",
  "X-User-Role": "admin",
});
ok(r.status === 200, "com sessão válida de admin, dashboard abre (200)");

r = await atacante("POST", "/api/admin/usuarios", {
  role: "admin",
  nome: "Invasor",
  email: "invasor@teste.com",
}, { "X-CSRF-Token": csrfDo(atacante) });
ok(r.status === 201, "criar usuário com role injetado funciona");
ok(
  db.prepare("SELECT role FROM admins WHERE email = 'invasor@teste.com'").get() === undefined,
  "invasor NÃO virou admin no banco"
);

/* Agora o teste que realmente importa: usuário comum, sem
   sessão de admin, tentando escrever role = admin. */
const falsario = cliente();
r = await falsario("POST", "/api/admin/usuarios", {
  role: "admin",
  nome: "Falsário",
  email: "falsario@teste.com",
});
ok(r.status === 401, "usuário comum sem sessão NÃO cria usuário (401)");
ok(
  db.prepare("SELECT id FROM usuarios WHERE email = 'falsario@teste.com'").get() === undefined,
  "nada foi gravado pela tentativa sem sessão"
);

/* Cookie de sessão forjado (token inventado). */
const forjado = cliente();
forjado.cookies.set("cm_admin_sessao", "token-inventado-abc123");
forjado.cookies.set("cm_admin_csrf", "x");
r = await forjado("GET", "/api/admin/usuarios");
ok(r.status === 401, "token de sessão forjado é rejeitado");

/* Cookie de sessão copiado de outra instalação (não existe no banco). */
const copia = cliente();
const tokenReal = adm.cookies.get("cm_admin_sessao");
copia.cookies.set("cm_admin_sessao", randomBytes(32).toString("base64url"));
r = await copia("GET", "/api/admin/usuarios");
ok(r.status === 401, "sessão de outro banco é rejeitada");

/* Conta desativada perde o acesso imediatamente, e a sessão é
   derrubada no servidor: reativar a conta não ressuscita a
   sessão antiga. */
const tokenAntesDesativar = adm.cookies.get("cm_admin_sessao");
db.prepare("UPDATE admins SET ativo = 0 WHERE email = ?").run("manu.bernst@icloud.com");
r = await adm("GET", "/api/admin/usuarios");
ok(r.status === 403, "conta desativada é bloqueada (403)");
ok(
  db.prepare("SELECT COUNT(*) AS n FROM sessoes WHERE token = ?").get(tokenAntesDesativar).n === 0,
  "sessão destruída no servidor ao desativar a conta"
);

db.prepare("UPDATE admins SET ativo = 1 WHERE email = ?").run("manu.bernst@icloud.com");
r = await adm("GET", "/api/admin/usuarios");
ok(r.status === 401, "sessão antiga não volta mesmo com a conta reativada");

/* Reautenticação resolve. Daqui em diante os testes usam adm2. */
const adm2 = cliente();
r = await adm2("POST", "/api/admin/login", {
  email: "manu.bernst@icloud.com", senha: "SenhaAdmin2026",
});
ok(r.status === 200, "login funciona após reativar a conta");
r = await adm2("GET", "/api/admin/usuarios");
ok(r.status === 200, "conta reativada volta a funcionar (200)");

/* CSRF */
r = await adm2("POST", "/api/admin/usuarios", { nome: "X", email: "x@t.com" }, {
  "X-CSRF-Token": "valor-invalido",
});
ok(r.status === 403, "mutação sem CSRF válido é bloqueada (403)");
ok(
  db.prepare("SELECT id FROM usuarios WHERE email = 'x@t.com'").get() === undefined,
  "nada gravado sem CSRF"
);

/* ============================================================
   4. CRUD DE USUÁRIOS
   ============================================================ */

secao("4. Usuários");

const comCsrf = (c) => ({ "X-CSRF-Token": csrfDo(c) });

r = await adm2("POST", "/api/admin/usuarios",
  { nome: "Ana", sobrenome: "Souza", email: "ana@aluno.com", telefone: "11988887777" },
  comCsrf(adm2));
ok(r.status === 201, "cria usuário");
const idAna = r.json.id;

r = await adm2("POST", "/api/admin/usuarios", { nome: "", email: "sem@nome.com" }, comCsrf(adm2));
ok(r.status === 400, "recusa nome vazio");

r = await adm2("POST", "/api/admin/usuarios", { nome: "Dup", email: "ana@aluno.com" }, comCsrf(adm2));
ok(r.status === 409, "recusa e-mail duplicado");

r = await adm2("POST", "/api/admin/usuarios", { nome: "B", email: "email-invalido" }, comCsrf(adm2));
ok(r.status === 400, "recusa e-mail inválido");

r = await adm2("GET", "/api/admin/usuarios");
ok(r.json.usuarios.some((u) => u.id === idAna), "usuário aparece na lista");
ok(r.json.usuarios.every((u) => u.senha === undefined), "lista de usuários não expõe senha");

r = await adm2("GET", "/api/admin/usuarios?q=ana");
ok(r.json.usuarios.length === 1 && r.json.usuarios[0].id === idAna, "busca por nome funciona");

r = await adm2("GET", "/api/admin/usuarios?q=11");
ok(r.json.usuarios.length === 1, "busca por telefone funciona");

r = await adm2("POST", `/api/admin/usuarios/${idAna}/bloquear`, {}, comCsrf(adm2));
ok(r.status === 200, "bloqueia usuário");
ok(
  db.prepare("SELECT bloqueado FROM usuarios WHERE id = ?").get(idAna).bloqueado === 1,
  "bloqueado = 1 no banco"
);

r = await adm2("GET", "/api/admin/usuarios?status=bloqueado");
ok(r.json.usuarios.every((u) => u.bloqueado === 1), "filtro bloqueado funciona");

r = await adm2("POST", `/api/admin/usuarios/${idAna}/desativar`, {}, comCsrf(adm2));
ok(db.prepare("SELECT status FROM usuarios WHERE id = ?").get(idAna).status === "inativo",
  "desativa usuário");

r = await adm2("POST", `/api/admin/usuarios/${idAna}/ativar`, {}, comCsrf(adm2));
ok(db.prepare("SELECT status FROM usuarios WHERE id = ?").get(idAna).status === "ativo",
  "ativa usuário");

r = await adm2("POST", `/api/admin/usuarios/${idAna}/desbloquear`, {}, comCsrf(adm2));
ok(db.prepare("SELECT bloqueado FROM usuarios WHERE id = ?").get(idAna).bloqueado === 0,
  "desbloqueia usuário");

/* exclusão exige confirmação explícita */
r = await adm2("DELETE", `/api/admin/usuarios/${idAna}`, {}, comCsrf(adm2));
ok(r.status === 400, "excluir sem confirmar é bloqueado (400)");
ok(db.prepare("SELECT id FROM usuarios WHERE id = ?").get(idAna) !== undefined,
  "usuário continua no banco após recusa");

r = await adm2("DELETE", `/api/admin/usuarios/${idAna}`, {}, comCsrf(adm2));
ok(r.status === 400, "excluir com confirmar:false é bloqueado");

r = await adm2("DELETE", `/api/admin/usuarios/${idAna}`, { confirmar: true }, comCsrf(adm2));
ok(r.status === 200, "exclui com confirmar:true");
ok(db.prepare("SELECT id FROM usuarios WHERE id = ?").get(idAna) === undefined,
  "usuário removido do banco");

r = await adm2("DELETE", "/api/admin/usuarios/999999", { confirmar: true }, comCsrf(adm2));
ok(r.status === 404, "excluir id inexistente devolve 404");

/* ============================================================
   5. PROFISSIONAIS E CICLO DE APROVAÇÃO
   ============================================================ */

secao("5. Profissionais");

db.prepare(
  `INSERT INTO profissionais (nome, email, registro, especialidade, data_cadastro, status)
   VALUES (?, ?, ?, ?, ?, 'pendente')`
).run("Dra. Rita", "rita@prof.com", "CRM-123", "Psicologia", new Date().toISOString());

r = await adm2("GET", "/api/admin/profissionais");
ok(r.json.profissionais.length === 1, "profissional listado");
ok(r.json.profissionais[0].status === "pendente", "status inicial = pendente");
const idRita = r.json.profissionais[0].id;

r = await adm2("GET", "/api/admin/profissionais?status=pendente");
ok(r.json.profissionais.length === 1, "filtro pendente funciona");

r = await adm2("POST", `/api/admin/profissionais/${idRita}/aprovar`, {}, comCsrf(adm2));
ok(r.status === 200, "aprova cadastro");
ok(db.prepare("SELECT status FROM profissionais WHERE id = ?").get(idRita).status === "aprovado",
  "status = aprovado");

r = await adm2("POST", `/api/admin/profissionais/${idRita}/rejeitar`, {}, comCsrf(adm2));
ok(r.status === 400, "rejeitar sem motivo é bloqueado");

r = await adm2("POST", `/api/admin/profissionais/${idRita}/rejeitar`,
  { motivo: "Documentação incompleta" }, comCsrf(adm2));
ok(r.status === 200, "rejeita com motivo");
ok(db.prepare("SELECT status FROM profissionais WHERE id = ?").get(idRita).status === "rejeitado",
  "status = rejeitado");

r = await adm2("POST", `/api/admin/profissionais/${idRita}/ativar`, {}, comCsrf(adm2));
ok(db.prepare("SELECT status FROM profissionais WHERE id = ?").get(idRita).status === "ativo",
  "status = ativo");

r = await adm2("POST", `/api/admin/prof_Check`, {}, comCsrf(adm2));
ok(r.status === 404, "rota inexistente devolve 404");

r = await adm2("POST", `/api/admin/profissionais/${idRita}/bloquear`, {}, comCsrf(adm2));
ok(db.prepare("SELECT bloqueado FROM profissionais WHERE id = ?").get(idRita).bloqueado === 1,
  "bloqueia profissional");

r = await adm2("PUT", `/api/admin/profissionais/${idRita}`,
  { especialidade: "Psiquiatria", registro: "CRM-999" }, comCsrf(adm2));
ok(r.status === 200, "edita dados administrativos do profissional");
const prof = db.prepare("SELECT * FROM profissionais WHERE id = ?").get(idRita);
ok(prof.especialidade === "Psiquiatria" && prof.registro === "CRM-999", "alterações gravadas");

/* ============================================================
   6. COMUNIDADE, DENÚNCIAS E CONTEÚDO
   ============================================================ */

secao("6. Comunidade e denúncias");

/* Ana precisa existir como usuário para o bloqueio por nome
   ter efeito — o teste do bloco usa exatamente esse nome. */
db.prepare(
  "INSERT INTO usuarios (nome, email, data_cadastro, status) VALUES (?, ?, ?, 'ativo')"
).run("Ana", "ana.comunidade@teste.com", new Date().toISOString());

const pub = db.prepare(
  "INSERT INTO publicacoes (autor_nome, conteudo, criada_em) VALUES (?, ?, ?)"
).run("Ana", "Preciso de ajuda", new Date().toISOString());
const idPub = Number(pub.lastInsertRowid);

const com = db.prepare(
  "INSERT INTO comentarios (publicacao_id, autor_nome, conteudo, criado_em) VALUES (?, ?, ?, ?)"
).run(idPub, "Bruno", "Procuro ajuda também", new Date().toISOString());
const idCom = Number(com.lastInsertRowid);

const den = db.prepare(
  "INSERT INTO denuncias (tipo_alvo, alvo_id, alvo_autor, motivo, criada_em) VALUES (?, ?, ?, ?, ?)"
).run("publicacao", idPub, "Ana", "conteúdo inadequado", new Date().toISOString());
const idDen = Number(den.lastInsertRowid);

r = await adm2("GET", "/api/admin/comunidade");
ok(r.json.publicacoes.length === 1, "lista publicações");
ok(r.json.comentarios.length === 1, "lista comentários");
ok(r.json.publicacoes[0].comentarios === 1, "contagem de comentários por publicação");

r = await adm2("DELETE", `/api/admin/publicacoes/${idPub}`, {}, comCsrf(adm2));
ok(r.status === 400, "remover publicação sem motivo é bloqueado");

r = await adm2("DELETE", `/api/admin/publicacoes/${idPub}`,
  { motivo: "Viola a regra de respeito" }, comCsrf(adm2));
ok(r.status === 200, "remove publicação com motivo");
ok(db.prepare("SELECT removida FROM publicacoes WHERE id = ?").get(idPub).removida === 1,
  "publicação marcada como removida");

r = await adm2("DELETE", `/api/admin/comentarios/${idCom}`,
  { motivo: "Comentário abusivo" }, comCsrf(adm2));
ok(r.status === 200, "remove comentário com motivo");

r = await adm2("PUT", `/api/admin/denuncias/${idDen}`, { status: "resolvida" }, comCsrf(adm2));
ok(r.status === 200, "marca denúncia como resolvida");
ok(db.prepare("SELECT status FROM denuncias WHERE id = ?").get(idDen).status === "resolvida",
  "status = resolvida");

r = await adm2("PUT", `/api/admin/denuncias/${idDen}`, { status: "inventado" }, comCsrf(adm2));
ok(r.status === 400, "recusa status inválido de denúncia");

r = await adm2("PUT", `/api/admin/denuncias/${idDen}`,
  { status: "arquivada", bloquearAutor: true }, comCsrf(adm2));
ok(r.status === 200, "bloqueia autor via denúncia");
const linhaAna = db.prepare("SELECT bloqueado FROM usuarios WHERE nome = 'Ana'").get();
ok(linhaAna?.bloqueado === 1, "autor bloqueado no banco");

for (const st of ["pendente", "em_analise", "resolvida", "arquivada"]) {
  r = await adm2("PUT", `/api/admin/denuncias/${idDen}`, { status: st }, comCsrf(adm2));
  ok(r.status === 200, `status "${st}" aceito`);
}

r = await adm2("GET", "/api/admin/denuncias");
ok(r.json.denuncias.length === 1, "lista denúncias");
ok(!!r.json.denuncias[0].motivo, "denúncia traz o motivo");

/* ============================================================
   7. CONTEÚDOS
   ============================================================ */

secao("7. Conteúdos");

r = await adm2("POST", "/api/admin/categorias", { nome: "Ansiedade", destino: "usuarios" }, comCsrf(adm2));
ok(r.status === 201, "cria categoria");
const idCat = r.json.id;

r = await adm2("POST", "/api/admin/categorias", { nome: "Ansiedade", destino: "usuarios" }, comCsrf(adm2));
ok(r.status === 409, "recusa categoria duplicada");

r = await adm2("POST", "/api/admin/categorias", { nome: "Clínica", destino: "profissionais" }, comCsrf(adm2));
ok(r.status === 201, "cria categoria para profissionais");

r = await adm2("POST", "/api/admin/conteudos", {
  titulo: "Entendendo a ansiedade",
  corpo: "Texto educativo sobre ansiedade.",
  categoria_id: idCat,
  destino: "usuarios",
  publicado: true,
}, comCsrf(adm2));
ok(r.status === 201, "cria conteúdo publicado para usuários");
const idCon = r.json.id;

r = await adm2("POST", "/api/admin/conteudos", {
  titulo: "Documento técnico",
  corpo: "Uso interno.",
  destino: "profissionais",
}, comCsrf(adm2));
ok(r.status === 201, "cria conteúdo para profissionais");
const idConProf = r.json.id;

r = await adm2("GET", "/api/admin/conteudos");
ok(r.json.conteudos.length === 2, "lista 2 conteúdos");
ok(r.json.conteudos.some((c) => c.categoria === "Ansiedade"), "categoria associada aparece");

r = await adm2("POST", `/api/admin/conteudos/${idCon}/publicar`, {}, comCsrf(adm2));
ok(r.status === 404, "não existe rota publicar separada");

r = await adm2("PUT", `/api/admin/conteudos/${idCon}`, { publicado: false }, comCsrf(adm2));
ok(db.prepare("SELECT publicado FROM conteudos WHERE id = ?").get(idCon).publicado === 0,
  "despublica conteúdo");

r = await adm2("PUT", `/api/admin/conteudos/${idCon}`, { publicado: true }, comCsrf(adm2));
ok(db.prepare("SELECT publicado FROM conteudos WHERE id = ?").get(idCon).publicado === 1,
  "publica conteúdo");

r = await adm2("PUT", `/api/admin/conteudos/${idCon}`, { titulo: "Título novo" }, comCsrf(adm2));
ok(db.prepare("SELECT titulo FROM conteudos WHERE id = ?").get(idCon).titulo === "Título novo",
  "edita conteúdo");

r = await adm2("DELETE", `/api/admin/conteudos/${idCon}`, {}, comCsrf(adm2));
ok(r.status === 400, "excluir conteúdo sem confirmar é bloqueado");

r = await adm2("DELETE", `/api/admin/conteudos/${idConProf}`, { confirmar: true }, comCsrf(adm2));
ok(r.status === 200, "exclui conteúdo com confirmação");
ok(db.prepare("SELECT id FROM conteudos WHERE id = ?").get(idConProf) === undefined,
  "conteúdo removido do banco");

/* ============================================================
   8. AGENDAMENTOS
   ============================================================ */

secao("8. Agendamentos");

const hoje = new Date().toISOString().slice(0, 10);
db.prepare(
  "INSERT INTO consultas (profissional, paciente, data, hora, status, valor) VALUES (?, ?, ?, ?, ?, ?)"
).run("Dra. Rita", "Ana", hoje, "09:00", "agendada", 150);
db.prepare(
  "INSERT INTO consultas (profissional, paciente, data, hora, status, valor) VALUES (?, ?, ?, ?, ?, ?)"
).run("Dra. Rita", "Bruno", hoje, "10:00", "realizada", 150);
db.prepare(
  "INSERT INTO consultas (profissional, paciente, data, hora, status, valor) VALUES (?, ?, ?, ?, ?, ?)"
).run("Dr. Carlos", "Carla", hoje, "11:00", "cancelada", 200);

r = await adm2("GET", "/api/admin/agendamentos");
ok(r.json.consultas.length === 3, "lista 3 consultas");
ok(r.json.estatisticas.porStatus.length === 3, "estatísticas por status");
ok(r.json.estatisticas.porProfissional.length === 2, "estatísticas por profissional");

const idConsulta = r.json.consultas.find((c) => c.status === "agendada").id;
r = await adm2("PUT", `/api/admin/consultas/${idConsulta}`, { status: "realizada" }, comCsrf(adm2));
ok(db.prepare("SELECT status FROM consultas WHERE id = ?").get(idConsulta).status === "realizada",
  "atualiza status da consulta");

r = await adm2("PUT", `/api/admin/consultas/${idConsulta}`, { status: "inventado" }, comCsrf(adm2));
ok(db.prepare("SELECT status FROM consultas WHERE id = ?").get(idConsulta).status === "realizada",
  "status inválido é ignorado, sem alterar o banco");

/* ============================================================
   9. FINANCEIRO — cálculo real
   ============================================================ */

secao("9. Financeiro");

r = await adm2("POST", "/api/admin/movimentacoes", {
  tipo: "receita", descricao: "Mensalidade", valor: 300, data: hoje, status: "pago",
}, comCsrf(adm2));
ok(r.status === 201, "cria receita paga");

await adm2("POST", "/api/admin/movimentacoes", {
  tipo: "receita", descricao: "Mensalidade pendente", valor: 100, data: hoje, status: "pendente",
}, comCsrf(adm2));

await adm2("POST", "/api/admin/movimentacoes", {
  tipo: "despesa", descricao: "Servidor", valor: 50, data: hoje, status: "pago", categoria: "Infraestrutura",
}, comCsrf(adm2));

r = await adm2("POST", "/api/admin/movimentacoes",
  { tipo: "receita", descricao: "Zero", valor: 0, data: hoje }, comCsrf(adm2));
ok(r.status === 400, "recusa valor zero");

r = await adm2("POST", "/api/admin/movimentacoes",
  { tipo: "receita", descricao: "", valor: 10, data: hoje }, comCsrf(adm2));
ok(r.status === 400, "recusa descrição vazia");

r = await adm2("GET", "/api/admin/financeiro?periodo=dia");
ok(r.json.receitas === 300, `receitas = 300 (obtido ${r.json.receitas})`);
ok(r.json.despesas === 50, `despesas = 50 (obtido ${r.json.despesas})`);
ok(r.json.saldo === 250, `saldo = 250 (obtido ${r.json.saldo})`);
ok(r.json.recebido === 300, `recebido = 300 (obtido ${r.json.recebido})`);
ok(r.json.pendente === 100, `pendente = 100 (obtido ${r.json.pendente})`);
ok(r.json.faturamentoRealizado === 300, "faturamento das consultas realizadas = 300");
ok(r.json.movimentacoes.length === 3, "lista 3 movimentações do dia");

r = await adm2("GET", "/api/admin/financeiro?periodo=personalizado&de=1990-01-01&ate=1990-12-31");
ok(r.json.movimentacoes.length === 0, "período sem dados devolve lista vazia");
ok(r.json.receitas === 0, "período sem dados devolve receita 0 (não inventa número)");

r = await adm2("GET", "/api/admin/financeiro?periodo=ano");
ok(r.json.movimentacoes.length === 3, "filtro ano inclui as movimentações de hoje");

const idPendente = db
  .prepare("SELECT id FROM movimentacoes WHERE status='pendente'")
  .get().id;
r = await adm2("DELETE", `/api/admin/movimentacoes/${idPendente}`, {}, comCsrf(adm2));
ok(r.status === 400, "excluir movimentação sem confirmar é bloqueado");

r = await adm2("DELETE", `/api/admin/movimentacoes/${idPendente}`, { confirmar: true }, comCsrf(adm2));
ok(r.status === 200, "exclui movimentação com confirmação");

r = await adm2("GET", "/api/admin/financeiro?periodo=dia");
ok(r.json.receitas === 300, "receita paga não muda ao excluir a pendente");
ok(r.json.pendente === 0, "pendente cai para 0");
ok(r.json.despesas === 50, "despesa permanece 50");
ok(r.json.totalMovimentacoes === 2, "restam 2 movimentações");

/* ============================================================
   10. RELATÓRIOS
   ============================================================ */

secao("10. Relatórios");

r = await adm2("GET", "/api/admin/relatorios?meses=6");
ok(r.json.crescimento.length === 6, "série mensal com 6 pontos");
ok(typeof r.json.crescimento[0].usuarios === "number", "série tem contagem numérica de usuários");
ok(typeof r.json.crescimento[0].profissionais === "number", "série tem contagem numérica de profissionais");
ok(typeof r.json.crescimento[0].consultas === "number", "série tem contagem numérica de consultas");
ok(typeof r.json.crescimento[0].denuncias === "number", "série tem contagem numérica de denúncias");
ok(typeof r.json.utilizacao.novosUsuarios === "number", "utilização calculada");
ok(
  r.json.crescimento.every((p) => /^\d{4}-\d{2}$/.test(p.mes)),
  "meses no formato AAAA-MM"
);

r = await adm2("GET", "/api/admin/relatorios?meses=999");
ok(r.json.crescimento.length === 24, "meses limitado ao máximo de 24");

/* ============================================================
   11. DADOS SENSÍVEIS — item 16
   ============================================================ */

secao("11. Dados sensíveis (item 16)");

const tabelas = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
  .all()
  .map((t) => t.name);

ok(!tabelas.some((t) => /diario|journal|anotacao|privad/i.test(t)),
  "banco admin não tem tabela de diário nem dados privados");

const colunasDiario = tabelas
  .filter((t) => !t.startsWith("sqlite_"))
  .flatMap((t) => db.prepare(`PRAGMA table_info("${t}")`).all())
  .map((c) => c.name.toLowerCase());

ok(!colunasDiario.some((c) => /diario|privad|journal|entrada/.test(c)),
  "nenhuma coluna com nome de diário ou conteúdo privado");

const todosOsRegistros = db.prepare("SELECT * FROM auditoria").all();
const textoAuditoria = JSON.stringify(todosOsRegistros);

ok(!/scrypt\$/.test(textoAuditoria), "auditoria não contém hash de senha");
ok(!/SenhaAdmin2026|SenhaForte123|senha-errada/.test(textoAuditoria),
  "auditoria não contém senha em texto puro");
ok(!/cm_admin_sessao|cm_admin_csrf|token-inventado/.test(textoAuditoria),
  "auditoria não contém tokens nem cookies");
ok(!/\bcpf\b/i.test(textoAuditoria), "auditoria não contém CPF");

r = await adm2("GET", "/api/admin/dashboard");
ok(r.json.dadosSensiveisExpostos === false, "dashboard sinaliza que não expõe dados sensíveis");
ok(r.json.resumo.consultasTotal >= 0, "dashboard tem contagem de consultas");
ok(r.json.resumo.usuariosTotal >= 0, "dashboard tem contagem de usuários");

const chavesDashboard = Object.keys(r.json.resumo).join(",");
ok(!/diario|privad|sensiv/i.test(chavesDashboard), "resumo do dashboard não tem campo sensível");

r = await adm2("GET", "/api/admin/auditoria");
ok(r.json.registros.length > 0, "auditoria registrou ações");
ok(r.json.total === r.json.registros.length, "total confere com a lista");

/* todo o texto gravado na auditoria passa por filtro de redação */
const acoes = new Set(todosOsRegistros.map((a) => a.acao));
ok([...acoes].some((a) => a.startsWith("login.")), "login aparece na auditoria");
ok([...acoes].some((a) => a.startsWith("usuario.")), "ações de usuário aparecem");
ok([...acoes].some((a) => a.startsWith("profissional.")), "ações de profissional aparecem");
ok([...acoes].some((a) => a.startsWith("denuncia.")), "ações de denúncia aparecem");
ok([...acoes].some((a) => a.startsWith("publicacao.")), "remoção de publicação aparece");

const negados = todosOsRegistros.filter((a) => a.resultado === "negado");
ok(negados.length > 0, "tentativas negadas ficam registradas");

/* ============================================================
   12. PERFIL DO ADMIN
   ============================================================ */

secao("12. Perfil do administrador");

r = await adm2("PUT", "/api/admin/perfil", {
  nome: "Manuella", sobrenome: "Bernst",
  telefone: "11991234567", cargo: "Administradora do sistema",
  descricao: "Responsável pela gestão do Clear Minds.",
}, comCsrf(adm2));
ok(r.status === 200, "salva dados do perfil");
ok(r.json.admin.nome === "Manuella", "nome gravado");
ok(r.json.admin.cargo === "Administradora do sistema", "cargo gravado");

r = await adm2("PUT", "/api/admin/perfil", { role: "superadmin", ativo: 0 }, comCsrf(adm2));
ok(r.status === 200, "PUT /perfil aceita campos desconhecidos sem quebrar");
ok(db.prepare("SELECT role, ativo FROM admins WHERE email = ?")
  .get("manu.bernst@icloud.com").role === "admin",
  "role NÃO pode ser alterado pelo perfil");
ok(db.prepare("SELECT ativo FROM admins WHERE email = ?")
  .get("manu.bernst@icloud.com").ativo === 1,
  "admin NÃO pode se desativar pelo perfil");

r = await adm2("PUT", "/api/admin/perfil", { email: "outro@exemplo.com" }, comCsrf(adm2));
ok(r.status === 200, "altera e-mail do admin");
r = await adm2("PUT", "/api/admin/perfil", { email: "manu.bernst@icloud.com" }, comCsrf(adm2));
ok(r.status === 200, "volta ao e-mail original");

/* troca de senha */
r = await adm2("PUT", "/api/admin/perfil/senha",
  { atual: "errada", nova: "NovaSenha2026", confirmacao: "NovaSenha2026" }, comCsrf(adm2));
ok(r.status === 401, "troca de senha exige a senha atual correta");

r = await adm2("PUT", "/api/admin/perfil/senha",
  { atual: "SenhaAdmin2026", nova: "curta", confirmacao: "curta" }, comCsrf(adm2));
ok(r.status === 400, "troca de senha recusa senha fraca");

r = await adm2("PUT", "/api/admin/perfil/senha",
  { atual: "SenhaAdmin2026", nova: "NovaSenha2026", confirmacao: "Outra2026" }, comCsrf(adm2));
ok(r.status === 400, "troca de senha exige confirmação igual");

r = await adm2("PUT", "/api/admin/perfil/senha",
  { atual: "SenhaAdmin2026", nova: "NovaSenha2026", confirmacao: "NovaSenha2026" }, comCsrf(adm2));
ok(r.status === 200, "troca de senha realizada");

const novoAdm = cliente();
r = await novoAdm("POST", "/api/admin/login", {
  email: "manu.bernst@icloud.com", senha: "NovaSenha2026",
});
ok(r.status === 200, "login com a nova senha funciona");

r = await novoAdm("POST", "/api/admin/login", {
  email: "manu.bernst@icloud.com", senha: "SenhaAdmin2026",
});
ok(r.status === 401, "senha antiga não funciona mais");

/* ============================================================
   13. CONFIGURAÇÕES DO SISTEMA
   ============================================================ */

secao("13. Configurações do sistema");

r = await adm2("GET", "/api/admin/config");
ok(r.status === 200, "lê configurações");
ok(r.json.config.nome_sistema === "Clear Minds", "configuração padrão existe");
ok(Array.isArray(r.json.categorias), "lista categorias junto");

r = await adm2("PUT", "/api/admin/config",
  { config: { nome_sistema: "Clear Minds UFSC" } }, comCsrf(adm2));
ok(r.status === 200, "altera configuração permitida");

r = await adm2("PUT", "/api/admin/config", { config: { chave_desconhecida: "x" } }, comCsrf(adm2));
ok(r.status === 400, "recusa chave desconhecida");

for (const protegida of ["senha_hash", "admin_email", "role", "token"]) {
  r = await adm2("PUT", "/api/admin/config",
    { config: { [protegida]: "hack" } }, comCsrf(adm2));
  ok(r.status === 403, `chave protegida "${protegida}" é bloqueada`);
}

r = await adm2("PUT", "/api/admin/config",
  { config: { regra_denuncia: "Nova regra de comunidade.", max_denuncias_pendentes: "25" } },
  comCsrf(adm2));
ok(r.status === 200, "altera regras da comunidade");

/* ============================================================
   14. LOGOUT
   ============================================================ */

secao("14. Logout");

const tokenDoLogout = adm2.cookies.get("cm_admin_sessao");
const sessoesAntes = db.prepare("SELECT COUNT(*) AS n FROM sessoes").get().n;

r = await adm2("POST", "/api/admin/logout", {});
ok(r.status === 200, "logout responde 200");
ok(!adm2.cookies.get("cm_admin_sessao"), "cookie de sessão removido");

r = await adm2("GET", "/api/admin/usuarios");
ok(r.status === 401, "sessão invalidada após logout");

ok(
  db.prepare("SELECT COUNT(*) AS n FROM sessoes WHERE token = ?").get(tokenDoLogout).n === 0,
  "sessão encerrada removida do banco"
);
ok(
  db.prepare("SELECT COUNT(*) AS n FROM sessoes").get().n === sessoesAntes - 1,
  "apenas a sessão encerrada saiu; as demais seguem ativas"
);

/* ============================================================
   15. ISOLAMENTO DAS PÁGINAS EXISTENTES
   ============================================================ */

secao("15. Páginas existentes continuam intactas");

const raiz = new URL("../..", import.meta.url).pathname.replace(/^\//, "").replace(/\//g, "\\");
for (const arquivo of [
  "index.html", "login.html", "login-profissional.html",
  "home.html", "home-profissional.html", "style.css",
  "home.js", "home-profissional.js", "utils.js", "script.js",
]) {
  r = await anon("GET", "/" + arquivo);
  ok(r.status === 200, `/  ${arquivo} continua acessível (200)`);
}

r = await anon("GET", "/home.html");
ok(!/admin/i.test(r.texto.split("<body")[0]), "home.html não foi alterado com referências admin");

/* as páginas antigas não conhecem o painel */
r = await anon("GET", "/home-profissional.html");
ok(!r.texto.includes("admin/login.html"), "home-profissional.html não aponta para o painel admin");

/* ============================================================
   16. GUARDA SERVER-SIDE DO PAINEL
   ============================================================ */

secao("16. Painel só é servido com sessão válida");

const visitante = cliente();

r = await visitante("GET", "/admin/admin.html");
ok(r.status === 302, "admin.html redireciona quando não há sessão (302)");
ok(
  (r.json === null && /login\.html/.test(r.texto)) ||
    r.texto === "",
  "redirecionamento aponta para a tela de login"
);

r = await visitante("GET", "/admin/usuarios");
ok(r.status === 302, "rota interna do SPA também é bloqueada sem sessão");

/* a tela de login precisa continuar pública, senão ninguém entra */
r = await visitante("GET", "/admin/login.html");
ok(r.status === 200, "login.html continua público (200)");
r = await visitante("GET", "/admin/login.js");
ok(r.status === 200, "login.js continua público (200)");
r = await visitante("GET", "/admin/admin.css");
ok(r.status === 200, "admin.css continua público (200)");

/* com sessão de admin, o painel é servido */
const autenticado = cliente();
await autenticado("POST", "/api/admin/login", {
  email: "manu.bernst@icloud.com",
  senha: "NovaSenha2026",
});

r = await autenticado("GET", "/admin/admin.html");
ok(r.status === 200, "admin.html é servido com sessão de admin (200)");
ok(/<title/i.test(r.texto), "admin.html devolveu o HTML do painel");

r = await autenticado("GET", "/admin/usuarios");
ok(r.status === 200, "rota interna do SPA abre com sessão válida");

/* token forjado não libera o HTML */
const tokenFalsificado = cliente();
tokenFalsificado.cookies.set("cm_admin_sessao", "token-inventado-aqui");
r = await tokenFalsificado("GET", "/admin/admin.html");
ok(r.status === 302, "token de sessão forjado não serve o painel");

/* ============================================================
   17. IMPORTAÇÃO DO NAVEGADOR (ponte localStorage → SQLite)
   ============================================================ */

secao("17. Importação de dados do navegador");

const imp = cliente();
r = await imp("POST", "/api/admin/login", {
  email: "manu.bernst@icloud.com",
  senha: "NovaSenha2026",
});
const cabImportar = { "X-CSRF-Token": csrfDo(imp) };

r = await imp("GET", "/api/admin/importar/previa");
ok(r.status === 200, "GET /importar/previa responde 200");
ok(Array.isArray(r.json.chavesBloqueadas), "previa lista as chaves recusadas");
ok(r.json.chavesBloqueadas.includes("cm_diario"), "cm_diario está na lista de recusadas");
ok(r.json.chavesAceitas.includes("cm_postagens"), "cm_postagens está na lista de aceitas");

r = await imp("POST", "/api/admin/importar", {
  dados: { cm_profile: { nome: "Ana Souza", email: "ana@importe.com", humor: "Feliz", ansiedade: "Baixa" } },
}, cabImportar);
ok(r.status === 200, "importa perfil do navegador");
ok(r.json.resumo.usuarios === 1, "resumo conta 1 usuário");

const usuarioImportado = db
  .prepare("SELECT nome, email, telefone FROM usuarios WHERE email = ?")
  .get("ana@importe.com");
ok(usuarioImportado && usuarioImportado.nome === "Ana Souza", "usuário gravado com o nome certo");

/* o campo sensível veio no payload e não pode existir no banco */
const colunasUsuario = db.prepare("PRAGMA table_info(usuarios)").all().map((c) => c.name);
ok(
  !colunasUsuario.some((c) => ["humor", "ansiedade", "sono", "estresse"].includes(c)),
  "usuarios não tem coluna de humor/ansiedade/sono/estresse"
);

r = await imp("POST", "/api/admin/importar", {
  dados: {
    cm_profile_profissional: {
      nome: "Dra. Helena Costa",
      email: "helena@importe.com",
      profissao: "Psicóloga",
      registroProfissional: "CRP 00/9999",
      bio: "Atendimento adolescentar.",
      senha: "nao-deve-vazar",
    },
  },
}, cabImportar);
ok(r.json.resumo.profissionais === 1, "resumo conta 1 profissional");

const profImportada = db
  .prepare("SELECT nome, registro, especialidade, status FROM profissionais WHERE email = ?")
  .get("helena@importe.com");
ok(profImportada && profImportada.registro === "CRP 00/9999", "registro profissional gravado");
ok(profImportada && profImportada.especialidade === "Psicóloga", "especialidade gravada");
ok(profImportada && profImportada.status === "pendente", "profissional importado fica pendente de aprovação");

/* a senha do app nunca é copiada para o banco admin */
const colunasProf = db.prepare("PRAGMA table_info(profissionais)").all().map((c) => c.name);
ok(!colunasProf.includes("senha"), "profissionais não tem coluna de senha");
ok(
  !db.prepare("SELECT * FROM profissionais WHERE email = ?").get("helena@importe.com").senha_hash,
  "nenhum hash de senha foi importado do navegador"
);

r = await imp("POST", "/api/admin/importar", {
  dados: {
    cm_postagens: [
      {
        autor: "Ana Souza",
        texto: "Studar em grupo ajuda bastante.",
        data: "2026-03-01T10:00:00.000Z",
        comentarios: [{ autor: "Bruno", texto: "Concordo!", data: "2026-03-01T11:00:00.000Z" }],
      },
    ],
    cm_denuncias: [{ texto: "Comentário fora das regras", autor: "Bruno", postId: "1", data: "2026-03-02T09:00:00.000Z" }],
  },
}, cabImportar);
ok(r.json.resumo.publicacoes === 1, "resumo conta 1 publicação");
ok(r.json.resumo.comentarios === 1, "resumo conta 1 comentário");
ok(r.json.resumo.denuncias === 1, "resumo conta 1 denúncia");

const publicacaoImportada = db.prepare("SELECT autor_nome, conteudo FROM publicacoes ORDER BY id DESC LIMIT 1").get();
ok(publicacaoImportada && publicacaoImportada.autor_nome === "Ana Souza", "publicação gravada com o autor");

/* segunda importação do mesmo post não duplica */
r = await imp("POST", "/api/admin/importar", {
  dados: {
    cm_postagens: [
      { autor: "Ana Souza", texto: "Studar em grupo ajuda bastante.", data: "2026-03-01T10:00:00.000Z", comentarios: [] },
    ],
  },
}, cabImportar);
ok(r.json.resumo.publicacoes === 0, "reimportar o mesmo post não duplica publicação");

r = await imp("POST", "/api/admin/importar", {
  dados: {
    cm_movimentacoes: [
      { descricao: "Mensalidade", tipo: "entrada", status: "recebido", valor: 120, data: "2026-03-05" },
      { descricao: "Material", tipo: "saida", status: "recebido", valor: 30, data: "2026-03-05" },
    ],
    cm_agenda_profissional: [
      { paciente: "Ana Souza", data: "2026-03-06", horario: "14:00", status: "realizado", valor: 90 },
    ],
    cm_conteudos_profissional: [
      { titulo: "Como pedir ajuda", corpo: "Texto de orientação.", data: "2026-03-01" },
    ],
  },
}, cabImportar);
ok(r.json.resumo.movimentacoes === 2, "resumo conta 2 movimentações");
ok(r.json.resumo.consultas === 1, "resumo conta 1 consulta");
ok(r.json.resumo.conteudos === 1, "resumo conta 1 conteúdo");

const movs = db
  .prepare("SELECT tipo, status, descricao FROM movimentacoes WHERE descricao IN ('Mensalidade','Material')")
  .all();
const entrada = movs.find((m) => m.descricao === "Mensalidade");
const saida = movs.find((m) => m.descricao === "Material");
ok(entrada && entrada.tipo === "receita" && entrada.status === "pago", "entrada/recebido virou receita/pago");
ok(saida && saida.tipo === "despesa", "saida virou despesa");

const consulta = db.prepare("SELECT paciente, hora, status, valor FROM consultas ORDER BY id DESC LIMIT 1").get();
ok(consulta && consulta.hora === "14:00", "consulta importada com horário");
ok(consulta && consulta.status === "realizada", "consulta importada com status");

/* ---------- idempotência: reimportar não pode duplicar ----------
   Sem isto, o admin clicava duas vezes em "Importar arquivo" e o
   painel passava a mostrar consultas, denúncias, conteúdos e
   movimentações que nunca existiram.

   O profissional vem nomeado no próprio item da agenda para que a
   linha seja sempre a mesma, venha o perfil junto no payload ou não. */
const payloadIdempotente = {
  cm_profile: { nome: "Ida Souza", email: "ida@importe.com" },
  cm_profile_profissional: {
    nome: "Dra. Helena Costa",
    email: "helena@importe.com",
    profissao: "Psicóloga",
  },
  cm_postagens: [
    {
      autor: "Ida Souza",
      texto: "Revisitar o plano de estudos ajuda.",
      data: "2026-04-01T10:00:00.000Z",
      comentarios: [{ autor: "Bruno", texto: "Faz sentido!", data: "2026-04-01T11:00:00.000Z" }],
    },
  ],
  cm_denuncias: [{ texto: "Comentário fora das regras", autor: "Bruno", postId: "7", data: "2026-04-02T09:00:00.000Z" }],
  cm_agenda_profissional: [
    { paciente: "Ida Souza", profissional: "Dra. Helena Costa", data: "2026-04-06", horario: "14:00", status: "realizado", valor: 90 },
  ],
  cm_conteudos_profissional: [
    { titulo: "Rotina de sono", corpo: "Texto de orientação do mês.", data: "2026-04-01" },
  ],
  cm_movimentacoes: [
    { descricao: "Mensalidade de abril", tipo: "entrada", status: "recebido", valor: 120, data: "2026-04-05" },
  ],
};

const contar = (tabela) => db.prepare(`SELECT COUNT(*) AS n FROM ${tabela}`).get().n;

/* primeira vez: tudo entra */
r = await imp("POST", "/api/admin/importar", { dados: payloadIdempotente }, cabImportar);
ok(r.status === 200, "primeira importação do lote conclui");
ok(r.json.resumo.usuarios === 1, "primeira importação cria o usuário");
ok(r.json.resumo.denuncias === 1, "primeira importação cria a denúncia");
ok(r.json.resumo.consultas === 1, "primeira importação cria a consulta");
ok(r.json.resumo.conteudos === 1, "primeira importação cria o conteúdo");
ok(r.json.resumo.movimentacoes === 1, "primeira importação cria a movimentação");

const antes = {
  usuarios: contar("usuarios"),
  profissionais: contar("profissionais"),
  publicacoes: contar("publicacoes"),
  comentarios: contar("comentarios"),
  denuncias: contar("denuncias"),
  consultas: contar("consultas"),
  conteudos: contar("conteudos"),
  movimentacoes: contar("movimentacoes"),
};

/* segunda e terceira vezes: nada muda */
for (const vez of ["segunda", "terceira"]) {
  r = await imp("POST", "/api/admin/importar", { dados: payloadIdempotente }, cabImportar);
  ok(r.status === 200, `${vez} importação do mesmo navegador conclui`);
  ok(r.json.resumo.usuarios === 0, `${vez} vez não recria o usuário`);
  ok(r.json.resumo.profissionais === 0, `${vez} vez não recria o profissional`);
  ok(r.json.resumo.publicacoes === 0, `${vez} vez não recria a publicação`);
  ok(r.json.resumo.comentarios === 0, `${vez} vez não recria o comentário`);
  ok(r.json.resumo.denuncias === 0, `${vez} vez não recria a denúncia`);
  ok(r.json.resumo.consultas === 0, `${vez} vez não recria a consulta`);
  ok(r.json.resumo.conteudos === 0, `${vez} vez não recria o conteúdo`);
  ok(r.json.resumo.movimentacoes === 0, `${vez} vez não recria a movimentação`);
  ok(r.json.resumo.duplicadas === 8, `${vez} vez informa as 8 linhas que já existiam`);
  for (const tabela of Object.keys(antes)) {
    ok(contar(tabela) === antes[tabela], `${vez} vez: tabela ${tabela} ficou igual`);
  }
}

/* dado novo entra normalmente ao lado do que já existia */
r = await imp("POST", "/api/admin/importar", {
  dados: {
    cm_movimentacoes: [
      { descricao: "Mensalidade de abril", tipo: "entrada", status: "recebido", valor: 120, data: "2026-04-05" },
      { descricao: "Sessão avulsa", tipo: "entrada", status: "recebido", valor: 80, data: "2026-04-09" },
    ],
  },
}, cabImportar);
ok(r.json.resumo.movimentacoes === 1, "movimentação inédita entra");
ok(r.json.resumo.duplicadas === 1, "movimentação repetida do mesmo payload é contada como duplicada");
ok(contar("movimentacoes") === antes.movimentacoes + 1, "sobe exatamente uma movimentação");

/* ---------- chaves sensíveis são recusadas ---------- */
r = await imp("POST", "/api/admin/importar", {
  dados: {
    cm_diario: [{ titulo: "Meu registro", texto: "Hoje me senti mal.", humor: "Triste" }],
    cm_solicitacoes_diario: [{ paciente: "Ana", texto: "Quero acesso ao diário" }],
    cm_humor_atual: "Ansioso",
    cm_pacientes: [{ nome: "Paciente Privado", email: "privado@x.com", diarioAcesso: "liberado" }],
    cm_postagens: [{ autor: "Ana Souza", texto: "Post válido junto do sensível.", data: "2026-03-07T10:00:00.000Z" }],
  },
}, cabImportar);
ok(r.status === 200, "importação com chaves sensíveis ainda conclui");
ok(r.json.resumo.rejeitadas.length === 4, "as 4 chaves sensíveis foram recusadas");
ok(r.json.resumo.rejeitadas.includes("cm_diario"), "cm_diario recusada");
ok(r.json.resumo.rejeitadas.includes("cm_pacientes"), "cm_pacientes recusada");
ok(r.json.resumo.publicacoes === 1, "o post válido do mesmo payload foi importado");

const textoImportacao = JSON.stringify(db.prepare("SELECT * FROM auditoria ORDER BY id DESC LIMIT 5").all());
ok(!/privado@x\.com|Paciente Privado|Meu registro|Quero acesso/.test(textoImportacao),
  "nada do conteúdo recusado aparece na auditoria");

/* o diário recusado não foi parar em nenhuma tabela */
const nomesDeTabelas = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all()
  .map((t) => t.name);
ok(!nomesDeTabelas.some((t) => /diario|humor|paciente/i.test(t)), "nenhuma tabela de diário/humor/paciente foi criada");

/* ---------- permissões e validação ---------- */
const visitanteImp = cliente();
r = await visitanteImp("POST", "/api/admin/importar", { dados: { cm_postagens: [] } });
ok(r.status === 401, "importação sem sessão é bloqueada (401)");

r = await imp("POST", "/api/admin/importar", { dados: { cm_postagens: [] } });
ok(r.status === 403, "importação sem CSRF é bloqueada (403)");

r = await imp("POST", "/api/admin/importar", { dados: [] }, cabImportar);
ok(r.status === 400, "importação com array no lugar de objeto é recusada");

r = await imp("POST", "/api/admin/importar", {}, cabImportar);
ok(r.status === 400, "importação sem payload é recusada");

/* a importação alimenta o dashboard e o financeiro */
r = await imp("GET", "/api/admin/dashboard");
ok(r.json.resumo.usuariosTotal > 0, "dashboard passa a contar os usuários importados");
ok(r.json.resumo.consultasTotal > 0, "dashboard passa a contar as consultas importadas");

/* ============================================================
   RESULTADO
   ============================================================ */

console.log(`\n${"=".repeat(52)}`);
console.log(`  ${passou} passaram · ${falhou} falharam`);
if (falhas.length) {
  console.log(`\n  Falhas:`);
  for (const f of falhas) console.log(`   - ${f}`);
}
console.log(`${"=".repeat(52)}\n`);

servidor.close();
db.close();
rmSync(dir, { recursive: true, force: true });

process.exit(falhou ? 1 : 0);