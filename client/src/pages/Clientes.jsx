import { Users, Plus } from "lucide-react";

// Página de Clientes (temporária).
// Vai mostrar a lista de clientes cadastrados na próxima etapa.
export default function Clientes() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clientes</h2>
          <p className="text-slate-500">Cadastro de clientes da oficina</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Novo cliente
        </button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
        <Users className="h-12 w-12 text-blue-400" />
        <h3 className="mt-4 text-lg font-semibold text-slate-800">
          Nenhum cliente ainda
        </h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Nesta tela você vai poder cadastrar clientes (nome, telefone, veículo)
          e consultar o histórico de cada um.
        </p>
      </div>
    </div>
  );
}
