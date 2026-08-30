import { Users, FileText, CheckCircle2, Clock } from "lucide-react";
import StatsCard from "../components/StatsCard.jsx";

// Página inicial: mostra um resumo da oficina.
// Por enquanto os números são de exemplo (dados fictícios).
// Na próxima etapa eles virão do Supabase (banco de dados).
export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500">Resumo da movimentação da oficina</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Clientes cadastrados"
          value="0"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Orçamentos criados"
          value="0"
          icon={FileText}
          color="violet"
        />
        <StatsCard
          title="Aprovados"
          value="0"
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard title="Pendentes" value="0" icon={Clock} color="orange" />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">
          Bem-vindo ao OrcaPro
        </h3>
        <p className="mt-2 text-slate-500">
          Em breve aqui aparecerão os últimos orçamentos e a movimentação da
          oficina.
        </p>
      </div>
    </div>
  );
}
