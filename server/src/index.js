import express from "express";
import cors from "cors";

// Servidor = o "gerente" do sistema.
// Ele recebe os pedidos do site (frontend) e responde com dados.
// Express é a biblioteca que facilita criar esse servidor.
const app = express();

// cors: libera o site (que roda em outra porta) falar com este servidor
app.use(cors());
// express.json: entende JSON vindo do site (ex: formulários)
app.use(express.json());

const PORT = process.env.PORT || 3333;

// Rota de saúde: serve para saber se o servidor está no ar
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "OrcaPro API",
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`OrcaPro API rodando em http://localhost:${PORT}`);
});
