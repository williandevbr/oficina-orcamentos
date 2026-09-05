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

// O servidor gratuito "adormece" e demora 30-60s para acordar.
// Por isso: espera 30s e, se for só LEITURA (GET) e expirou o tempo,
// tenta mais 1 vez sozinho antes de avisar erro. Escrita (POST/PUT/
// DELETE) nunca repete sozinha para não duplicar dados.
const TIMEOUT_MS = 30000;

function ehTimeout(erro) {
  return (
    erro?.name === "TimeoutError" ||
    (erro?.name === "AbortError" && !erro?._canceladoPeloUsuario)
  );
}

export async function apiFetch(url, opcoes = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const cabecalhos = {
    ...(opcoes.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const metodo = (opcoes.method || "GET").toUpperCase();
  const sinalUsuario = opcoes.signal || null;

  const tentar = () =>
    fetch(`${base}${url}`, {
      ...opcoes,
      headers: cabecalhos,
      // Junta o cancelamento da tela + o limite de tempo
      signal: sinalUsuario
        ? AbortSignal.any([sinalUsuario, AbortSignal.timeout(TIMEOUT_MS)])
        : AbortSignal.timeout(TIMEOUT_MS),
    });

  try {
    return await tentar();
  } catch (erro) {
    // Só repete leitura (GET) que expirou por tempo — e só se a tela
    // ainda está aberta. Cobre o servidor gratuito acordando (30-60s).
    if (
      metodo === "GET" &&
      ehTimeout(erro) &&
      !(sinalUsuario && sinalUsuario.aborted)
    ) {
      await new Promise((r) => setTimeout(r, 1000));
      return tentar();
    }
    throw erro;
  }
}
