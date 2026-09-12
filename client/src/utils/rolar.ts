// ============================================================
// Rolagem até a seção com JS (não depende só do href "#").
// ============================================================
// O menu da landing usa isso para os links sempre funcionarem,
// mesmo com o React Router no meio do caminho.
// ============================================================

export function irPara(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}
