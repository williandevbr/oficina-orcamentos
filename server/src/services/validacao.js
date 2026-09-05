// ============================================================
// Regras de VALIDAÇÃO do orçamento (com Zod)
// ============================================================
// Fonte única da verdade para validar o que entra na API.
// - Mensagens em português, amigáveis para o site exibir.
// - Limites anti-abuso (tamanho, faixa, quantidade de itens).
// - As funções antigas (validarItens, idValido, etc.) continuam
//   existindo para não quebrar rotas e testes — agora por cima do Zod.
// ============================================================
import { z } from "zod";

// ---------- Constantes ----------
export const STATUS_VALIDOS = [
  "rascunho",
  "enviado",
  "aprovado",
  "recusado",
  "expirado",
];

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
function vazioParaIndefinido(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

function textoOpcional(max, mensagem) {
  return z.preprocess(
    vazioParaIndefinido,
    z.string({ error: mensagem }).trim().max(max, { error: mensagem }).optional(),
  );
}

// Pega a primeira mensagem de erro do Zod em PT
export function primeiraMensagemZod(resultado) {
  const erros = resultado.error?.issues || [];
  if (erros.length === 0) return "Dados inválidos.";
  return erros[0].message || "Dados inválidos.";
}

// ---------- Schemas ----------
const uuidSchema = (mensagem) =>
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

export const orcamentoCriarSchema = z.object({
  cliente_id: uuidSchema("Escolha um cliente válido para o orçamento."),
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
      v.status !== undefined ||
      v.desconto !== undefined ||
      v.observacoes !== undefined ||
      v.validade_dias !== undefined ||
      v.itens !== undefined,
    { message: "Nada para atualizar.", path: [] },
  );

// ---------- Funções legadas (mantidas por compatibilidade) ----------

// Valida a lista de itens do orçamento.
// Retorna null se estiver tudo certo, ou uma mensagem de erro.
export function validarItens(itens) {
  const r = itensSchema.safeParse(itens);
  if (r.success) return null;
  return primeiraMensagemZod(r);
}

// Valida o corpo de criação de orçamento.
// Retorna null se estiver tudo certo, ou um objeto de erro.
export function validarCriacaoOrcamento({ cliente_id, itens }) {
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

export function idValido(id) {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export function statusValido(status) {
  return STATUS_VALIDOS.includes(status);
}

export function descontoValido(desconto) {
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

export function filtrarCamposCliente(body = {}) {
  const out = {};
  for (const campo of CAMPOS_CLIENTE) {
    if (body[campo] !== undefined) out[campo] = body[campo];
  }
  // Normaliza: strings com trim; placa em maiúsculas; "" vira undefined
  for (const k of Object.keys(out)) {
    if (typeof out[k] === "string") {
      const t = out[k].trim();
      if (t === "") {
        delete out[k];
        continue;
      }
      out[k] = k === "placa" ? t.toUpperCase() : t;
    }
  }
  return out;
}
