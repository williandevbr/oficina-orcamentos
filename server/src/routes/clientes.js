import { Router } from "express";
import { supabase } from "../lib/supabase.js";

// ============================================================
// Rotas da API de CLIENTES (CRUD completo)
// ============================================================
// CRUD = Criar (Create), Ler (Read), Atualizar (Update), Apagar (Delete)
// É o "cardápio" de ações que o site pode pedir ao servidor:
//   GET    /api/clientes      -> lista todos
//   POST   /api/clientes      -> cria um novo
//   PUT    /api/clientes/:id  -> atualiza um existente
//   DELETE /api/clientes/:id  -> remove um
// ============================================================

const router = Router();

// 1. LER (Read) - lista todos os clientes
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false }); // mais novos primeiro

  if (error) {
    return res.status(400).json({ message: error.message });
  }
  res.json(data);
});

// 2. CRIAR (Create) - cadastra um cliente novo
router.post("/", async (req, res) => {
  const {
    nome,
    telefone,
    email,
    documento,
    endereco,
    veiculo,
    placa,
    observacoes,
  } = req.body || {};

  // Regra de negócio: nome é obrigatório
  if (!nome || !nome.trim()) {
    return res.status(400).json({ message: "O campo 'nome' é obrigatório." });
  }

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nome: nome.trim(),
      telefone: telefone || null,
      email: email || null,
      documento: documento || null,
      endereco: endereco || null,
      veiculo: veiculo || null,
      placa: placa || null,
      observacoes: observacoes || null,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }
  res.status(201).json(data); // 201 = "criado com sucesso"
});

// 3. ATUALIZAR (Update) - edita um cliente existente
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const campos = req.body || {};

  if (!campos.nome || !campos.nome.trim()) {
    return res.status(400).json({ message: "O campo 'nome' é obrigatório." });
  }

  const { data, error } = await supabase
    .from("clientes")
    .update(campos)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }
  if (!data) {
    return res.status(404).json({ message: "Cliente não encontrado." });
  }
  res.json(data);
});

// 4. APAGAR (Delete) - remove um cliente
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) {
    return res.status(400).json({ message: error.message });
  }
  res.json({ ok: true });
});

export default router;
