import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { mensagemBanco } from "../lib/mensagensErro.js";
import {
  perfilSchema,
  primeiraMensagemZod,
} from "../services/validacao.js";

// ============================================================
// Rotas do PERFIL (quem usa o sistema)
// ============================================================
//   GET /api/perfil -> devolve o perfil (404 se ainda não criou)
//   PUT /api/perfil -> cria ou atualiza (upsert pelo dono)
// Na primeira entrada o site manda para /perfil criar.
// ============================================================

const router = Router();

// LER o perfil do usuário logado
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    if (!data) {
      return res.status(404).json({ message: "Perfil ainda não criado." });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// CRIAR OU ATUALIZAR (upsert: salva pelo dono, sem duplicar)
router.put("/", async (req, res, next) => {
  try {
    const validado = perfilSchema.safeParse(req.body || {});
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }

    const { data, error } = await supabase
      .from("perfis")
      .upsert({ user_id: req.userId, nome: validado.data.nome })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;
