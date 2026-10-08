/* ==========================================================
   CLEAR MINDS — Utilidades de dados (somente agregados)
   ==========================================================
   REGRA CENTRAL DO ITEM 16 DO PEDIDO:
   o administrador NÃO tem leitura direta de diários, notas
   privadas ou conteúdo clínico. Este arquivo não expõe
   nenhuma função que devolva esse tipo de dado, e nem
   existe tabela de diário no banco administrativo.
   ========================================================== */

import { db, agoraISO } from "./db.js";

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */

const emIso = () => new Date().toISOString();

/** Normaliza "YYYY-MM-DD" ou ISO completo para o início do dia local. */
export function inicioDoDia(iso) {
  return `${String(iso).slice(0, 10)}T00:00:00.000Z`;
}

export function fimDoDia(iso) {
  return `${String(iso).slice(0, 10)}T23:59:59.999Z`;
}

/**
 * Resolve "dia" | "semana" | "mes" | "ano" | {de, ate} em
 * um intervalo [inicio, fim) em ISO. Sem data válida, cai
 * no mês corrente — nunca inventa números.
 */
export function resolverPeriodo(periodo) {
  const agora = new Date();
  const iso = (d) => d.toISOString().slice(0, 19) + ".000Z";

  switch (periodo) {
    case "dia": {
      const inicio = new Date(
        Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate())
      );
      return { de: inicio.toISOString(), ate: new Date(inicio.getTime() + 86400000).toISOString() };
    }
    case "semana": {
      const d = new Date(
        Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate())
      );
      const diaSemana = (d.getUTCDay() + 6) % 7;      // semana começa na segunda
      const inicio = new Date(d.getTime() - diaSemana * 86400000);
      return { de: inicio.toISOString(), ate: new Date(inicio.getTime() + 7 * 86400000).toISOString() };
    }
    case "ano": {
      const inicio = new Date(Date.UTC(agora.getUTCFullYear(), 0, 1));
      return { de: inicio.toISOString(), ate: new Date(Date.UTC(agora.getUTCFullYear() + 1, 0, 1)).toISOString() };
    }
    case "mes":
    default: {
      const inicio = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1));
      return { de: inicio.toISOString(), ate: new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + 1, 1)).toISOString() };
    }
  }
}

export function resolverPeriodoCustomizado(de, ate) {
  if (!de || !ate) return resolverPeriodo("mes");
  return { de: `${de}T00:00:00.000Z`, ate: `${ate}T23:59:59.999Z` };
}

/* ------------------------------------------------------------
   DASHBOARD — apenas contagens e status, sem conteúdo
   ------------------------------------------------------------ */

export function resumoDashboard() {
  const u = (sql, ...p) => db.prepare(sql).get(...p);

  return {
    usuariosTotal: u("SELECT COUNT(*) AS n FROM usuarios").n,
    usuariosAtivos: u("SELECT COUNT(*) AS n FROM usuarios WHERE status='ativo' AND bloqueado=0").n,
    usuariosBloqueados: u("SELECT COUNT(*) AS n FROM usuarios WHERE bloqueado=1").n,
    usuariosInativos: u("SELECT COUNT(*) AS n FROM usuarios WHERE status<>'ativo'").n,

    profissionaisTotal: u("SELECT COUNT(*) AS n FROM profissionais").n,
    profissionaisAprovados: u("SELECT COUNT(*) AS n FROM profissionais WHERE status IN ('aprovado','ativo')").n,
    profissionaisPendentes: u("SELECT COUNT(*) AS n FROM profissionais WHERE status='pendente'").n,
    profissionaisRejeitados: u("SELECT COUNT(*) AS n FROM profissionais WHERE status='rejeitado'").n,
    profissionaisInativos: u("SELECT COUNT(*) AS n FROM profissionais WHERE status='inativo'").n,

    denunciasPendentes: u("SELECT COUNT(*) AS n FROM denuncias WHERE status IN ('pendente','em_analise')").n,
   denunciasTotal: u("SELECT COUNT(*) AS n FROM denuncias").n,

    publicacoes: u("SELECT COUNT(*) AS n FROM publicacoes WHERE removida=0").n,
    comentarios: u("SELECT COUNT(*) AS n FROM comentarios WHERE removido=0").n,

    solicitacoesPendentes: u("SELECT COUNT(*) AS n FROM profissionais WHERE status='pendente'").n,

    consultasTotal: u("SELECT COUNT(*) AS n FROM consultas").n,
    consultasAgendadas: u("SELECT COUNT(*) AS n FROM consultas WHERE status='agendada'").n,
    consultasRealizadas: u("SELECT COUNT(*) AS n FROM consultas WHERE status='realizada'").n,
    consultasCanceladas: u("SELECT COUNT(*) AS n FROM consultas WHERE status='cancelada'").n,

    conteudosPublicados: u("SELECT COUNT(*) AS n FROM conteudos WHERE publicado=1").n,
    conteudosRascunho: u("SELECT COUNT(*) AS n FROM conteudos WHERE publicado=0").n,

    receitaPeriodo: u(
      "SELECT COALESCE(SUM(valor),0) AS v FROM movimentacoes WHERE tipo='receita' AND status='pago'"
    ).v,
    despesaPeriodo: u(
      "SELECT COALESCE(SUM(valor),0) AS v FROM movimentacoes WHERE tipo='despesa' AND status='pago'"
    ).v,
  };
}

/** Ações administrativas recentes — alimentos pela auditoria. */
export function atividadeRecente(limite = 8) {
  return db
    .prepare(
      `SELECT em, acao, recurso, recurso_id, resultado, admin_email
         FROM auditoria
        WHERE resultado = 'sucesso' AND acao NOT LIKE 'login.%'
        ORDER BY em DESC, id DESC
        LIMIT ?`
    )
    .all(limite);
}

/* ------------------------------------------------------------
   RELATÓRIOS — séries temporais reais
   ------------------------------------------------------------ */

export function crescimentoMensal(meses = 6) {
  const hoje = new Date();
  const pontos = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - i, 1));
    pontos.push({
      mes: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      de: d.toISOString(),
      ate: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString(),
    });
  }

  const serie = pontos.map((p) => ({
    mes: p.mes,
    usuarios: db
      .prepare("SELECT COUNT(*) AS n FROM usuarios WHERE data_cadastro >= ? AND data_cadastro < ?")
      .get(p.de, p.ate).n,
    profissionais: db
      .prepare("SELECT COUNT(*) AS n FROM profissionais WHERE data_cadastro >= ? AND data_cadastro < ?")
      .get(p.de, p.ate).n,
    publicacoes: db
      .prepare("SELECT COUNT(*) AS n FROM publicacoes WHERE criada_em >= ? AND criada_em < ?")
      .get(p.de, p.ate).n,
    consultas: db
      .prepare("SELECT COUNT(*) AS n FROM consultas WHERE data >= ? AND data < ?")
      .get(String(p.de).slice(0, 10), String(p.ate).slice(0, 10)).n,
    denuncias: db
      .prepare("SELECT COUNT(*) AS n FROM denuncias WHERE criada_em >= ? AND criada_em < ?")
      .get(p.de, p.ate).n,
  }));

  return serie;
}

/**
 * Utilização do sistema: contagens agregadas dos últimos 30 dias.
 * Nenhuma linha de diário ou dado clínico é lida.
 */
export function utilizacao30Dias() {
  const desde = new Date(Date.now() - 30 * 86400000).toISOString();
  const um = (sql) => db.prepare(sql).get(desde).n;

  return {
    novosUsuarios: um("SELECT COUNT(*) AS n FROM usuarios WHERE data_cadastro >= ?"),
    novosProfissionais: um("SELECT COUNT(*) AS n FROM profissionais WHERE data_cadastro >= ?"),
    novasPublicacoes: um("SELECT COUNT(*) AS n FROM publicacoes WHERE criada_em >= ?"),
    novosComentarios: um("SELECT COUNT(*) AS n FROM comentarios WHERE criado_em >= ?"),
    novasDenuncias: um("SELECT COUNT(*) AS n FROM denuncias WHERE criada_em >= ?"),
    consultasAgendadas: db
      .prepare("SELECT COUNT(*) AS n FROM consultas WHERE data >= ?")
      .get(String(desde).slice(0, 10)).n,
  };
}

/* ------------------------------------------------------------
   FINANCEIRO — soma real da tabela movimentacoes
   ------------------------------------------------------------ */

export function financeiro({ de, ate }) {
  /* movimentacoes.data é "YYYY-MM-DD"; os limites chegam em ISO
     completo. Comparar os dois direto erraria a faixa, então
     normalizamos os limites para data. */
  const deData = String(de).slice(0, 10);
  const ateData = String(ate).slice(0, 10);

  const linhas = db
    .prepare(
      `SELECT tipo, status, categoria, valor, data
         FROM movimentacoes
        WHERE data >= ? AND data <= ?
        ORDER BY data DESC`
    )
    .all(deData, ateData);

  let receitas = 0, despesas = 0, recebido = 0, pendente = 0;

  for (const m of linhas) {
    const valor = Number(m.valor) || 0;
    if (m.status === "pago") {
      if (m.tipo === "receita") { receitas += valor; recebido += valor; }
      else despesas += valor;
    } else {
      if (m.tipo === "receita") pendente += valor;
    }
  }

  // AWT: soma dos valores das consultas realizadas no período.
  const faturamentoRealizado = db
    .prepare(
      `SELECT COALESCE(SUM(valor),0) AS v FROM consultas
        WHERE status='realizada' AND data >= ? AND data <= ?`
    )
    .get(deData, ateData).v;

  const porCategoria = {};
  for (const m of linhas) {
    if (m.status !== "pago") continue;
    const chave = m.categoria || "Sem categoria";
    porCategoria[chave] = (porCategoria[chave] || 0) + (Number(m.valor) || 0);
  }

  return {
    receitas,
    despesas,
    recebido,
    pendente,
    saldo: receitas - despesas,
    faturamentoRealizado,
    totalMovimentacoes: linhas.length,
    porCategoria,
  };
}

export function listarMovimentacoes({ de, ate }) {
  return db
    .prepare(
      `SELECT id, tipo, descricao, valor, data, categoria, status
         FROM movimentacoes
        WHERE data >= ? AND data <= ?
        ORDER BY data DESC, id DESC`
    )
    .all(String(de).slice(0, 10), String(ate).slice(0, 10));
}

/* ------------------------------------------------------------
   AGENDAMENTOS
   ------------------------------------------------------------ */

export function estatisticasConsultas() {
  const porStatus = db
    .prepare("SELECT status, COUNT(*) AS n, COALESCE(SUM(valor),0) AS v FROM consultas GROUP BY status")
    .all();
  const porProfissional = db
    .prepare(
      `SELECT profissional, COUNT(*) AS n, COALESCE(SUM(valor),0) AS v
         FROM consultas GROUP BY profissional ORDER BY n DESC`
    )
    .all();
  return { porStatus, porProfissional };
}

export { emIso };