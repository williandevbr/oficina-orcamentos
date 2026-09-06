import { useEffect } from "react";
import { X } from "lucide-react";

// ============================================================
// Formulário de item do catálogo (modal)
// ============================================================

export interface CatalogoFormValores {
  descricao?: string;
  tipo?: string;
  valor_unitario?: number | string;
}

export default function CatalogoForm({
  form,
  editandoId,
  erro,
  salvando = false,
  aoMudar,
  aoSalvar,
  aoFechar,
}: {
  form: CatalogoFormValores;
  editandoId: string | null;
  erro?: string;
  salvando?: boolean;
  aoMudar: (campo: string, valor: string) => void;
  aoSalvar: (e: React.FormEvent<HTMLFormElement>) => void;
  aoFechar: () => void;
}) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editandoId ? "Editar item" : "Novo item"}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {editandoId ? "Editar item" : "Novo item do catálogo"}
          </h3>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={aoSalvar} className="space-y-4">
          <div>
            <label
              htmlFor="catalogo-descricao"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Descrição *
            </label>
            <input
              id="catalogo-descricao"
              name="descricao"
              type="text"
              required
              minLength={2}
              maxLength={140}
              value={form.descricao || ""}
              onChange={(e) => aoMudar("descricao", e.target.value)}
              placeholder="Ex: Pastilha de freio"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="catalogo-tipo"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Tipo
              </label>
              <select
                id="catalogo-tipo"
                name="tipo"
                value={form.tipo || "peca"}
                onChange={(e) => aoMudar("tipo", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="peca">Peça</option>
                <option value="servico">Serviço</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="catalogo-valor"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Valor (R$) *
              </label>
              <input
                id="catalogo-valor"
                name="valor_unitario"
                type="number"
                required
                min="0"
                step="any"
                value={form.valor_unitario ?? ""}
                onChange={(e) => aoMudar("valor_unitario", e.target.value)}
                placeholder="0,00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {erro}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={aoFechar}
              disabled={salvando}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
