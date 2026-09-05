// ============================================================
// Setup dos testes (vitest) — roda ANTES de qualquer teste.
// ============================================================
// O módulo do Supabase desliga o processo se as chaves não
// existirem. No CI não há .env (segredos não entram no Git),
// então preenchemos valores FALSOS só para os testes.
// Os testes de integração usam banco simulado (mock) mesmo —
// essas chaves nunca conectam de verdade.
// ============================================================
process.env.SUPABASE_URL ||= "http://localhost:54321";
process.env.SUPABASE_ANON_KEY ||= "chave-falsa-de-teste";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= process.env.SUPABASE_ANON_KEY;
process.env.FRONTEND_URL ||= "http://localhost:5173";
process.env.PORT ||= "3333";
