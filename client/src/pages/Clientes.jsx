import { Users, Plus, Pencil, Trash2, Search, X, Car } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ClienteForm from "../components/ClienteForm.jsx";
import VeiculosModal from "../components/VeiculosModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Paginacao from "../components/Paginacao.jsx";
import { SkeletonTabela } from "../components/Skeleton.jsx";
import { mascararTelefone, mascararDocumento } from "../utils/mascaras.js";
import { apiFetch } from "../lib/api.js";

// ============================================================
// Página de Clientes - CRUD completo (busca e paginação no servidor)
// Veículos ficam em cadastro separado: 1 cliente -> N veículos.
// ============================================================

const API = "/api/clientes";
const API_VEICULOS = "/api/veiculos";
const POR_PAGINA = 8;

// Fábrica: cada "novo" ganha um objeto próprio (sem referência compartilhada)
function criarFormVazio() {
  return {
    nome: "",
    telefone: "",
    email: "",
    documento: "",
    endereco: "",
    observacoes: "",
  };
}

// Só os campos do formulário (nunca id/created_at/user_id)
function extrairForm(cliente = {}) {
  return {
    nome: cliente.nome || "",
    telefone: cliente.telefone || "",
    email: cliente.email || "",
    documento: cliente.documento || "",
    endereco: cliente.endereco || "",
    observacoes: cliente.observacoes || "",
  };
}

async function lerJsonSeguro(resp) {
  try {
    return await resp.json();
  } catch {
    return {};
  }
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(criarFormVazio);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [pagina, setPagina] = useState(1);
  const [idParaExcluir, setIdParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  // Veículos: todos carregados uma vez (1 cliente -> N veículos)
  const [veiculos, setVeiculos] = useState([]);
  const [veiculosDe, setVeiculosDe] = useState(null); // cliente com modal aberto
  const [erroVeiculo, setErroVeiculo] = useState("");
  const [salvandoVeiculo, setSalvandoVeiculo] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Vindo do Dashboard ("Novo cliente"): abre o modal direto
  useEffect(() => {
    if (location.state?.novo) {
      abrirNovo();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce da busca (300ms) + reseta para a página 1
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaDebounced(busca.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  // Carrega do servidor (com cancelamento se trocar de página rápido)
  useEffect(() => {
    const controle = new AbortController();
    carregarClientes(controle.signal);
    return () => controle.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, buscaDebounced]);

  // Veículos: carrega uma vez (independe da página/busca)
  useEffect(() => {
    carregarVeiculos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inicio = total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const fim = Math.min(pagina * POR_PAGINA, total);

  async function carregarClientes(sinal) {
    try {
      setCarregando(true);
      const params = new URLSearchParams({
        page: String(pagina),
        limit: String(POR_PAGINA),
      });
      if (buscaDebounced) params.set("search", buscaDebounced);
      const resp = await apiFetch(`${API}?${params}`, { signal: sinal });
      const dados = await lerJsonSeguro(resp);
      if (sinal?.aborted) return;
      if (resp.status === 401) {
        throw new Error("Sessão expirada. Entre novamente.");
      }
      if (!resp.ok) throw new Error(dados.message || "Não foi possível carregar os clientes.");
      // Servidor paginado devolve objeto; legado devolve array
      if (Array.isArray(dados)) {
        setClientes(dados);
        setTotal(dados.length);
        setTotalPaginas(1);
      } else {
        setClientes(Array.isArray(dados.data) ? dados.data : []);
        setTotal(dados.total ?? 0);
        setTotalPaginas(dados.totalPages ?? 1);
      }
      setErro("");
    } catch (e) {
      if (e?.name === "AbortError" || sinal?.aborted) return;
      if (e?.name === "TimeoutError") {
        setErro("O servidor demorou a responder. Tente novamente.");
      } else {
        setErro(e.message || "Não foi possível carregar os clientes.");
      }
    } finally {
      if (!sinal?.aborted) setCarregando(false);
    }
  }

  function abrirNovo() {
    setForm(criarFormVazio());
    setEditandoId(null);
    setErroForm("");
    setModalAberto(true);
  }

  function abrirEdicao(cliente) {
    setForm(extrairForm(cliente));
    setEditandoId(cliente.id);
    setErroForm("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function aoMudarForm(campo, valor) {
    let final = valor;
    if (campo === "telefone") final = mascararTelefone(valor);
    if (campo === "documento") final = mascararDocumento(valor);
    setForm((atual) => ({ ...atual, [campo]: final }));
  }

  // Mapa cliente_id -> lista de veículos (para a coluna da tabela)
  const veiculosDoCliente = (clienteId) =>
    veiculos.filter((v) => v.cliente_id === clienteId);

  async function carregarVeiculos() {
    try {
      const resp = await apiFetch(API_VEICULOS);
      const dados = await lerJsonSeguro(resp);
      if (!resp.ok) return; // tabela nova pode não existir ainda: segue sem travar
      setVeiculos(Array.isArray(dados) ? dados : dados.data || []);
    } catch {
      // Sem veículos por enquanto (offline ou migration pendente)
    }
  }

  async function adicionarVeiculo({ veiculo, placa }) {
    if (!veiculosDe) return;
    try {
      setSalvandoVeiculo(true);
      setErroVeiculo("");
      const resp = await apiFetch(API_VEICULOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: veiculosDe.id,
          veiculo,
          placa: placa || undefined,
        }),
      });
      const dados = await lerJsonSeguro(resp);
      if (!resp.ok) {
        setErroVeiculo(dados.message || "Erro ao salvar o veículo.");
        return;
      }
      setVeiculos((atual) => [dados, ...atual]);
      toast.success("Veículo adicionado!");
    } catch {
      setErroVeiculo("Erro de conexão com o servidor.");
    } finally {
      setSalvandoVeiculo(false);
    }
  }

  async function excluirVeiculo(id) {
    try {
      setSalvandoVeiculo(true);
      setErroVeiculo("");
      const resp = await apiFetch(`${API_VEICULOS}/${id}`, {
        method: "DELETE",
      });
      const dados = await lerJsonSeguro(resp);
      if (!resp.ok) throw new Error(dados.message || "Não foi possível excluir.");
      setVeiculos((atual) => atual.filter((v) => v.id !== id));
      toast.success("Veículo removido!");
    } catch (e) {
      setErroVeiculo(e.message || "Não foi possível excluir.");
    } finally {
      setSalvandoVeiculo(false);
    }
  }

  async function salvar(evento) {
    evento.preventDefault();

    const url = editandoId ? `${API}/${editandoId}` : API;
    const metodo = editandoId ? "PUT" : "POST";

    try {
      setSalvando(true);
      setErroForm("");
      const resp = await apiFetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const dados = await lerJsonSeguro(resp);

      if (!resp.ok) {
        setErroForm(dados.message || "Erro ao salvar.");
        return;
      }

      setModalAberto(false);
      toast.success(editandoId ? "Cliente atualizado!" : "Cliente criado!");
      await carregarClientes();
    } catch {
      setErroForm("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  function pedirExclusao(id) {
    setIdParaExcluir(id);
  }

  async function confirmarExclusao() {
    if (!idParaExcluir) return;
    try {
      setExcluindo(true);
      const resp = await apiFetch(`${API}/${idParaExcluir}`, {
        method: "DELETE",
      });
      const dados = await lerJsonSeguro(resp);
      if (!resp.ok) throw new Error(dados.message || "Não foi possível excluir.");
      toast.success("Cliente excluído!");
      setIdParaExcluir(null);
      // Se apagou o último da página, volta uma página
      if (clientes.length === 1 && pagina > 1) {
        setPagina(pagina - 1);
      } else {
        await carregarClientes();
      }
    } catch (e) {
      toast.error(e.message || "Não foi possível excluir.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      {/* Cabeçalho da página */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clientes</h2>
          <p className="text-slate-500">Cadastro de clientes da oficina</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </button>
      </div>

      {erro && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{erro}</span>
          <button
            type="button"
            onClick={() => carregarClientes()}
            className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Busca (no servidor, com debounce) */}
      <div className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone, placa..."
            aria-label="Buscar clientes"
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-9 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de clientes */}
      {carregando ? (
        <SkeletonTabela linhas={5} colunas={5} />
      ) : total === 0 && buscaDebounced ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
          <Users className="h-12 w-12 text-blue-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">
            Nenhum resultado para “{buscaDebounced}”
          </h3>
          <button
            type="button"
            onClick={() => setBusca("")}
            className="mt-4 rounded-lg border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            Limpar busca
          </button>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
          <Users className="h-12 w-12 text-blue-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">
            Nenhum cliente ainda
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Cadastre o primeiro para começar a criar orçamentos.
          </p>
          <button
            type="button"
            onClick={abrirNovo}
            className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Novo cliente
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">Veículos</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((cliente) => {
                const lista = veiculosDoCliente(cliente.id);
                return (
                <tr key={cliente.id} className="hover:bg-blue-50/50">
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {cliente.nome}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {cliente.telefone || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {lista.length === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <div className="flex max-w-56 flex-wrap gap-1">
                        {lista.slice(0, 3).map((v) => (
                          <span
                            key={v.id}
                            title={v.placa ? `${v.veiculo} • ${v.placa}` : v.veiculo}
                            className="max-w-40 truncate rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {v.veiculo}
                          </span>
                        ))}
                        {lista.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                            +{lista.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVeiculosDe(cliente);
                          setErroVeiculo("");
                        }}
                        title={`Veículos (${lista.length})`}
                        aria-label={`Veículos de ${cliente.nome}`}
                        className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Car className="h-4 w-4" />
                        {lista.length > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                            {lista.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirEdicao(cliente)}
                        title="Editar"
                        aria-label={`Editar ${cliente.nome}`}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => pedirExclusao(cliente.id)}
                        title="Excluir"
                        aria-label={`Excluir ${cliente.nome}`}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          <Paginacao
            pagina={pagina}
            totalPaginas={totalPaginas}
            total={total}
            inicio={inicio}
            fim={fim}
            aoMudar={setPagina}
          />
        </div>
      )}

      {/* Modal do formulário */}
      {modalAberto && (
        <ClienteForm
          form={form}
          editandoId={editandoId}
          erro={erroForm}
          salvando={salvando}
          aoMudar={aoMudarForm}
          aoSalvar={salvar}
          aoFechar={fecharModal}
        />
      )}

      {/* Modal de veículos do cliente */}
      {veiculosDe && (
        <VeiculosModal
          clienteNome={veiculosDe.nome}
          veiculos={veiculosDoCliente(veiculosDe.id)}
          salvando={salvandoVeiculo}
          erro={erroVeiculo}
          onAdicionar={adicionarVeiculo}
          onExcluir={excluirVeiculo}
          onFechar={() => setVeiculosDe(null)}
        />
      )}

      <ConfirmDialog
        aberto={!!idParaExcluir}
        titulo="Excluir cliente?"
        mensagem="O cliente será removido. Orçamentos ligados a ele também podem ser apagados. Esta ação não pode ser desfeita."
        confirmarLabel="Excluir"
        cancelando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => !excluindo && setIdParaExcluir(null)}
      />
    </div>
  );
}
