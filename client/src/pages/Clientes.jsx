import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ClienteForm from "../components/ClienteForm.jsx";

// ============================================================
// Página de Clientes - CRUD completo
// ============================================================
// Fluxo:
//   1. Ao abrir a página, busca a lista de clientes no servidor
//   2. "Novo cliente" abre o formulário (modal)
//   3. Salvar envia para a API (cria ou edita)
//   4. Botão de lixeira apaga um cliente
// ============================================================

// Caminho da API (o Vite repassa para o servidor na porta 3333)
const API = "/api/clientes";

// Formulário vazio (usado ao criar um novo cliente)
const formVazio = {
  nome: "",
  telefone: "",
  email: "",
  documento: "",
  endereco: "",
  veiculo: "",
  placa: "",
  observacoes: "",
};

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVazio);

  // Carrega a lista assim que a página abre
  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    try {
      const resp = await fetch(API);
      const dados = await resp.json();
      setClientes(dados);
      setErro("");
    } catch {
      setErro("Não foi possível carregar os clientes.");
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovo() {
    setForm(formVazio);
    setEditandoId(null);
    setModalAberto(true);
  }

  function abrirEdicao(cliente) {
    setForm(cliente);
    setEditandoId(cliente.id);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  async function salvar(evento) {
    evento.preventDefault();

    const url = editandoId ? `${API}/${editandoId}` : API;
    const metodo = editandoId ? "PUT" : "POST";

    try {
      const resp = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const dados = await resp.json();

      if (!resp.ok) {
        setErro(dados.message || "Erro ao salvar.");
        return;
      }

      setModalAberto(false);
      await carregarClientes();
    } catch {
      setErro("Erro de conexão com o servidor.");
    }
  }

  async function excluir(id) {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    await carregarClientes();
  }

  return (
    <div>
      {/* Cabeçalho da página */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clientes</h2>
          <p className="text-slate-500">Cadastro de clientes da oficina</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </button>
      </div>

      {erro && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Lista de clientes */}
      {carregando ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Carregando clientes...
        </div>
      ) : clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
          <Users className="h-12 w-12 text-blue-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">
            Nenhum cliente ainda
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Clique em "Novo cliente" para cadastrar o primeiro.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">Veículo</th>
                <th className="px-5 py-3">Placa</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-blue-50/50">
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {cliente.nome}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {cliente.telefone || "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {cliente.veiculo || "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {cliente.placa || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEdicao(cliente)}
                        title="Editar"
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => excluir(cliente.id)}
                        title="Excluir"
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal do formulário */}
      {modalAberto && (
        <ClienteForm
          form={form}
          editandoId={editandoId}
          erro={erro}
          aoMudar={(campo, valor) => setForm({ ...form, [campo]: valor })}
          aoSalvar={salvar}
          aoFechar={fecharModal}
        />
      )}
    </div>
  );
}
