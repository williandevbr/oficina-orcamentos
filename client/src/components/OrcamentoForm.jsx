import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { formatarMoeda } from "../utils/format.js";

// ============================================================
// Formulário de ORÇAMENTO (modal)
// ============================================================
// Permite:
//   - escolher o cliente
//   - adicionar/remover itens (serviços e peças)
//   - ver o total calculado AO VIVO (subtotal - desconto)
//   - escolher o status do orçamento
// Ao salvar, chama onSalvar(payload) com tudo montado.
// ============================================================

const statusOpcoes = [
  { valor: "rascunho", rotulo: "Rascunho" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "aprovado", rotulo: "Aprovado" },
  { valor: "recusado", rotulo: "Recusado" },
];

const itemVazio = {
  descricao: "",
  tipo: "servico",
  quantidade: 1,
  valor_unitario: "",
};

export default function OrcamentoForm({
  clientes,
  dadosIniciais, // null para novo, ou o orçamento completo para edição
  erro,
  onSalvar,
  onFechar,
}) {
  // Estado do formulário
  const [form, setForm] = useState({
    cliente_id: dadosIniciais?.cliente_id || "",
    status: dadosIniciais?.status || "rascunho",
    desconto: dadosIniciais?.desconto || 0,
    observacoes: dadosIniciais?.observacoes || "",
    validade_dias: dadosIniciais?.validade_dias || 7,
  });

  // Estado dos itens
  const [itens, setItens] = useState(
    dadosIniciais?.orcamento_itens?.length
      ? dadosIniciais.orcamento_itens
      : [itemVazio],
  );

  function aoMudar(campo, valor) {
    setForm({ ...form, [campo]: valor });
  }

  function adicionarItem() {
    setItens([...itens, { ...itemVazio }]);
  }

  function removerItem(indice) {
    setItens(itens.filter((_, i) => i !== indice));
  }

  function atualizarItem(indice, campo, valor) {
    const novos = itens.map((item, i) =>
      i === indice ? { ...item, [campo]: valor } : item,
    );
    setItens(novos);
  }

  // Cálculo ao vivo (mesma regra do servidor)
  const subtotal = itens.reduce(
    (soma, item) =>
      soma +
      (Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0),
    0,
  );
  const descontoNum = Number(form.desconto) || 0;
  const total = Math.max(0, subtotal - descontoNum);

  function aoSubmeter(e) {
    e.preventDefault();
    onSalvar({
      cliente_id: form.cliente_id,
      status: form.status,
      desconto: descontoNum,
      observacoes: form.observacoes,
      validade_dias: Number(form.validade_dias) || 7,
      itens: itens.map((item) => ({
        descricao: item.descricao,
        tipo: item.tipo,
        quantidade: Number(item.quantidade) || 0,
        valor_unitario: Number(item.valor_unitario) || 0,
      })),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {dadosIniciais
              ? `Editar orçamento nº ${dadosIniciais.numero}`
              : "Novo orçamento"}
          </h3>
          <button
            onClick={onFechar}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={aoSubmeter} className="space-y-6">
          {/* Cliente + status + validade */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Cliente *
              </label>
              <select
                value={form.cliente_id}
                onChange={(e) => aoMudar("cliente_id", e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Selecione o cliente...</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}{" "}
                    {cliente.veiculo ? `- ${cliente.veiculo}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => aoMudar("status", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {statusOpcoes.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Validade (dias)
              </label>
              <input
                type="number"
                min="1"
                value={form.validade_dias}
                onChange={(e) => aoMudar("validade_dias", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Itens do orçamento */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Serviços e peças *
              </label>
              <button
                type="button"
                onClick={adicionarItem}
                className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </button>
            </div>

            <div className="space-y-3">
              {itens.map((item, indice) => (
                <div
                  key={indice}
                  className="grid grid-cols-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="col-span-12 sm:col-span-2">
                    <select
                      value={item.tipo}
                      onChange={(e) =>
                        atualizarItem(indice, "tipo", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700"
                    >
                      <option value="servico">Serviço</option>
                      <option value="peca">Peça</option>
                    </select>
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Descrição (ex: Troca de óleo)"
                      value={item.descricao}
                      onChange={(e) =>
                        atualizarItem(indice, "descricao", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Qtd"
                      value={item.quantidade}
                      onChange={(e) =>
                        atualizarItem(indice, "quantidade", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="R$ unitário"
                      value={item.valor_unitario}
                      onChange={(e) =>
                        atualizarItem(indice, "valor_unitario", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div className="col-span-3 text-sm font-semibold text-slate-700">
                    {formatarMoeda(
                      (Number(item.quantidade) || 0) *
                        (Number(item.valor_unitario) || 0),
                    )}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removerItem(indice)}
                      title="Remover item"
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Observações
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) => aoMudar("observacoes", e.target.value)}
              rows={2}
              placeholder="Ex: prazo de entrega, garantia, condições..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Total + desconto */}
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-blue-50 p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Desconto (R$)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.desconto}
                onChange={(e) => aoMudar("desconto", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col justify-center text-right">
              <p className="text-sm text-slate-600">
                Subtotal:{" "}
                <span className="font-semibold">{formatarMoeda(subtotal)}</span>
              </p>
              <p className="text-2xl font-bold text-blue-800">
                Total: {formatarMoeda(total)}
              </p>
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
              onClick={onFechar}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
            >
              Salvar orçamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
