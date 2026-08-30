import { useEffect, useState } from "react";
import { FileText, Plus, Pencil, Trash2, FileDown } from "lucide-react";
import OrcamentoForm from "../components/OrcamentoForm.jsx";
import { formatarMoeda, formatarData } from "../utils/format.js";
import { apiFetch } from "../lib/api.js";

// ============================================================
// Página de ORÇAMENTOS
// ============================================================
// Mostra a lista de orçamentos e abre o formulário
// (criar novo / editar existente).
// ============================================================

const API = "/api/orcamentos";
const API_CLIENTES = "/api/clientes";

// Cores do selo (badge) de status
function BadgeStatus({ status }) {
  const cores = {
    rascunho: "bg-slate-100 text-slate-600",
    enviado: "bg-blue-100 text-blue-700",
    aprovado: "bg-emerald-100 text-emerald-700",
    recusado: "bg-red-100 text-red-700",
  };
  const rotulos = {
    rascunho: "Rascunho",
    enviado: "Enviado",
    aprovado: "Aprovado",
    recusado: "Recusado",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${cores[status] || cores.rascunho}`}
    >
      {rotulos[status] || status}
    </span>
  );
}

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [dadosEdicao, setDadosEdicao] = useState(null); // null = novo

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    try {
      const [respOrc, respCli] = await Promise.all([
        apiFetch(API),
        apiFetch(API_CLIENTES),
      ]);
      const [listaOrc, listaCli] = await Promise.all([
        respOrc.json(),
        respCli.json(),
      ]);
      setOrcamentos(listaOrc);
      setClientes(listaCli);
      setErro("");
    } catch {
      setErro("Não foi possível carregar os orçamentos.");
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovo() {
    setDadosEdicao(null);
    setErro("");
    setModalAberto(true);
  }

  // Para editar, busca o orçamento completo (com os itens)
  async function abrirEdicao(id) {
    try {
      const resp = await apiFetch(`${API}/${id}`);
      const dados = await resp.json();
      setDadosEdicao(dados);
      setErro("");
      setModalAberto(true);
    } catch {
      setErro("Não foi possível carregar o orçamento.");
    }
  }

  async function salvar(payload) {
    const url = dadosEdicao ? `${API}/${dadosEdicao.id}` : API;
    const metodo = dadosEdicao ? "PUT" : "POST";

    try {
      const resp = await apiFetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dados = await resp.json();

      if (!resp.ok) {
        setErro(dados.message || "Erro ao salvar.");
        return;
      }

      setModalAberto(false);
      await carregarTudo();
    } catch {
      setErro("Erro de conexão com o servidor.");
    }
  }

  async function excluir(id) {
    if (!confirm("Tem certeza que deseja excluir este orçamento?")) return;
    await apiFetch(`${API}/${id}`, { method: "DELETE" });
    await carregarTudo();
  }

  // Baixa o PDF com autorização (o navegador sozinho não envia o crachá)
  async function baixarPdf(orc) {
    try {
      setErro("");
      const resp = await apiFetch(`${API}/${orc.id}/pdf`);
      if (!resp.ok) {
        setErro("Não foi possível gerar o PDF.");
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orcamento-${String(orc.numero).padStart(4, "0")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErro("Erro de conexão ao gerar o PDF.");
    }
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orçamentos</h2>
          <p className="text-slate-500">Criação e envio de orçamentos</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo orçamento
        </button>
      </div>

      {erro && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Lista */}
      {carregando ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Carregando orçamentos...
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-20 text-center">
          <FileText className="h-12 w-12 text-blue-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">
            Nenhum orçamento ainda
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Clique em "Novo orçamento" para criar o primeiro.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
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
                <tr key={orc.id} className="hover:bg-blue-50/50">
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {String(orc.numero).padStart(4, "0")}
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
                    {formatarData(orc.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => baixarPdf(orc)}
                        title="Baixar PDF"
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => abrirEdicao(orc.id)}
                        title="Editar"
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => excluir(orc.id)}
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
        <OrcamentoForm
          clientes={clientes}
          dadosIniciais={dadosEdicao}
          erro={erro}
          onSalvar={salvar}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
