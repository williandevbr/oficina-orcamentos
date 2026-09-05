import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

// Diálogo de confirmação customizado (substitui o confirm() nativo,
// que é feio e bloqueia o navegador).
export default function ConfirmDialog({
  aberto,
  titulo = "Excluir?",
  mensagem = "Esta ação não pode ser desfeita.",
  confirmarLabel = "Excluir",
  cancelando = false,
  aoConfirmar,
  aoCancelar,
}) {
  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e) {
      if (e.key === "Escape") aoCancelar?.();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, aoCancelar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={aoCancelar}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{titulo}</h3>
        </div>
        <p className="mt-3 text-sm text-slate-500">{mensagem}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={aoCancelar}
            disabled={cancelando}
            autoFocus
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={cancelando}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {cancelando ? "Excluindo..." : confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
