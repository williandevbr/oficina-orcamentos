// ============================================================
// Tradutor de erros do banco para mensagens seguras
// ============================================================
// O Supabase devolve mensagens técnicas (nome de tabela, constraint,
// coluna) que NÃO podem chegar ao site/usuário: vaza estrutura
// interna e confunde. Aqui convertemos em frases simples e PT.
// O detalhe técnico vai só para o log do servidor (console.error).
// ============================================================

export function mensagemBanco(error, padrao = "Não foi possível completar a operação.") {
  if (!error) return padrao;

  // Log interno (não vaza para o usuário)
  console.error("[banco]", error.code || "", error.message || error);

  const codigo = error.code || "";
  const msg = error.message || "";

  // Linha não encontrada (PostgREST)
  if (codigo === "PGRST116") return "Registro não encontrado.";

  // Violação de chave estrangeira (ex: cliente que não existe)
  if (codigo === "23503") return "Registro relacionado não encontrado.";

  // Duplicado (violação de unique)
  if (codigo === "23505") return "Registro duplicado.";

  // Violação de check (status, desconto, validade, etc.)
  if (codigo === "23514" || codigo === "23513") return "Dados inválidos.";

  // Coluna não existe = migration não rodada
  if (codigo === "42703")
    return "Banco desatualizado. Rode as migrations pendentes.";

  // Função RPC não encontrada = migration não rodada
  if (codigo === "42883" || msg.includes("Could not find the function"))
    return "Banco desatualizado. Rode as migrations pendentes.";

  // Valor inválido (ex: texto em campo numérico)
  if (codigo === "22P02" || codigo === "22003") return "Dados inválidos.";

  return padrao;
}
