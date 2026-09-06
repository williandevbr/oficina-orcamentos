import { describe, it, expect } from "vitest";
import { mensagemErroRede } from "./erros";

describe("mensagemErroRede", () => {
  it("ignora cancelamento (AbortError)", () => {
    expect(mensagemErroRede(new DOMException("x", "AbortError"), "P")).toBeNull();
  });
  it("avisa quando o servidor dorme (TimeoutError)", () => {
    expect(mensagemErroRede(new DOMException("x", "TimeoutError"), "P")).toContain(
      "demorou",
    );
  });
  it("usa a mensagem do erro ou o padrão", () => {
    expect(mensagemErroRede(new Error("Caiu!"), "P")).toBe("Caiu!");
    expect(mensagemErroRede("texto", "Padrão aqui")).toBe("Padrão aqui");
  });
});
