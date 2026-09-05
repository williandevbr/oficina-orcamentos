-- ============================================================
-- Migration 0004: catálogo de peças e serviços
-- ============================================================
-- Tabela para a oficina cadastrar uma vez ("Pastilha de freio",
-- "Troca de óleo") com preço, e depois só puxar no orçamento.
-- Cada linha tem dono (user_id): ninguém vê o catálogo do outro.
-- Rode no SQL Editor do Supabase APÓS a 0003.
-- ============================================================

create table if not exists public.catalogo_itens (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  descricao      text not null check (char_length(trim(descricao)) >= 2),
  tipo           text not null check (tipo in ('servico', 'peca')),
  valor_unitario numeric(12,2) not null default 0 check (valor_unitario >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_catalogo_updated_at
  before update on public.catalogo_itens
  for each row execute function public.set_updated_at();

create index if not exists idx_catalogo_user_id on public.catalogo_itens (user_id);

-- Evita duplicado: mesma descrição (sem maiúscula/minúscula) por dono
create unique index if not exists uq_catalogo_user_descricao
  on public.catalogo_itens (user_id, lower(trim(descricao)));

alter table public.catalogo_itens enable row level security;

drop policy if exists "catalogo_owner_all" on public.catalogo_itens;
create policy "catalogo_owner_all" on public.catalogo_itens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
