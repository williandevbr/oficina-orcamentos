import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.ts";

// ============================================================
// Porteiro da API
// ============================================================
// Todo pedido que chega nas rotas do sistema passa por aqui.
// Ele confere o "crachá" (token) que o site envia junto com o pedido.
// Sem crachá válido -> 401 (não autorizado) e nada é feito.
// ============================================================
export async function autenticar(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const cabecalho = req.headers.authorization || "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Faça login para continuar." });
    return;
  }

  try {
    // O Supabase verifica se o crachá é verdadeiro e não está vencido.
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ message: "Sessão inválida ou expirada." });
      return;
    }

    // Guarda o usuário na requisição para o restante das rotas usarem
    req.usuario = data.user;
    req.userId = data.user.id;
    req.token = token;
    return next();
  } catch {
    res.status(401).json({ message: "Sessão inválida ou expirada." });
    return;
  }
}
