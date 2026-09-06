// ============================================================
// Regras de VALIDAÇÃO do orçamento (com Zod)
// ============================================================
// Fonte única da verdade para validar o que entra na API.
// - Mensagens em português, amigáveis para o site exibir.
// - Limites anti-abuso (tamanho, faixa, quantidade de itens).
// - Os tipos saem dos schemas (z.infer): validação e tipo juntos.
// ============================================================
import { z } from "zod";

// ---------- Constantes ----------
export const STATUS_VALIDOS = [
  "rascunho",
  "enviado",
  "aprovado",
  "recusado",
  "expirado",
] as const;

export type StatusValido = (typeof STATUS_VALIDOS)[number];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const LIMITES = {
  nomeMin: 2,
  nomeMax: 120,
  telefoneMax: 20,
  emailMax: 160,
  documentoMax: 20,
  enderecoMax: 200,
  veiculoMax: 80,
  placaMax: 10,
  observacoesMax: 2000,
  descricaoMin: 2,
  descricaoMax: 140,
  qtdMax: 10000,
  valorMax: 1000000,
  descontoMax: 1000000,
  validadeMin: 1,
  validadeMax: 365,
  itensMin: 1,
  itensMax: 100,
};

// ---------- Helpers ----------
function vazioParaIndefinido(v: unknown): unknown {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

function textoOpcional(max: number, mensagem: string) {
  return z.preprocess(
    vazioParaIndefinido,
    z.string({ error: mensagem }).trim().max(max, { error: mensagem }).optional(),
  );
}

// Pega a primeira mensagem de erro do Zod em PT
export function primeiraMensagemZod(resultado: {
  error?: { issues?: Array<{ message?: string }> };
}): string {
  const erros = resultado.error?.issues || [];
  if (erros.length === 0) return "Dados inválidos.";
  return erros[0].message || "Dados inválidos.";
}

// ---------- Schemas ----------
const uuidSchema = (mensagem: string) =>
  z.string({ error: mensagem }).regex(UUID_REGEX, { error: mensagem });

export const itemSchema = z.object({
  descricao: z
    .string({ error: "Todo item precisa de uma descrição." })
    .trim()
    .min(LIMITES.descricaoMin, {
      error: "Todo item precisa de uma descrição (mínimo 2 letras).",
    })
    .max(LIMITES.descricaoMax, {
      error: "Descrição do item muito longa (máximo 140 letras).",
    }),
  tipo: z.enum(["servico", "peca"], {
    error: "O tipo do item deve ser 'servico' ou 'peca'.",
  }),
  quantidade: z.coerce
    .number({ error: "Quantidade e valor inválidos em um dos itens." })
    .refine((n) => Number.isFinite(n) && n > 0, {
      message:
        "Quantidade e valor inválidos em um dos itens (quantidade deve ser maior que zero).",
    })
    .refine((n) => n <= LIMITES.qtdMax, {
      message: `Quantidade e valor inválidos em um dos itens (máximo ${LIMITES.qtdMax}).`,
    }),
  valor_unitario: z.coerce
    .number({ error: "Quantidade e valor inválidos em um dos itens." })
    .refine((n) => Number.isFinite(n) && n >= 0, {
      message:
        "Quantidade e valor inválidos em um dos itens (valor não pode ser negativo).",
    })
    .refine((n) => n <= LIMITES.valorMax, {
      message:
        "Quantidade e valor inválidos em um dos itens (valor muito alto).",
    }),
});

export const itensSchema = z
  .array(itemSchema, {
    error: "O orçamento precisa de pelo menos um item (serviço ou peça).",
  })
  .min(LIMITES.itensMin, {
    error: "O orçamento precisa de pelo menos um item (serviço ou peça).",
  })
  .max(LIMITES.itensMax, {
    error: `O orçamento pode ter no máximo ${LIMITES.itensMax} itens.`,
  });

export const clienteCriarSchema = z.object({
  nome: z
    .string({ error: "O campo 'nome' é obrigatório." })
    .trim()
    .min(LIMITES.nomeMin, {
      error: "O campo 'nome' é obrigatório (mínimo 2 letras).",
    })
    .max(LIMITES.nomeMax, {
      error: "Nome muito longo (máximo 120 letras).",
    }),
  telefone: textoOpcional(
    LIMITES.telefoneMax,
    "Telefone muito longo (máximo 20 caracteres).",
  ),
  email: z.preprocess(
    vazioParaIndefinido,
    z
      .string({ error: "E-mail inválido." })
      .trim()
      .max(LIMITES.emailMax, { error: "E-mail muito longo." })
      .email({ error: "E-mail inválido." })
      .optional(),
  ),
  documento: textoOpcional(
    LIMITES.documentoMax,
    "Documento muito longo (máximo 20 caracteres).",
  ),
  endereco: textoOpcional(
    LIMITES.enderecoMax,
    "Endereço muito longo (máximo 200 letras).",
  ),
  veiculo: textoOpcional(
    LIMITES.veiculoMax,
    "Veículo muito longo (máximo 80 letras).",
  ),
  placa: textoOpcional(
    LIMITES.placaMax,
    "Placa muito longa (máximo 10 caracteres).",
  ),
  observacoes: textoOpcional(
    LIMITES.observacoesMax,
    "Observações muito longas (máximo 2000 letras).",
  ),
});

export const clienteAtualizarSchema = clienteCriarSchema;

const descontoSchema = (mensagem = "Desconto inválido (não pode ser negativo).") =>
  z.coerce
    .number({ error: mensagem })
    .refine((n) => Number.isFinite(n) && n >= 0, { message: mensagem })
    .refine((n) => n <= LIMITES.descontoMax, {
      message: "Desconto muito alto.",
    });

const validadeSchema = z.coerce
  .number({ error: "Validade inválida (mínimo 1 dia)." })
  .int({ error: "Validade inválida (use dias inteiros)." })
  .min(LIMITES.validadeMin, { error: "Validade inválida (mínimo 1 dia)." })
  .max(LIMITES.validadeMax, {
    error: `Validade inválida (máximo ${LIMITES.validadeMax} dias).`,
  });

const veiculoIdOpcional = z.preprocess(
  (v) => (v === "" ? null : v),
  uuidSchema("Veículo inválido.").nullable().optional(),
);

export const orcamentoCriarSchema = z.object({
  cliente_id: uuidSchema("Escolha um cliente válido para o orçamento."),
  // Veículo do atendimento (opcional; "" vira null = sem veículo específico)
  veiculo_id: veiculoIdOpcional,
  status: z
    .enum(STATUS_VALIDOS, {
      error: `Status inválido. Use: ${STATUS_VALIDOS.join(", ")}.`,
    })
    .optional(),
  desconto: descontoSchema().optional(),
  observacoes: textoOpcional(
    LIMITES.observacoesMax,
    "Observações muito longas (máximo 2000 letras).",
  ),
  validade_dias: validadeSchema.optional(),
  itens: itensSchema,
});

export const orcamentoAtualizarSchema = z
  .object({
    cliente_id: uuidSchema("Cliente inválido.").optional(),
    veiculo_id: veiculoIdOpcional,
    status: z
      .enum(STATUS_VALIDOS, {
        error: `Status inválido. Use: ${STATUS_VALIDOS.join(", ")}.`,
      })
      .optional(),
    desconto: descontoSchema().optional(),
    observacoes: textoOpcional(
      LIMITES.observacoesMax,
      "Observações muito longas (máximo 2000 letras).",
    ),
    validade_dias: validadeSchema.optional(),
    itens: itensSchema.optional(),
  })
  .refine(
    (v) =>
      v.cliente_id !== undefined ||
      v.veiculo_id !== undefined ||
      v.status !== undefined ||
      v.desconto !== undefined ||
      v.observacoes !== undefined ||
      v.validade_dias !== undefined ||
      v.itens !== undefined,
    { message: "Nada para atualizar.", path: [] },
  );

// ---------- Veículos (1 cliente -> N veículos) ----------
export const veiculoCriarSchema = z.object({
  cliente_id: uuidSchema("Escolha um cliente válido para o veículo."),
  veiculo: z
    .string({ error: "Dê um nome ao veículo (ex.: Honda CG 160)." })
    .trim()
    .min(2, { error: "Nome do veículo curto demais (mínimo 2 letras)." })
    .max(LIMITES.veiculoMax, {
      error: "Veículo muito longo (máximo 80 letras).",
    }),
  placa: textoOpcional(
    LIMITES.placaMax,
    "Placa muito longa (máximo 10 caracteres).",
  ),
});

export const veiculoAtualizarSchema = z
  .object({
    veiculo: z
      .string({ error: "Nome do veículo inválido." })
      .trim()
      .min(2, { error: "Nome do veículo curto demais (mínimo 2 letras)." })
      .max(LIMITES.veiculoMax, {
        error: "Veículo muito longo (máximo 80 letras).",
      })
      .optional(),
    // null ou "" = apagar a placa; undefined = não mexer
    placa: z.preprocess(
      (v) => (v === "" ? null : v),
      z
        .string({ error: "Placa inválida." })
        .trim()
        .max(LIMITES.placaMax, {
          error: "Placa muito longa (máximo 10 caracteres).",
        })
        .nullable()
        .optional(),
    ),
  })
  .refine((v) => v.veiculo !== undefined || v.placa !== undefined, {
    message: "Nada para atualizar.",
    path: [],
  });

// ---------- Perfil (quem usa o sistema) ----------
export const perfilSchema = z.object({
  nome: z
    .string({ error: "Digite seu nome." })
    .trim()
    .min(LIMITES.nomeMin, { error: "Nome curto demais (mínimo 2 letras)." })
    .max(LIMITES.nomeMax, { error: "Nome muito longo (máximo 120 letras)." }),
});

// ---------- Loja (dados da oficina, usados no PDF) ----------
export const lojaSchema = z.object({
  nome_loja: z
    .string({ error: "Digite o nome da oficina." })
    .trim()
    .min(LIMITES.nomeMin, {
      error: "Nome da oficina curto demais (mínimo 2 letras).",
    })
    .max(LIMITES.nomeMax, {
      error: "Nome da oficina muito longo (máximo 120 letras).",
    }),
  telefone: textoOpcional(
    LIMITES.telefoneMax,
    "Telefone muito longo (máximo 20 caracteres).",
  ),
  email: z.preprocess(
    vazioParaIndefinido,
    z
      .string({ error: "E-mail inválido." })
      .trim()
      .max(LIMITES.emailMax, { error: "E-mail muito longo." })
      .email({ error: "E-mail inválido." })
      .optional(),
  ),
  endereco: textoOpcional(
    LIMITES.enderecoMax,
    "Endereço muito longo (máximo 200 letras).",
  ),
  cnpj: textoOpcional(
    LIMITES.documentoMax,
    "CNPJ muito longo (máximo 20 caracteres).",
  ),
});

// ---------- Catálogo (peças e serviços) ----------
export const catalogoSchema = z.object({
  descricao: z
    .string({ error: "Todo item precisa de uma descrição." })
    .trim()
    .min(LIMITES.descricaoMin, {
      error: "Descrição curta demais (mínimo 2 letras).",
    })
    .max(LIMITES.descricaoMax, {
      error: "Descrição muito longa (máximo 140 letras).",
    }),
  tipo: z.enum(["servico", "peca"], {
    error: "O tipo deve ser 'servico' ou 'peca'.",
  }),
  valor_unitario: z.coerce
    .number({ error: "Valor inválido." })
    .refine((n) => Number.isFinite(n) && n >= 0, {
      message: "Valor não pode ser negativo.",
    })
    .refine((n) => n <= LIMITES.valorMax, {
      message: "Valor muito alto.",
    }),
});

export const catalogoAtualizarSchema = catalogoSchema;

// ---------- Tipos inferidos (validação e tipo juntos, sem duplicar) ----------
export type ItemValido = z.infer<typeof itemSchema>;
export type OrcamentoCriar = z.infer<typeof orcamentoCriarSchema>;
export type OrcamentoAtualizar = z.infer<typeof orcamentoAtualizarSchema>;
export type VeiculoCriar = z.infer<typeof veiculoCriarSchema>;
export type CatalogoValido = z.infer<typeof catalogoSchema>;
export type LojaValida = z.infer<typeof lojaSchema>;

// ---------- Funções legadas (mantidas por compatibilidade) ----------

// Valida a lista de itens do orçamento.
// Retorna null se estiver tudo certo, ou uma mensagem de erro.
export function validarItens(itens: unknown): string | null {
  const r = itensSchema.safeParse(itens);
  if (r.success) return null;
  return primeiraMensagemZod(r);
}

// Valida o corpo de criação de orçamento.
// Retorna null se estiver tudo certo, ou um objeto de erro.
export function validarCriacaoOrcamento({
  cliente_id,
  itens,
}: {
  cliente_id?: unknown;
  itens?: unknown;
}): { campo: string; mensagem: string } | null {
  if (!cliente_id) {
    return {
      campo: "cliente",
      mensagem: "Escolha um cliente para o orçamento.",
    };
  }
  const mensagem = validarItens(itens);
  if (mensagem) {
    return { campo: "itens", mensagem };
  }
  return null;
}

export function idValido(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export function statusValido(status: unknown): status is StatusValido {
  return (STATUS_VALIDOS as readonly unknown[]).includes(status);
}

export function descontoValido(desconto: unknown): boolean {
  const n = Number(desconto);
  return Number.isFinite(n) && n >= 0;
}

// Campos permitidos no PUT de clientes (evita mass-assignment de id/created_at)
export const CAMPOS_CLIENTE = [
  "nome",
  "telefone",
  "email",
  "documento",
  "endereco",
  "veiculo",
  "placa",
  "observacoes",
];

// Campos permitidos no PUT de veículos (cliente_id nunca muda de dono)
export const CAMPOS_VEICULO = ["veiculo", "placa"];

function normalizarTexto(
  out: Record<string, unknown>,
  placaComoNulo = false,
): void {
  // Normaliza: strings com trim; placa em maiúsculas; "" vira undefined
  // (no PUT de veículo, "" na placa significa "apagar a placa" -> null)
  for (const k of Object.keys(out)) {
    if (typeof out[k] === "string") {
      const t = (out[k] as string).trim();
      if (t === "") {
        if (placaComoNulo && k === "placa") {
          out[k] = null;
          continue;
        }
        delete out[k];
        continue;
      }
      out[k] = k === "placa" ? t.toUpperCase() : t;
    }
  }
}

export function filtrarCamposCliente(
  body: Record<string, unknown> = {},
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const campo of CAMPOS_CLIENTE) {
    if (body[campo] !== undefined) out[campo] = body[campo];
  }
  normalizarTexto(out);
  return out;
}

export function filtrarCamposVeiculo(
  body: Record<string, unknown> = {},
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const campo of CAMPOS_VEICULO) {
    if (body[campo] !== undefined) out[campo] = body[campo];
  }
  normalizarTexto(out, true);
  return out;
}
