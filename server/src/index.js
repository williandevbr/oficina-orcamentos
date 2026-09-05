import { app } from "./app.js";

// ============================================================
// Servidor = o "gerente" do sistema.
// O app Express mora no app.js (para os testes usarem direto);
// aqui só ligamos a porta — exceto em teste.
// ============================================================
const PORT = process.env.PORT || 3333;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`OrcaPro API rodando em http://localhost:${PORT}`);
  });
}

export default app;
