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

  // Subtotais por grupo (como nos modelos profissionais)
  const subtotalPecas = Math.round(
    pecas.reduce((s, i) => s + i.total, 0) * 100,
  ) / 100;
  const subtotalServicos = Math.round(
    servicos.reduce((s, i) => s + i.total, 0) * 100,
  ) / 100;

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
      fontSize: 8,
      bold: true,
      color: "#64748b",
      margin: [0, 18, 0, 2],
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
        hLineWidth: (i, node) =>
          i === 0 || i === node.table.body.length ? 1 : 0.5,
        hLineColor: (i) => (i === 0 ? "#1e3a8a" : "#e2e8f0"),
        vLineWidth: () => 0,
        paddingTop: () => 7,
        paddingBottom: () => 7,
        paddingLeft: () => 4,
        paddingRight: () => 4,
      },
    },
  ];

  const estiloTabela = {
    // Cabeçalho das tabelas: versalete cinza, sem caixa colorida
    cabecalhoTabela: { color: "#64748b", bold: true, fontSize: 7 },
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
      // ===== Topo limpo: oficina + documento =====
      {
        columns: [
          {
            stack: [
              { text: oficina.nome, bold: true, fontSize: 22, color: "#1e3a8a" },
              ...[oficina.endereco, oficina.telefone, oficina.cnpj ? `CNPJ: ${oficina.cnpj}` : ""]
                .filter(Boolean)
                .map((linha) => ({ text: linha, fontSize: 8, color: "#64748b" })),
            ],
          },
          {
            stack: [
              {
                text: "ORÇAMENTO",
                bold: true,
                fontSize: 13,
                color: "#0f172a",
                alignment: "right",
              },
              {
                text: `Nº ${numero}`,
                fontSize: 22,
                bold: true,
                color: "#1e3a8a",
                alignment: "right",
              },
              {
                text: (rotuloStatus[orcamento.status] || orcamento.status || "").toUpperCase(),
                fontSize: 8,
                bold: true,
                color: corSelo,
                alignment: "right",
                margin: [0, 2, 0, 0],
              },
            ],
          },
        ],
        columnGap: 20,
      },

      // Linha fina de respiro
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 523,
            y2: 0,
            lineWidth: 1,
            lineColor: "#e2e8f0",
          },
        ],
        margin: [0, 12, 0, 12],
      },

      // ===== Metadados em uma linha =====
      {
        columns: [
          { text: `Emitido em ${dataEmissao}`, fontSize: 8, color: "#64748b" },
          {
            text: `Válido até ${validoAteTxt}`,
            fontSize: 8,
            color: "#64748b",
            alignment: "center",
          },
          {
            text: `Protocolo ${protocolo || "—"}`,
            fontSize: 8,
            color: "#64748b",
            alignment: "right",
          },
        ],
      },

      // ===== Cliente (sem caixa) =====
      {
        text: "CLIENTE",
        fontSize: 7,
        bold: true,
        color: "#94a3b8",
        margin: [0, 16, 0, 2],
      },
      {
        text: cliente.nome || "—",
        fontSize: 12,
        bold: true,
        color: "#0f172a",
      },
      {
        text: [cliente.veiculo, cliente.placa, cliente.telefone]
          .filter(Boolean)
          .join("  •  "),
        fontSize: 8,
        color: "#64748b",
        margin: [0, 2, 0, 0],
      },

      // ===== Peças e serviços (tabelas leves, separadas) =====
      ...(pecas.length ? tabelaItens("PEÇAS", pecas) : []),
      ...(servicos.length ? tabelaItens("SERVIÇOS", servicos) : []),

      // ===== Totais (bloco respirado, total em destaque) =====
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "46%",
            margin: [0, 16, 0, 0],
            table: {
              widths: ["50%", "50%"],
              body: [
                [
                  { text: "Peças", color: "#64748b", fontSize: 8, padding: [0, 2] },
                  {
                    text: formatarMoeda(subtotalPecas),
                    alignment: "right",
                    fontSize: 8,
                    padding: [0, 2],
                  },
                ],
                [
                  { text: "Mão de obra", color: "#64748b", fontSize: 8, padding: [0, 2] },
                  {
                    text: formatarMoeda(subtotalServicos),
                    alignment: "right",
                    fontSize: 8,
                    padding: [0, 2],
                  },
                ],
                [
                  { text: "Desconto", color: "#64748b", fontSize: 8, padding: [0, 2] },
                  {
                    text: formatarMoeda(desconto),
                    alignment: "right",
                    fontSize: 8,
                    padding: [0, 2],
                  },
                ],
                [
                  {
                    text: "TOTAL",
                    bold: true,
                    color: "#1e3a8a",
                    fontSize: 11,
                    padding: [0, 8, 0, 0],
                  },
                  {
                    text: formatarMoeda(total),
                    bold: true,
                    color: "#1e3a8a",
                    fontSize: 16,
                    alignment: "right",
                    padding: [0, 8, 0, 0],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: (i, node) =>
                i === node.table.body.length - 1 ? 1 : 0,
              hLineColor: () => "#1e3a8a",
              vLineWidth: () => 0,
            },
          },
        ],
      },

      // ===== Condições em uma linha =====
      {
        text: `Validade de ${validadeDias} dias  •  Garantia de 90 dias para serviços e peças aplicadas.`,
        fontSize: 7,
        color: "#94a3b8",
        margin: [0, 14, 0, 0],
      },

      // ===== Observações (se houver, sem título gritado) =====
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

      // ===== Declaração de aceite =====
      {
        text: "Aprovo a execução dos serviços e peças acima, no valor total indicado.",
        fontSize: 8,
        color: "#334155",
        margin: [0, 16, 0, 0],
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

      // ===== Assinaturas =====
      {
        columns: [
          {
            stack: [
              { text: "", margin: [0, 22, 0, 0] },
              {
                canvas: [
                  { type: "line", x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 0.75, lineColor: "#cbd5e1" },
                ],
              },
              { text: `Cliente${cliente.nome ? ` — ${cliente.nome}` : ""}`, fontSize: 7, color: "#94a3b8", alignment: "center", margin: [0, 3, 0, 0] },
            ],
          },
          {
            stack: [
              { text: "", margin: [0, 22, 0, 0] },
              {
                canvas: [
                  { type: "line", x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 0.75, lineColor: "#cbd5e1" },
                ],
              },
              { text: `Oficina — ${oficina.nome}`, fontSize: 7, color: "#94a3b8", alignment: "center", margin: [0, 3, 0, 0] },
            ],
          },
        ],
        columnGap: 60,
        margin: [0, 4, 0, 0],
      },

      // ===== Agradecimento =====
      {
        text: "Obrigado pela preferência!",
        alignment: "center",
        fontSize: 8,
        color: "#cbd5e1",
        margin: [0, 20, 0, 0],
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
