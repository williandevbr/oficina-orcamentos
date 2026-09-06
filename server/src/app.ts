import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { supabase } from "./lib/supabase.ts";
import { autenticar } from "./middlewares/autenticar.ts";
import clientesRouter from "./routes/clientes.ts";
import veiculosRouter from "./routes/veiculos.ts";
import perfilRouter from "./routes/perfil.ts";
import lojaRouter from "./routes/loja.ts";
import orcamentosRouter from "./routes/orcamentos.ts";
import catalogoRouter from "./routes/catalogo.ts";

// ============================================================
// App Express (sem listen) — o listen fica no index.js.
// Separado para os testes de integração usarem o app direto
// via supertest, sem subir porta e sem banco de verdade.
// ============================================================
export const app = express();
app.set("trust proxy", 1);

// helmet: cabeçalhos de segurança (XSS, clickjacking, MIME sniffing)
app.use(helmet());
// cors: libera SÓ o site oficial falar com este servidor
const origens = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: origens, credentials: true }));
// express.json: entende JSON vindo do site (com limite anti-DoS)
app.use(express.json({ limit: "100kb" }));

// rate-limit: evita força bruta e DoS (PDF é rota cara)
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Rota de saúde: serve para saber se o servidor está no ar
// (por isso fica ANTES do porteiro — não precisa de login)
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "OrcaPro API",
    time: new Date().toISOString(),
  });
});

// Porteiro: a partir daqui, toda rota /api exige um usuário logado
app.use("/api", autenticar);

// Resumo para o painel inicial (Dashboard)
// Conta só os dados do usuário logado
app.get("/api/resumo", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const [contCliente, contOrc, contAprov, contPend] = await Promise.all([
      supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("orcamentos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("orcamentos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "aprovado"),
      supabase
        .from("orcamentos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["rascunho", "enviado"]),
    ]);

    res.json({
      clientes: contCliente.count ?? 0,
      orcamentos: contOrc.count ?? 0,
      aprovados: contAprov.count ?? 0,
      pendentes: contPend.count ?? 0,
    });
  } catch (e) {
    next(e);
  }
});

// Liga as rotas de clientes ao caminho /api/clientes
app.use("/api/clientes", clientesRouter);

// Liga as rotas de veículos ao caminho /api/veiculos
app.use("/api/veiculos", veiculosRouter);

// Liga as rotas do perfil e da loja (configurações)
app.use("/api/perfil", perfilRouter);
app.use("/api/loja", lojaRouter);

// Liga as rotas de orçamentos ao caminho /api/orcamentos
app.use("/api/orcamentos", orcamentosRouter);

// Liga as rotas do catálogo ao caminho /api/catalogo
app.use("/api/catalogo", catalogoRouter);

// 404 para rotas desconhecidas
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

// Tratamento global de erro (não vaza detalhes internos em 500)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
  res.status(status).json({ message: err.message || "Erro na requisição." });
});
