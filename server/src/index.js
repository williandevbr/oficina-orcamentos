import express from "express";
import cors from "cors";
import { supabase } from "./lib/supabase.js";
import { autenticar } from "./middlewares/autenticar.js";
import clientesRouter from "./routes/clientes.js";
import orcamentosRouter from "./routes/orcamentos.js";

// ============================================================
// Servidor = o "gerente" do sistema.
// Ele recebe os pedidos do site (frontend) e responde com dados.
// ============================================================
const app = express();

// cors: libera o site (que roda em outra porta) falar com este servidor
app.use(cors());
// express.json: entende JSON vindo do site (ex: formulários)
app.use(express.json());

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
// Conta quantos clientes e orçamentos existem no momento
app.get("/api/resumo", async (req, res) => {
  const contCliente = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });
  const contOrc = await supabase
    .from("orcamentos")
    .select("*", { count: "exact", head: true });
  const contAprov = await supabase
    .from("orcamentos")
    .select("*", { count: "exact", head: true })
    .eq("status", "aprovado");
  const contPend = await supabase
    .from("orcamentos")
    .select("*", { count: "exact", head: true })
    .in("status", ["rascunho", "enviado"]);

  res.json({
    clientes: contCliente.count ?? 0,
    orcamentos: contOrc.count ?? 0,
    aprovados: contAprov.count ?? 0,
    pendentes: contPend.count ?? 0,
  });
});

// Liga as rotas de clientes ao caminho /api/clientes
app.use("/api/clientes", clientesRouter);

// Liga as rotas de orçamentos ao caminho /api/orcamentos
app.use("/api/orcamentos", orcamentosRouter);

app.listen(PORT, () => {
  console.log(`OrcaPro API rodando em http://localhost:${PORT}`);
});
