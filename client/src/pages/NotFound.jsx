import { Link, useNavigate } from "react-router-dom";
import { FileWarning } from "lucide-react";

// Página 404 — exibida quando a rota não existe.
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <FileWarning className="h-7 w-7 text-blue-600" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Página não encontrada
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          O endereço que você tentou abrir não existe ou foi movido.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
