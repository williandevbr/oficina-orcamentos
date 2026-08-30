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
export function calcularSubtotal(itens = []) {
  return itens.reduce((soma, item) => {
    const quantidade = Number(item.quantidade) || 0;
    const valorUnitario = Number(item.valor_unitario) || 0;
    return soma + quantidade * valorUnitario;
  }, 0);
}

// Calcula o subtotal, o desconto e o total final
export function calcularTotais(itens = [], desconto = 0) {
  const subtotal = calcularSubtotal(itens);
  const descontoNum = Number(desconto) || 0;
  const total = Math.max(0, subtotal - descontoNum); // nunca fica negativo
  return { subtotal, desconto: descontoNum, total };
}
