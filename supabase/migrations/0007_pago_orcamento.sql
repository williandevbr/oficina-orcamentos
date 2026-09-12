-- ============================================================
-- Migration 0007: controle básico recebido/pendente (financeiro mínimo)
-- ============================================================
-- Adiciona a coluna "pago" em orcamentos:
--   false = pendente (padrão) | true = recebido
-- Só para o mecânico saber o que já entrou. Nada mais.
-- Rode no SQL Editor do Supabase APÓS a 0006.
-- ============================================================

alter table public.orcamentos
  add column if not exists pago boolean not null default false;

create index if not exists idx_orcamentos_pago on public.orcamentos (user_id, pago);
