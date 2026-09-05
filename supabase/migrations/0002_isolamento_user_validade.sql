-- ============================================================
-- Migration 0002: isolamento por usuário + status expirado + validade
-- ============================================================
-- 1. Adiciona dono (user_id) para futuro multi-usuário
-- 2. Adiciona status 'expirado' e coluna valido_ate
-- 3. Cria policies RLS por dono + trava checks
-- Rode no SQL Editor do Supabase APÓS a 0001.
-- ============================================================

-- ---------- 1. Coluna user_id (nullable para backfill) ----------
alter table public.clientes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.orcamentos
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists idx_clientes_user_id on public.clientes (user_id);
create index if not exists idx_orcamentos_user_id on public.orcamentos (user_id);
create index if not exists idx_orcamentos_user_numero on public.orcamentos (user_id, numero desc);

-- ---------- 2. Status expirado + valido_ate ----------
alter table public.orcamentos drop constraint if exists orcamentos_status_check;
alter table public.orcamentos
  add constraint orcamentos_status_check
  check (status in ('rascunho', 'enviado', 'aprovado', 'recusado', 'expirado'));

alter table public.orcamentos
  add column if not exists valido_ate timestamptz;

-- Preenche valido_ate para registros antigos
update public.orcamentos
set valido_ate = created_at + (validade_dias || ' days')::interval
where valido_ate is null;

-- Trava valores absurdos
alter table public.orcamentos drop constraint if exists orcamentos_desconto_check;
alter table public.orcamentos add constraint orcamentos_desconto_check check (desconto >= 0);
alter table public.orcamentos drop constraint if exists orcamentos_total_check;
alter table public.orcamentos add constraint orcamentos_total_check check (total >= 0);
alter table public.orcamentos drop constraint if exists orcamentos_validade_check;
alter table public.orcamentos add constraint orcamentos_validade_check check (validade_dias >= 1);

-- ---------- 3. RLS: policies por dono ----------
-- Com service_role o backend ignora RLS, mas acesso direto via anon
-- passa a respeitar o dono. Defesa em profundidade.

drop policy if exists "clientes_owner_all" on public.clientes;
create policy "clientes_owner_all" on public.clientes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "orcamentos_owner_all" on public.orcamentos;
create policy "orcamentos_owner_all" on public.orcamentos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "itens_via_orcamento" on public.orcamento_itens;
create policy "itens_via_orcamento" on public.orcamento_itens
  for all
  using (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_id and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_id and o.user_id = auth.uid()
    )
  );

-- ---------- 4. Backfill OBRIGATÓRIO (rode manualmente) ----------
-- Descubra seu UUID em Authentication > Users e rode:
--   update public.clientes set user_id = 'SEU-UUID' where user_id is null;
--   update public.orcamentos set user_id = (
--     select user_id from public.clientes where id = cliente_id
--   ) where user_id is null;
-- Depois trave:
--   alter table public.clientes alter column user_id set not null;
--   alter table public.orcamentos alter column user_id set not null;
