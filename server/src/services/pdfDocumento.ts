import { createElement, type ReactElement } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Polyline,
  renderToBuffer,
} from "@react-pdf/renderer";
import { fileURLToPath } from "url";
import path from "path";
import { calcularTotais, totalLinha } from "./calculo.ts";

// ============================================================
// DOCUMENTO PDF (@react-pdf/renderer — layout com componentes)
// ============================================================
// Sem JSX de propósito: o Node roda .ts direto (sem build) e
// não entende JSX. O helper h() monta a mesma árvore.
// ============================================================

function h(
  type: any,
  props?: Record<string, any> | null,
  ...children: Array<any>
): ReactElement {
  return createElement(type, props ?? undefined, ...children);
}

// ---------- Fontes Poppins (offline, pasta server/fonts) ----------
const pastaAtual = path.dirname(fileURLToPath(import.meta.url));
const pastaFontes = path.resolve(pastaAtual, "..", "..", "fonts");

Font.register({
  family: "Poppins",
  fonts: [
    { src: path.join(pastaFontes, "Poppins-Regular.ttf") },
    { src: path.join(pastaFontes, "Poppins-Medium.ttf"), fontWeight: 500 },
    { src: path.join(pastaFontes, "Poppins-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(pastaFontes, "Poppins-Bold.ttf"), fontWeight: 700 },
  ],
});

// ---------- Paleta ----------
const AZUL = "#2563eb";
const ESCURO = "#1e40af";
const MARINHO = "#172554";
const CLARO = "#dbeafe";
const FUNDO = "#f1f5f9";
const FUNDO_LINHA = "#eff6ff";
const TEXTO = "#0f172a";
const MEDIO = "#475569";
const LEVE = "#94a3b8";
const VERDE = "#16a34a";
const DOURADO = "#f59e0b";
const BRANCO = "#ffffff";
const BORDA = "#e2e8f0";

// ---------- O que o PDF precisa (campos extras são ignorados) ----------
export interface OrcamentoPdf {
  id?: string;
  numero?: number;
  status?: string;
  desconto?: number;
  validade_dias?: number;
  observacoes?: string;
  created_at?: string;
  clientes?: {
    nome?: string;
    telefone?: string;
    veiculo?: string;
    placa?: string;
  } | null;
  veiculos?: { veiculo?: string; placa?: string } | null;
  orcamento_itens?: Array<{
    descricao: string;
    tipo: string;
    quantidade: number;
    valor_unitario: number;
    total?: number;
  }>;
}

export interface LojaPdf {
  nome_loja?: string;
  telefone?: string;
  endereco?: string;
  cnpj?: string;
}

// ---------- Formatação ----------
function moeda(valor: number | string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function pontuarDocumento(valor: string = ""): string {
  const d = String(valor).replace(/\D/g, "");
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  if (d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return String(valor);
}

const rotuloStatus: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirado: "Expirado",
};

const corStatus: Record<string, string> = {
  rascunho: "#64748b",
  enviado: "#2563eb",
  aprovado: "#16a34a",
  recusado: "#dc2626",
  expirado: "#d97706",
};

// ---------- Estilos ----------
const e = StyleSheet.create({
  pagina: {
    fontFamily: "Poppins",
    backgroundColor: FUNDO,
    paddingBottom: 56,
  },
  faixa: {
    backgroundColor: MARINHO,
    paddingTop: 26,
    paddingBottom: 22,
    paddingHorizontal: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lojaNome: { color: BRANCO, fontSize: 22, fontWeight: 700 },
  lojaContato: { color: "#bfdbfe", fontSize: 8, marginTop: 4 },
  docTitulo: { color: BRANCO, fontSize: 17, fontWeight: 700, textAlign: "right" },
  docNumero: { color: "#bfdbfe", fontSize: 11, textAlign: "right", marginTop: 2 },
  fileteOuro: { height: 4, backgroundColor: DOURADO },
  corpo: { paddingTop: 18, paddingHorizontal: 30 },
  linhaCartoes: { flexDirection: "row", gap: 8, marginBottom: 16 },
  cartao: {
    flex: 1,
    backgroundColor: BRANCO,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: BORDA,
  },
  rotulo: { color: AZUL, fontSize: 7, fontWeight: 600, marginBottom: 3 },
  cartaoValor: { color: TEXTO, fontSize: 9, fontWeight: 600 },
  cartaoSub: { color: MEDIO, fontSize: 8, marginTop: 2 },
  tabela: {
    backgroundColor: BRANCO,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDA,
    overflow: "hidden",
    marginBottom: 14,
  },
  linha: { flexDirection: "row", alignItems: "center" },
  th: {
    backgroundColor: CLARO,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  thTexto: { color: AZUL, fontSize: 7.5, fontWeight: 700 },
  td: { paddingVertical: 8, paddingHorizontal: 10 },
  tdTexto: { color: TEXTO, fontSize: 9 },
  tdSuave: { color: MEDIO, fontSize: 8.5 },
  tdTotal: { color: TEXTO, fontSize: 9, fontWeight: 700, textAlign: "right" },
  faixaTotal: {
    backgroundColor: CLARO,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalRotulo: { color: ESCURO, fontSize: 12, fontWeight: 700 },
  totalValor: { color: AZUL, fontSize: 18, fontWeight: 700 },
  caixaObs: {
    backgroundColor: BRANCO,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDA,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  rodapeFixo: {
    position: "absolute",
    bottom: 18,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rodapeTexto: { color: LEVE, fontSize: 7 },
});

// Colunas da tabela (larguras em %)
const COL_DESC = "44%";
const COL_TIPO = "13%";
const COL_QTD = "9%";
const COL_UNIT = "17%";
const COL_TOTAL = "17%";

// Traço da assinatura automática
const ASSINATURA_PONTOS =
  "10,30 20,10 35,35 50,8 60,28 75,12 85,30 100,15 115,32 125,18 140,28 155,20 170,25";

// ---------- Cartão de informação ----------
function Cartao(titulo: string, valor: string, sub?: string): ReactElement {
  return h(
    View,
    { style: e.cartao },
    h(Text, { style: e.rotulo }, titulo),
    h(Text, { style: e.cartaoValor }, valor),
    sub ? h(Text, { style: e.cartaoSub }, sub) : null,
  );
}

// ---------- Linha de total simples ----------
function LinhaTotal(rotulo: string, valor: string, corValor?: string): ReactElement {
  return h(
    View,
    { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 } },
    h(Text, { style: { color: MEDIO, fontSize: 9 } }, rotulo),
    h(Text, { style: { color: corValor || TEXTO, fontSize: 9 } }, valor),
  );
}

// ---------- Monta o documento ----------
export function montarDocumento(
  orcamento: OrcamentoPdf,
  loja: LojaPdf | null = null,
): ReactElement {
  const cliente = orcamento.clientes || {};
  const itens = orcamento.orcamento_itens || [];
  const numero = String(orcamento.numero ?? "—").padStart(4, "0");

  const l = loja || {};
  const nomeLoja = l.nome_loja || process.env.OFICINA_NOME || "OrcaPro";
  const contatoLoja = [
    l.telefone || process.env.OFICINA_TELEFONE || "",
    l.endereco || process.env.OFICINA_ENDERECO || "",
  ]
    .filter(Boolean)
    .join("  •  ");
  const cnpjLoja = pontuarDocumento(
    l.cnpj || process.env.OFICINA_CNPJ || "",
  );

  const validadeDias = Number(orcamento.validade_dias) || 7;
  const base = new Date(orcamento.created_at || Date.now());
  const validoAte = new Date(base);
  validoAte.setDate(validoAte.getDate() + validadeDias);
  const validoAteTxt = Number.isNaN(validoAte.getTime())
    ? "—"
    : validoAte.toLocaleDateString("pt-BR");

  const protocolo = String(orcamento.id || "")
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  const itensCalc = itens.map((item) => ({
    ...item,
    total: totalLinha(item.quantidade, item.valor_unitario),
  }));

  const { subtotal, desconto, total } = calcularTotais(
    itensCalc.map((item) => ({
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    })),
    orcamento.desconto ?? 0,
  );

  const statusChave = orcamento.status || "";
  const corSelo = corStatus[statusChave] || "#64748b";
  const textoStatus = (
    rotuloStatus[statusChave] ||
    orcamento.status ||
    "—"
  ).toUpperCase();

  const subtotalPecas =
    Math.round(
      itensCalc
        .filter((i) => i.tipo === "peca")
        .reduce((s, i) => s + i.total, 0) * 100,
    ) / 100;
  const subtotalServicos =
    Math.round(
      itensCalc
        .filter((i) => i.tipo !== "peca")
        .reduce((s, i) => s + i.total, 0) * 100,
    ) / 100;

  const veic = orcamento.veiculos || {};
  const linhaVeiculo = [veic.veiculo || cliente.veiculo, veic.placa || cliente.placa]
    .filter(Boolean)
    .join("  •  ");

  const agora = new Date();
  const carimbo = `Assinado em ${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return h(
    Document,
    { title: `Orçamento ${numero} — ${nomeLoja}`, author: nomeLoja },
    h(
      Page,
      { size: "A4", style: e.pagina },
      // Faixa da loja
      h(
        View,
        { style: e.faixa },
        h(
          View,
          null,
          h(Text, { style: e.lojaNome }, nomeLoja.toUpperCase()),
          contatoLoja
            ? h(Text, { style: e.lojaContato }, contatoLoja)
            : null,
        ),
        h(
          View,
          null,
          h(Text, { style: e.docTitulo }, "ORÇAMENTO"),
          h(Text, { style: e.docNumero }, `Nº ${numero}`),
        ),
      ),
      h(View, { style: e.fileteOuro }),
      // Corpo
      h(
        View,
        { style: e.corpo },
        // Cartões
        h(
          View,
          { style: e.linhaCartoes },
          Cartao(
            "CLIENTE",
            (cliente.nome || "—").toUpperCase(),
            cliente.telefone || undefined,
          ),
          Cartao("VEÍCULO", linhaVeiculo || "—"),
          Cartao("VÁLIDO ATÉ", validoAteTxt, `Protocolo ${protocolo || "—"}`),
          h(
            View,
            { style: e.cartao },
            h(Text, { style: e.rotulo }, "STATUS"),
            h(
              Text,
              { style: { fontSize: 10, fontWeight: 700, color: corSelo } },
              textoStatus,
            ),
          ),
        ),
        // Tabela de itens
        h(
          View,
          { style: e.tabela },
          h(
            View,
            { style: e.linha },
            h(View, { style: { ...e.th, width: COL_DESC } }, h(Text, { style: e.thTexto }, "DESCRIÇÃO")),
            h(View, { style: { ...e.th, width: COL_TIPO, alignItems: "center" } }, h(Text, { style: e.thTexto }, "TIPO")),
            h(View, { style: { ...e.th, width: COL_QTD, alignItems: "center" } }, h(Text, { style: e.thTexto }, "QTD")),
            h(View, { style: { ...e.th, width: COL_UNIT, alignItems: "flex-end" } }, h(Text, { style: e.thTexto }, "VALOR UNIT.")),
            h(View, { style: { ...e.th, width: COL_TOTAL, alignItems: "flex-end" } }, h(Text, { style: e.thTexto }, "TOTAL")),
          ),
          ...itensCalc.map((item, i) =>
            h(
              View,
              {
                key: `item-${i}`,
                style: {
                  ...e.linha,
                  backgroundColor: i % 2 ? BRANCO : FUNDO_LINHA,
                  borderTopWidth: 0.5,
                  borderTopColor: BORDA,
                },
              },
              h(View, { style: { ...e.td, width: COL_DESC } }, h(Text, { style: e.tdTexto }, item.descricao)),
              h(
                View,
                { style: { ...e.td, width: COL_TIPO, alignItems: "center" } },
                h(Text, { style: e.tdSuave }, item.tipo === "peca" ? "Peça" : "Serviço"),
              ),
              h(
                View,
                { style: { ...e.td, width: COL_QTD, alignItems: "center" } },
                h(Text, { style: e.tdSuave }, String(Number(item.quantidade))),
              ),
              h(
                View,
                { style: { ...e.td, width: COL_UNIT, alignItems: "flex-end" } },
                h(Text, { style: e.tdSuave }, moeda(item.valor_unitario)),
              ),
              h(
                View,
                { style: { ...e.td, width: COL_TOTAL, alignItems: "flex-end" } },
                h(Text, { style: e.tdTotal }, moeda(item.total)),
              ),
            ),
          ),
        ),
        // Subtotais à direita
        h(
          View,
          { style: { alignItems: "flex-end", marginBottom: 8 } },
          h(
            View,
            { style: { width: 230 } },
            LinhaTotal("Peças", moeda(subtotalPecas)),
            LinhaTotal("Mão de obra", moeda(subtotalServicos)),
            LinhaTotal("Subtotal", moeda(subtotal)),
            ...(desconto > 0
              ? [LinhaTotal("Desconto", `− ${moeda(desconto)}`, VERDE)]
              : []),
          ),
        ),
        // Faixa de total
        h(
          View,
          { style: e.faixaTotal },
          h(Text, { style: e.totalRotulo }, "TOTAL GERAL"),
          h(Text, { style: e.totalValor }, moeda(total)),
        ),
        // Observações
        ...(orcamento.observacoes
          ? [
              h(
                View,
                { style: e.caixaObs },
                h(Text, { style: e.rotulo }, "OBSERVAÇÕES"),
                h(
                  Text,
                  { style: { color: MEDIO, fontSize: 9 } },
                  orcamento.observacoes,
                ),
              ),
            ]
          : []),
        // Aceite + assinatura
        h(
          View,
          { style: { flexDirection: "row", gap: 30, marginTop: 6 } },
          h(
            View,
            { style: { flex: 1 } },
            h(
              Text,
              { style: { color: MEDIO, fontSize: 8 } },
              "Aprovo a execução dos serviços e peças acima, no valor total indicado.",
            ),
            h(
              Text,
              { style: { color: LEVE, fontSize: 7, marginTop: 3 } },
              orcamento.status === "aprovado"
                ? `Aprovado • Protocolo ${protocolo || "—"}. Guarde este PDF como comprovante.`
                : `Para aprovar, responda este PDF no WhatsApp da oficina informando o protocolo ${protocolo || "—"}.`,
            ),
            h(
              Text,
              { style: { color: AZUL, fontSize: 10, fontWeight: 700, marginTop: 8 } },
              "Obrigado pela preferência!",
            ),
          ),
          h(
            View,
            { style: { width: 190, alignItems: "center" } },
            h(
              Svg,
              { width: 180, height: 40, viewBox: "0 0 180 40" },
              h(Polyline, {
                points: ASSINATURA_PONTOS,
                fill: "none",
                stroke: ESCURO,
                strokeWidth: 1.4,
              }),
            ),
            h(View, {
              style: {
                width: 180,
                borderBottomWidth: 0.8,
                borderBottomColor: "#cbd5e1",
              },
            }),
            h(
              Text,
              { style: { color: MEDIO, fontSize: 8, fontWeight: 600, marginTop: 3 } },
              nomeLoja,
            ),
            h(Text, { style: { color: LEVE, fontSize: 6, marginTop: 1 } }, carimbo),
          ),
        ),
      ),
      // Rodapé fixo
      h(
        View,
        { style: e.rodapeFixo, fixed: true },
        h(
          Text,
          { style: e.rodapeTexto },
          `${nomeLoja}${cnpjLoja ? ` • CNPJ: ${cnpjLoja}` : ""} • Válido até ${validoAteTxt}`,
        ),
        h(Text, {
          style: e.rodapeTexto,
          render: (info: any) =>
            `Página ${info.pageNumber} de ${info.totalPages}`,
        }),
      ),
    ),
  );
}

// ---------- Gera o arquivo ----------
export async function renderizarPdf(
  orcamento: OrcamentoPdf,
  loja: LojaPdf | null = null,
): Promise<Buffer> {
  const doc = montarDocumento(orcamento, loja) as Parameters<
    typeof renderToBuffer
  >[0];
  return renderToBuffer(doc);
}
