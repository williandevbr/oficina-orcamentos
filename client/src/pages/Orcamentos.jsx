import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  Search,
  MessageCircle,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import OrcamentoForm from "../components/OrcamentoForm.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Paginacao from "../components/Paginacao.jsx";
import { SkeletonTabela } from "../components/Skeleton.jsx";
import { formatarMoeda, formatarData, formatarNumero } from "../utils/format.js";
import {
  montarLinkWhatsApp,
  calcularValidoAte,
} from "../utils/mascaras.js";
import { apiFetch } from "../lib/api.js";

// ============================================================
// Página de ORÇAMENTOS
// ============================================================
// - Navegação (sem busca): paginação e filtro de status no servidor.
// - Com busca textual: carrega a lista (filtro de status no servidor)
//   e filtra por número/cliente/placa no navegador — assim a busca
//   por nome do cliente continua funcionando.
// ============================================================

const API = "/api/orcamentos";
const API_CLIENTES = "/api/clientes";
const POR_PAGINA = 8;

const STATUS_OPCOES = [
  { valor: "todos", rotulo: "Todos os status" },
  { valor: "rascunho", rotulo: "Rascunho" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "aprovado", rotulo: "Aprovado" },
  { valor: "recusado", rotulo: "Recusado" },
  { valor: "expirado", rotulo: "Expirado" },
];

// Cores do selo (badge) de status
function BadgeStatus({ status }) {
  const cores = {
    rascunho: "bg-slate-100 text-slate-600",
    enviado: "bg-blue-100 text-blue-700",
    aprovado: "bg-emerald-100 text-emerald-700",
    recusado: "bg-red-100 text-red-700",
    expirado: "bg-amber-100 text-amber-700",
  };
  const rotulos = {
    rascunho: "Rascunho",
    enviado: "Enviado",
    aprovado: "Aprovado",
    recusado: "Recusado",
    expirado: "Expirado",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${cores[status] || cores.rascunho}`}
    >
      {rotulos[status] || status}
    </span>
  );
}

// Uma linha da tabela (memoizada: evita recalcular link/validade à toa)
function LinhaOrcamento({ orc, baixando, editando, onBaixar, onEditar, onExcluir }) {
  const linha = useMemo(() => {
    const validoAte = calcularValidoAte(orc.created_at, orc.validade_dias);
    const linkZap = montarLinkWhatsApp({
      telefone: orc.clientes?.telefone,
      nomeCliente: orc.clientes?.nome,
      numero: orc.numero,
      total: formatarMoeda(orc.total),
    });
    return { validoAte, linkZap };
  }, [orc]);

  return (
    <tr className="hover:bg-blue-50/50">
      <td className="px-5 py-3 font-semibold text-slate-800">
        {formatarNumero(orc.numero)}
      </td>
      <td className="px-5 py-3">
        <div className="font-medium text-slate-800">
          {orc.clientes?.nome || "—"}
        </div>
        <div className="text-xs text-slate-400">
          {orc.clientes?.veiculo || ""}
        </div>
      </td>
      <td className="px-5 py-3 font-semibold text-blue-800">
        {formatarMoeda(orc.total)}
      </td>
      <td className="px-5 py-3">
        <BadgeStatus status={orc.status} />
      </td>
      <td className="px-5 py-3 text-slate-500">
        <div>{formatarData(orc.created_at)}</div>
        {linha.validoAte && (
          <div className="text-xs text-slate-400">
            Válido até {formatarData(linha.validoAte)}
          </div>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex justify-end gap-2">
          {linha.linkZap && (
            <a
              href={linha.linkZap}
              target="_blank"
              rel="noreferrer"
              title="Enviar por WhatsApp"
              aria-label={`Enviar orçamento ${orc.numero} por WhatsApp`}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onBaixar(orc)}
            disabled={baixando}
            title="Baixar PDF"
            aria-label={`Baixar PDF do orçamento ${orc.numero}`}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50"
          >
            {baixando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onEditar(orc.id)}
            disabled={editando}
            title="Editar"
            aria-label={`Editar orçamento ${orc.numero}`}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50"
          >
            {editando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onExcluir(orc.id)}
            title="Excluir"
            aria-label={`Excluir orçamento ${orc.numero}`}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

async function lerJsonSeguro(resp) {
  try {
    return await resp.json();
  } catch {
    return {};
  }
}

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [dadosEdicao, setDadosEdicao] = useState(null); // null = novo
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [baixandoId, setBaixandoId] = useState(null);

  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [idParaExcluir, setIdParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  // Debounce da busca (300ms) + volta para a página 1
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaDebounced(busca.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    setPagina(1);
  }, [filtroStatus]);

  useEffect(() => {
    const controle = new AbortController();
    carregarTudo(controle.signal);
    return () => controle.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, buscaDebounced, filtroStatus]);

  const inicio = total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const fim = Math.min(pagina * POR_PAGINA, total);

  async function carregarTudo(sinal) {
    try {
      setCarregando(true);
      const statusParam =
        filtroStatus !== "todos" ? `&status=${filtroStatus}` : "";

      if (!buscaDebounced) {
        // Modo paginado no servidor
        const [respOrc, respCli] = await Promise.all([
          apiFetch(`${API}?page=${pagina}&limit=${POR_PAGINA}${statusParam}`, {
            signal: sinal,
          }),
          apiFetch(API_CLIENTES, { signal: sinal }),
        ]);
        const [dadosOrc, dadosCli] = await Promise.all([
          lerJsonSeguro(respOrc),
          lerJsonSeguro(respCli),
        ]);
        if (sinal?.aborted) return;
        if (respOrc.status === 401 || respCli.status === 401) {
          throw new Error("Sessão expirada. Entre novamente.");
        }
        if (!respOrc.ok) {
          throw new Error(dadosOrc.message || "Não foi possível carregar os orçamentos.");
        }
        if (Array.isArray(dadosOrc)) {
          setOrcamentos(dadosOrc);
          setTotal(dadosOrc.length);
          setTotalPaginas(1);
        } else {
          setOrcamentos(Array.isArray(dadosOrc.data) ? dadosOrc.data : []);
          setTotal(dadosOrc.total ?? 0);
          setTotalPaginas(dadosOrc.totalPages ?? 1);
        }
        setClientes(Array.isArray(dadosCli) ? dadosCli : dadosCli.data || []);
      } else {
        // Modo busca: lista com filtro de status e filtra o texto no navegador
        // (para achar também por nome do cliente e placa)
        const [respOrc, respCli] = await Promise.all([
          apiFetch(`${API}?status=${filtroStatus === "todos" ? "" : filtroStatus}`, {
            signal: sinal,
          }),
          apiFetch(API_CLIENTES, { signal: sinal }),
        ]);
        const [dadosOrc, dadosCli] = await Promise.all([
          lerJsonSeguro(respOrc),
          lerJsonSeguro(respCli),
        ]);
        if (sinal?.aborted) return;
        if (respOrc.status === 401 || respCli.status === 401) {
          throw new Error("Sessão expirada. Entre novamente.");
        }
        if (!respOrc.ok) {
          throw new Error(dadosOrc.message || "Não foi possível carregar os orçamentos.");
        }
        const lista = Array.isArray(dadosOrc) ? dadosOrc : dadosOrc.data || [];
        const termo = buscaDebounced.toLowerCase();
        const filtrada = lista.filter((orc) =>
          [String(orc.numero), orc.clientes?.nome, orc.clientes?.placa]
            .join(" ")
            .toLowerCase()
            .includes(termo),
        );
        const totPag = Math.max(1, Math.ceil(filtrada.length / POR_PAGINA));
        const pagSegura = Math.min(pagina, totPag);
        setOrcamentos(
          filtrada.slice((pagSegura - 1) * POR_PAGINA, pagSegura * POR_PAGINA),
        );
        setTotal(filtrada.length);
        setTotalPaginas(totPag);
        setClientes(Array.isArray(dadosCli) ? dadosCli : dadosCli.data || []);
      }
      setErro("");
    } catch (e) {
      if (e?.name === "AbortError" || sinal?.aborted) return;
      if (e?.name === "TimeoutError") {
        setErro("O servidor demorou a responder. Tente novamente.");
      } else {
        setErro(e.message || "Não foi possível carregar os orçamentos.");
      }
    } finally {
      if (!sinal?.aborted) setCarregando(false);
    }
  }

  function abrirNovo() {
    setDadosEdicao(null);
    setErroForm("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setDadosEdicao(null);
  }

  // Para editar, busca o orçamento completo (com os itens)
  async function abrirEdicao(id) {
    try {
      setEditandoId(id);
      const resp = await apiFetch(`${API}/${id}`);
      const dados = await lerJsonSeguro(resp);
      if (!resp.ok) {
        toast.error(dados.message || "Não foi possível carregar o orçamento.");
        return;
      }
      setDadosEdicao(dados);
      setErroForm("");
      setModalAberto(true);
    } catch {
      toast.error("Erro de conexão ao carregar o orçamento.");
    } finally {
      setEditandoId(null);
    }
  }

  async function salvar(payload) {
    const url = dadosEdicao ? `${API}/${dadosEdicao.id}` : API;
    const metodo = dadosEdicao ? "PUT" : "POST";

    try {
      setSalvando(true);
      setErroForm("");
      const resp = await apiFetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dados = await lerJsonSeguro(resp);

      if (!resp.ok) {
        setErroForm(dados.message || "Erro ao salvar.");
        return;
      }

      fecharModal();
      toast.success(dadosEdicao ? "Orçamento atualizado!" : "Orçamento criado!");
      await carregarTudo();
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
      toast.success("Orçamento excluído!");
      setIdParaExcluir(null);
      if (orcamentos.length === 1 && pagina > 1) {
        setPagina(pagina - 1);
      } else {
        await carregarTudo();
      }
    } catch (e) {
      toast.error(e.message || "Não foi possível excluir.");
    } finally {
      setExcluindo(false);
    }
  }

  // Baixa o PDF com autorização (o navegador sozinho não envia o crachá)
  async function baixarPdf(orc) {
    if (baixandoId) return; // evita duplo clique
    try {
      setBaixandoId(orc.id);
      const resp = await apiFetch(`${API}/${orc.id}/pdf`);
      if (!resp.ok) {
        const dados = await lerJsonSeguro(resp);
        toast.error(dados.message || "Não foi possível gerar o PDF.");
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orcamento-${formatarNumero(orc.numero)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF baixado!");
    } catch {
      toast.error("Erro de conexão ao gerar o PDF.");
    } finally {
      setBaixandoId(null);
    }
  }

  const mostrandoBusca = buscaDebounced !== "" || filtroStatus !== "todos";

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orçamentos</h2>
          <p className="text-slate-500">Criação e envio de orçamentos</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Novo orçamento
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
            onClick={() => carregarTudo()}
            className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Busca + filtro */}
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, cliente, placa..."
            aria-label="Buscar orçamentos"
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
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          aria-label="Filtrar por status"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          {STATUS_OPCOES.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.rotulo}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {carregando ? (
        <SkeletonTabela linhas={6} colunas={6} />
      ) : total === 0 && mostrandoBusca ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
          <FileText className="h-12 w-12 text-blue-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">
            Nenhum resultado
          </h3>
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setFiltroStatus("todos");
            }}
            className="mt-4 rounded-lg border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            Limpar filtros
          </button>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
          <FileText className="h-12 w-12 text-blue-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">
            Nenhum orçamento ainda
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Crie o primeiro para enviar ao cliente por WhatsApp ou PDF.
          </p>
          <button
            type="button"
            onClick={abrirNovo}
            className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Novo orçamento
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] whitespace-nowrap text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Nº</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orcamentos.map((orc) => (
                <LinhaOrcamento
                  key={orc.id}
                  orc={orc}
                  baixando={baixandoId === orc.id}
                  editando={editandoId === orc.id}
                  onBaixar={baixarPdf}
                  onEditar={abrirEdicao}
                  onExcluir={pedirExclusao}
                />
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

      {/* Modal do formulário (key reseta o estado ao trocar de orçamento) */}
      {modalAberto && (
        <OrcamentoForm
          key={dadosEdicao?.id || "novo"}
          clientes={clientes}
          dadosIniciais={dadosEdicao}
          erro={erroForm}
          salvando={salvando}
          onSalvar={salvar}
          onFechar={fecharModal}
        />
      )}

      <ConfirmDialog
        aberto={!!idParaExcluir}
        titulo="Excluir orçamento?"
        mensagem="O orçamento e seus itens serão removidos. Esta ação não pode ser desfeita."
        confirmarLabel="Excluir"
        cancelando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => !excluindo && setIdParaExcluir(null)}
      />
    </div>
  );
}
