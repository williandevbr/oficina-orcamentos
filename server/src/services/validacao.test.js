// ============================================================
// Testes unitários da VALIDAÇÃO do orçamento
// ============================================================
import { describe, it, expect } from "vitest";
import {
  validarItens,
  validarCriacaoOrcamento,
  idValido,
  statusValido,
  descontoValido,
  filtrarCamposCliente,
  filtrarCamposVeiculo,
  clienteCriarSchema,
  orcamentoCriarSchema,
  orcamentoAtualizarSchema,
  veiculoCriarSchema,
  veiculoAtualizarSchema,
  perfilSchema,
  lojaSchema,
  catalogoSchema,
} from "./validacao.js";

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

  it("recusa Infinity como quantidade/valor", () => {
    expect(
      validarItens([
        { descricao: "Teste", tipo: "servico", quantidade: Infinity, valor_unitario: 10 },
      ]),
    ).toMatch(/inválidos/);
    expect(
      validarItens([
        { descricao: "Teste", tipo: "peca", quantidade: 1, valor_unitario: Infinity },
      ]),
    ).toMatch(/inválidos/);
  });
});

describe("idValido / statusValido / descontoValido / filtrarCamposCliente", () => {
  it("valida UUID", () => {
    expect(idValido("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(idValido("nao-uuid")).toBe(false);
    expect(idValido("")).toBe(false);
  });

  it("valida status", () => {
    expect(statusValido("aprovado")).toBe(true);
    expect(statusValido("expirado")).toBe(true);
    expect(statusValido("aprovadoo")).toBe(false);
  });

  it("desconto negativo é inválido", () => {
    expect(descontoValido(-5)).toBe(false);
    expect(descontoValido(0)).toBe(true);
    expect(descontoValido(10)).toBe(true);
  });

  it("filtrarCamposCliente bloqueia mass-assignment", () => {
    const out = filtrarCamposCliente({
      nome: "João",
      id: "x",
      created_at: "y",
      user_id: "z",
    });
    expect(out.nome).toBe("João");
    expect(out.id).toBeUndefined();
    expect(out.created_at).toBeUndefined();
    expect(out.user_id).toBeUndefined();
  });

  it("filtrarCamposCliente normaliza placa e remove vazio", () => {
    const out = filtrarCamposCliente({ nome: "  Ana  ", placa: "abc-1234", email: "   " });
    expect(out.nome).toBe("Ana");
    expect(out.placa).toBe("ABC-1234");
    expect(out.email).toBeUndefined();
  });
});

describe("schemas Zod (limites profissionais)", () => {
  const clienteOk = { nome: "Carlos Silva" };
  const itemOk = {
    descricao: "Troca de oleo",
    tipo: "servico",
    quantidade: 1,
    valor_unitario: 100,
  };
  const orcOk = {
    cliente_id: "550e8400-e29b-41d4-a716-446655440000",
    itens: [itemOk],
  };

  it("recusa nome curto e email invalido", () => {
    expect(clienteCriarSchema.safeParse({ nome: "A" }).success).toBe(false);
    expect(
      clienteCriarSchema.safeParse({ nome: "Ana", email: "nao-email" }).success,
    ).toBe(false);
    expect(clienteCriarSchema.safeParse(clienteOk).success).toBe(true);
  });

  it("recusa validade 0 e acima de 365, aceita padrao", () => {
    expect(
      orcamentoCriarSchema.safeParse({ ...orcOk, validade_dias: 0 }).success,
    ).toBe(false);
    expect(
      orcamentoCriarSchema.safeParse({ ...orcOk, validade_dias: 999 }).success,
    ).toBe(false);
    expect(
      orcamentoCriarSchema.safeParse({ ...orcOk, validade_dias: 30 }).success,
    ).toBe(true);
  });

  it("recusa status e desconto invalidos", () => {
    expect(
      orcamentoCriarSchema.safeParse({ ...orcOk, status: "invalido" }).success,
    ).toBe(false);
    expect(
      orcamentoCriarSchema.safeParse({ ...orcOk, desconto: -5 }).success,
    ).toBe(false);
  });

  it("PUT vazio retorna 'Nada para atualizar'", () => {
    const r = orcamentoAtualizarSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("recusa mais de 100 itens", () => {
    const muitos = Array.from({ length: 101 }, () => ({ ...itemOk }));
    expect(
      orcamentoCriarSchema.safeParse({ ...orcOk, itens: muitos }).success,
    ).toBe(false);
  });
});

describe("perfil e loja (schemas)", () => {
  it("perfil aceita nome válido e recusa curto", () => {
    expect(perfilSchema.safeParse({ nome: "Carlos" }).success).toBe(true);
    expect(perfilSchema.safeParse({ nome: "A" }).success).toBe(false);
    expect(perfilSchema.safeParse({}).success).toBe(false);
  });

  it("loja aceita dados válidos e recusa sem nome ou e-mail ruim", () => {
    expect(
      lojaSchema.safeParse({ nome_loja: "Auto Center Silva" }).success,
    ).toBe(true);
    expect(lojaSchema.safeParse({}).success).toBe(false);
    expect(
      lojaSchema.safeParse({ nome_loja: "Auto Center", email: "nao-email" })
        .success,
    ).toBe(false);
  });
});

describe("catalogoSchema", () => {
  const itemOk = { descricao: "Pastilha de freio", tipo: "peca", valor_unitario: 120 };

  it("aceita item válido", () => {
    expect(catalogoSchema.safeParse(itemOk).success).toBe(true);
  });

  it("recusa descricao curta, tipo e valor inválidos", () => {
    expect(
      catalogoSchema.safeParse({ ...itemOk, descricao: "A" }).success,
    ).toBe(false);
    expect(
      catalogoSchema.safeParse({ ...itemOk, tipo: "outro" }).success,
    ).toBe(false);
    expect(
      catalogoSchema.safeParse({ ...itemOk, valor_unitario: -1 }).success,
    ).toBe(false);
  });
});

describe("veículos (schemas e filtro)", () => {
  const CLI = "550e8400-e29b-41d4-a716-446655440000";
  const VEI = "11111111-2222-3333-4444-555555555555";
  const veiOk = { cliente_id: CLI, veiculo: "Honda CG 160", placa: "abc1d23" };

  it("aceita veículo válido e normaliza a placa", () => {
    const r = veiculoCriarSchema.safeParse(veiOk);
    expect(r.success).toBe(true);
  });

  it("recusa sem cliente, sem nome ou com placa longa", () => {
    expect(
      veiculoCriarSchema.safeParse({ veiculo: "Honda CG 160" }).success,
    ).toBe(false);
    expect(
      veiculoCriarSchema.safeParse({ cliente_id: CLI, veiculo: "A" }).success,
    ).toBe(false);
    expect(
      veiculoCriarSchema.safeParse({ ...veiOk, placa: "PLACA-LONGA-DEM" })
        .success,
    ).toBe(false);
  });

  it("PUT vazio retorna 'Nada para atualizar'; null apaga a placa", () => {
    expect(veiculoAtualizarSchema.safeParse({}).success).toBe(false);
    const r = veiculoAtualizarSchema.safeParse({ placa: null });
    expect(r.success).toBe(true);
    expect(r.data.placa).toBeNull();
  });

  it("filtrarCamposVeiculo bloqueia cliente_id e normaliza placa", () => {
    const out = filtrarCamposVeiculo({
      veiculo: "  Honda CG 160  ",
      placa: "abc1d23",
      cliente_id: "x",
    });
    expect(out.veiculo).toBe("Honda CG 160");
    expect(out.placa).toBe("ABC1D23");
    expect(out.cliente_id).toBeUndefined();
  });

  it("orçamento aceita veiculo_id válido e recusa inválido", () => {
    const base = {
      cliente_id: CLI,
      itens: [
        {
          descricao: "Troca de oleo",
          tipo: "servico",
          quantidade: 1,
          valor_unitario: 100,
        },
      ],
    };
    expect(
      orcamentoCriarSchema.safeParse({ ...base, veiculo_id: VEI }).success,
    ).toBe(true);
    expect(
      orcamentoCriarSchema.safeParse({ ...base, veiculo_id: "nao-uuid" })
        .success,
    ).toBe(false);
    // "" = sem veículo específico
    const r = orcamentoCriarSchema.safeParse({ ...base, veiculo_id: "" });
    expect(r.success).toBe(true);
    expect(r.data.veiculo_id).toBeNull();
  });

  it("PUT de orçamento só com veiculo_id é atualização válida", () => {
    const r = orcamentoAtualizarSchema.safeParse({ veiculo_id: VEI });
    expect(r.success).toBe(true);
  });
});
