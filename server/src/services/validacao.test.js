// ============================================================
// Testes unitários da VALIDAÇÃO do orçamento
// ============================================================
import { describe, it, expect } from "vitest";
import { validarItens, validarCriacaoOrcamento } from "./validacao.js";

describe("validarItens", () => {
  const itemValido = {
    descricao: "Troca de óleo",
    tipo: "servico",
    quantidade: 1,
    valor_unitario: 120,
  };

  it("aceita uma lista de itens válida (retorna null = sem erro)", () => {
    expect(validarItens([itemValido])).toBeNull();
  });

  it("recusa lista vazia ou inexistente", () => {
    expect(validarItens([])).toMatch(/pelo menos um item/);
    expect(validarItens(undefined)).toMatch(/pelo menos um item/);
  });

  it("recusa item sem descrição", () => {
    expect(validarItens([{ ...itemValido, descricao: "" }])).toMatch(
      /descrição/,
    );
  });

  it("recusa tipo inválido (não é serviço nem peça)", () => {
    expect(validarItens([{ ...itemValido, tipo: "outro" }])).toMatch(/tipo/);
  });

  it("recusa quantidade menor ou igual a zero", () => {
    expect(validarItens([{ ...itemValido, quantidade: 0 }])).toMatch(
      /inválidos/,
    );
    expect(validarItens([{ ...itemValido, quantidade: -1 }])).toMatch(
      /inválidos/,
    );
  });

  it("recusa valor unitário negativo", () => {
    expect(validarItens([{ ...itemValido, valor_unitario: -5 }])).toMatch(
      /inválidos/,
    );
  });
});

describe("validarCriacaoOrcamento", () => {
  it("recusa orçamento sem cliente", () => {
    const resultado = validarCriacaoOrcamento({ cliente_id: "", itens: [] });
    expect(resultado.campo).toBe("cliente");
  });

  it("recusa orçamento sem itens (mesmo com cliente)", () => {
    const resultado = validarCriacaoOrcamento({
      cliente_id: "abc-123",
      itens: [],
    });
    expect(resultado.campo).toBe("itens");
  });

  it("aceita um pedido válido", () => {
    const resultado = validarCriacaoOrcamento({
      cliente_id: "abc-123",
      itens: [
        {
          descricao: "Serviço",
          tipo: "servico",
          quantidade: 1,
          valor_unitario: 50,
        },
      ],
    });
    expect(resultado).toBeNull();
  });
});
