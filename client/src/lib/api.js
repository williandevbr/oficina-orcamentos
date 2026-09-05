import { supabase } from "./supabase.js";

// ============================================================
// Chamadas ao nosso servidor (com crachá automático)
// ============================================================
// Toda consulta ao servidor usa esta função. Ela pega o token
// da sessão logada e anexa no cabeçalho "Authorization".
// Em desenvolvimento (VITE_API_URL vazio) o Vite faz a ponte /api.
// Em produção, VITE_API_URL aponta para o endereço público da API.
// ============================================================

const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

// Tempo máximo de espera por resposta (20s). Sem isso, a tela
// trava "carregando" para sempre se o servidor adormecer.
const TIMEOUT_MS = 20000;

export async function apiFetch(url, opcoes = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const cabecalhos = {
    ...(opcoes.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(`${base}${url}`, {
    ...opcoes,
    headers: cabecalhos,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}
