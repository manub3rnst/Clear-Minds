/* ==========================================================
   CLEAR MINDS — Importação dos dados do navegador
   ==========================================================
   As páginas existentes (Home do usuário e do profissional)
   continuam guardando tudo em localStorage. Este arquivo é a
   PONTE: recebe esse conteúdo e grava no SQLite do painel
   administrativo.

   REGRA INEGOCIÁVEL (item 16 do pedido):
   diário, humor, sono, ansiedade e qualquer dado clínico ou
   de bem-estar NUNCA entram no banco do administrador. As
   chaves abaixo são recusadas na porta e a tentativa fica
   registrada na auditoria.
   ========================================================== */

import { db, agoraISO } from "./db.js";

/* ------------------------------------------------------------
   CHAVAS RECUSADAS — nunca importadas
   ------------------------------------------------------------ */

export const CHAVES_BLOQUEADAS = [
  "cm_diario",
  "cm_solicitacoes_diario",
  "cm_humor_atual",
  "cm_pacientes",
  "cm_curtidas",
  "cm_amizades",
  "cm_compartilhamentos",
  "cm_profissionais_usuario",
];

/* Campos de perfil que são dados de saúde/bem-estar. O painel
   administrativo não os recebe, mesmo que venham no payload. */
export const CAMPOS_SENSIVEIS = [
  "humor", "humor_atual", "sono", "ansiedade", "atividade",
  "estresse", "comentario", "acompanhamento", "nascimento",
  "genero", "diario", "diarioAcesso", "ultimaSessao",
];

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */

const txt = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Gravação idempotente: procura uma linha com exatamente estes
 * valores e só insere quando não acha.
 *
 * Sem isso, reimportar o mesmo navegador duplicaria denúncias,
 * consultas, conteúdos e movimentações — o painel mentiria para o
 * admin. Quem chama soma em `resumo.duplicadas` quando ela
 * devolve false.
 *
 * As colunas comparáveis usam `IS` porque `= NULL` nunca
 * encontra nada no SQLite.
 */
function inserirSeFaltar(sqlExistente, sqlInserir, valores) {
  if (db.prepare(sqlExistente).get(...valores)) return false;
  db.prepare(sqlInserir).run(...valores);
  return true;
}

/** Só aceita data ISO real; sem isso, cai na data da importação. */
function dataIso(v) {
  const s = txt(v, 40);
  if (!s) return "";
  const d = new Date(s.length === 10 ? `${s}T12:00:00Z` : s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function dataIsoOuAgora(v) {
  return dataIso(v) || agoraISO();
}

/** "YYYY-MM-DD" para as colunas de data (consultas, movimentação). */
function dataCurta(v) {
  return dataIso(v).slice(0, 10);
}

/** Remove campos sensíveis de um objeto, sem mutar o original. */
function semSensiveis(objeto) {
  const saida = {};
  for (const [chave, valor] of Object.entries(objeto || {})) {
    if (CAMPOS_SENSIVEIS.includes(chave)) continue;
    saida[chave] = valor;
  }
  return saida;
}

/* O profissional importado chega "pendente" e só o admin libera,
   exatamente como no fluxo real do site. */
const STATUS_PROFISSIONAL = "pendente";

/* ------------------------------------------------------------
   IMPORTAÇÃO
   ------------------------------------------------------------ */

export function importarDoNavegador(payload = {}) {
  const origem = payload && typeof payload === "object" ? payload : {};
  const resumo = {
    usuarios: 0, profissionais: 0, publicacoes: 0, comentarios: 0,
    denuncias: 0, consultas: 0, conteudos: 0, movimentacoes: 0,
    duplicadas: 0, ignoradas: [], rejeitadas: [],
  };

  /* Qualquer tentativa de trazer dado sensível é anotada e
     descartada antes de chegar perto do SQL. */
  for (const chave of CHAVES_BLOQUEADAS) {
    if (chave in origem) {
      resumo.rejeitadas.push(chave);
      delete origem[chave];
    }
  }

  const agora = agoraISO();

  /* ---------- usuários ---------- */
  const perfil = semSensiveis(origem.cm_profile);
  if (perfil && (perfil.email || perfil.nome)) {
    const email = txt(perfil.email, 160);
    if (email) {
      /* `changes` diz se a linha entrou de fato: reimportar o mesmo
         navegador não pode inflar o contador. */
      const gravado = db.prepare(
        `INSERT INTO usuarios (nome, sobrenome, email, telefone, foto, status, bloqueado, data_cadastro)
         VALUES (?, ?, ?, ?, ?, 'ativo', 0, ?)
         ON CONFLICT(email) DO NOTHING`
      ).run(
        txt(perfil.nome, 120) || email.split("@")[0],
        txt(perfil.sobrenome, 120) || null,
        email,
        txt(perfil.telefone, 40) || null,
        txt(perfil.foto, 200000) || null,
        dataIsoOuAgora(perfil.data_cadastro)
      ).changes;
      if (gravado) resumo.usuarios++;
      else resumo.duplicadas++;
    }
  }

  /* ---------- profissionais ---------- */
  const prof = semSensiveis(origem.cm_profile_profissional);
  if (prof && prof.email) {
    const gravado = db.prepare(
      `INSERT INTO profissionais (nome, email, telefone, foto, registro, especialidade, bio, status, bloqueado, data_cadastro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
       ON CONFLICT(email) DO NOTHING`
    ).run(
      txt(prof.nome, 120) || txt(prof.email).split("@")[0],
      txt(prof.email, 160),
      txt(prof.telefone, 40) || null,
      txt(prof.foto, 200000) || null,
      txt(prof.registroProfissional, 60) || txt(prof.registro, 60) || null,
      txt(prof.profissao, 80) || txt(prof.especialidade, 80) || null,
      txt(prof.bio, 1000) || null,
      STATUS_PROFISSIONAL,
      dataIsoOuAgora(prof.data_cadastro)
    ).changes;
    if (gravado) resumo.profissionais++;
    else resumo.duplicadas++;
  }

  /* ---------- publicações e comentários ---------- */
  const postagens = Array.isArray(origem.cm_postagens) ? origem.cm_postagens : [];
  for (const p of postagens) {
    const conteudo = txt(p && p.texto, 4000);
    const autor = txt(p && p.autor, 120);
    if (!conteudo || !autor) continue;

    const criadaEm = dataIsoOuAgora(p.data);
    const jaExiste = db
      .prepare("SELECT id FROM publicacoes WHERE autor_nome = ? AND conteudo = ? AND criada_em = ?")
      .get(autor, conteudo, criadaEm);

    let publicacaoId = jaExiste ? jaExiste.id : null;
    if (!publicacaoId) {
      publicacaoId = db
        .prepare(
          "INSERT INTO publicacoes (autor_nome, autor_tipo, conteudo, criada_em, removida) VALUES (?, ?, ?, ?, 0)"
        )
        .run(autor, "usuario", conteudo, criadaEm).lastInsertRowid;
      resumo.publicacoes++;
    } else {
      resumo.duplicadas++;
    }

    for (const c of p.comentarios || []) {
      const textoComentario = txt(c && c.texto, 2000);
      const autorComentario = txt(c && c.autor, 120);
      if (!textoComentario || !autorComentario) continue;
      const criadoEm = dataIsoOuAgora(c.data);
      if (inserirSeFaltar(
        "SELECT id FROM comentarios WHERE publicacao_id = ? AND autor_nome = ? AND conteudo = ? AND criado_em = ?",
        "INSERT INTO comentarios (publicacao_id, autor_nome, conteudo, criado_em, removido) VALUES (?, ?, ?, ?, 0)",
        [publicacaoId, autorComentario, textoComentario, criadoEm]
      )) {
        resumo.comentarios++;
      } else {
        resumo.duplicadas++;
      }
    }
  }

  /* ---------- denúncias ---------- */
  for (const d of Array.isArray(origem.cm_denuncias) ? origem.cm_denuncias : []) {
    const textoDenuncia = txt(d && d.texto, 2000);
    if (!textoDenuncia) continue;
    const tipoAlvo = "comentario";
    const alvoId = num(d.postId) || null;
    const alvoAutor = txt(d.autor, 120) || null;
    const criadaEm = dataIsoOuAgora(d.data);
    if (inserirSeFaltar(
      `SELECT id FROM denuncias
        WHERE tipo_alvo = ? AND alvo_id IS ? AND alvo_autor IS ? AND motivo = ? AND criada_em = ?`,
      `INSERT INTO denuncias (tipo_alvo, alvo_id, alvo_autor, motivo, criada_em, status)
       VALUES (?, ?, ?, ?, ?, 'pendente')`,
      [tipoAlvo, alvoId, alvoAutor, textoDenuncia, criadaEm]
    )) {
      resumo.denuncias++;
    } else {
      resumo.duplicadas++;
    }
  }

  /* ---------- consultas (do usuário e do profissional) ---------- */
  /* O app do profissional grava "realizado"/"cancelado"; o painel
     usa "realizada"/"cancelada". Traduzimos em vez de descartar. */
  const TRADUCAO_CONSULTA = {
    agendada: "agendada", agendado: "agendada", pendente: "agendada",
    realizada: "realizada", realizado: "realizada", concluida: "realizada",
    cancelada: "cancelada", cancelado: "cancelada",
  };

  const gravarConsulta = (item, profissionalPadrao) => {
    const paciente = txt(item && item.paciente, 120);
    const data = dataCurta(item && item.data);
    if (!paciente || !data) return;

    const status = TRADUCAO_CONSULTA[txt(item.status, 20).toLowerCase()] || "agendada";
    const valores = [
      txt(item.profissional, 120) || profissionalPadrao || "Não informado",
      paciente,
      data,
      txt(item.horario || item.hora, 10) || "00:00",
      status,
      num(item.valor),
    ];

    if (inserirSeFaltar(
      `SELECT id FROM consultas
        WHERE profissional = ? AND paciente = ? AND data = ? AND hora = ? AND status = ? AND valor = ?`,
      "INSERT INTO consultas (profissional, paciente, data, hora, status, valor) VALUES (?, ?, ?, ?, ?, ?)",
      valores
    )) {
      resumo.consultas++;
    } else {
      resumo.duplicadas++;
    }
  };

  for (const c of Array.isArray(origem.cm_consultas) ? origem.cm_consultas : []) {
    gravarConsulta(c, "");
  }
  const nomeProf = txt(origem.cm_profile_profissional && origem.cm_profile_profissional.nome, 120);
  for (const c of Array.isArray(origem.cm_agenda_profissional) ? origem.cm_agenda_profissional : []) {
    gravarConsulta(c, nomeProf);
  }

  /* ---------- conteúdos do profissional ---------- */
  for (const c of Array.isArray(origem.cm_conteudos_profissional) ? origem.cm_conteudos_profissional : []) {
    const titulo = txt(c && c.titulo, 160);
    const corpo = txt(c && (c.corpo || c.texto || c.conteudo), 8000);
    if (!titulo || !corpo) continue;
    const destino = "profissionais";
    const publicado = c.publicado === false ? 0 : 1;
    const criadoEm = dataIsoOuAgora(c.data);
    if (inserirSeFaltar(
      `SELECT id FROM conteudos
        WHERE titulo = ? AND corpo = ? AND destino = ? AND publicado = ? AND criado_em = ?`,
      `INSERT INTO conteudos (titulo, corpo, destino, publicado, criado_em)
       VALUES (?, ?, ?, ?, ?)`,
      [titulo, corpo, destino, publicado, criadoEm]
    )) {
      resumo.conteudos++;
    } else {
      resumo.duplicadas++;
    }
  }

  /* ---------- financeiro ---------- */
  for (const m of Array.isArray(origem.cm_movimentacoes) ? origem.cm_movimentacoes : []) {
    const descricao = txt(m && m.descricao, 200);
    const valor = num(m && m.valor);
    const data = dataCurta(m && m.data);
    if (!descricao || !valor || !data) continue;

    /* No app: entrada/saida + recebido/pago. No banco: receita/despesa + pago/pendente. */
    const tipo = txt(m.tipo, 20) === "saida" ? "despesa" : "receita";
    const status = ["recebido", "pago"].includes(txt(m.status, 20)) ? "pago" : "pendente";
    const categoria = txt(m.categoria, 80) || null;
    const valores = [tipo, descricao, valor, data, categoria, status];

    if (inserirSeFaltar(
      `SELECT id FROM movimentacoes
        WHERE tipo = ? AND descricao = ? AND valor = ? AND data = ? AND categoria IS ? AND status = ?`,
      "INSERT INTO movimentacoes (tipo, descricao, valor, data, categoria, status) VALUES (?, ?, ?, ?, ?, ?)",
      valores
    )) {
      resumo.movimentacoes++;
    } else {
      resumo.duplicadas++;
    }
  }

  /* Chaves enviadas que não entram em nenhuma tabela: ignoradas
     de propósito, para o painel não inventar dado que não tem. */
  const conhecidas = [
    "cm_profile", "cm_profile_profissional", "cm_postagens",
    "cm_denuncias", "cm_consultas", "cm_agenda_profissional",
    "cm_conteudos_profissional", "cm_movimentacoes",
    ...CHAVES_BLOQUEADAS,
  ];
  resumo.ignoradas = Object.keys(origem).filter((k) => !conhecidas.includes(k));
  resumo.hora = agora;

  return resumo;
}