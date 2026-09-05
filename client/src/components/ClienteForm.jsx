import { useEffect } from "react";
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

const AUTOCOMPLETE = {
  nome: "name",
  telefone: "tel",
  email: "email",
  documento: undefined,
  endereco: "street-address",
  veiculo: undefined,
  placa: undefined,
};

export default function ClienteForm({
  form,
  editandoId,
  erro,
  salvando = false,
  aoMudar,
  aoSalvar,
  aoFechar,
}) {
  // Fecha com Escape (igual ao ConfirmDialog)
  useEffect(() => {
    function aoTeclar(e) {
      if (e.key === "Escape") aoFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);
  // Lista de campos do formulário (nome do campo, rótulo, tipo HTML)
  const campos = [
    { nome: "nome", label: "Nome completo *", tipo: "text" },
    {
      nome: "telefone",
      label: "Telefone / WhatsApp",
      tipo: "text",
      placeholder: "(11) 98765-4321",
      inputMode: "tel",
      maxLength: 15,
    },
    { nome: "email", label: "E-mail", tipo: "email" },
    { nome: "documento", label: "CPF / CNPJ", tipo: "text" },
    { nome: "endereco", label: "Endereço", tipo: "text" },
    { nome: "veiculo", label: "Veículo", tipo: "text" },
    {
      nome: "placa",
      label: "Placa",
      tipo: "text",
      placeholder: "ABC1D23",
      maxLength: 8,
      maiuscula: true,
    },
  ];

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
        aria-label={editandoId ? "Editar cliente" : "Novo cliente"}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Cabeçalho do modal */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {editandoId ? "Editar cliente" : "Novo cliente"}
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

        {/* Formulário */}
        <form onSubmit={aoSalvar} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campos.map((campo) => (
              <div key={campo.nome}>
                <label
                  htmlFor={`cliente-${campo.nome}`}
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  {campo.label}
                </label>
                <input
                  id={`cliente-${campo.nome}`}
                  name={campo.nome}
                  type={campo.tipo}
                  value={form[campo.nome] || ""}
                  onChange={(e) => aoMudar(campo.nome, e.target.value)}
                  required={campo.nome === "nome"}
                  placeholder={campo.placeholder}
                  inputMode={campo.inputMode}
                  maxLength={campo.maxLength}
                  autoComplete={AUTOCOMPLETE[campo.nome]}
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${campo.maiuscula ? "uppercase" : ""}`}
                />
              </div>
            ))}

            {/* Observações (ocupa a linha toda) */}
            <div className="sm:col-span-2">
              <label
                htmlFor="cliente-observacoes"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Observações
              </label>
              <textarea
                id="cliente-observacoes"
                name="observacoes"
                value={form.observacoes || ""}
                onChange={(e) => aoMudar("observacoes", e.target.value)}
                rows={3}
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

          {/* Botões */}
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
              {salvando ? "Salvando..." : "Salvar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
