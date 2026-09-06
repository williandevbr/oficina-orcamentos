import { createClient } from "@supabase/supabase-js";

// ============================================================
// Cliente do Supabase (lado do site)
// ============================================================
// É a ponte entre o site e o serviço de autenticação do Supabase.
// As chaves ficam no arquivo .env (não aparecem no Git).
// ============================================================
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltando VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no arquivo client/.env. Copie o client/.env.example e preencha.",
  );
}

export const supabase = createClient(url, anonKey);
