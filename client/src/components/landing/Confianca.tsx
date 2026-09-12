import { FileCheck, Lock, Smartphone, Zap } from "lucide-react";
import Revelar from "./Revelar";

// ============================================================
// Faixa de confiança — fatos reais, sem números inventados.
// ============================================================

const ITENS = [
  {
    icone: Zap,
    titulo: "Rápido no balcão",
    desc: "Orçamento pronto em minutos, sem papel.",
  },
  {
    icone: Smartphone,
    titulo: "Sem instalar nada",
    desc: "Roda no celular e no computador.",
  },
  {
    icone: Lock,
    titulo: "Só o seu dado",
    desc: "Cada login enxerga só a própria oficina.",
  },
  {
    icone: FileCheck,
    titulo: "PDF com sua marca",
    desc: "Nome e dados da oficina no documento.",
  },
] as const;

export default function Confianca(): React.JSX.Element {
  return (
    <section aria-label="Por que confiar" className="border-y border-white/10">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {ITENS.map((item, i) => (
          <Revelar key={item.titulo} atraso={i * 90}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                <item.icone className="h-5 w-5 text-blue-300" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-white">
                  {item.titulo}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {item.desc}
                </p>
              </div>
            </div>
          </Revelar>
        ))}
      </div>
    </section>
  );
}
