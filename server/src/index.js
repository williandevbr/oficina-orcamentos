import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { supabase } from "./lib/supabase.js";
import { autenticar } from "./middlewares/autenticar.js";
import clientesRouter from "./routes/clientes.js";
import orcamentosRouter from "./routes/orcamentos.js";

// ============================================================
// Servidor = o "gerente" do sistema.
// Ele recebe os pedidos do site (frontend) e responde com dados.
// ============================================================
const app = express();
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

const PORT = process.env.PORT || 3333;

// Rota de saúde: serve para saber se o servidor está no ar
// (por isso fica ANTES do porteiro — não precisa de login)
app.get("/api/health", (req, res) => {
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
app.get("/api/resumo", async (req, res, next) => {
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

// Liga as rotas de orçamentos ao caminho /api/orcamentos
app.use("/api/orcamentos", orcamentosRouter);

// 404 para rotas desconhecidas
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

// Tratamento global de erro (não vaza detalhes internos em 500)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
  res.status(status).json({ message: err.message || "Erro na requisição." });
});

app.listen(PORT, () => {
  console.log(`OrcaPro API rodando em http://localhost:${PORT}`);
});
