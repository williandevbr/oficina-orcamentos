// ============================================================
// Tipos COMPARTILHADOS do OrcaPro (a verdade sobre cada dado)
// ============================================================
// Espelham o que o servidor devolve em /api. Quando o .jsx
// virar .tsx, as telas usam estes tipos em vez de "qualquer coisa".
// ============================================================

export type StatusOrcamento =
  | "rascunho"
  | "enviado"
  | "aprovado"
  | "recusado"
  | "expirado";

export type TipoItem = "servico" | "peca";

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  documento?: string | null;
  endereco?: string | null;
  // Reserva antiga (hoje os veículos ficam na tabela própria)
  veiculo?: string | null;
  placa?: string | null;
  observacoes?: string | null;
  created_at?: string;
}

export interface Veiculo {
  id: string;
  cliente_id: string;
  veiculo: string;
  placa?: string | null;
  created_at?: string;
}

export interface OrcamentoItem {
  id?: string;
  descricao: string;
  tipo: TipoItem;
  quantidade: number;
  valor_unitario: number;
  total?: number;
}

export interface Orcamento {
  id: string;
  numero: number;
  cliente_id: string;
  veiculo_id?: string | null;
  status: StatusOrcamento;
  desconto: number;
  total: number;
  observacoes?: string | null;
  validade_dias: number;
  created_at: string;
  // Junções que o servidor traz junto (podem não vir em toda rota)
  clientes?: Pick<
    Cliente,
    "nome" | "telefone" | "email" | "endereco" | "veiculo" | "placa"
  > | null;
  veiculos?: Pick<Veiculo, "veiculo" | "placa"> | null;
  orcamento_itens?: OrcamentoItem[];
}

export interface CatalogoItem {
  id: string;
  descricao: string;
  tipo: TipoItem;
  valor_unitario: number;
}

export interface Perfil {
  user_id: string;
  nome: string;
}

export interface Loja {
  user_id: string;
  nome_loja: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cnpj?: string | null;
}

// Resposta paginada do servidor (modo ?page=)
export interface Pagina<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
