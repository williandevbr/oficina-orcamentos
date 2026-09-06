import { Package, Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CatalogoForm from "../components/CatalogoForm.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Paginacao from "../components/Paginacao.jsx";
import { SkeletonTabela } from "../components/Skeleton.jsx";
import { formatarMoeda } from "../utils/format";
import { apiFetch } from "../lib/api";

// ============================================================
// Página do Catálogo — peças e serviços com preço pronto
// ============================================================
// A oficina cadastra uma vez e depois só puxa no orçamento.
// Busca e paginação no servidor.
// ============================================================

const API = "/api/catalogo";
const POR_PAGINA = 8;

const TIPOS = [
  { valor: "todos", rotulo: "Peças e serviços" },
  { valor: "peca", rotulo: "Peças" },
  { valor: "servico", rotulo: "Serviços" },
];

function criarFormVazio() {
  return { descricao: "", tipo: "peca", valor_unitario: "" };
}

async function lerJsonSeguro(resp) {
  try {
    return await resp.json();
  } catch {
    return {};
  }
}

export default function Catalogo() {
  const [itens, setItens] = useState([]);
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
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [idParaExcluir, setIdParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaDebounced(busca.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    setPagina(1);
  }, [filtroTipo]);

  useEffect(() => {
    const controle = new AbortController();
    carregar(controle.signal);
    return () => controle.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, buscaDebounced, filtroTipo]);

  const inicio = total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const fim = Math.min(pagina * POR_PAGINA, total);

  async function carregar(sinal) {
    try {
      setCarregando(true);
      const params = new URLSearchParams({
        page: String(pagina),
        limit: String(POR_PAGINA),
      });
      if (buscaDebounced) params.set("search", buscaDebounced);
      if (filtroTipo !== "todos") params.set("tipo", filtroTipo);
      const resp = await apiFetch(`${API}?${params}`, { signal: sinal });
      const dados = await lerJsonSeguro(resp);
      if (sinal?.aborted) return;
      if (resp.status === 401) throw new Error("Sessão expirada. Entre novamente.");
      if (!resp.ok) throw new Error(dados.message || "Não foi possível carregar o catálogo.");
      if (Array.isArray(dados)) {
        setItens(dados);
        setTotal(dados.length);
        setTotalPaginas(1);
      } else {
        setItens(Array.isArray(dados.data) ? dados.data : []);
        setTotal(dados.total ?? 0);
        setTotalPaginas(dados.totalPages ?? 1);
      }
      setErro("");
    } catch (e) {
      if (e?.name === "AbortError" || sinal?.aborted) return;
      setErro(e.message || "Não foi possível carregar o catálogo.");
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

  function abrirEdicao(item) {
    setForm({
      descricao: item.descricao || "",
      tipo: item.tipo || "peca",
      valor_unitario: item.valor_unitario ?? "",
    });
    setEditandoId(item.id);
    setErroForm("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function aoMudar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
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
        body: JSON.stringify({
          descricao: String(form.descricao).trim(),
          tipo: form.tipo,
          valor_unitario: Number(form.valor_unitario),
        }),
      });
      const dados = await lerJsonSeguro(resp);
      if (!resp.ok) {
        setErroForm(dados.message || "Erro ao salvar.");
        return;
      }
      setModalAberto(false);
      toast.success(editandoId ? "Item atualizado!" : "Item criado!");
      await carregar();
    } catch {
      setErroForm("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!idParaExcluir) return;
    try {
      setExcluindo(true);
      const resp = await apiFetch(`${API}/${idParaExcluir}`, { method: "DELETE" });
      const dados = await lerJsonSeguro(resp);
      if (!resp.ok) throw new Error(dados.message || "Não foi possível excluir.");
      toast.success("Item excluído!");
      setIdParaExcluir(null);
      if (itens.length === 1 && pagina > 1) setPagina(pagina - 1);
      else await carregar();
    } catch (e) {
      toast.error(e.message || "Não foi possível excluir.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Catálogo</h2>
          <p className="text-slate-500">Peças e serviços com preço pronto</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Novo item
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
            onClick={() => carregar()}
            className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar peça ou serviço..."
            aria-label="Buscar no catálogo"
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
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          aria-label="Filtrar por tipo"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
      </div>

      {carregando ? (
        <SkeletonTabela linhas={5} colunas={4} />
      ) : total === 0 && (buscaDebounced || filtroTipo !== "todos") ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
          <Package className="h-12 w-12 text-blue-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">Nenhum resultado</h3>
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setFiltroTipo("todos");
            }}
            className="mt-4 rounded-lg border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            Limpar filtros
          </button>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
          <Package className="h-12 w-12 text-blue-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">Catálogo vazio</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Cadastre peças e serviços uma vez e puxe no orçamento sem digitar.
          </p>
          <button
            type="button"
            onClick={abrirNovo}
            className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Novo item
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] whitespace-nowrap text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itens.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50">
                  <td className="px-5 py-3 font-medium text-slate-800">{item.descricao}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {item.tipo === "peca" ? "Peça" : "Serviço"}
                  </td>
                  <td className="px-5 py-3 font-semibold text-blue-800">
                    {formatarMoeda(item.valor_unitario)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(item)}
                        title="Editar"
                        aria-label={`Editar ${item.descricao}`}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdParaExcluir(item.id)}
                        title="Excluir"
                        aria-label={`Excluir ${item.descricao}`}
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

      {modalAberto && (
        <CatalogoForm
          form={form}
          editandoId={editandoId}
          erro={erroForm}
          salvando={salvando}
          aoMudar={aoMudar}
          aoSalvar={salvar}
          aoFechar={fecharModal}
        />
      )}

      <ConfirmDialog
        aberto={!!idParaExcluir}
        titulo="Excluir item?"
        mensagem="O item sairá do catálogo. Orçamentos já criados não mudam. Esta ação não pode ser desfeita."
        confirmarLabel="Excluir"
        cancelando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => !excluindo && setIdParaExcluir(null)}
      />
    </div>
  );
}
