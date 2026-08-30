// ============================================================
// Regras de VALIDAÇÃO do orçamento
// ============================================================
// Separada em módulo próprio para poder ser TESTADA de forma
// isolada (testes unitários) e usada pelas rotas.
// ============================================================

// Valida a lista de itens do orçamento.
// Retorna null se estiver tudo certo, ou uma mensagem de erro.
export function validarItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    return "O orçamento precisa de pelo menos um item (serviço ou peça).";
  }
  for (const item of itens) {
    if (!item.descricao || !item.descricao.trim()) {
      return "Todo item precisa de uma descrição.";
    }
    if (!["servico", "peca"].includes(item.tipo)) {
      return "O tipo do item deve ser 'servico' ou 'peca'.";
    }
    if (Number(item.quantidade) <= 0 || Number(item.valor_unitario) < 0) {
      return "Quantidade e valor inválidos em um dos itens.";
    }
  }
  return null;
}

// Valida o corpo de criação de orçamento.
// Retorna null se estiver tudo certo, ou um objeto de erro.
export function validarCriacaoOrcamento({ cliente_id, itens }) {
  if (!cliente_id) {
    return {
      campo: "cliente",
      mensagem: "Escolha um cliente para o orçamento.",
    };
  }
  const mensagem = validarItens(itens);
  if (mensagem) {
    return { campo: "itens", mensagem };
  }
  return null;
}
