/* ==========================================================
   CLEAR MINDS — Servidor do ambiente administrativo
   ==========================================================
   node admin/server.js      (sem dependências externas)

   Serve o painel administrativo em /admin e as páginas
   estáticas do projeto em / (as de usuário e profissional
   continuam exatamente como antes, via localStorage).
   ========================================================== */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { db, CAMINHO_DB, EMAIL_ADMIN_INICIAL, contarAdmins } from "./db.js";
import { limparSessoesExpiradas, lerSessaoDoPedido } from "./security.js";
import { tratar } from "./api.js";
import { registrarAuditoria } from "./audit.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ_SITE = join(__dirname, "..");
const PASTA_ADMIN = join(__dirname, "public");

const PORTA = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || "127.0.0.1";

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/* Cabeçalhos de segurança aplicados a tudo. */
const cabecalhosSeguranca = (res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
      // apenas o estilo inline dos gráficos/medidas; sem script inline
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
      "img-src 'self' data: https://cdnjs.cloudflare.com https://unpkg.com/leaflet@1.9.4/dist/images/ https://*.tile.openstreetmap.org",
      "connect-src 'self' https://nominatim.openstreetmap.org https://overpass-api.de",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ")
  );
};

/** Impede path traversal: o caminho resolvido tem de ficar sob a raiz. */
function caminhoSeguro(base, urlCaminho) {
  const relativo = decodeURIComponent(urlCaminho).replace(/^\/+/, "");
  const alvo = normalize(join(base, relativo));
  if (!alvo.startsWith(base + sep) && alvo !== base) return null;
  return alvo;
}

async function servirArquivo(res, caminho, { cache = false } = {}) {
  try {
    const info = await stat(caminho);
    if (!info.isFile()) return false;
    const conteudo = await readFile(caminho);
    res.writeHead(200, {
      "Content-Type": TIPOS[extname(caminho).toLowerCase()] || "application/octet-stream",
      "Cache-Control": cache ? "public, max-age=300" : "no-store",
    });
    res.end(conteudo);
    return true;
  } catch {
    return false;
  }
}

export function criarServidor() {
return createServer(async (req, res) => {
  cabecalhosSeguranca(res);

  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  } catch {
    res.writeHead(400).end("Requisição inválida.");
    return;
  }

  const caminho = url.pathname;

  /* ---------- API ---------- */
  if (caminho.startsWith("/api/")) {
    const encontrada = await tratar(req, res, caminho);
    if (!encontrada) {
      if (!res.headersSent) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ erro: "Recurso não encontrado." }));
      }
    }
    return;
  }

  /* ---------- painel administrativo ---------- */
  if (caminho === "/" || caminho === "/admin" || caminho === "/admin/") {
    res.writeHead(302, { Location: "/admin/login.html" });
    res.end();
    return;
  }

  if (caminho.startsWith("/admin/")) {
    const relativo = caminho.slice("/admin/".length);
    const alvo = caminhoSeguro(PASTA_ADMIN, relativo);
    if (!alvo) {
      res.writeHead(403).end("Acesso negado.");
      return;
    }

    /* O painel é servido apenas para quem tem sessão administrativa
       válida. Login, CSS e JS do próprio login continuam públicos,
       senão ninguém conseguiria nem abrir a tela de acesso. */
    const ehTelaDeLogin = /^(login\.html|login\.js)$/i.test(relativo);
    const ehPaginaDoPainel =
      relativo === "admin.html" || (!extname(relativo) && !ehTelaDeLogin);

    if (ehPaginaDoPainel) {
      const sessao = lerSessaoDoPedido(req);
      if (!sessao || sessao.role !== "admin" || sessao.ativo !== 1 || sessao.setup_feito !== 1) {
        res.writeHead(302, { Location: "/admin/login.html", "Cache-Control": "no-store" });
        res.end();
        return;
      }
    }

    if (await servirArquivo(res, alvo, { cache: false })) return;

    // o SPA admin é single-page: rotas internas caem no painel
    const semExtensao = !extname(alvo);
    if (semExtensao) {
      const painel = join(PASTA_ADMIN, "admin.html");
      if (await servirArquivo(res, painel)) return;
    }

    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404</h1><p>Arquivo não encontrado.</p>");
    return;
  }

  /* ---------- páginas estáticas do projeto (inalteradas) ---------- */
  const alvo = caminhoSeguro(RAIZ_SITE, caminho);
  if (alvo && await servirArquivo(res, alvo, { cache: false })) return;

  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<h1>404</h1><p>Página não encontrada.</p>");
});
}

/* Limpeza periódica de sessões expiradas. */
const timer = setInterval(() => {
  try {
    limparSessoesExpiradas();
  } catch (e) {
    console.error("[manutencao] falha ao limpar sessões:", e.message);
  }
}, 30 * 60 * 1000);
timer.unref();

export function iniciar(porta = PORTA, host = HOST) {
  return new Promise((resolve) => {
    const servidor = criarServidor();
    servidor.listen(porta, host, () => {
      const linha = "─".repeat(52);
      console.log(`\n${linha}`);
      console.log("  Clear Minds — Ambiente administrativo");
      console.log(linha);
      const real = servidor.address().port;
      console.log(`  URL ..... http://${host}:${real}/admin/login.html`);
      console.log(`  Banco ... ${CAMINHO_DB}`);
      console.log(`  E-mail .. ${EMAIL_ADMIN_INICIAL}`);
      console.log(`  Contas .. ${contarAdmins()} conta(s) administrativa(s)`);

      const setupPendente = db
        .prepare("SELECT COUNT(*) AS n FROM admins WHERE setup_feito = 0")
        .get().n;
      if (setupPendente > 0) {
        console.log(`\n  >> Primeiro acesso pendente: defina a senha de`);
        console.log(`     ${EMAIL_ADMIN_INICIAL} na tela de configuração.`);
      }
      console.log(`\n  Login de usuário e profissional: Continue abrindo os`);
      console.log(`  arquivos .html diretamente no navegador, como antes.\n${linha}\n`);
      resolve(servidor);
    });
  });
}

/* Só sobe sozinho quando executado diretamente (não em import). */
function foiExecutadoDireto() {
  const entrada = process.argv[1];
  if (!entrada) return false;
  try {
    return realpathSync(entrada) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
const executadoDireto = foiExecutadoDireto();

if (executadoDireto) {
  const servidor = await iniciar();

  process.on("SIGINT", () => {
    console.log("\nEncerrando Clear Minds...");
    try { db.close(); } catch {}
    servidor.close();
    process.exit(0);
  });

  process.on("uncaughtException", (e) => {
    console.error("[erro fatal]", e);
  });
}

process.on("SIGINT", () => {
  console.log("\nEncerrando Clear Minds...");
  try { db.close(); } catch {}
  process.exit(0);
});

process.on("uncaughtException", (e) => {
  console.error("[erro fatal]", e);
});