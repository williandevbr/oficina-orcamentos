import pdfmake from "pdfmake";
import { fileURLToPath } from "url";
import path from "path";
import { calcularTotais, totalLinha } from "./calculo.js";

// ============================================================
// Geração do PDF de ORÇAMENTO
// Fonte: Poppins (moderna, profissional)
// Layout: página inteira, fundo suave, assinatura automática
// ============================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.resolve(__dirname, "..", "..", "fonts");

pdfmake.addFonts({
  Poppins: {
    normal: path.join(fontsDir, "Poppins-Regular.ttf"),
    bold: path.join(fontsDir, "Poppins-Medium.ttf"),
    italics: path.join(fontsDir, "Poppins-Regular.ttf"),
    bolditalics: path.join(fontsDir, "Poppins-SemiBold.ttf"),
  },
});

pdfmake.setLocalAccessPolicy((caminho) => caminho.startsWith(fontsDir));

// ============================================================
// PALETA — azul suave, fundo cinza-azulado, contraste limpo
// ============================================================
const AZUL = "#2563eb";
const AZUL_ESCURO = "#1e40af";
const AZUL_CLARO = "#dbeafe";
const AZUL_FONDO = "#eff6ff";
const FUNDO = "#f1f5f9";
const TEXTO = "#0f172a";
const TEXTO_MEDIO = "#334155";
const TEXTO_LEVE = "#64748b";
const TEXTO_BAIXO = "#94a3b8";
const VERDE = "#16a34a";
const BRANCO = "#ffffff";
const LARANJA = "#f97316";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

// Pontuação automática de documento (só se veio sem pontos)
function pontuarDocumento(valor = "") {
  const d = String(valor).replace(/\D/g, "");
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  if (d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return String(valor);
}

// Dados da oficina vindos do .env (reserva, caso a loja não esteja cadastrada)
const oficinaPadrao = {
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

const semBorda = {
  hLineWidth: () => 0,
  vLineWidth: () => 0,
};

// ============================================================
// ASSINATURA DIGITAL AUTOMÁTICA
// Gera uma "assinatura manuscrita" usando traços do pdfmake
// ============================================================
function gerarAssinatura(nomeProprietario) {
  const largura = 180;
  const altura = 40;

  // Pontos de uma assinatura estilizada (curva suave + traço final)
  const pontos = [
    { x: 10, y: 30 },
    { x: 20, y: 10 },
    { x: 35, y: 35 },
    { x: 50, y: 8 },
    { x: 60, y: 28 },
    { x: 75, y: 12 },
    { x: 85, y: 30 },
    { x: 100, y: 15 },
    { x: 115, y: 32 },
    { x: 125, y: 18 },
    { x: 140, y: 28 },
    { x: 155, y: 20 },
    { x: 170, y: 25 },
  ];

  return {
    stack: [
      // Traços da assinatura (linhas conectadas)
      {
        canvas: pontos.map((p, i) => {
          if (i === 0) return null;
          const anterior = pontos[i - 1];
          return {
            type: "line",
            x1: anterior.x,
            y1: anterior.y,
            x2: p.x,
            y2: p.y,
            lineWidth: 1.2,
            lineColor: AZUL_ESCURO,
          };
        }).filter(Boolean),
        width: largura,
        height: altura,
      },
      // Linha abaixo da assinatura
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: largura,
            y2: 0,
            lineWidth: 0.5,
            lineColor: "#cbd5e1",
          },
        ],
        margin: [0, 0, 0, 2],
      },
      // Nome do proprietário
      {
        text: nomeProprietario,
        fontSize: 8,
        bold: true,
        color: TEXTO_MEDIO,
        alignment: "center",
      },
      // Data e hora da assinatura
      {
        text: `Assinado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        fontSize: 6,
        color: TEXTO_LEVE,
        alignment: "center",
        margin: [0, 1, 0, 0],
      },
    ],
    width: largura,
  };
}

// ============================================================
// DOCUMENT DEFINITION
// ============================================================
export async function gerarPdfOrcamento(orcamento, loja = null) {
  const cliente = orcamento.clientes || {};
  const itens = orcamento.orcamento_itens || [];

  // Dados da oficina: usa a loja cadastrada; sem cadastro, usa o .env
  const l = loja || {};
  const oficina = {
    nome: l.nome_loja || oficinaPadrao.nome,
    telefone: l.telefone || oficinaPadrao.telefone,
    endereco: l.endereco || oficinaPadrao.endereco,
    cnpj: pontuarDocumento(l.cnpj || oficinaPadrao.cnpj),
  };
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

  // Assinatura automática do proprietário
  const assinatura = gerarAssinatura(oficina.nome);

  // ============================================================
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [30, 30, 30, 30],
    background: () => ({
      canvas: [
        {
          type: "rect",
          x: 0,
          y: 0,
          w: 595.28,
          h: 841.89,
          r: 0,
          color: FUNDO,
        },
      ],
    }),
    defaultStyle: {
      font: "Poppins",
      fontSize: 9,
      lineHeight: 1.35,
      color: TEXTO,
    },

    content: [
      // ============================================================
      // TOPO: faixa azul escura com nome + número
      // ============================================================
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                columns: [
                  {
                    width: "*",
                    stack: [
                      {
                        text: oficina.nome.toUpperCase(),
                        bold: true,
                        fontSize: 20,
                        color: BRANCO,
                      },
                      {
                        text: oficina.telefone || "",
                        fontSize: 8,
                        color: "#bfdbfe",
                        margin: [0, 2, 0, 0],
                      },
                    ],
                  },
                  {
                    width: "auto",
                    stack: [
                      {
                        text: "ORÇAMENTO",
                        bold: true,
                        fontSize: 18,
                        color: BRANCO,
                        alignment: "right",
                      },
                      {
                        text: `Nº ${numero}`,
                        fontSize: 12,
                        color: "#bfdbfe",
                        alignment: "right",
                        margin: [0, 1, 0, 0],
                      },
                    ],
                  },
                ],
                columnGap: 20,
                fillColor: AZUL_ESCURO,
                margin: [20, 16, 20, 16],
              },
            ],
          ],
        },
        layout: semBorda,
        margin: [0, 0, 0, 12],
      },

      // ============================================================
      // INFO: cliente / veículo / validade / status (4 colunas)
      // ============================================================
      {
        table: {
          widths: ["*", "*", "*", "auto"],
          body: [
            [
              {
                stack: [
                  { text: "CLIENTE", fontSize: 7, bold: true, color: AZUL, margin: [0, 0, 0, 2] },
                  { text: (cliente.nome || "—").toUpperCase(), bold: true, fontSize: 10, color: TEXTO },
                  { text: cliente.telefone || "", fontSize: 8, color: TEXTO_MEDIO, margin: [0, 1, 0, 0] },
                ],
                fillColor: BRANCO,
                margin: [10, 8, 10, 8],
              },
              {
                stack: [
                  { text: "VEÍCULO", fontSize: 7, bold: true, color: AZUL, margin: [0, 0, 0, 2] },
                  { text: linhaVeiculo || "—", fontSize: 9, color: TEXTO },
                ],
                fillColor: BRANCO,
                margin: [10, 8, 10, 8],
              },
              {
                stack: [
                  { text: "VALIDADE", fontSize: 7, bold: true, color: AZUL, margin: [0, 0, 0, 2] },
                  { text: `${validoAteTxt}`, bold: true, fontSize: 9, color: TEXTO },
                  { text: `Protocolo: ${protocolo}`, fontSize: 7, color: TEXTO_LEVE, margin: [0, 1, 0, 0] },
                ],
                fillColor: BRANCO,
                margin: [10, 8, 10, 8],
              },
              {
                stack: [
                  { text: "STATUS", fontSize: 7, bold: true, color: AZUL, margin: [0, 0, 0, 2] },
                  { text: textoStatus, bold: true, fontSize: 10, color: corSelo },
                ],
                fillColor: BRANCO,
                margin: [10, 8, 10, 8],
              },
            ],
          ],
        },
        layout: semBorda,
        margin: [0, 0, 0, 12],
      },

      // ============================================================
      // TABELA DE ITENS
      // ============================================================
      {
        table: {
          headerRows: 1,
          widths: ["*", "12%", "10%", "17%", "17%"],
          body: [
            [
              { text: "DESCRIÇÃO", bold: true, fontSize: 7, color: AZUL, fillColor: AZUL_CLARO },
              { text: "TIPO", bold: true, fontSize: 7, color: AZUL, fillColor: AZUL_CLARO, alignment: "center" },
              { text: "QTD", bold: true, fontSize: 7, color: AZUL, fillColor: AZUL_CLARO, alignment: "center" },
              { text: "UNITÁRIO", bold: true, fontSize: 7, color: AZUL, fillColor: AZUL_CLARO, alignment: "right" },
              { text: "TOTAL", bold: true, fontSize: 7, color: AZUL, fillColor: AZUL_CLARO, alignment: "right" },
            ],
            ...itensCalc.map((item, i) => [
              {
                text: item.descricao,
                fontSize: 9,
                color: TEXTO,
                fillColor: i % 2 ? BRANCO : AZUL_FONDO,
              },
              {
                text: item.tipo === "peca" ? "Peça" : "Serviço",
                fontSize: 8,
                color: TEXTO_MEDIO,
                alignment: "center",
                fillColor: i % 2 ? BRANCO : AZUL_FONDO,
              },
              {
                text: String(Number(item.quantidade)),
                fontSize: 9,
                color: TEXTO_MEDIO,
                alignment: "center",
                fillColor: i % 2 ? BRANCO : AZUL_FONDO,
              },
              {
                text: formatarMoeda(item.valor_unitario),
                fontSize: 9,
                color: TEXTO_MEDIO,
                alignment: "right",
                fillColor: i % 2 ? BRANCO : AZUL_FONDO,
              },
              {
                text: formatarMoeda(item.total),
                fontSize: 9,
                bold: true,
                color: TEXTO,
                alignment: "right",
                fillColor: i % 2 ? BRANCO : AZUL_FONDO,
              },
            ]),
          ],
        },
        layout: {
          hLineWidth: (i) => (i === 0 || i === 1 ? 0.5 : 0.2),
          vLineWidth: () => 0,
          hLineColor: () => "#cbd5e1",
          paddingTop: () => 7,
          paddingBottom: () => 7,
          paddingLeft: () => 10,
          paddingRight: () => 10,
        },
        margin: [0, 0, 0, 12],
      },

      // ============================================================
      // TOTAIS
      // ============================================================
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
                  { text: formatarMoeda(subtotalPecas), fontSize: 9, color: TEXTO, alignment: "right" },
                ],
                [
                  { text: "Mão de obra", fontSize: 9, color: TEXTO_MEDIO },
                  { text: formatarMoeda(subtotalServicos), fontSize: 9, color: TEXTO, alignment: "right" },
                ],
                [
                  { text: "", border: [false, true, false, false] },
                  { text: "", border: [false, true, false, false] },
                ],
                [
                  { text: "Subtotal", fontSize: 9, color: TEXTO_MEDIO },
                  { text: formatarMoeda(subtotal), fontSize: 9, color: TEXTO, alignment: "right" },
                ],
                ...(desconto > 0
                  ? [
                      [
                        { text: "Desconto", fontSize: 9, color: TEXTO_MEDIO },
                        { text: `− ${formatarMoeda(desconto)}`, fontSize: 9, color: VERDE, alignment: "right" },
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

      // ============================================================
      // TOTAL GERAL (destaque)
      // ============================================================
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                columns: [
                  { width: "*", text: "TOTAL GERAL", bold: true, fontSize: 12, color: AZUL_ESCURO },
                  { width: "auto", text: formatarMoeda(total), bold: true, fontSize: 18, color: AZUL, alignment: "right" },
                ],
                columnGap: 10,
                fillColor: AZUL_CLARO,
                margin: [14, 10, 14, 10],
              },
            ],
          ],
        },
        layout: semBorda,
        margin: [0, 0, 0, 14],
      },

      // ============================================================
      // OBSERVAÇÕES (se houver)
      // ============================================================
      ...(orcamento.observacoes
        ? [
            {
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      stack: [
                        { text: "OBSERVAÇÕES", fontSize: 7, bold: true, color: AZUL, margin: [0, 0, 0, 2] },
                        { text: orcamento.observacoes, fontSize: 9, color: TEXTO_MEDIO },
                      ],
                      fillColor: BRANCO,
                      margin: [10, 8, 10, 8],
                    },
                  ],
                ],
              },
              layout: semBorda,
              margin: [0, 0, 0, 14],
            },
          ]
        : []),

      // ============================================================
      // ACEITE + ASSINATURA
      // ============================================================
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
                    ? `Aprovado • Protocolo ${protocolo || "—"} • Guarde este PDF como comprovante.`
                    : `Para aprovar, responda este PDF no WhatsApp da oficina informando o protocolo ${protocolo || "—"}.`,
                fontSize: 7,
                color: TEXTO_BAIXO,
                margin: [0, 3, 0, 0],
              },
              {
                text: "Obrigado pela preferência!",
                bold: true,
                fontSize: 10,
                color: AZUL,
                margin: [0, 8, 0, 0],
              },
            ],
          },
          assinatura,
        ],
        columnGap: 30,
      },
    ],

    // ============================================================
    // RODAPÉ
    // ============================================================
    footer: (currentPage, pageCount) => ({
      margin: [30, 0, 30, 0],
      table: {
        widths: ["*", "auto"],
        body: [
          [
            {
              text: `${oficina.nome}${oficina.cnpj ? ` • CNPJ: ${oficina.cnpj}` : ""} • Válido até ${validoAteTxt}`,
              fontSize: 7,
              color: TEXTO_BAIXO,
              fillColor: BRANCO,
              margin: [10, 6, 10, 6],
            },
            {
              text: `Página ${currentPage} de ${pageCount}`,
              fontSize: 7,
              color: TEXTO_BAIXO,
              fillColor: BRANCO,
              alignment: "right",
              margin: [10, 6, 10, 6],
            },
          ],
        ],
      },
      layout: semBorda,
    }),
  };

  return pdfmake.createPdf(docDefinition).getBuffer();
}
