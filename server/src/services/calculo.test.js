// ============================================================
// Testes unitários do CÁLCULO do orçamento
// ============================================================
// Um "teste unitário" verifica uma regra isolada:
//   - coloca um valor de entrada conhecido
//   - espera uma saída exata
// Se qualquer regra quebrar no futuro, estes testes acusam na hora.
// ============================================================
import { describe, it, expect } from "vitest";
import { calcularSubtotal, calcularTotais } from "./calculo.js";

describe("calcularSubtotal (soma quantidade x valor de cada item)", () => {
  it("calcula corretamente: 1x120 + 2x45 = 210", () => {
    const itens = [
      { quantidade: 1, valor_unitario: 120 },
      { quantidade: 2, valor_unitario: 45 },
    ];
    expect(calcularSubtotal(itens)).toBe(210);
  });

  it("retorna 0 quando a lista está vazia", () => {
    expect(calcularSubtotal([])).toBe(0);
  });

  it("trata itens sem valores válidos como zero", () => {
    const itens = [
      { quantidade: undefined, valor_unitario: 50 },
      { quantidade: 3, valor_unitario: undefined },
    ];
    expect(calcularSubtotal(itens)).toBe(0);
  });

  it("aceita valores decimais", () => {
    const itens = [{ quantidade: 2.5, valor_unitario: 10.9 }];
    expect(calcularSubtotal(itens)).toBeCloseTo(27.25);
  });
});

describe("calcularTotais (subtotal, desconto e total)", () => {
  it("aplica desconto corretamente: 210 - 20 = 190", () => {
    const itens = [{ quantidade: 1, valor_unitario: 210 }];
    const { subtotal, desconto, total } = calcularTotais(itens, 20);
    expect(subtotal).toBe(210);
    expect(desconto).toBe(20);
    expect(total).toBe(190);
  });

  it("sem desconto: total é igual ao subtotal", () => {
    const itens = [{ quantidade: 2, valor_unitario: 10 }];
    const { subtotal, total } = calcularTotais(itens);
    expect(subtotal).toBe(20);
    expect(total).toBe(20);
  });

  it("nunca deixa o total negativo (desconto maior que o subtotal)", () => {
    const itens = [{ quantidade: 1, valor_unitario: 100 }];
    const { total } = calcularTotais(itens, 500);
    expect(total).toBe(0);
  });

  it("desconto zero quando não informado", () => {
    const { desconto } = calcularTotais([{ quantidade: 1, valor_unitario: 5 }]);
    expect(desconto).toBe(0);
  });
});
