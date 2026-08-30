import pdfmake from "pdfmake";
import { fileURLToPath } from "url";
import path from "path";

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
};

// "Molde" do documento: recebe o orçamento completo (com cliente e itens)
export async function gerarPdfOrcamento(orcamento) {
  const cliente = orcamento.clientes || {};
  const itens = orcamento.orcamento_itens || [];
  const numero = String(orcamento.numero).padStart(4, "0");
  const dataEmissao = new Date(
    orcamento.created_at || Date.now(),
  ).toLocaleDateString("pt-BR");

  // Recalcula os totais com a mesma regra do sistema
  const subtotal = itens.reduce(
    (soma, item) =>
      soma +
      (Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0),
    0,
  );
  const desconto = Number(orcamento.desconto) || 0;
  const total = Math.max(0, subtotal - desconto);

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
      // ===== Cabeçalho do documento =====
      {
        columns: [
          {
            stack: [
              {
                text: oficina.nome,
                bold: true,
                fontSize: 20,
                color: "#1e3a8a",
              },
              {
                text: "Orçamentos para oficinas",
                fontSize: 9,
                color: "#64748b",
                margin: [0, 2, 0, 0],
              },
              ...(oficina.telefone
                ? [{ text: oficina.telefone, fontSize: 8, color: "#64748b" }]
                : []),
            ],
          },
          {
            stack: [
              {
                text: "ORÇAMENTO",
                bold: true,
                fontSize: 18,
                color: "#2563eb",
                alignment: "right",
              },
              {
                text: `Número: ${numero}`,
                fontSize: 10,
                alignment: "right",
                margin: [0, 3, 0, 0],
              },
              {
                text: `Emissão: ${dataEmissao}`,
                fontSize: 8,
                color: "#64748b",
                alignment: "right",
              },
              {
                text: `Status: ${rotuloStatus[orcamento.status] || orcamento.status}`,
                fontSize: 8,
                color: "#64748b",
                alignment: "right",
              },
            ],
          },
        ],
        columnGap: 20,
      },

      // Linha divisória azul
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 523,
            y2: 0,
            lineWidth: 2,
            lineColor: "#2563eb",
          },
        ],
        margin: [0, 10, 0, 14],
      },

      // ===== Dados do cliente =====
      {
        text: "DADOS DO CLIENTE",
        fontSize: 8,
        bold: true,
        color: "#2563eb",
        letterSpacing: 1,
        margin: [0, 0, 0, 6],
      },
      {
        table: {
          widths: ["30%", "25%", "25%", "20%"],
          body: [
            [
              { text: "Cliente", color: "#64748b", fontSize: 7 },
              { text: "Telefone", color: "#64748b", fontSize: 7 },
              { text: "Veículo", color: "#64748b", fontSize: 7 },
              { text: "Placa", color: "#64748b", fontSize: 7 },
            ],
            [
              { text: cliente.nome || "—", bold: true },
              { text: cliente.telefone || "—" },
              { text: cliente.veiculo || "—" },
              { text: cliente.placa || "—" },
            ],
          ],
        },
        layout: "lightHorizontalLines",
      },

      // ===== Itens do orçamento =====
      {
        text: "ITENS DO ORÇAMENTO",
        fontSize: 8,
        bold: true,
        color: "#2563eb",
        letterSpacing: 1,
        margin: [0, 18, 0, 6],
      },
      {
        table: {
          headerRows: 1,
          widths: ["8%", "*", "14%", "18%", "18%"],
          body: [
            [
              { text: "Qtd", style: "cabecalhoTabela", alignment: "center" },
              { text: "Descrição", style: "cabecalhoTabela" },
              { text: "Tipo", style: "cabecalhoTabela" },
              {
                text: "Valor unitário",
                style: "cabecalhoTabela",
                alignment: "right",
              },
              { text: "Total", style: "cabecalhoTabela", alignment: "right" },
            ],
            ...itens.map((item) => [
              { text: String(Number(item.quantidade)), alignment: "center" },
              { text: item.descricao },
              { text: item.tipo === "peca" ? "Peça" : "Serviço" },
              { text: formatarMoeda(item.valor_unitario), alignment: "right" },
              {
                text: formatarMoeda(item.total),
                alignment: "right",
                bold: true,
              },
            ]),
          ],
        },
        layout: {
          fillColor: (rowIndex, node) =>
            rowIndex === 0 ? "#2563eb" : rowIndex % 2 === 0 ? "#f8fafc" : null,
          hLineColor: () => "#e2e8f0",
          vLineColor: () => "#e2e8f0",
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },

      // ===== Resumo dos valores =====
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "45%",
            margin: [0, 14, 0, 0],
            table: {
              widths: ["55%", "45%"],
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
                    color: "#1e3a8a",
                    fontSize: 12,
                    padding: [0, 6],
                  },
                  {
                    text: formatarMoeda(total),
                    bold: true,
                    color: "#1e3a8a",
                    fontSize: 15,
                    alignment: "right",
                    padding: [0, 6],
                  },
                ],
              ],
            },
            layout: "noBorders",
          },
        ],
      },

      // ===== Validade =====
      {
        text: `Este orçamento tem validade de ${orcamento.validade_dias || 7} dias a partir da data de emissão.`,
        fontSize: 8,
        color: "#64748b",
        margin: [0, 18, 0, 0],
      },

      // ===== Observações (se houver) =====
      ...(orcamento.observacoes
        ? [
            {
              text: "OBSERVAÇÕES",
              fontSize: 8,
              bold: true,
              color: "#2563eb",
              letterSpacing: 1,
              margin: [0, 12, 0, 4],
            },
            { text: orcamento.observacoes, fontSize: 9, color: "#334155" },
          ]
        : []),

      // ===== Mensagem final =====
      {
        text: "Obrigado pela preferência!",
        alignment: "center",
        fontSize: 9,
        color: "#94a3b8",
        margin: [0, 24, 0, 0],
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
