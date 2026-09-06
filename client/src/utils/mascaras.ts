// Máscaras de telefone, placa e documentos (padrão brasileiro).

export function mascararTelefone(valor: string = ""): string {
  const digitos = String(valor).replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos.length ? `(${digitos}` : "";
  if (digitos.length <= 6) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  }
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function mascararPlaca(valor: string = ""): string {
  const placa = String(valor)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
  // Modelo antigo ABC-1234: adiciona hífen para leitura
  if (/^[A-Z]{3}\d{4}$/.test(placa)) {
    return `${placa.slice(0, 3)}-${placa.slice(3)}`;
  }
  return placa;
}

// Pontuação automática de CNPJ: 00.000.000/0001-00
export function mascararCnpj(valor: string = ""): string {
  const d = String(valor).replace(/\D/g, "").slice(0, 14);
  if (d.length > 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  if (d.length > 8) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  if (d.length > 5) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  }
  if (d.length > 2) {
    return `${d.slice(0, 2)}.${d.slice(2)}`;
  }
  return d;
}

// Pontuação automática de CPF: 000.000.000-00
export function mascararCpf(valor: string = ""): string {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length > 9) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length > 6) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  }
  if (d.length > 3) {
    return `${d.slice(0, 3)}.${d.slice(3)}`;
  }
  return d;
}

// Documento genérico (CPF/CNPJ): escolhe sozinho pelo tamanho
export function mascararDocumento(valor: string = ""): string {
  const d = String(valor).replace(/\D/g, "");
  if (d.length > 11) return mascararCnpj(valor);
  return mascararCpf(valor);
}

// Normaliza telefone para link wa.me (só dígitos + 55 se faltar DDI)
// Regras: remove 0 inicial; se tem 10-11 dígitos (BR sem DDI), põe 55.
// Com 12-13 dígitos (já com DDI), mantém. Outros tamanhos: devolve limpo.
export function normalizarTelefoneWhatsApp(valor: string = ""): string {
  const digitos = String(valor)
    .replace(/\D/g, "")
    .replace(/^0+/, "");
  if (!digitos) return "";
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return digitos;
}

export interface DadosWhatsApp {
  telefone?: string | null;
  nomeCliente?: string | null;
  numero?: number | string | null;
  total: string;
}

// Monta o link do WhatsApp com mensagem pronta do orçamento
export function montarLinkWhatsApp({
  telefone,
  nomeCliente,
  numero,
  total,
}: DadosWhatsApp): string {
  const destino = normalizarTelefoneWhatsApp(telefone ?? "");
  if (!destino) return "";
  const num =
    numero === null || numero === undefined || numero === ""
      ? "—"
      : String(numero).padStart(4, "0");
  const texto = `Olá ${nomeCliente || "cliente"}! Aqui é da oficina. Seu orçamento nº ${num} ficou em ${total}. Qualquer dúvida estou à disposição!`;
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
}

// Validade: created_at + validade_dias (com guardas anti-NaN)
export function calcularValidoAte(
  createdAt?: string | null,
  validadeDias: number = 7,
): Date | null {
  if (!createdAt) return null;
  const data = new Date(createdAt);
  if (Number.isNaN(data.getTime())) return null;
  const dias = Number(validadeDias);
  data.setDate(data.getDate() + (Number.isFinite(dias) && dias >= 1 ? dias : 7));
  return data;
}
