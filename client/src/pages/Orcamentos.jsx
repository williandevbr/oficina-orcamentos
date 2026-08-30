import { FileText, Plus } from "lucide-react";

// Página de Orçamentos (temporária).
// Vai permitir criar orçamentos e gerar o PDF na próxima etapa.
export default function Orcamentos() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orçamentos</h2>
          <p className="text-slate-500">Criação e envio de orçamentos</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Novo orçamento
        </button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
        <FileText className="h-12 w-12 text-blue-400" />
        <h3 className="mt-4 text-lg font-semibold text-slate-800">
          Nenhum orçamento ainda
        </h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Aqui você vai criar o orçamento, calcular o total e gerar o PDF para
          enviar ao cliente.
        </p>
      </div>
    </div>
  );
}
