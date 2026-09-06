// ============================================================
// Erros de rede (para as telas mostrarem mensagens amigáveis)
// ============================================================
// O fetch do navegador falha com DOMException (AbortError quando
// a tela desmonta, TimeoutError quando o servidor dorme).
// Esta função traduz: devolve null se foi só cancelamento
// (a tela deve ignorar) ou a mensagem para exibir.
// ============================================================

export function mensagemErroRede(e: unknown, padrao: string): string | null {
  if (e instanceof DOMException && e.name === "AbortError") return null;
  if (e instanceof DOMException && e.name === "TimeoutError") {
    return "O servidor demorou a responder. Tente novamente.";
  }
  if (e instanceof DOMException || e instanceof Error) {
    return e.message || padrao;
  }
  return padrao;
}
