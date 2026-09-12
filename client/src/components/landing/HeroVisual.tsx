import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";

// ============================================================
// Visual do hero: o orçamento "vivo".
// ============================================================
// Coreografia de entrada (tudo com atraso em cascata):
// 0.35s cartão → 0.5s cabeçalho → 0.65/0.8/0.95s itens →
// 1.1s carimbo (pop girando) → 1.2s selo recebido →
// 1.3s chip WhatsApp → 1.5s chip pagamento.
// Depois da entrada: total conta de R$ 0 até R$ 1.240,00 e os
// dois chips flutuam sem parar. Sem movimento reduzido no
// sistema = mostra tudo pronto de uma vez.
// ============================================================

const ITENS = [
  { descricao: "Troca de óleo e filtro", tipo: "Serviço", valor: "R$ 180,00", atraso: "650ms" },
  { descricao: "Pastilha de freio", tipo: "Peça", valor: "R$ 320,00", atraso: "800ms" },
  { descricao: "Mão de obra", tipo: "Serviço", valor: "R$ 740,00", atraso: "950ms" },
] as const;

const TOTAL_CENTAVOS = 124000;

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function movimentoReduzido(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Conta de 0 até o total com easing suave, após o atraso. */
function useContagem(valorFinal: number, atrasoMs: number, duracaoMs: number): number {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (movimentoReduzido()) {
      setValor(valorFinal);
      return;
    }
    let raf = 0;
    let inicio = 0;
    function passo(tempo: number): void {
      if (!inicio) inicio = tempo;
      const passado = tempo - inicio;
      if (passado < atrasoMs) {
        raf = requestAnimationFrame(passo);
        return;
      }
      const progresso = Math.min((passado - atrasoMs) / duracaoMs, 1);
      const suave = 1 - Math.pow(1 - progresso, 3);
      setValor(Math.round(valorFinal * suave));
      if (progresso < 1) raf = requestAnimationFrame(passo);
    }
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [valorFinal, atrasoMs, duracaoMs]);

  return valor;
}

export default function HeroVisual(): React.JSX.Element {
  const total = useContagem(TOTAL_CENTAVOS, 900, 1400);

  return (
    <div className="relative" role="img" aria-label="Exemplo de orçamento Nº 0007 aprovado e recebido no OrcaPro">
      {/* Cartão principal */}
      <div
        className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]"
        style={{ animationDelay: "350ms" }}
      >
        <div
          className="animate-fade-up flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3"
          style={{ animationDelay: "500ms" }}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="ml-2 font-mono text-xs text-slate-500">
            Nº 0007 — Gol 1.6 · ABC-1234
          </span>
        </div>

        <div className="relative p-5">
          {/* Carimbo cai girando e assenta torto */}
          <span
            className="animate-pop pointer-events-none absolute right-5 top-4 rounded border-2 border-emerald-700 px-2.5 py-1 text-xs font-bold uppercase text-emerald-700"
            style={{ animationDelay: "1100ms" }}
          >
            Aprovado
          </span>

          {ITENS.map((item) => (
            <div
              key={item.descricao}
              className="animate-fade-up flex items-baseline justify-between gap-3 border-b border-dotted border-slate-200 py-2.5 text-sm"
              style={{ animationDelay: item.atraso }}
            >
              <span className="text-slate-700">{item.descricao}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {item.tipo}
              </span>
              <span className="ml-auto font-mono font-semibold text-slate-900">
                {item.valor}
              </span>
            </div>
          ))}

          <div
            className="animate-fade-up flex items-baseline justify-between pt-3"
            style={{ animationDelay: "1050ms" }}
          >
            <span className="text-sm text-slate-500">Total do orçamento</span>
            <span className="font-mono text-xl font-bold tabular-nums text-blue-800">
              {formatarMoeda(total)}
            </span>
          </div>
        </div>

        <div
          className="animate-fade-up flex items-center gap-2 border-t border-slate-100 px-5 py-3"
          style={{ animationDelay: "1200ms" }}
        >
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            <Check className="h-3 w-3" aria-hidden="true" />
            Recebido
          </span>
          <span className="ml-auto text-xs text-slate-400">
            Validade calculada sozinha
          </span>
        </div>
      </div>

      {/* Chip flutuante: WhatsApp */}
      <div
        className="animate-fade-up absolute -top-7 right-2 sm:-right-5"
        style={{ animationDelay: "1300ms" }}
      >
        <div className="animate-float flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 shadow-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
            <MessageCircle className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xs font-semibold text-slate-900">
              PDF enviado
            </span>
            <span className="block text-[11px] text-slate-500">
              WhatsApp · agora mesmo
            </span>
          </span>
        </div>
      </div>

      {/* Chip flutuante: pagamento */}
      <div
        className="animate-fade-up absolute -bottom-7 left-2 sm:-left-5"
        style={{ animationDelay: "1500ms" }}
      >
        <div
          className="animate-float flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 shadow-xl"
          style={{ animationDelay: "-3s" }}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>
            <span className="block font-mono text-xs font-bold text-slate-900">
              R$ 1.240,00
            </span>
            <span className="block text-[11px] text-slate-500">
              marcado como recebido
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
