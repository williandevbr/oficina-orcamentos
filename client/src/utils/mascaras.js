// Máscaras de telefone e placa (padrão brasileiro).

export function mascararTelefone(valor = "") {
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

export function mascararPlaca(valor = "") {
  let placa = String(valor)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
  // Modelo antigo ABC-1234: adiciona hífen para leitura
  if (/^[A-Z]{3}\d{4}$/.test(placa)) {
    return `${placa.slice(0, 3)}-${placa.slice(3)}`;
  }
  return placa;
}

// Normaliza telefone para link wa.me (só dígitos + 55 se faltar DDI)
// Regras: remove 0 inicial; se tem 10-11 dígitos (BR sem DDI), põe 55.
// Com 12-13 dígitos (já com DDI), mantém. Outros tamanhos: devolve limpo.
export function normalizarTelefoneWhatsApp(valor = "") {
  let digitos = String(valor).replace(/\D/g, "").replace(/^0+/, "");
  if (!digitos) return "";
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return digitos;
}

// Monta o link do WhatsApp com mensagem pronta do orçamento
export function montarLinkWhatsApp({ telefone, nomeCliente, numero, total }) {
  const destino = normalizarTelefoneWhatsApp(telefone);
  if (!destino) return "";
  const num =
    numero === null || numero === undefined || numero === ""
      ? "—"
      : String(numero).padStart(4, "0");
  const texto = `Olá ${nomeCliente || "cliente"}! Aqui é da oficina. Seu orçamento nº ${num} ficou em ${total}. Qualquer dúvida estou à disposição!`;
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
}

// Validade: created_at + validade_dias (com guardas anti-NaN)
export function calcularValidoAte(createdAt, validadeDias = 7) {
  if (!createdAt) return null;
  const data = new Date(createdAt);
  if (Number.isNaN(data.getTime())) return null;
  const dias = Number(validadeDias);
  data.setDate(data.getDate() + (Number.isFinite(dias) && dias >= 1 ? dias : 7));
  return data;
}
