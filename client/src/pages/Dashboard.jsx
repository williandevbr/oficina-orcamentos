import { Users, FileText, CheckCircle2, Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatsCard from "../components/StatsCard.jsx";
import { SkeletonStats, Skeleton } from "../components/Skeleton.jsx";
import { formatarMoeda, formatarData, formatarNumero } from "../utils/format.js";
import { apiFetch } from "../lib/api.js";

// ============================================================
// Página inicial: resumo da oficina com números REAIS do servidor
// ============================================================

const STATUS_LISTA = ["rascunho", "enviado", "aprovado", "recusado", "expirado"];

async function lerJsonSeguro(resp) {
  try {
    return await resp.json();
  } catch {
    return {};
  }
}

export default function Dashboard() {
  const [resumo, setResumo] = useState({
    clientes: 0,
    orcamentos: 0,
    aprovados: 0,
    pendentes: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [recentes, setRecentes] = useState([]);
  const [porStatus, setPorStatus] = useState([]);
  const [faturamento, setFaturamento] = useState(0);

  // Busca os números quando a página abre (com cancelamento)
  useEffect(() => {
    const controle = new AbortController();
    carregar(controle.signal);
    return () => controle.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregar(sinal) {
    try {
      setCarregando(true);
      const [respResumo, respOrc] = await Promise.all([
        apiFetch("/api/resumo", { signal: sinal }),
        apiFetch("/api/orcamentos", { signal: sinal }),
      ]);
      const dadosResumo = await lerJsonSeguro(respResumo);
      if (sinal?.aborted) return;
      if (respResumo.status === 401) {
        throw new Error("Sessão expirada. Entre novamente.");
      }
      if (!respResumo.ok) {
        throw new Error(
          dadosResumo.message || "Não foi possível carregar o resumo.",
        );
      }
      setResumo({
        clientes: dadosResumo.clientes ?? 0,
        orcamentos: dadosResumo.orcamentos ?? 0,
        aprovados: dadosResumo.aprovados ?? 0,
        pendentes: dadosResumo.pendentes ?? 0,
      });

      // A lista de orçamentos é essencial pros gráficos: se falhar, erra tudo
      // (antes mostrava "zerado" falso, enganando o usuário)
      const dadosOrc = await lerJsonSeguro(respOrc);
      if (sinal?.aborted) return;
      if (!respOrc.ok) {
        throw new Error(
          dadosOrc.message || "Não foi possível carregar os orçamentos.",
        );
      }
      const arr = Array.isArray(dadosOrc)
        ? dadosOrc
        : Array.isArray(dadosOrc.data)
          ? dadosOrc.data
          : [];
      const contagem = {};
      let fat = 0;
      for (const o of arr) {
        contagem[o.status] = (contagem[o.status] || 0) + 1;
        if (o.status === "aprovado") fat += Number(o.total) || 0;
      }
      setPorStatus(
        STATUS_LISTA.map((s) => ({ status: s, total: contagem[s] || 0 })),
      );
      setFaturamento(fat);
      setRecentes(
        [...arr]
          .sort((a, b) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            const va = Number.isFinite(ta) ? ta : 0;
            const vb = Number.isFinite(tb) ? tb : 0;
            return vb - va;
          })
          .slice(0, 5),
      );
      setErro("");
    } catch (e) {
      if (e?.name === "AbortError" || sinal?.aborted) return;
      if (e?.name === "TimeoutError") {
        setErro("O servidor demorou a responder. Tente novamente.");
      } else {
        setErro(e.message || "Não foi possível carregar o resumo.");
      }
    } finally {
      if (!sinal?.aborted) setCarregando(false);
    }
  }

  const maxStatus = Math.max(1, ...porStatus.map((p) => p.total));
  const rotulos = {
    rascunho: "Rascunho",
    enviado: "Enviado",
    aprovado: "Aprovado",
    recusado: "Recusado",
    expirado: "Expirado",
  };
  const barraCor = {
    rascunho: "bg-slate-400",
    enviado: "bg-blue-500",
    aprovado: "bg-emerald-500",
    recusado: "bg-red-400",
    expirado: "bg-amber-400",
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500">Resumo da movimentação da oficina</p>
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

      {carregando ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Clientes cadastrados"
            value={resumo.clientes}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Orçamentos criados"
            value={resumo.orcamentos}
            icon={FileText}
            color="violet"
          />
          <StatsCard
            title="Aprovados"
            value={resumo.aprovados}
            icon={CheckCircle2}
            color="green"
          />
          <StatsCard
            title="Pendentes"
            value={resumo.pendentes}
            icon={Clock}
            color="orange"
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Por status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">
            Orçamentos por status
          </h3>
          {carregando ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {porStatus.map((p) => (
                <div key={p.status}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">
                      {rotulos[p.status]}
                    </span>
                    <span className="font-bold text-slate-900">{p.total}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-slate-100">
                    <div
                      className={`h-2 rounded ${barraCor[p.status]}`}
                      style={{ width: `${(p.total / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="pt-2 text-sm text-slate-500">
                Faturamento aprovado:{" "}
                <span className="font-bold text-emerald-700">
                  {formatarMoeda(faturamento)}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Recentes + ações */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Orçamentos recentes
            </h3>
            <Link
              to="/orcamentos"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Ver todos
            </Link>
          </div>
          {carregando ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : recentes.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Nenhum orçamento ainda.{" "}
              <Link
                to="/clientes"
                className="font-semibold text-blue-600 hover:text-blue-800"
              >
                Cadastre um cliente
              </Link>{" "}
              para começar.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {recentes.map((o) => (
                <li
                  key={o.id}
                  className="flex min-w-0 items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate font-semibold text-slate-800">
                    Nº {formatarNumero(o.numero)} — {o.clientes?.nome || "—"}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {formatarMoeda(o.total)} · {formatarData(o.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/clientes"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Plus className="h-4 w-4" />
              Novo cliente
            </Link>
            <Link
              to="/orcamentos"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Novo orçamento
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
