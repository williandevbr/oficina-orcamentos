-- ============================================================
-- Migration 0001: criação das tabelas iniciais do OrcaPro
-- ============================================================
-- O que este arquivo faz:
--   1. Cria a tabela "clientes"     -> guarda os dados dos clientes
--   2. Cria a tabela "orcamentos"   -> guarda cada orçamento criado
--   3. Cria a tabela "orcamento_itens" -> guarda os itens (serviços/peças)
--   4. Liga as tabelas entre si (um orçamento pertence a um cliente)
--   5. Habilita a segurança por linha (Row Level Security)
--
-- Como aplicar (via conector do Supabase ou "supabase db push"):
--   Apenas rode este arquivo no SQL Editor do Supabase (ou com a CLI).
-- ============================================================

-- ---------- Função auxiliar: atualiza "updated_at" automaticamente ----------
-- Serve para marcar "quando foi a última alteração" sem escrever código extra.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- Tabela: clientes ----------
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),  -- chave única gerada automaticamente
  nome        text not null,                               -- nome é obrigatório
  telefone    text,
  email       text,
  documento   text,                                        -- CPF/CNPJ (opcional)
  endereco    text,
  veiculo     text,                                        -- veículo do cliente (opcional)
  placa       text,                                        -- placa do veículo
  observacoes text,
  created_at  timestamptz not null default now(),          -- criado em
  updated_at  timestamptz not null default now()           -- atualizado em
);

-- Gatilho: atualiza updated_at sempre que a linha mudar
create trigger trg_clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

-- Índice para busca rápida por nome
create index if not exists idx_clientes_nome on public.clientes (nome);

-- ---------- Sequência: número sequencial dos orçamentos ----------
-- Ex.: o 1º orçamento do mês é o número 1, o 2º é o 2... (fica bonito no PDF)
create sequence if not exists public.orcamentos_numero_seq start 1;

-- ---------- Tabela: orcamentos ----------
create table if not exists public.orcamentos (
  id            uuid primary key default gen_random_uuid(),
  numero        integer not null default nextval('public.orcamentos_numero_seq'),
  cliente_id    uuid not null references public.clientes(id) on delete cascade,
  status        text not null default 'rascunho'
                check (status in ('rascunho', 'enviado', 'aprovado', 'recusado')),
  observacoes   text,
  desconto      numeric(12,2) not null default 0,          -- desconto concedido (R$)
  total         numeric(12,2) not null default 0,          -- valor total do orçamento
  validade_dias integer not null default 7,                -- validade em dias (padrão 7)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_orcamentos_updated_at
  before update on public.orcamentos
  for each row execute function public.set_updated_at();

-- Índice para buscar orçamentos de um cliente rapidamente
create index if not exists idx_orcamentos_cliente on public.orcamentos (cliente_id);

-- ---------- Tabela: orcamento_itens (os itens do orçamento) ----------
-- Cada linha é um serviço ou uma peça dentro do orçamento.
create table if not exists public.orcamento_itens (
  id             uuid primary key default gen_random_uuid(),
  orcamento_id   uuid not null references public.orcamentos(id) on delete cascade,
  descricao      text not null,                             -- ex.: "Troca de óleo"
  tipo           text not null check (tipo in ('servico', 'peca')),
  quantidade     numeric(10,2) not null default 1 check (quantidade > 0),
  valor_unitario numeric(12,2) not null default 0 check (valor_unitario >= 0),
  total          numeric(12,2) not null default 0,          -- quantidade * valor_unitario
  created_at     timestamptz not null default now()
);

create index if not exists idx_itens_orcamento on public.orcamento_itens (orcamento_id);

-- ---------- Segurança: Row Level Security ----------
-- Garante que os dados só podem ser acessados com as chaves certas do servidor.
-- O site (navegador) NÃO acessa o banco direto: tudo passa pelo nosso servidor.
alter table public.clientes enable row level security;
alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;