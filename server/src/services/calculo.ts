// ============================================================
// Regra de negócio: CÁLCULO do orçamento
// ============================================================
// Separada em um módulo próprio para poder ser TESTADA de forma
// isolada (testes unitários) e para ser a fonte única da verdade.
//
// Regras:
//   subtotal  = soma de (quantidade x valor_unitario) de cada item
//   total     = subtotal - desconto  (nunca fica negativo)
// ============================================================

export interface ItemCalculo {
  // Entradas podem vir sujas (undefined/null) — a regra trata como zero
  quantidade: number | string | null | undefined;
  valor_unitario: number | string | null | undefined;
}

export interface Totais {
  subtotal: number;
  desconto: number;
  total: number;
}

// Soma o valor de todos os itens
// Arredonda para centavos para evitar erro de float (ex: 0.1 + 0.2)
export function arredondarCentavos(valor: number | string): number {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

export function totalLinha(
  quantidade: number | string,
  valorUnitario: number | string,
): number {
  return arredondarCentavos(
    (Number(quantidade) || 0) * (Number(valorUnitario) || 0),
  );
}

export function calcularSubtotal(itens: ItemCalculo[] = []): number {
  return arredondarCentavos(
    itens.reduce((soma, item) => {
      const quantidade = Number(item.quantidade) || 0;
      const valorUnitario = Number(item.valor_unitario) || 0;
      return soma + quantidade * valorUnitario;
    }, 0),
  );
}

// Calcula o subtotal, o desconto e o total final
export function calcularTotais(
  itens: ItemCalculo[] = [],
  desconto: number | string = 0,
): Totais {
  const subtotal = calcularSubtotal(itens);
  // Desconto negativo não faz sentido (aumentaria o total) -> trava em 0
  const descontoNum = Math.max(0, arredondarCentavos(desconto));
  const total = arredondarCentavos(Math.max(0, subtotal - descontoNum)); // nunca fica negativo
  return { subtotal, desconto: descontoNum, total };
}
