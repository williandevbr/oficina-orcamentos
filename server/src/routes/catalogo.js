import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { mensagemBanco } from "../lib/mensagensErro.js";
import {
  idValido,
  catalogoSchema,
  catalogoAtualizarSchema,
  primeiraMensagemZod,
} from "../services/validacao.js";

// ============================================================
// Rotas da API do CATÁLOGO (peças e serviços)
// ============================================================
// A oficina cadastra uma vez e depois só puxa no orçamento.
//   GET    /api/catalogo      -> lista (?search=, ?page=&limit=)
//   POST   /api/catalogo      -> cria
//   PUT    /api/catalogo/:id  -> atualiza
//   DELETE /api/catalogo/:id  -> remove
// ============================================================

const router = Router();

// 1. LER — só os itens do usuário logado
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, search, tipo } = req.query || {};

    const aplicarFiltros = (query) => {
      let q = query.eq("user_id", req.userId);
      if (tipo === "servico" || tipo === "peca") q = q.eq("tipo", tipo);
      if (typeof search === "string" && search.trim() !== "") {
        const s = search.trim().replace(/[%_,"'().]/g, "");
        if (s !== "") q = q.ilike("descricao", `%${s}%`);
      }
      return q;
    };

    // Modo legado: array (sem ?page)
    if (page === undefined) {
      const { data, error } = await aplicarFiltros(
        supabase.from("catalogo_itens").select("*"),
      ).order("descricao", { ascending: true });
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

    const { data, error, count } = await aplicarFiltros(
      supabase.from("catalogo_itens").select("*", { count: "exact" }),
    )
      .order("descricao", { ascending: true })
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

// 2. CRIAR
router.post("/", async (req, res, next) => {
  try {
    const validado = catalogoSchema.safeParse(req.body || {});
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }
    const v = validado.data;

    const { data, error } = await supabase
      .from("catalogo_itens")
      .insert({
        user_id: req.userId,
        descricao: v.descricao,
        tipo: v.tipo,
        valor_unitario: Number(v.valor_unitario),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ message: "Já existe esse item no catálogo." });
      }
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

// 3. ATUALIZAR
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }
    const validado = catalogoAtualizarSchema.safeParse(req.body || {});
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }
    const v = validado.data;

    const { data, error } = await supabase
      .from("catalogo_itens")
      .update({
        descricao: v.descricao,
        tipo: v.tipo,
        valor_unitario: Number(v.valor_unitario),
      })
      .eq("id", id)
      .eq("user_id", req.userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ message: "Já existe esse item no catálogo." });
      }
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    if (!data) {
      return res.status(404).json({ message: "Item não encontrado." });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// 4. APAGAR
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const { data, error } = await supabase
      .from("catalogo_itens")
      .delete()
      .eq("id", id)
      .eq("user_id", req.userId)
      .select("id")
      .maybeSingle();

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    if (!data) {
      return res.status(404).json({ message: "Item não encontrado." });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
