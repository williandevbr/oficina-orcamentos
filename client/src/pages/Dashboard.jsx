import { Users, FileText, CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import StatsCard from "../components/StatsCard.jsx";

// ============================================================
// Página inicial: mostra um resumo da oficina com números REAIS
// vindos do nosso servidor (que busca no Supabase).
// ============================================================

export default function Dashboard() {
  const [resumo, setResumo] = useState({
    clientes: 0,
    orcamentos: 0,
    aprovados: 0,
    pendentes: 0,
  });

  // Busca os números quando a página abre
  useEffect(() => {
    async function carregar() {
      try {
        const resp = await fetch("/api/resumo");
        const dados = await resp.json();
        setResumo(dados);
      } catch {
        // mantém zeros se o servidor estiver offline
      }
    }
    carregar();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500">Resumo da movimentação da oficina</p>
      </div>

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

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">
          Bem-vindo ao OrcaPro
        </h3>
        <p className="mt-2 text-slate-500">
          Cadastre um cliente em "Clientes" para começar a usar o sistema.
        </p>
      </div>
    </div>
  );
}
