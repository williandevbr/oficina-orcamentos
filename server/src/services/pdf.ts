import {
  renderizarPdf,
  type OrcamentoPdf,
  type LojaPdf,
} from "./pdfDocumento.ts";

// ============================================================
// Geração do PDF de ORÇAMENTO (@react-pdf/renderer)
// ============================================================
// Este arquivo é a porta de entrada (rotas e testes usam daqui).
// O desenho do documento mora em pdfDocumento.ts.
// ============================================================

export type { OrcamentoPdf, LojaPdf };

// "Molde" do documento: recebe o orçamento completo (com cliente e itens)
// e opcionalmente os dados da loja. Devolve o arquivo (Buffer).
export async function gerarPdfOrcamento(
  orcamento: OrcamentoPdf,
  loja: LojaPdf | null = null,
): Promise<Buffer> {
  return renderizarPdf(orcamento, loja);
}
