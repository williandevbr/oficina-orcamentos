// Carrega as variáveis do arquivo .env (chaves de acesso)
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// Módulo de conexão com o Supabase (banco de dados na nuvem)
// ============================================================
// Este arquivo lê as chaves do arquivo .env e prepara o "cliente"
// que o servidor usa para falar com o banco.
//
// Regra de segurança:
//  - Se a SERVICE_ROLE estiver preenchida, o backend a usa
//    (ela ignora a segurança RLS - é a chave "dona do banco").
//  - Caso contrário, usa a chave ANON (pública).

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltando SUPABASE_URL ou chave no arquivo .env");
  console.error("Copie o arquivo .env.example para .env e preencha.");
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
