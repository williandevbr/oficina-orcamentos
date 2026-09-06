import pdfmake from "pdfmake";
import { fileURLToPath } from "url";
import path from "path";
import { calcularTotais, totalLinha } from "./calculo.js";

// ============================================================
// Geração do PDF de ORÇAMENTO (layout profissional)
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

// Cor do selo de status (fundo) — o cliente olha primeiro para isso
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

  // Peça e mão de obra em tabelas separadas (padrão que vende)
  const pecas = itensCalc.filter((i) => i.tipo === "peca");
  const servicos = itensCalc.filter((i) => i.tipo !== "peca");

  const linhasTabela = (lista) =>
    lista.map((item) => [
      { text: String(Number(item.quantidade)), alignment: "center" },
      { text: item.descricao },
      { text: formatarMoeda(item.valor_unitario), alignment: "right" },
      { text: formatarMoeda(item.total), alignment: "right", bold: true },
    ]);

  const tabelaItens = (titulo, lista) => [
    {
      text: titulo,
      fontSize: 9,
      bold: true,
      color: "#1e3a8a",
      margin: [0, 16, 0, 6],
    },
    {
      table: {
        headerRows: 1,
        widths: ["10%", "*", "22%", "22%"],
        body: [
          [
            { text: "Qtd", style: "cabecalhoTabela", alignment: "center" },
            { text: "Descrição", style: "cabecalhoTabela" },
            {
              text: "Valor unitário",
              style: "cabecalhoTabela",
              alignment: "right",
            },
            { text: "Total", style: "cabecalhoTabela", alignment: "right" },
          ],
          ...linhasTabela(lista),
        ],
      },
      layout: {
        fillColor: (rowIndex) =>
          rowIndex === 0 ? "#1e3a8a" : rowIndex % 2 === 0 ? "#f1f5f9" : null,
        hLineColor: () => "#cbd5e1",
        vLineColor: () => "#cbd5e1",
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
    },
  ];

  const estiloTabela = {
    // Cabeçalho da tabela de itens (letra branca sobre azul)
    cabecalhoTabela: { color: "#ffffff", bold: true, fontSize: 8 },
  };

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [36, 30, 36, 34],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      lineHeight: 1.35,
      color: "#0f172a",
    },
    content: [
      // ===== Faixa superior da oficina =====
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              {
                stack: [
                  { text: oficina.nome, bold: true, fontSize: 20, color: "#ffffff" },
                  ...(oficina.endereco
                    ? [{ text: oficina.endereco, fontSize: 8, color: "#bfdbfe" }]
                    : []),
                  ...(oficina.telefone
                    ? [{ text: oficina.telefone, fontSize: 8, color: "#bfdbfe" }]
                    : []),
                  ...(oficina.cnpj
                    ? [{ text: `CNPJ: ${oficina.cnpj}`, fontSize: 8, color: "#bfdbfe" }]
                    : []),
                ],
              },
              {
                stack: [
                  {
                    text: "ORÇAMENTO",
                    bold: true,
                    fontSize: 20,
                    color: "#ffffff",
                    alignment: "right",
                  },
                  {
                    text: `Nº ${numero}`,
                    fontSize: 12,
                    bold: true,
                    color: "#bfdbfe",
                    alignment: "right",
                    margin: [0, 2, 0, 0],
                  },
                ],
              },
            ],
          ],
        },
        layout: {
          fillColor: () => "#1e3a8a",
          hLineColor: () => "#1e3a8a",
          vLineColor: () => "#1e3a8a",
          paddingTop: () => 12,
          paddingBottom: () => 12,
          paddingLeft: () => 14,
          paddingRight: () => 14,
        },
        margin: [0, 0, 0, 0],
      },

      // ===== Faixa de datas + status =====
      {
        table: {
          widths: ["*", "*", "*", "auto"],
          body: [
            [
              { text: "Emissão", color: "#64748b", fontSize: 7 },
              { text: "Válido até", color: "#64748b", fontSize: 7 },
              { text: "Protocolo", color: "#64748b", fontSize: 7 },
              { text: "Status", color: "#64748b", fontSize: 7, alignment: "center" },
            ],
            [
              { text: dataEmissao, bold: true, fontSize: 9 },
              { text: validoAteTxt, bold: true, fontSize: 9 },
              { text: protocolo || "—", bold: true, fontSize: 9 },
              {
                table: {
                  widths: ["auto"],
                  body: [
                    [
                      {
                        text: (rotuloStatus[orcamento.status] || orcamento.status || "").toUpperCase(),
                        fontSize: 8,
                        bold: true,
                        color: "#ffffff",
                        alignment: "center",
                      },
                    ],
                  ],
                },
                layout: {
                  fillColor: () => corSelo,
                  hLineColor: () => corSelo,
                  vLineColor: () => corSelo,
                  paddingTop: () => 3,
                  paddingBottom: () => 3,
                  paddingLeft: () => 10,
                  paddingRight: () => 10,
                },
                alignment: "center",
              },
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 10, 0, 4],
      },

      // ===== Cartão do cliente + veículo =====
      {
        table: {
          widths: ["*", "*", "*", "*"],
          body: [
            [
              { text: "CLIENTE", color: "#64748b", fontSize: 7, bold: true },
              { text: "TELEFONE", color: "#64748b", fontSize: 7, bold: true },
              { text: "VEÍCULO", color: "#64748b", fontSize: 7, bold: true },
              { text: "PLACA", color: "#64748b", fontSize: 7, bold: true },
            ],
            [
              { text: cliente.nome || "—", bold: true, fontSize: 10 },
              { text: cliente.telefone || "—", fontSize: 10 },
              { text: cliente.veiculo || "—", fontSize: 10 },
              { text: cliente.placa || "—", fontSize: 10, bold: true },
            ],
          ],
        },
        layout: {
          fillColor: () => "#f1f5f9",
          hLineColor: () => "#e2e8f0",
          vLineColor: () => "#e2e8f0",
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 10,
          paddingRight: () => 10,
        },
        margin: [0, 8, 0, 0],
      },

      // ===== Peças e serviços (tabelas separadas) =====
      ...(pecas.length ? tabelaItens("PEÇAS", pecas) : []),
      ...(servicos.length ? tabelaItens("MÃO DE OBRA (SERVIÇOS)", servicos) : []),

      // ===== Totais + condições lado a lado =====
      {
        columns: [
          {
            width: "50%",
            margin: [0, 14, 10, 0],
            stack: [
              {
                text: "CONDIÇÕES",
                fontSize: 8,
                bold: true,
                color: "#1e3a8a",
                margin: [0, 0, 0, 4],
              },
              {
                text: `Validade: até ${validoAteTxt} (${validadeDias} dias).`,
                fontSize: 8,
                color: "#334155",
                margin: [0, 0, 0, 2],
              },
              {
                text: "Garantia: 90 dias para serviços e peças aplicadas.",
                fontSize: 8,
                color: "#334155",
              },
            ],
          },
          {
            width: "50%",
            margin: [0, 14, 0, 0],
            table: {
              widths: ["50%", "50%"],
              body: [
                [
                  { text: "Subtotal", color: "#64748b", padding: [0, 3] },
                  {
                    text: formatarMoeda(subtotal),
                    alignment: "right",
                    padding: [0, 3],
                  },
                ],
                [
                  { text: "Desconto", color: "#64748b", padding: [0, 3] },
                  {
                    text: formatarMoeda(desconto),
                    alignment: "right",
                    padding: [0, 3],
                  },
                ],
                [
                  {
                    text: "TOTAL",
                    bold: true,
                    color: "#ffffff",
                    fontSize: 12,
                    padding: [6, 6],
                  },
                  {
                    text: formatarMoeda(total),
                    bold: true,
                    color: "#ffffff",
                    fontSize: 15,
                    alignment: "right",
                    padding: [6, 6],
                  },
                ],
              ],
            },
            layout: {
              fillColor: (rowIndex) => (rowIndex === 2 ? "#1e3a8a" : null),
              hLineColor: () => "#e2e8f0",
              vLineColor: () => "#e2e8f0",
            },
          },
        ],
      },

      // ===== Observações (se houver) =====
      ...(orcamento.observacoes
        ? [
            {
              text: "OBSERVAÇÕES",
              fontSize: 8,
              bold: true,
              color: "#1e3a8a",
              margin: [0, 14, 0, 4],
            },
            { text: orcamento.observacoes, fontSize: 9, color: "#334155" },
          ]
        : []),

      // ===== Declaração de aceite =====
      {
        text: "DECLARAÇÃO",
        fontSize: 8,
        bold: true,
        color: "#1e3a8a",
        margin: [0, 14, 0, 4],
      },
      {
        text: "Aprovo a execução dos serviços e a aplicação das peças descritas neste orçamento, no valor total acima.",
        fontSize: 8,
        color: "#334155",
      },

      // ===== Mensagem final =====
      {
        text: "Obrigado pela preferência!",
        alignment: "center",
        fontSize: 9,
        color: "#94a3b8",
        margin: [0, 20, 0, 0],
      },

      // ===== Aceite digital (prova de envio/aprovação) =====
      {
        text: "ACEITE DIGITAL",
        fontSize: 8,
        bold: true,
        color: "#1e3a8a",
        margin: [0, 16, 0, 4],
      },
      {
        text:
          orcamento.status === "aprovado"
            ? `Aprovado por ${cliente.nome || "cliente"} • Protocolo ${protocolo || "—"}. Guarde este PDF como comprovante.`
            : `Para aprovar, responda este PDF no WhatsApp da oficina (${oficina.telefone || "ver telefone acima"}) informando o protocolo ${protocolo || "—"}.`,
        fontSize: 8,
        color: "#334155",
      },

      // ===== Assinaturas (vale impresso ou foto do assinado) =====
      {
        columns: [
          {
            stack: [
              { text: "", margin: [0, 18, 0, 0] },
              {
                canvas: [
                  { type: "line", x1: 0, y1: 0, x2: 230, y2: 0, lineWidth: 1, lineColor: "#94a3b8" },
                ],
              },
              { text: "Assinatura do cliente", fontSize: 7, color: "#64748b", alignment: "center", margin: [0, 3, 0, 0] },
              { text: cliente.nome || "", fontSize: 8, alignment: "center" },
            ],
          },
          {
            stack: [
              { text: "", margin: [0, 18, 0, 0] },
              {
                canvas: [
                  { type: "line", x1: 0, y1: 0, x2: 230, y2: 0, lineWidth: 1, lineColor: "#94a3b8" },
                ],
              },
              { text: "Assinatura da oficina", fontSize: 7, color: "#64748b", alignment: "center", margin: [0, 3, 0, 0] },
              { text: oficina.nome, fontSize: 8, alignment: "center" },
            ],
          },
        ],
        columnGap: 40,
        margin: [0, 6, 0, 0],
      },
    ],

    styles: estiloTabela,

    // ===== Rodapé (todas as páginas) =====
    footer: (currentPage, pageCount) => ({
      margin: [36, 0],
      columns: [
        {
          text: `${oficina.nome}${oficina.cnpj ? ` • CNPJ: ${oficina.cnpj}` : ""} • Documento sem valor de cobrança`,
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
