// ============================================================
// Fachada TIPADA do pdfmake (a lib não traz tipos próprios)
// ============================================================
// O import cru não tem declaração e o TS não aceita `declare
// module` para ele — então o único ponto sem checagem fica aqui,
// isolado. Todo o resto do código usa esta fachada com tipos.

export interface FontesPdf {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

export interface PdfGerado {
  getBuffer(): Promise<Uint8Array>;
}

export interface PdfMakeEstatico {
  addFonts(fontes: Record<string, FontesPdf>): void;
  setLocalAccessPolicy(politica: (caminho: string) => boolean): void;
  createPdf(definicao: unknown): PdfGerado;
}

// @ts-expect-error: pdfmake não publica tipos (verificado na v0.3)
import pdfmakeCru from "pdfmake";

const pdfmake = pdfmakeCru as unknown as PdfMakeEstatico;

export default pdfmake;
