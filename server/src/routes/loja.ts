import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.ts";
import { mensagemBanco } from "../lib/mensagensErro.ts";
import {
  lojaSchema,
  primeiraMensagemZod,
} from "../services/validacao.ts";

// ============================================================
// Rotas da LOJA (dados da oficina, usados no PDF)
// ============================================================
//   GET /api/loja -> devolve os dados (404 se ainda não cadastrou)
//   PUT /api/loja -> cria ou atualiza (upsert pelo dono)
// ============================================================

const router = Router();

// LER os dados da loja do usuário logado
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from("loja")
      .select("*")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    if (!data) {
      return res.status(404).json({ message: "Dados da loja ainda não cadastrados." });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// CRIAR OU ATUALIZAR (upsert: salva pelo dono, sem duplicar)
router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validado = lojaSchema.safeParse(req.body || {});
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }
    const v = validado.data;

    const { data, error } = await supabase
      .from("loja")
      .upsert({
        user_id: req.userId,
        nome_loja: v.nome_loja,
        telefone: v.telefone || null,
        email: v.email || null,
        endereco: v.endereco || null,
        cnpj: v.cnpj || null,
      })
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
