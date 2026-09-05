-- ============================================================
-- Migration 0003: transacoes atomicas para orcamento + itens
-- ============================================================
-- Cria 2 funcoes que fazem tudo dentro de UMA transacao:
--   1. criar_orcamento_com_itens     -> cria cabecalho + itens junto
--   2. atualizar_orcamento_com_itens -> troca os itens sem risco de perda
-- Se qualquer item falhar, NADA e salvo (rollback automatico).
-- Rode no SQL Editor do Supabase APOS a 0002.
-- ============================================================

-- ---------- 1. CRIAR ----------
create or replace function public.criar_orcamento_com_itens(
  p_user_id uuid,
  p_cliente_id uuid,
  p_status text,
  p_desconto numeric,
  p_total numeric,
  p_observacoes text,
  p_validade_dias integer,
  p_itens jsonb
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
  -- garante que o cliente e do usuario logado
  if not exists (
    select 1 from public.clientes
    where id = p_cliente_id and user_id = p_user_id
  ) then
    raise exception 'CLIENTE_INVALIDO';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) != 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'ITENS_OBRIGATORIOS';
  end if;

  -- cria o cabecalho
  insert into public.orcamentos (user_id, cliente_id, status, desconto, total, observacoes, validade_dias)
  values (p_user_id, p_cliente_id, p_status, p_desconto, p_total, p_observacoes, p_validade_dias)
  returning id into v_orcamento_id;

  -- cria os itens (se um falhar, tudo e desfeito)
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

-- ---------- 2. ATUALIZAR (troca atomica dos itens) ----------
create or replace function public.atualizar_orcamento_com_itens(
  p_user_id uuid,
  p_orcamento_id uuid,
  p_cliente_id uuid,
  p_status text,
  p_desconto numeric,
  p_total numeric,
  p_observacoes text,
  p_validade_dias integer,
  p_itens jsonb
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
begin
  -- garante que o orcamento e do usuario logado
  if not exists (
    select 1 from public.orcamentos
    where id = p_orcamento_id and user_id = p_user_id
  ) then
    raise exception 'ORCAMENTO_NAO_ENCONTRADO';
  end if;

  -- se trocou o cliente, garante que o novo tambem e do usuario
  if p_cliente_id is not null and not exists (
    select 1 from public.clientes
    where id = p_cliente_id and user_id = p_user_id
  ) then
    raise exception 'CLIENTE_INVALIDO';
  end if;

  -- atualiza o cabecalho (só os campos nao-nulos)
  update public.orcamentos set
    cliente_id = coalesce(p_cliente_id, cliente_id),
    status = coalesce(p_status, status),
    desconto = coalesce(p_desconto, desconto),
    total = coalesce(p_total, total),
    observacoes = p_observacoes,
    validade_dias = coalesce(p_validade_dias, validade_dias)
  where id = p_orcamento_id and user_id = p_user_id;

  -- se p_itens for nulo, nao mexe nos itens (mudou só cabecalho)
  if p_itens is null then
    return;
  end if;

  if jsonb_typeof(p_itens) != 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'ITENS_OBRIGATORIOS';
  end if;

  -- apaga e reinsere DENTRO da mesma transacao (atomico)
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

-- Permite o backend (service_role) executar as funcoes
grant execute on function public.criar_orcamento_com_itens(uuid, uuid, text, numeric, numeric, text, integer, jsonb) to service_role;
grant execute on function public.atualizar_orcamento_com_itens(uuid, uuid, uuid, text, numeric, numeric, text, integer, jsonb) to service_role;