import { supabase } from "./supabase.js";

// ============================================================
// Chamadas ao nosso servidor (com crachá automático)
// ============================================================
// Toda consulta ao servidor usa esta função. Ela pega o token
// da sessão logada e anexa no cabeçalho "Authorization".
// ============================================================
export async function apiFetch(url, opcoes = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const cabecalhos = {
    ...(opcoes.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...opcoes, headers: cabecalhos });
}
