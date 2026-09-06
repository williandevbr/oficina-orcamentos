import { useEffect, useState } from "react";
import { X, Plus, Trash2, Car } from "lucide-react";
import type { Veiculo } from "../types";

// ============================================================
// Modal de VEÍCULOS do cliente (1 pessoa -> N veículos)
// ============================================================
// Lista os veículos já cadastrados, adiciona novos e remove.
// Recebe do pai:
//   clienteNome -> nome para o título
//   veiculos    -> lista já filtrada deste cliente
//   salvando    -> trava os botões durante a requisição
//   erro        -> mensagem de erro do servidor (ou "")
//   onAdicionar({ veiculo, placa }) -> cadastra
//   onExcluir(id)                   -> remove
//   onFechar                        -> fecha
// ============================================================

export interface NovoVeiculo {
  veiculo: string;
  placa: string;
}

export default function VeiculosModal({
  clienteNome,
  veiculos = [],
  salvando = false,
  erro = "",
  onAdicionar,
  onExcluir,
  onFechar,
}: {
  clienteNome: string;
  veiculos?: Veiculo[];
  salvando?: boolean;
  erro?: string;
  onAdicionar: (dados: NovoVeiculo) => void;
  onExcluir: (id: string) => void;
  onFechar: () => void;
}) {
  const [veiculo, setVeiculo] = useState("");
  const [placa, setPlaca] = useState("");
  const [erroLocal, setErroLocal] = useState("");

  // Fecha com Escape
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  function aoAdicionar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroLocal("");
    if (veiculo.trim().length < 2) {
      setErroLocal("Dê um nome ao veículo (ex.: Honda CG 160).");
      return;
    }
    onAdicionar({ veiculo: veiculo.trim(), placa: placa.trim() });
    setVeiculo("");
    setPlaca("");
  }

  const erroVisivel = erroLocal || erro;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Veículos de ${clienteNome}`}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Car className="h-5 w-5 text-blue-600" />
            Veículos de {clienteNome}
          </h3>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista atual */}
        {veiculos.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Nenhum veículo ainda. Cadastre a moto, o carro, o que ele tiver.
          </p>
        ) : (
          <ul className="mb-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {veiculos.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-2 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-800">
                    {v.veiculo}
                  </div>
                  {v.placa && (
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      {v.placa}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onExcluir(v.id)}
                  disabled={salvando}
                  title="Remover veículo"
                  aria-label={`Remover ${v.veiculo}`}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Adicionar novo */}
        <form onSubmit={aoAdicionar} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={veiculo}
            onChange={(e) => setVeiculo(e.target.value)}
            placeholder="Veículo (ex.: Honda CG 160)"
            aria-label="Nome do veículo"
            maxLength={80}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="text"
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            placeholder="Placa"
            aria-label="Placa do veículo"
            maxLength={10}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:w-28"
          />
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </form>

        {erroVisivel && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {erroVisivel}
          </div>
        )}
      </div>
    </div>
  );
}
