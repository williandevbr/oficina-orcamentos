// ============================================================
// Funções de formatação (usadas em várias telas)
// ============================================================

// Formata um número como moeda brasileira: 350 -> R$ 350,00
export function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

// Formata uma data ISO (do banco) para o formato brasileiro
export function formatarData(dataISO) {
  if (!dataISO) return "—";
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR");
}
