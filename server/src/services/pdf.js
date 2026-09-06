import pdfmake from "pdfmake";
import { fileURLToPath } from "url";
import path from "path";
import { calcularTotais, totalLinha } from "./calculo.js";

// ============================================================
// Geração do PDF de ORÇAMENTO (visual limpo e elegante)
// ============================================================
// Biblioteca pdfmake com fontes Roboto offline (pasta server/fonts).
// Regra de ouro do pdfmake: todo "body" de tabela é uma lista
// de LINHAS, e cada linha é uma lista de células.
// ============================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.resolve(__dirname, "..", "..", "fonts");

pdfmake.addFonts({
  Roboto: {
    normal: path.join(fontsDir, "Roboto-Regular.ttf"),
    bold: path.join(fontsDir, "Roboto-Medium.ttf"),
    italics: path.join(fontsDir, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontsDir, "Roboto-MediumItalic.ttf"),
  },
});

pdfmake.setLocalAccessPolicy((caminho) => caminho.startsWith(fontsDir));

// Paleta: grafite + laranja (contraste alto, leitura fácil)
const GRAFITE = "#1e293b";
const LARANJA = "#f97316";
const LARANJA_ESCURO = "#ea580c";
const CREME = "#fff7ed";
const ZEBRA = "#fff7ed";
const CINZA = "#64748b";
const BORDA = "#fed7aa";
const BRANCO = "#ffffff";

// Formata moeda como R$
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

// Dados da oficina (configuráveis no arquivo .env)
const oficina = {
  nome: process.env.OFICINA_NOME || "OrcaPro",
  telefone: process.env.OFICINA_TELEFONE || "",
  endereco: process.env.OFICINA_ENDERECO || "",
  cnpj: process.env.OFICINA_CNPJ || "",
};

const rotuloStatus = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirado: "Expirado",
};

const corStatus = {
  rascunho: "#64748b",
  enviado: "#2563eb",
  aprovado: "#16a34a",
  recusado: "#dc2626",
  expirado: "#d97706",
};

// Tabela sem bordas (limpa)
const semBorda = {
  hLineWidth: () => 0,
  vLineWidth: () => 0,
};

// "Molde" do documento: recebe o orçamento completo (com cliente e itens)
export async function gerarPdfOrcamento(orcamento) {
  const cliente = orcamento.clientes || {};
  const itens = orcamento.orcamento_itens || [];
  const numero = String(orcamento.numero ?? "—").padStart(4, "0");
  const dataEmissao = new Date(
    orcamento.created_at || Date.now(),
  ).toLocaleDateString("pt-BR");

  // Validade com data pronta (o cliente não precisa calcular)
  const validadeDias = Number(orcamento.validade_dias) || 7;
  const validoAte = new Date(orcamento.created_at || Date.now());
  validoAte.setDate(validoAte.getDate() + validadeDias);
  const validoAteTxt = Number.isNaN(validoAte.getTime())
    ? "—"
    : validoAte.toLocaleDateString("pt-BR");

  // Protocolo curto do aceite digital (identifica este orçamento)
  const protocolo = String(orcamento.id || "")
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  // Totais de linha recalculados (iguais aos do resumo — nunca divergem)
  const itensCalc = itens.map((item) => ({
    ...item,
    total: totalLinha(item.quantidade, item.valor_unitario),
  }));

  // Recalcula os totais com a mesma regra do sistema (fonte única)
  const { subtotal, desconto, total } = calcularTotais(
    itensCalc.map((item) => ({
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    })),
    orcamento.desconto,
  );

  const corSelo = corStatus[orcamento.status] || "#64748b";
  const textoStatus = (
    rotuloStatus[orcamento.status] ||
    orcamento.status ||
    "—"
  ).toUpperCase();

  // Subtotais por grupo (peças x mão de obra)
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

  const linhaVeiculo = [cliente.veiculo, cliente.placa]
    .filter(Boolean)
    .join("  •  ");
  const contatoOficina = [oficina.telefone, oficina.endereco]
    .filter(Boolean)
    .join("  •  ");

  // Linha da tabela de itens (uma linha = lista de 5 células)
  const linhaItem = (item, i) => [
    { text: item.descricao, color: GRAFITE, fillColor: i % 2 ? BRANCO : ZEBRA },
    {
      text: item.tipo === "peca" ? "Peça" : "Serviço",
      alignment: "center",
      fontSize: 8,
      color: CINZA,
      fillColor: i % 2 ? BRANCO : ZEBRA,
    },
    {
      text: String(Number(item.quantidade)),
      alignment: "center",
      color: CINZA,
      fillColor: i % 2 ? BRANCO : ZEBRA,
    },
    {
      text: formatarMoeda(item.valor_unitario),
      alignment: "right",
      color: CINZA,
      fillColor: i % 2 ? BRANCO : ZEBRA,
    },
    {
      text: formatarMoeda(item.total),
      alignment: "right",
      bold: true,
      color: GRAFITE,
      fillColor: i % 2 ? BRANCO : ZEBRA,
    },
  ];

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 30, 40, 40],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      lineHeight: 1.4,
      color: GRAFITE,
    },

    content: [
      // ===== Faixa da oficina (grafite + laranja) =====
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              {
                stack: [
                  {
                    text: oficina.nome.toUpperCase(),
                    bold: true,
                    fontSize: 20,
                    color: BRANCO,
                  },
                  {
                    text: contatoOficina || "ORÇAMENTOS PARA OFICINAS",
                    fontSize: 8,
                    color: "#fdba74",
                    margin: [0, 3, 0, 0],
                  },
                ],
                fillColor: GRAFITE,
                margin: [4, 4, 4, 4],
              },
              {
                stack: [
                  {
                    text: "ORÇAMENTO",
                    bold: true,
                    fontSize: 16,
                    color: LARANJA,
                    alignment: "right",
                  },
                  {
                    text: `Nº ${numero}`,
                    fontSize: 11,
                    color: BRANCO,
                    alignment: "right",
                    margin: [0, 2, 0, 0],
                  },
                ],
                fillColor: GRAFITE,
                margin: [4, 4, 4, 4],
              },
            ],
          ],
        },
        layout: semBorda,
        margin: [0, 0, 0, 14],
      },

      // ===== Cartões: cliente / validade / status =====
      {
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              {
                stack: [
                  { text: "CLIENTE", fontSize: 7, bold: true, color: LARANJA_ESCURO },
                  {
                    text: (cliente.nome || "—").toUpperCase(),
                    bold: true,
                    fontSize: 10,
                    color: GRAFITE,
                    margin: [0, 2, 0, 0],
                  },
                  {
                    text: linhaVeiculo || cliente.telefone || "—",
                    fontSize: 8,
                    color: CINZA,
                    margin: [0, 1, 0, 0],
                  },
                ],
                fillColor: CREME,
                margin: [6, 6, 6, 6],
              },
              {
                stack: [
                  { text: "VALIDADE", fontSize: 7, bold: true, color: LARANJA_ESCURO },
                  {
                    text: `Emitido em ${dataEmissao}`,
                    fontSize: 8,
                    color: GRAFITE,
                    margin: [0, 2, 0, 0],
                  },
                  {
                    text: `Válido até ${validoAteTxt}`,
                    fontSize: 8,
                    color: GRAFITE,
                  },
                  {
                    text: `Protocolo ${protocolo || "—"}`,
                    fontSize: 7,
                    color: CINZA,
                    margin: [0, 1, 0, 0],
                  },
                ],
                fillColor: CREME,
                margin: [6, 6, 6, 6],
              },
              {
                stack: [
                  { text: "STATUS", fontSize: 7, bold: true, color: LARANJA_ESCURO },
                  {
                    text: textoStatus,
                    bold: true,
                    fontSize: 12,
                    color: corSelo,
                    margin: [0, 4, 0, 0],
                  },
                  {
                    text: `${validadeDias} dias de validade`,
                    fontSize: 8,
                    color: CINZA,
                    margin: [0, 1, 0, 0],
                  },
                ],
                fillColor: CREME,
                margin: [6, 6, 6, 6],
              },
            ],
          ],
        },
        layout: semBorda,
        margin: [0, 0, 0, 14],
      },

      // ===== Tabela de itens =====
      {
        table: {
          headerRows: 1,
          widths: ["*", "12%", "9%", "18%", "18%"],
          body: [
            [
              {
                text: "DESCRIÇÃO",
                bold: true,
                fontSize: 8,
                color: BRANCO,
                fillColor: GRAFITE,
              },
              {
                text: "TIPO",
                bold: true,
                fontSize: 8,
                color: BRANCO,
                fillColor: LARANJA,
                alignment: "center",
              },
              {
                text: "QTD",
                bold: true,
                fontSize: 8,
                color: BRANCO,
                fillColor: LARANJA,
                alignment: "center",
              },
              {
                text: "VALOR UNIT.",
                bold: true,
                fontSize: 8,
                color: BRANCO,
                fillColor: LARANJA,
                alignment: "right",
              },
              {
                text: "TOTAL",
                bold: true,
                fontSize: 8,
                color: BRANCO,
                fillColor: LARANJA,
                alignment: "right",
              },
            ],
            ...itensCalc.map((item, i) => linhaItem(item, i)),
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingTop: () => 7,
          paddingBottom: () => 7,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 0, 0, 10],
      },

      // ===== Subtotais =====
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "46%",
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  { text: "Peças", fontSize: 8, color: CINZA },
                  {
                    text: formatarMoeda(subtotalPecas),
                    fontSize: 8,
                    color: GRAFITE,
                    alignment: "right",
                  },
                ],
                [
                  { text: "Mão de obra", fontSize: 8, color: CINZA },
                  {
                    text: formatarMoeda(subtotalServicos),
                    fontSize: 8,
                    color: GRAFITE,
                    alignment: "right",
                  },
                ],
                [
                  { text: "Subtotal", fontSize: 8, color: CINZA },
                  {
                    text: formatarMoeda(subtotal),
                    fontSize: 8,
                    color: GRAFITE,
                    alignment: "right",
                  },
                ],
                [
                  { text: "Desconto", fontSize: 8, color: CINZA },
                  {
                    text: `− ${formatarMoeda(desconto)}`,
                    fontSize: 8,
                    color: "#16a34a",
                    alignment: "right",
                  },
                ],
              ],
            },
            layout: semBorda,
          },
        ],
        margin: [0, 0, 0, 6],
      },

      // ===== Barra de TOTAL =====
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              {
                text: "TOTAL GERAL",
                bold: true,
                fontSize: 12,
                color: BRANCO,
                fillColor: GRAFITE,
                margin: [6, 4, 6, 4],
              },
              {
                text: formatarMoeda(total),
                bold: true,
                fontSize: 16,
                color: LARANJA,
                fillColor: GRAFITE,
                alignment: "right",
                margin: [6, 4, 6, 4],
              },
            ],
          ],
        },
        layout: semBorda,
        margin: [0, 0, 0, 12],
      },

      // ===== Observações (só se houver) =====
      ...(orcamento.observacoes
        ? [
            {
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      stack: [
                        {
                          text: "OBSERVAÇÕES",
                          fontSize: 7,
                          bold: true,
                          color: LARANJA_ESCURO,
                        },
                        {
                          text: orcamento.observacoes,
                          fontSize: 9,
                          color: GRAFITE,
                          margin: [0, 3, 0, 0],
                        },
                      ],
                      fillColor: CREME,
                      margin: [6, 6, 6, 6],
                    },
                  ],
                ],
              },
              layout: semBorda,
              margin: [0, 0, 0, 12],
            },
          ]
        : []),

      // ===== Aceite + assinatura (colunas, sem tabela) =====
      {
        columns: [
          {
            stack: [
              {
                text: "Aprovo a execução dos serviços e peças acima, no valor total indicado.",
                fontSize: 8,
                color: CINZA,
              },
              {
                text:
                  orcamento.status === "aprovado"
                    ? `Aprovado • Protocolo ${protocolo || "—"}. Guarde este PDF como comprovante.`
                    : `Para aprovar, responda este PDF no WhatsApp da oficina informando o protocolo ${protocolo || "—"}.`,
                fontSize: 7,
                color: "#94a3b8",
                margin: [0, 3, 0, 0],
              },
              {
                text: "Obrigado pela preferência!",
                bold: true,
                fontSize: 10,
                color: LARANJA_ESCURO,
                margin: [0, 8, 0, 0],
              },
            ],
          },
          {
            stack: [
              { text: "", margin: [0, 28, 0, 0] },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 200,
                    y2: 0,
                    lineWidth: 1,
                    lineColor: BORDA,
                  },
                ],
              },
              {
                text: `${oficina.nome}  •  ${cliente.nome || "cliente"}`,
                fontSize: 7,
                color: CINZA,
                alignment: "center",
                margin: [0, 4, 0, 0],
              },
            ],
            alignment: "right",
          },
        ],
        columnGap: 30,
        margin: [0, 0, 0, 0],
      },
    ],

    // ===== Rodapé (todas as páginas) =====
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 0],
      columns: [
        {
          text: `${oficina.nome}${oficina.cnpj ? ` • CNPJ: ${oficina.cnpj}` : ""} • Válido até ${validoAteTxt}`,
          fontSize: 7,
          color: "#94a3b8",
          alignment: "left",
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          fontSize: 7,
          color: "#94a3b8",
          alignment: "right",
        },
      ],
    }),
  };

  // Gera o documento e devolve o arquivo (Buffer)
  return pdfmake.createPdf(docDefinition).getBuffer();
}
