import { X } from "lucide-react";

// ============================================================
// Formulário de cliente (aparece como janelinha por cima da tela)
// ============================================================
// Recebe do pai:
//   form     -> os valores digitados
//   aoMudar  -> função que atualiza um campo
//   aoSalvar -> função chamada ao clicar em Salvar
//   aoFechar -> função chamada ao fechar
// ============================================================

export default function ClienteForm({
  form,
  editandoId,
  erro,
  aoMudar,
  aoSalvar,
  aoFechar,
}) {
  // Lista de campos do formulário (nome do campo, rótulo, tipo HTML)
  const campos = [
    { nome: "nome", label: "Nome completo *", tipo: "text" },
    { nome: "telefone", label: "Telefone / WhatsApp", tipo: "text" },
    { nome: "email", label: "E-mail", tipo: "email" },
    { nome: "documento", label: "CPF / CNPJ", tipo: "text" },
    { nome: "endereco", label: "Endereço", tipo: "text" },
    { nome: "veiculo", label: "Veículo", tipo: "text" },
    { nome: "placa", label: "Placa", tipo: "text" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        {/* Cabeçalho do modal */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {editandoId ? "Editar cliente" : "Novo cliente"}
          </h3>
          <button
            onClick={aoFechar}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={aoSalvar} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campos.map((campo) => (
              <div key={campo.nome}>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {campo.label}
                </label>
                <input
                  type={campo.tipo}
                  value={form[campo.nome] || ""}
                  onChange={(e) => aoMudar(campo.nome, e.target.value)}
                  required={campo.nome === "nome"}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            ))}

            {/* Observações (ocupa a linha toda) */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Observações
              </label>
              <textarea
                value={form.observacoes || ""}
                onChange={(e) => aoMudar("observacoes", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
            >
              Salvar cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
