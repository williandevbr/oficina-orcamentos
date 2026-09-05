import { supabase } from "../lib/supabase.js";

// ============================================================
// Porteiro da API
// ============================================================
// Todo pedido que chega nas rotas do sistema passa por aqui.
// Ele confere o "crachá" (token) que o site envia junto com o pedido.
// Sem crachá válido -> 401 (não autorizado) e nada é feito.
// ============================================================
export async function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Faça login para continuar." });
  }

  try {
    // O Supabase verifica se o crachá é verdadeiro e não está vencido.
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: "Sessão inválida ou expirada." });
    }

    // Guarda o usuário na requisição para o restante das rotas usarem
    req.usuario = data.user;
    req.userId = data.user.id;
    req.token = token;
    return next();
  } catch {
    return res.status(401).json({ message: "Sessão inválida ou expirada." });
  }
}
