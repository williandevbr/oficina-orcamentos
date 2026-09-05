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

// Soma o valor de todos os itens
// Arredonda para centavos para evitar erro de float (ex: 0.1 + 0.2)
export function arredondarCentavos(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

export function totalLinha(quantidade, valorUnitario) {
  return arredondarCentavos(
    (Number(quantidade) || 0) * (Number(valorUnitario) || 0),
  );
}

export function calcularSubtotal(itens = []) {
  return arredondarCentavos(
    itens.reduce((soma, item) => {
      const quantidade = Number(item.quantidade) || 0;
      const valorUnitario = Number(item.valor_unitario) || 0;
      return soma + quantidade * valorUnitario;
    }, 0),
  );
}

// Calcula o subtotal, o desconto e o total final
export function calcularTotais(itens = [], desconto = 0) {
  const subtotal = calcularSubtotal(itens);
  // Desconto negativo não faz sentido (aumentaria o total) -> trava em 0
  const descontoNum = Math.max(0, arredondarCentavos(desconto));
  const total = arredondarCentavos(Math.max(0, subtotal - descontoNum)); // nunca fica negativo
  return { subtotal, desconto: descontoNum, total };
}
