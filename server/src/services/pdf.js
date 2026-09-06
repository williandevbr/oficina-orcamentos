import pdfmake from "pdfmake";
import { fileURLToPath } from "url";
import path from "path";
import { calcularTotais, totalLinha } from "./calculo.js";

// ============================================================
// Geração do PDF de ORÇAMENTO (modelo inspirado em templates
// profissionais de invoice: faixa da oficina, tabela com
// cabeçalho duplo e barra de TOTAL em destaque)
// ============================================================
// Usa a biblioteca pdfmake (a mesma de sistemas de fatura).
// As fontes Roboto ficam na pasta server/fonts/ (extraídas do
// próprio pacote, funcionam offline).
// ============================================================

// Caminho da pasta de fontes (relativo a este arquivo)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.resolve(__dirname, "..", "..", "fonts");

// Registra as fontes para o pdfmake (API oficial da versão 0.3)
pdfmake.addFonts({
  Roboto: {
    normal: path.join(fontsDir, "Roboto-Regular.ttf"),
    bold: path.join(fontsDir, "Roboto-Medium.ttf"),
    italics: path.join(fontsDir, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontsDir, "Roboto-MediumItalic.ttf"),
  },
});

// Libera a leitura apenas da pasta de fontes (segurança de acesso local)
pdfmake.setLocalAccessPolicy((caminho) => caminho.startsWith(fontsDir));

// Paleta do modelo (azul claro + marinho)
const AZUL = "#4b9fe1";
const AZUL_CLARO_TEXTO = "#e8f3fd";
const MARINHO = "#1e3a8a";
const CINZA = "#64748b";
const CINZA_CLARO = "#94a3b8";
const ZEBRA = "#f2f8fe";
const PRETO = "#0f172a";

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

// Cor do status (texto) — sem caixa, seguindo o modelo
const corStatus = {
  rascunho: "#64748b",
  enviado: "#2563eb",
  aprovado: "#16a34a",
  recusado: "#dc2626",
  expirado: "#d97706",
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

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [36, 0, 36, 34],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      lineHeight: 1.35,
      color: PRETO,
    },
    // Faixa superior sem margem (encosta no topo, como no modelo)
    header: {
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
                  color: "#ffffff",
                },
                {
                  text: "ORÇAMENTOS PARA OFICINAS",
                  fontSize: 7,
                  color: AZUL_CLARO_TEXTO,
                  margin: [0, 2, 0, 0],
                },
              ],
              margin: [36, 22, 0, 22],
            },
            {
              stack: [
                ...(oficina.telefone
                  ? [
                      {
                        text: `Fone: ${oficina.telefone}`,
                        fontSize: 8,
                        color: "#ffffff",
                        alignment: "right",
                      },
                    ]
                  : []),
                ...(oficina.endereco
                  ? [
                      {
                        text: oficina.endereco,
                        fontSize: 8,
                        color: AZUL_CLARO_TEXTO,
                        alignment: "right",
                      },
                    ]
                  : []),
                ...(oficina.cnpj
                  ? [
                      {
                        text: `CNPJ: ${oficina.cnpj}`,
                        fontSize: 8,
                        color: AZUL_CLARO_TEXTO,
                        alignment: "right",
                      },
                    ]
                  : []),
              ],
              margin: [0, 24, 36, 22],
            },
          ],
        ],
        },
        layout: {
        fillColor: () => AZUL,
        hLineColor: () => AZUL,
        vLineColor: () => AZUL,
        paddingTop: () => 0,
        paddingBottom: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
      },
    },
    content: [
      // ===== Para + título do documento =====
      {
        columns: [
          {
            stack: [
              { text: "Para:", fontSize: 8, color: CINZA },
              {
                text: (cliente.nome || "—").toUpperCase(),
                bold: true,
                fontSize: 11,
                color: PRETO,
                margin: [0, 2, 0, 0],
              },
              {
                text: [cliente.veiculo, cliente.placa, cliente.telefone]
                  .filter(Boolean)
                  .join("  •  "),
                fontSize: 8,
                color: CINZA,
                margin: [0, 2, 0, 0],
              },
            ],
          },
          {
            stack: [
              {
                text: "ORÇAMENTO",
                bold: true,
                fontSize: 18,
                color: PRETO,
                alignment: "right",
              },
              {
                text: `Nº ${numero}`,
                fontSize: 10,
                color: CINZA,
                alignment: "right",
              },
              {
                text: `Emissão: ${dataEmissao}  •  Válido até ${validoAteTxt}`,
                fontSize: 8,
                color: CINZA,
                alignment: "right",
              },
              {
                text: (rotuloStatus[orcamento.status] || orcamento.status || "").toUpperCase(),
                fontSize: 8,
                bold: true,
                color: corSelo,
                alignment: "right",
              },
            ],
          },
        ],
        columnGap: 20,
        margin: [0, 14, 0, 0],
      },

      // ===== Tabela de itens (cabeçalho duplo do modelo) =====
      {
        table: {
          headerRows: 1,
          widths: ["*", "12%", "10%", "18%", "18%"],
          body: [
            [
              {
                text: "DESCRIÇÃO",
                bold: true,
                fontSize: 8,
                color: "#ffffff",
                fillColor: AZUL,
              },
              {
                text: "TIPO",
                bold: true,
                fontSize: 8,
                color: "#ffffff",
                fillColor: MARINHO,
                alignment: "center",
              },
              {
                text: "QTD",
                bold: true,
                fontSize: 8,
                color: "#ffffff",
                fillColor: MARINHO,
                alignment: "center",
              },
              {
                text: "VALOR UNIT.",
                bold: true,
                fontSize: 8,
                color: "#ffffff",
                fillColor: MARINHO,
                alignment: "right",
              },
              {
                text: "TOTAL",
                bold: true,
                fontSize: 8,
                color: "#ffffff",
                fillColor: MARINHO,
                alignment: "right",
              },
            ],
            ...itensCalc.map((item, i) => [
              {
                text: item.descricao,
                fillColor: i % 2 === 0 ? ZEBRA : null,
              },
              {
                text: item.tipo === "peca" ? "Peça" : "Serviço",
                alignment: "center",
                fontSize: 8,
                color: CINZA,
                fillColor: i % 2 === 0 ? ZEBRA : null,
              },
              {
                text: String(Number(item.quantidade)),
                alignment: "center",
                fillColor: i % 2 === 0 ? ZEBRA : null,
              },
              {
                text: formatarMoeda(item.valor_unitario),
                alignment: "right",
                fillColor: i % 2 === 0 ? ZEBRA : null,
              },
              {
                text: formatarMoeda(item.total),
                alignment: "right",
                bold: true,
                fillColor: i % 2 === 0 ? ZEBRA : null,
              },
            ]),
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 14, 0, 0],
      },

      // ===== Subtotais à direita =====
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "42%",
            margin: [0, 10, 0, 0],
            table: {
              widths: ["55%", "45%"],
              body: [
                [
                  { text: "Peças", fontSize: 8, color: CINZA },
                  {
                    text: formatarMoeda(subtotalPecas),
                    alignment: "right",
                    fontSize: 8,
                  },
                ],
                [
                  { text: "Mão de obra", fontSize: 8, color: CINZA },
                  {
                    text: formatarMoeda(subtotalServicos),
                    alignment: "right",
                    fontSize: 8,
                  },
                ],
                [
                  { text: "Desconto", fontSize: 8, color: CINZA },
                  {
                    text: formatarMoeda(desconto),
                    alignment: "right",
                    fontSize: 8,
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingTop: () => 2,
              paddingBottom: () => 2,
            },
          },
        ],
      },

      // ===== Barra de TOTAL (destaque do modelo) =====
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              {
                text: "TOTAL GERAL",
                bold: true,
                fontSize: 11,
                color: "#ffffff",
              },
              {
                text: formatarMoeda(total),
                bold: true,
                fontSize: 14,
                color: "#ffffff",
                alignment: "right",
              },
            ],
          ],
        },
        layout: {
          fillColor: () => AZUL,
          hLineColor: () => AZUL,
          vLineColor: () => AZUL,
          paddingTop: () => 8,
          paddingBottom: () => 8,
          paddingLeft: () => 12,
          paddingRight: () => 12,
        },
        margin: [0, 8, 0, 0],
      },

      // ===== Observações (se houver) =====
      ...(orcamento.observacoes
        ? [
            {
              text: orcamento.observacoes,
              fontSize: 9,
              color: "#334155",
              margin: [0, 14, 0, 0],
            },
          ]
        : []),

      // ===== Rodapé do documento: aceite + assinatura =====
      {
        columns: [
          {
            stack: [
              {
                text: "Aprovo a execução dos serviços e peças acima, no valor total indicado.",
                fontSize: 8,
                color: "#334155",
              },
              {
                text:
                  orcamento.status === "aprovado"
                    ? `Aprovado • Protocolo ${protocolo || "—"}. Guarde este PDF como comprovante.`
                    : `Para aprovar, responda este PDF no WhatsApp da oficina informando o protocolo ${protocolo || "—"}.`,
                fontSize: 7,
                color: CINZA_CLARO,
                margin: [0, 3, 0, 0],
              },
              {
                text: "Obrigado pela preferência!",
                bold: true,
                fontSize: 9,
                color: PRETO,
                margin: [0, 10, 0, 0],
              },
            ],
          },
          {
            stack: [
              { text: "", margin: [0, 30, 0, 0] },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 200,
                    y2: 0,
                    lineWidth: 0.75,
                    lineColor: "#cbd5e1",
                  },
                ],
              },
              {
                text: `${oficina.nome} • ${cliente.nome || "cliente"}`,
                fontSize: 7,
                color: CINZA_CLARO,
                alignment: "center",
                margin: [0, 3, 0, 0],
              },
            ],
            alignment: "right",
          },
        ],
        columnGap: 30,
        margin: [0, 16, 0, 0],
      },
    ],

    // ===== Rodapé (todas as páginas) =====
    footer: (currentPage, pageCount) => ({
      margin: [36, 0],
      columns: [
        {
          text: `${oficina.nome}${oficina.cnpj ? ` • CNPJ: ${oficina.cnpj}` : ""} • Válido até ${validoAteTxt}`,
          fontSize: 7,
          color: CINZA_CLARO,
          alignment: "left",
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          fontSize: 7,
          color: CINZA_CLARO,
          alignment: "right",
        },
      ],
    }),
  };

  // Gera o documento e devolve o arquivo (Buffer)
  return pdfmake.createPdf(docDefinition).getBuffer();
}
