// ============================================================
// Funções de formatação (usadas em várias telas)
// ============================================================

// Formata um número como moeda brasileira: 350 -> R$ 350,00
// Tolera nulo/indefinido (vira R$ 0,00 em vez de quebrar a tela)
export function formatarMoeda(valor: number | string | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

// Formata uma data ISO (do banco) para o formato brasileiro
export function formatarData(dataISO?: string | null): string {
  if (!dataISO) return "—";
  const data = new Date(dataISO);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR");
}

// Formata número do orçamento com zeros: 7 -> "0007"
// Se vier nulo/indefinido, mostra "—" em vez de "undefined".
export function formatarNumero(numero?: number | string | null): string {
  if (numero === null || numero === undefined || numero === "") return "—";
  return String(numero).padStart(4, "0");
}
