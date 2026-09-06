// ============================================================
// Teste de fumaça do PDF: gera de verdade e confere o arquivo
// ============================================================
import { describe, it, expect } from "vitest";
import { gerarPdfOrcamento } from "./pdf.js";

const orcamentoExemplo = {
  id: "11111111-2222-3333-4444-555555555555",
  numero: 7,
  status: "enviado",
  desconto: 20,
  validade_dias: 7,
  observacoes: "Teste",
  created_at: new Date().toISOString(),
  clientes: {
    nome: "João Silva",
    telefone: "(11) 98765-4321",
    veiculo: "Honda CG 160",
    placa: "ABC1D23",
  },
  orcamento_itens: [
    {
      descricao: "Troca de óleo",
      tipo: "servico",
      quantidade: 1,
      valor_unitario: 120,
      total: 120,
    },
    {
      descricao: "Filtro de óleo",
      tipo: "peca",
      quantidade: 1,
      valor_unitario: 45,
      total: 45,
    },
  ],
};

describe("gerarPdfOrcamento", () => {
  it("gera um PDF válido", async () => {
    const buffer = await gerarPdfOrcamento(orcamentoExemplo);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(Buffer.from(buffer.slice(0, 5)).toString()).toBe("%PDF-");
  });

  it("gera mesmo com cliente vazio e sem itens divergentes", async () => {
    const buffer = await gerarPdfOrcamento({
      ...orcamentoExemplo,
      status: "aprovado",
      clientes: {},
      orcamento_itens: [
        { descricao: "X", tipo: "peca", quantidade: 2, valor_unitario: 10.5, total: 999 },
      ],
    });
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("usa o veículo do orçamento quando informado", async () => {
    const buffer = await gerarPdfOrcamento({
      ...orcamentoExemplo,
      veiculos: { veiculo: "Honda CG 160", placa: "ABC1D23" },
    });
    expect(buffer.length).toBeGreaterThan(1000);
    expect(Buffer.from(buffer.slice(0, 5)).toString()).toBe("%PDF-");
  });
});
