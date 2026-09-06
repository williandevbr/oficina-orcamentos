import pdfmake from "pdfmake";
import { fileURLToPath } from "url";
import path from "path";
import { calcularTotais, totalLinha } from "./calculo.js";

// ============================================================
// Geração do PDF de ORÇAMENTO (design limpo e moderno)
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

// Paleta: azul suave + grafite escuro (moderno, profissional, sem agressividade)
const COR_PRIMARIA = "#2563eb";     // azul vibrante
const COR_ESCURA = "#1e3a5f";       // azul escuro profundo
const COR_MEDIA = "#3b82f6";        // azul médio
const COR_BAIXA = "#dbeafe";        // azul claro suave
const COR_FUNDO = "#f8fafc";        // cinza claro quase branco
const TEXTO = "#0f172a";            // preto suave
const TEXTO_MEDIO = "#475569";      // cinza texto
const TEXTO_BAIXA = "#94a3b8";      // cinza leve
const VERDE = "#16a34a";
const BRANCO = "#ffffff";

// Formata moeda como R$
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

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

// Linha fina de separação
const linhaFina = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0,
  hLineColor: () => "#e2e8f0",
  vLineColor: () => "#e2e8f0",
};

export async function gerarPdfOrcamento(orcamento) {
  const cliente = orcamento.clientes || {};
  const itens = orcamento.orcamento_itens || [];
  const numero = String(orcamento.numero ?? "—").padStart(4, "0");
  const dataEmissao = new Date(
    orcamento.created_at || Date.now(),
  ).toLocaleDateString("pt-BR");

  const validadeDias = Number(orcamento.validade_dias) || 7;
  const validoAte = new Date(orcamento.created_at || Date.now());
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
    orcamento.desconto,
  );

  const corSelo = corStatus[orcamento.status] || "#64748b";
  const textoStatus = (
    rotuloStatus[orcamento.status] ||
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

  const veicOrc = orcamento.veiculos || {};
  const linhaVeiculo = [
    veicOrc.veiculo || cliente.veiculo,
    veicOrc.placa || cliente.placa,
  ]
    .filter(Boolean)
    .join("  •  ");

  // ============================================================
  // DOCUMENT DEFINITION — layout limpo e elegante
  // ============================================================
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 50, 40, 50],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      lineHeight: 1.3,
      color: TEXTO,
    },

    content: [
      // ── TOPO: nome da oficina + orçamento Nº ──
      {
        columns: [
          // Lado esquerdo: nome + contato
          {
            width: "*",
            stack: [
              {
                text: oficina.nome,
                bold: true,
                fontSize: 22,
                color: COR_ESCURA,
              },
              {
                text: [oficina.telefone, oficina.endereco, oficina.cnpj]
                  .filter(Boolean)
                  .join("  •  "),
                fontSize: 8,
                color: TEXTO_BAIXA,
                margin: [0, 2, 0, 0],
              },
            ],
          },
          // Lado direito: ORÇAMENTO + número
          {
            width: "auto",
            stack: [
              {
                text: "ORÇAMENTO",
                bold: true,
                fontSize: 14,
                color: COR_PRIMARIA,
                alignment: "right",
              },
              {
                text: `Nº ${numero}`,
                fontSize: 10,
                color: TEXTO_MEDIO,
                alignment: "right",
                margin: [0, 1, 0, 0],
              },
            ],
          },
        ],
        columnGap: 20,
        margin: [0, 0, 0, 6],
      },

      // Linha separadora
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1.5,
            lineColor: COR_PRIMARIA,
          },
        ],
        margin: [0, 0, 0, 16],
      },

      // ── INFORMAÇÕES: cliente / veículo / validade / status ──
      {
        columns: [
          // Cliente
          {
            width: "*",
            stack: [
              {
                text: "CLIENTE",
                fontSize: 7,
                bold: true,
                color: COR_PRIMARIA,
                margin: [0, 0, 0, 2],
              },
              {
                text: (cliente.nome || "—").toUpperCase(),
                bold: true,
                fontSize: 10,
                color: TEXTO,
              },
              {
                text: cliente.telefone || "",
                fontSize: 8,
                color: TEXTO_MEDIO,
                margin: [0, 1, 0, 0],
              },
            ],
          },
          // Veículo
          {
            width: "*",
            stack: [
              {
                text: "VEÍCULO",
                fontSize: 7,
                bold: true,
                color: COR_PRIMARIA,
                margin: [0, 0, 0, 2],
              },
              {
                text: linhaVeiculo || "—",
                fontSize: 9,
                color: TEXTO,
              },
            ],
          },
          // Validade
          {
            width: "auto",
            stack: [
              {
                text: "VALIDADE",
                fontSize: 7,
                bold: true,
                color: COR_PRIMARIA,
                margin: [0, 0, 0, 2],
              },
              {
                text: `Emitido: ${dataEmissao}`,
                fontSize: 8,
                color: TEXTO_MEDIO,
              },
              {
                text: `Válido até: ${validoAteTxt}`,
                fontSize: 8,
                bold: true,
                color: TEXTO,
              },
            ],
          },
          // Status
          {
            width: "auto",
            stack: [
              {
                text: "STATUS",
                fontSize: 7,
                bold: true,
                color: COR_PRIMARIA,
                margin: [0, 0, 0, 2],
              },
              {
                text: textoStatus,
                bold: true,
                fontSize: 10,
                color: corSelo,
              },
            ],
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 18],
      },

      // ── TABELA DE ITENS (limpa, com linhas sutis) ──
      {
        table: {
          headerRows: 1,
          widths: ["*", "12%", "10%", "18%", "18%"],
          body: [
            // Cabeçalho
            [
              {
                text: "DESCRIÇÃO",
                bold: true,
                fontSize: 7,
                color: COR_PRIMARIA,
                fillColor: COR_BAIXA,
              },
              {
                text: "TIPO",
                bold: true,
                fontSize: 7,
                color: COR_PRIMARIA,
                fillColor: COR_BAIXA,
                alignment: "center",
              },
              {
                text: "QTD",
                bold: true,
                fontSize: 7,
                color: COR_PRIMARIA,
                fillColor: COR_BAIXA,
                alignment: "center",
              },
              {
                text: "VALOR UNIT.",
                bold: true,
                fontSize: 7,
                color: COR_PRIMARIA,
                fillColor: COR_BAIXA,
                alignment: "right",
              },
              {
                text: "TOTAL",
                bold: true,
                fontSize: 7,
                color: COR_PRIMARIA,
                fillColor: COR_BAIXA,
                alignment: "right",
              },
            ],
            // Itens
            ...itensCalc.map((item, i) => [
              {
                text: item.descricao,
                fontSize: 9,
                color: TEXTO,
                fillColor: i % 2 ? BRANCO : COR_FUNDO,
              },
              {
                text: item.tipo === "peca" ? "Peça" : "Serviço",
                fontSize: 8,
                color: TEXTO_MEDIO,
                alignment: "center",
                fillColor: i % 2 ? BRANCO : COR_FUNDO,
              },
              {
                text: String(Number(item.quantidade)),
                fontSize: 9,
                color: TEXTO_MEDIO,
                alignment: "center",
                fillColor: i % 2 ? BRANCO : COR_FUNDO,
              },
              {
                text: formatarMoeda(item.valor_unitario),
                fontSize: 9,
                color: TEXTO_MEDIO,
                alignment: "right",
                fillColor: i % 2 ? BRANCO : COR_FUNDO,
              },
              {
                text: formatarMoeda(item.total),
                fontSize: 9,
                bold: true,
                color: TEXTO,
                alignment: "right",
                fillColor: i % 2 ? BRANCO : COR_FUNDO,
              },
            ]),
          ],
        },
        layout: {
          hLineWidth: (i) => (i === 0 || i === 1 ? 0.5 : 0.3),
          vLineWidth: () => 0,
          hLineColor: () => "#e2e8f0",
          paddingTop: () => 8,
          paddingBottom: () => 8,
          paddingLeft: () => 10,
          paddingRight: () => 10,
        },
        margin: [0, 0, 0, 14],
      },

      // ── TOTAIS (alinhado à direita, limpo) ──
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "45%",
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  { text: "Peças", fontSize: 9, color: TEXTO_MEDIO },
                  {
                    text: formatarMoeda(subtotalPecas),
                    fontSize: 9,
                    color: TEXTO,
                    alignment: "right",
                  },
                ],
                [
                  { text: "Mão de obra", fontSize: 9, color: TEXTO_MEDIO },
                  {
                    text: formatarMoeda(subtotalServicos),
                    fontSize: 9,
                    color: TEXTO,
                    alignment: "right",
                  },
                ],
                [
                  {
                    text: "",
                    border: [false, true, false, false],
                  },
                  {
                    text: "",
                    border: [false, true, false, false],
                  },
                ],
                [
                  {
                    text: "Subtotal",
                    fontSize: 9,
                    color: TEXTO_MEDIO,
                  },
                  {
                    text: formatarMoeda(subtotal),
                    fontSize: 9,
                    color: TEXTO,
                    alignment: "right",
                  },
                ],
                ...(desconto > 0
                  ? [
                      [
                        {
                          text: "Desconto",
                          fontSize: 9,
                          color: TEXTO_MEDIO,
                        },
                        {
                          text: `− ${formatarMoeda(desconto)}`,
                          fontSize: 9,
                          color: VERDE,
                          alignment: "right",
                        },
                      ],
                    ]
                  : []),
              ],
            },
            layout: semBorda,
          },
        ],
        margin: [0, 0, 0, 8],
      },

      // ── TOTAL GERAL (destaque elegante) ──
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "45%",
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  {
                    text: "TOTAL",
                    bold: true,
                    fontSize: 11,
                    color: COR_ESCURA,
                  },
                  {
                    text: formatarMoeda(total),
                    bold: true,
                    fontSize: 16,
                    color: COR_PRIMARIA,
                    alignment: "right",
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              fillColor: () => COR_BAIXA,
              paddingTop: () => 10,
              paddingBottom: () => 10,
              paddingLeft: () => 12,
              paddingRight: () => 12,
            },
          },
        ],
        margin: [0, 0, 0, 16],
      },

      // ── OBSERVAÇÕES (se houver) ──
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
                          color: COR_PRIMARIA,
                          margin: [0, 0, 0, 3],
                        },
                        {
                          text: orcamento.observacoes,
                          fontSize: 9,
                          color: TEXTO_MEDIO,
                        },
                      ],
                      fillColor: COR_FUNDO,
                      margin: [10, 8, 10, 8],
                    },
                  ],
                ],
              },
              layout: semBorda,
              margin: [0, 0, 0, 16],
            },
          ]
        : []),

      // ── ACEITE + ASSINATURA ──
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: "Aprovo a execução dos serviços e peças acima, no valor total indicado.",
                fontSize: 8,
                color: TEXTO_MEDIO,
              },
              {
                text:
                  orcamento.status === "aprovado"
                    ? `Aprovado • Protocolo ${protocolo || "—"}. Guarde este PDF como comprovante.`
                    : `Para aprovar, responda este PDF no WhatsApp da oficina informando o protocolo ${protocolo || "—"}.`,
                fontSize: 7,
                color: TEXTO_BAIXA,
                margin: [0, 2, 0, 0],
              },
              {
                text: "Obrigado pela preferência!",
                bold: true,
                fontSize: 10,
                color: COR_PRIMARIA,
                margin: [0, 10, 0, 0],
              },
            ],
          },
          {
            width: "auto",
            stack: [
              { text: "", margin: [0, 24, 0, 0] },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 180,
                    y2: 0,
                    lineWidth: 0.8,
                    lineColor: "#cbd5e1",
                  },
                ],
              },
              {
                text: `${oficina.nome}  •  ${cliente.nome || "cliente"}`,
                fontSize: 7,
                color: TEXTO_BAIXA,
                alignment: "center",
                margin: [0, 4, 0, 0],
              },
            ],
            alignment: "right",
          },
        ],
        columnGap: 30,
      },
    ],

    // ── RODAPÉ ──
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 0],
      columns: [
        {
          text: `${oficina.nome}${oficina.cnpj ? ` • CNPJ: ${oficina.cnpj}` : ""} • Válido até ${validoAteTxt}`,
          fontSize: 7,
          color: TEXTO_BAIXA,
          alignment: "left",
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          fontSize: 7,
          color: TEXTO_BAIXA,
          alignment: "right",
        },
      ],
    }),
  };

  return pdfmake.createPdf(docDefinition).getBuffer();
}
