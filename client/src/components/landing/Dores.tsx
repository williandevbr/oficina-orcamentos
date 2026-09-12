import { Check, X } from "lucide-react";
import Revelar from "./Revelar";

// ============================================================
// Saia do papel — o antes e o depois (dores reais da oficina).
// ============================================================
// Antes: cartão fantasma apagado. Depois: cartão branco sólido.
// O contraste conta a história sozinho.
// ============================================================

const DORES = [
  "Orçamento no caderno que some na gaveta",
  "Peça aplicada e esquecida na cobrança",
  "Cliente perguntando 'e aí?' sem resposta pronta",
  "Dinheiro recebido controlado só de cabeça",
] as const;

const GANHOS = [
  "Tudo salvo e organizado por cliente e placa",
  "PDF profissional enviado no WhatsApp",
  "Status e pagamento sempre visíveis",
  "Histórico completo pra cobrar sem erro",
] as const;

export default function Dores(): React.JSX.Element {
  return (
    <section aria-label="Saia do papel">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-20">
        <Revelar>
          <h2 className="font-display text-[26px] font-bold tracking-tight text-white sm:text-[30px] lg:text-[36px]">
            Saia do papel e do improviso
          </h2>
          <p className="mt-2 max-w-xl text-[15px] text-slate-300 lg:mt-3 lg:text-[16px]">
            O que muda na rotina da oficina com o sistema organizado.
          </p>
        </Revelar>

        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:gap-6 lg:mt-12 lg:grid-cols-2">
          <Revelar>
            <div className="h-full rounded-xl border border-white/10 bg-white/5 p-5 sm:p-7">
              <p className="text-sm font-semibold text-slate-400">
                Como é hoje na maioria das oficinas
              </p>
              <ul className="mt-5 space-y-4">
                {DORES.map((dor) => (
                  <li key={dor} className="flex items-start gap-3 text-[15px] text-slate-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                      <X className="h-4 w-4 text-red-400" aria-hidden="true" />
                    </span>
                    {dor}
                  </li>
                ))}
              </ul>
            </div>
          </Revelar>

          <Revelar atraso={120}>
            <div className="h-full rounded-xl bg-white p-5 shadow-2xl sm:p-7">
              <p className="text-sm font-semibold text-blue-700">
                Com o OrcaPro, a mesma rotina
              </p>
              <ul className="mt-5 space-y-4">
                {GANHOS.map((ganho) => (
                  <li key={ganho} className="flex items-start gap-3 text-[15px] font-medium text-slate-800">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                    </span>
                    {ganho}
                  </li>
                ))}
              </ul>
            </div>
          </Revelar>
        </div>
      </div>
    </section>
  );
}
