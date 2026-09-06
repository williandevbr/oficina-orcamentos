-- ============================================================
-- Migration 0005: veículos do cliente (1 pessoa -> N veículos)
-- ============================================================
-- O problema: veículo e placa ficavam na tabela "clientes",
-- então a mesma pessoa com moto + carro virava 2 cadastros
-- duplicados (e o histórico ficava espalhado).
--
-- A solução profissional (modelo normalizado):
--   1. Nova tabela "veiculos" -> cada cliente tem N veículos
--   2. Leva os veículos já cadastrados para a tabela nova
--   3. Orçamento ganha "veiculo_id" (opcional) -> diz QUAL
--      veículo entrou na oficina naquele atendimento
--   4. As funções de criar/atualizar passam a aceitar o veículo
--
-- Compatibilidade: nada antigo é apagado. As colunas
-- clientes.veiculo/placa continuam como reserva (fallback).
-- Rode no SQL Editor do Supabase APÓS a 0004. Pode rodar
-- 2x sem duplicar (o backfill é idempotente).
-- ============================================================

-- ---------- 1. Tabela: veiculos ----------
create table if not exists public.veiculos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  cliente_id  uuid not null references public.clientes(id) on delete cascade,
  veiculo     text not null,                             -- ex.: "Honda CG 160"
  placa       text,                                      -- ex.: "ABC1D23"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_veiculos_updated_at
  before update on public.veiculos
  for each row execute function public.set_updated_at();

create index if not exists idx_veiculos_cliente on public.veiculos (cliente_id);
create index if not exists idx_veiculos_user_id on public.veiculos (user_id);
create index if not exists idx_veiculos_placa on public.veiculos (placa);

-- ---------- 2. Backfill: leva os veículos antigos para a tabela nova ----------
-- (só onde ainda não existe igual — pode rodar de novo sem duplicar)
insert into public.veiculos (user_id, cliente_id, veiculo, placa)
select
  c.user_id,
  c.id,
  coalesce(nullif(trim(c.veiculo), ''), nullif(trim(c.placa), ''), 'Veículo'),
  nullif(trim(c.placa), '')
from public.clientes c
where (nullif(trim(coalesce(c.veiculo, '')), '') is not null
   or nullif(trim(coalesce(c.placa, '')), '') is not null)
  and not exists (
    select 1 from public.veiculos v
    where v.cliente_id = c.id
      and coalesce(v.veiculo, '') = coalesce(c.veiculo, '')
      and coalesce(v.placa, '') = coalesce(c.placa, '')
  );

-- ---------- 3. Orçamento aponta para o veículo (opcional) ----------
alter table public.orcamentos
  add column if not exists veiculo_id uuid references public.veiculos(id) on delete set null;

create index if not exists idx_orcamentos_veiculo on public.orcamentos (veiculo_id);

-- ---------- 4. Funções: aceitam o veículo (com padrão null = código antigo ok) ----------
-- O DEFAULT null mantém o backend antigo funcionando mesmo após a migration.

drop function if exists public.criar_orcamento_com_itens(uuid, uuid, text, numeric, numeric, text, integer, jsonb);

create or replace function public.criar_orcamento_com_itens(
  p_user_id uuid,
  p_cliente_id uuid,
  p_status text,
  p_desconto numeric,
  p_total numeric,
  p_observacoes text,
  p_validade_dias integer,
  p_itens jsonb,
  p_veiculo_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orcamento_id uuid;
  v_item jsonb;
  v_desc text;
  v_tipo text;
  v_qtd numeric;
  v_unit numeric;
  v_total_linha numeric;
begin
  -- garante que o cliente é do usuário logado
  if not exists (
    select 1 from public.clientes
    where id = p_cliente_id and user_id = p_user_id
  ) then
    raise exception 'CLIENTE_INVALIDO';
  end if;

  -- se informou veículo, ele precisa ser do usuário E daquele cliente
  if p_veiculo_id is not null and not exists (
    select 1 from public.veiculos
    where id = p_veiculo_id and user_id = p_user_id and cliente_id = p_cliente_id
  ) then
    raise exception 'VEICULO_INVALIDO';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) != 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'ITENS_OBRIGATORIOS';
  end if;

  -- cria o cabeçalho (com o veículo, se informado)
  insert into public.orcamentos (user_id, cliente_id, veiculo_id, status, desconto, total, observacoes, validade_dias)
  values (p_user_id, p_cliente_id, p_veiculo_id, p_status, p_desconto, p_total, p_observacoes, p_validade_dias)
  returning id into v_orcamento_id;

  -- cria os itens (se um falhar, tudo é desfeito)
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_desc := nullif(trim(coalesce(v_item->>'descricao', '')), '');
    v_tipo := coalesce(v_item->>'tipo', '');
    v_qtd := nullif(v_item->>'quantidade', '')::numeric;
    v_unit := nullif(v_item->>'valor_unitario', '')::numeric;

    if v_desc is null then
      raise exception 'ITEM_SEM_DESCRICAO';
    end if;
    if v_tipo not in ('servico', 'peca') then
      raise exception 'ITEM_TIPO_INVALIDO';
    end if;
    if v_qtd is null or v_qtd <= 0 then
      raise exception 'ITEM_QTD_INVALIDA';
    end if;
    if v_unit is null or v_unit < 0 then
      raise exception 'ITEM_VALOR_INVALIDO';
    end if;

    v_total_linha := round((v_qtd * v_unit)::numeric, 2);

    insert into public.orcamento_itens (orcamento_id, descricao, tipo, quantidade, valor_unitario, total)
    values (v_orcamento_id, v_desc, v_tipo, v_qtd, v_unit, v_total_linha);
  end loop;

  return v_orcamento_id;
end;
$$;

drop function if exists public.atualizar_orcamento_com_itens(uuid, uuid, uuid, text, numeric, numeric, text, integer, jsonb);

create or replace function public.atualizar_orcamento_com_itens(
  p_user_id uuid,
  p_orcamento_id uuid,
  p_cliente_id uuid,
  p_status text,
  p_desconto numeric,
  p_total numeric,
  p_observacoes text,
  p_validade_dias integer,
  p_itens jsonb,
  p_veiculo_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_desc text;
  v_tipo text;
  v_qtd numeric;
  v_unit numeric;
  v_total_linha numeric;
  v_cliente_final uuid;
begin
  -- garante que o orçamento é do usuário logado
  if not exists (
    select 1 from public.orcamentos
    where id = p_orcamento_id and user_id = p_user_id
  ) then
    raise exception 'ORCAMENTO_NAO_ENCONTRADO';
  end if;

  -- se trocou o cliente, garante que o novo também é do usuário
  if p_cliente_id is not null and not exists (
    select 1 from public.clientes
    where id = p_cliente_id and user_id = p_user_id
  ) then
    raise exception 'CLIENTE_INVALIDO';
  end if;

  -- cliente final (novo ou o que já estava)
  select coalesce(p_cliente_id, cliente_id) into v_cliente_final
  from public.orcamentos where id = p_orcamento_id;

  -- se informou veículo, ele precisa ser do usuário E do cliente final
  if p_veiculo_id is not null and not exists (
    select 1 from public.veiculos
    where id = p_veiculo_id and user_id = p_user_id and cliente_id = v_cliente_final
  ) then
    raise exception 'VEICULO_INVALIDO';
  end if;

  -- atualiza o cabeçalho (null no veículo = "sem veículo específico")
  update public.orcamentos set
    cliente_id = coalesce(p_cliente_id, cliente_id),
    veiculo_id = p_veiculo_id,
    status = coalesce(p_status, status),
    desconto = coalesce(p_desconto, desconto),
    total = coalesce(p_total, total),
    observacoes = p_observacoes,
    validade_dias = coalesce(p_validade_dias, validade_dias)
  where id = p_orcamento_id and user_id = p_user_id;

  -- se p_itens for nulo, não mexe nos itens (mudou só cabeçalho)
  if p_itens is null then
    return;
  end if;

  if jsonb_typeof(p_itens) != 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'ITENS_OBRIGATORIOS';
  end if;

  -- apaga e reinsere DENTRO da mesma transação (atômico)
  delete from public.orcamento_itens where orcamento_id = p_orcamento_id;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_desc := nullif(trim(coalesce(v_item->>'descricao', '')), '');
    v_tipo := coalesce(v_item->>'tipo', '');
    v_qtd := nullif(v_item->>'quantidade', '')::numeric;
    v_unit := nullif(v_item->>'valor_unitario', '')::numeric;

    if v_desc is null then
      raise exception 'ITEM_SEM_DESCRICAO';
    end if;
    if v_tipo not in ('servico', 'peca') then
      raise exception 'ITEM_TIPO_INVALIDO';
    end if;
    if v_qtd is null or v_qtd <= 0 then
      raise exception 'ITEM_QTD_INVALIDA';
    end if;
    if v_unit is null or v_unit < 0 then
      raise exception 'ITEM_VALOR_INVALIDO';
    end if;

    v_total_linha := round((v_qtd * v_unit)::numeric, 2);

    insert into public.orcamento_itens (orcamento_id, descricao, tipo, quantidade, valor_unitario, total)
    values (p_orcamento_id, v_desc, v_tipo, v_qtd, v_unit, v_total_linha);
  end loop;
end;
$$;

-- Permite o backend (service_role) executar as funções novas
grant execute on function public.criar_orcamento_com_itens(uuid, uuid, text, numeric, numeric, text, integer, jsonb, uuid) to service_role;
grant execute on function public.atualizar_orcamento_com_itens(uuid, uuid, uuid, text, numeric, numeric, text, integer, jsonb, uuid) to service_role;

-- ---------- 5. Segurança: Row Level Security da tabela nova ----------
alter table public.veiculos enable row level security;

drop policy if exists "veiculos_owner_all" on public.veiculos;
create policy "veiculos_owner_all" on public.veiculos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
