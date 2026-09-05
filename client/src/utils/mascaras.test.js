import { describe, it, expect } from "vitest";
import {
  mascararTelefone,
  mascararPlaca,
  normalizarTelefoneWhatsApp,
  montarLinkWhatsApp,
  calcularValidoAte,
} from "./mascaras.js";

describe("mascararTelefone", () => {
  it("formata celular 11 dígitos", () => {
    expect(mascararTelefone("11987654321")).toBe("(11) 98765-4321");
  });
  it("formata fixo 10 dígitos", () => {
    expect(mascararTelefone("1133334444")).toBe("(11) 3333-4444");
  });
  it("remove letras", () => {
    expect(mascararTelefone("abc11987654321")).toBe("(11) 98765-4321");
  });
});

describe("mascararPlaca", () => {
  it("mantém Mercosul sem hífen", () => {
    expect(mascararPlaca("abc1d23")).toBe("ABC1D23");
  });
  it("adiciona hífen no modelo antigo", () => {
    expect(mascararPlaca("abc1234")).toBe("ABC-1234");
  });
});

describe("whatsapp", () => {
  it("normaliza com 55", () => {
    expect(normalizarTelefoneWhatsApp("(11) 98765-4321")).toBe(
      "5511987654321",
    );
  });
  it("monta link wa.me", () => {
    const link = montarLinkWhatsApp({
      telefone: "11987654321",
      nomeCliente: "João",
      numero: 12,
      total: "R$ 100,00",
    });
    expect(link).toContain("https://wa.me/5511987654321");
    expect(link).toContain("text=");
  });
});

describe("calcularValidoAte", () => {
  it("soma validade_dias", () => {
    const base = "2026-01-10T12:00:00Z";
    const ate = calcularValidoAte(base, 7);
    const diffDias = Math.round((ate - new Date(base)) / 86400000);
    expect(diffDias).toBe(7);
  });
  it("retorna null para data invalida", () => {
    expect(calcularValidoAte("xxx")).toBeNull();
    expect(calcularValidoAte(null)).toBeNull();
  });
  it("nao duplica DDI de numero internacional", () => {
    expect(normalizarTelefoneWhatsApp("5511987654321")).toBe("5511987654321");
  });
});
