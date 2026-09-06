-- ============================================================
-- Migration 0006: perfil do usuário + dados da loja
-- ============================================================
-- Completa o sistema com quem usa e de quem é a oficina:
--   1. Tabela "perfis" -> nome de quem está logado (1 por usuário).
--      Na primeira entrada o sistema pede para criar o perfil.
--   2. Tabela "loja" -> dados da oficina (nome, telefone,
--      endereço, CNPJ, e-mail). O PDF usa estes dados.
-- Rode no SQL Editor do Supabase APÓS a 0005.
-- ============================================================

-- ---------- 1. Tabela: perfis (quem usa o sistema) ----------
create table if not exists public.perfis (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,                             -- nome de quem usa
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_perfis_updated_at
  before update on public.perfis
  for each row execute function public.set_updated_at();

-- ---------- 2. Tabela: loja (dados da oficina) ----------
create table if not exists public.loja (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nome_loja  text not null default '',                 -- nome da oficina
  telefone   text,
  email      text,
  endereco   text,
  cnpj       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_loja_updated_at
  before update on public.loja
  for each row execute function public.set_updated_at();

-- ---------- 3. Segurança: Row Level Security (só o dono vê o seu) ----------
alter table public.perfis enable row level security;
alter table public.loja enable row level security;

drop policy if exists "perfis_owner_all" on public.perfis;
create policy "perfis_owner_all" on public.perfis
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "loja_owner_all" on public.loja;
create policy "loja_owner_all" on public.loja
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
