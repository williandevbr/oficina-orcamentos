import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { mensagemBanco } from "../lib/mensagensErro.js";
import {
  filtrarCamposCliente,
  idValido,
  clienteCriarSchema,
  clienteAtualizarSchema,
  primeiraMensagemZod,
} from "../services/validacao.js";

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

// 1. LER (Read) - lista os clientes do usuário logado
// Sem ?page -> devolve array (compatível com o site atual).
// Com ?page -> devolve { data, total, page, limit, totalPages }.
// ?search= filtra por nome, telefone, email, placa, veículo e documento.
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, search } = req.query || {};

    // Modo legado: sem paginação, comportamento antigo
    if (page === undefined) {
      let query = supabase
        .from("clientes")
        .select("*")
        .eq("user_id", req.userId);
      if (typeof search === "string" && search.trim() !== "") {
        const s = search.trim().replace(/[%_,"'().]/g, "");
        if (s !== "") {
          query = query.or(
            `nome.ilike.%${s}%,telefone.ilike.%${s}%,email.ilike.%${s}%,placa.ilike.%${s}%,veiculo.ilike.%${s}%,documento.ilike.%${s}%`,
          );
        }
      }
      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) {
        return res.status(400).json({ message: mensagemBanco(error) });
      }
      return res.json(data);
    }

    // Modo paginado
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from("clientes")
      .select("*", { count: "exact" })
      .eq("user_id", req.userId);
    if (typeof search === "string" && search.trim() !== "") {
      const s = search.trim().replace(/[%_,"'().]/g, "");
      if (s !== "") {
        query = query.or(
          `nome.ilike.%${s}%,telefone.ilike.%${s}%,email.ilike.%${s}%,placa.ilike.%${s}%,veiculo.ilike.%${s}%,documento.ilike.%${s}%`,
        );
      }
    }
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    const total = count ?? 0;
    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (e) {
    next(e);
  }
});

// 2. CRIAR (Create) - cadastra um cliente novo
router.post("/", async (req, res, next) => {
  try {
    const campos = filtrarCamposCliente(req.body || {});
    const validado = clienteCriarSchema.safeParse(campos);
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }
    const v = validado.data;

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      user_id: req.userId,
      nome: v.nome,
      telefone: v.telefone || null,
      email: v.email || null,
      documento: v.documento || null,
      endereco: v.endereco || null,
      veiculo: v.veiculo || null,
      placa: v.placa || null,
      observacoes: v.observacoes || null,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: mensagemBanco(error) });
  }
  res.status(201).json(data); // 201 = "criado com sucesso"
  } catch (e) {
    next(e);
  }
});

// 3. ATUALIZAR (Update) - edita um cliente existente
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }
    // Whitelist: ignora id/created_at/user_id enviados por engano ou malícia
    const campos = filtrarCamposCliente(req.body || {});
    const validado = clienteAtualizarSchema.safeParse(campos);
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }

    const { data, error } = await supabase
      .from("clientes")
      .update(validado.data)
      .eq("id", id)
      .eq("user_id", req.userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ message: "Cliente não encontrado." });
      }
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    if (!data) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// 4. APAGAR (Delete) - remove um cliente
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const { data, error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id)
      .eq("user_id", req.userId)
      .select("id")
      .maybeSingle();

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    if (!data) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
