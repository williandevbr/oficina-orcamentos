import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.ts";
import { mensagemBanco } from "../lib/mensagensErro.ts";
import {
  filtrarCamposVeiculo,
  idValido,
  veiculoCriarSchema,
  veiculoAtualizarSchema,
  primeiraMensagemZod,
} from "../services/validacao.ts";

// ============================================================
// Rotas da API de VEÍCULOS (1 cliente -> N veículos)
// ============================================================
//   GET    /api/veiculos?cliente_id=  -> lista (filtro opcional)
//   POST   /api/veiculos              -> cadastra num cliente
//   PUT    /api/veiculos/:id          -> atualiza (cliente nunca muda)
//   DELETE /api/veiculos/:id          -> remove (orçamentos ficam sem veículo)
// ============================================================

const router = Router();

// Garante que o cliente é do usuário logado (trava troca de dono)
async function clienteDoUsuario(
  clienteId: string,
  userId: string,
): Promise<{ erro?: string; ok?: true }> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { erro: mensagemBanco(error) };
  if (!data) return { erro: "Escolha um cliente válido para o veículo." };
  return { ok: true };
}

// 1. LISTAR veículos do usuário (opcional: só de um cliente)
// ?search= filtra por veículo ou placa. ?cliente_id= filtra o dono.
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cliente_id, search } = req.query || {};
    let query = supabase
      .from("veiculos")
      .select("*")
      .eq("user_id", req.userId);
    if (typeof cliente_id === "string" && cliente_id.trim() !== "") {
      if (!idValido(cliente_id.trim())) {
        return res.status(400).json({ message: "Cliente inválido." });
      }
      query = query.eq("cliente_id", cliente_id.trim());
    }
    if (typeof search === "string" && search.trim() !== "") {
      const s = search.trim().replace(/[%_,"'().]/g, "");
      if (s !== "") {
        query = query.or(`veiculo.ilike.%${s}%,placa.ilike.%${s}%`);
      }
    }
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// 2. CRIAR (Create) - cadastra um veículo num cliente do usuário
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const corpo = req.body || {};
    const validado = veiculoCriarSchema.safeParse({
      cliente_id: corpo.cliente_id,
      ...filtrarCamposVeiculo(corpo),
    });
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }
    const v = validado.data;

    const dono = await clienteDoUsuario(v.cliente_id, req.userId);
    if (dono.erro) {
      return res.status(400).json({ message: dono.erro });
    }

    const { data, error } = await supabase
      .from("veiculos")
      .insert({
        user_id: req.userId,
        cliente_id: v.cliente_id,
        veiculo: v.veiculo,
        placa: v.placa || null,
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

// 3. ATUALIZAR (Update) - edita nome/placa (o cliente do veículo nunca muda)
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }
    const campos = filtrarCamposVeiculo(req.body || {});
    const validado = veiculoAtualizarSchema.safeParse(campos);
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }

    const { data, error } = await supabase
      .from("veiculos")
      .update(validado.data)
      .eq("id", id)
      .eq("user_id", req.userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ message: "Veículo não encontrado." });
      }
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    if (!data) {
      return res.status(404).json({ message: "Veículo não encontrado." });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// 4. APAGAR (Delete) - remove o veículo (orçamentos ficam sem veículo)
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const { data, error } = await supabase
      .from("veiculos")
      .delete()
      .eq("id", id)
      .eq("user_id", req.userId)
      .select("id")
      .maybeSingle();

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    if (!data) {
      return res.status(404).json({ message: "Veículo não encontrado." });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
