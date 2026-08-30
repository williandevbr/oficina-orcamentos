// ============================================================
// Testes unitários das funções de formatação do frontend
// ============================================================
import { describe, it, expect } from "vitest";
import { formatarMoeda, formatarData } from "./format.js";

describe("formatarMoeda", () => {
  it("formata número como Real brasileiro", () => {
    const texto = formatarMoeda(190);
    expect(texto).toContain("R$");
    expect(texto).toContain("190,00");
  });

  it("formata números com centavos", () => {
    const texto = formatarMoeda(1999.99);
    expect(texto).toContain("R$");
    expect(texto).toContain("1.999,99");
  });

  it("aceita string numérica vinda do banco", () => {
    expect(formatarMoeda("45.5")).toContain("45,50");
  });

  it("retorna R$ 0,00 para valor inválido", () => {
    expect(formatarMoeda(undefined)).toContain("0,00");
  });
});

describe("formatarData", () => {
  it("formata data ISO para o padrão brasileiro", () => {
    // 30 de agosto de 2026
    expect(formatarData("2026-08-30T12:00:00Z")).toBe("30/08/2026");
  });

  it("retorna travessão quando não há data", () => {
    expect(formatarData(null)).toBe("—");
  });
});
