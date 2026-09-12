import { Check, FileText, Users } from "lucide-react";
import Revelar from "./Revelar";

// ============================================================
// Recursos — dois cartões: orçamentos + clientes e veículos.
// ============================================================
// O cartão de orçamentos fica branco sólido (destaque); o de
// clientes acompanha o fundo escuro. Só recursos reais.
// ============================================================

const ITENS_ORCAMENTO = [
  "Peças, serviços e mão de obra no mesmo documento",
  "Desconto e validade em dias calculados sozinhos",
  "PDF com nome, telefone e CNPJ da oficina",
  "Status e controle de recebido e pendente",
  "Mão de obra como item separado no orçamento",
  "Busca rápida por nome do cliente ou placa",
] as const;

export default function Recursos(): React.JSX.Element {
  return (
    <section id="recursos">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <Revelar className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-300">O sistema</p>
          <h2 className="mt-2 font-display text-[30px] font-bold tracking-tight text-white lg:text-[36px]">
            Tudo da oficina num só lugar
          </h2>
          <p className="mt-3 text-[16px] text-slate-300">
            Orçamentos e clientes conectados — sem planilha no meio.
          </p>
        </Revelar>

        <div className="mt-12 grid gap-6 lg:grid-cols-5">
          <Revelar className="lg:col-span-3" atraso={0}>
            <article
              id="orcamentos"
              className="flex h-full scroll-mt-24 flex-col rounded-xl bg-white p-7 shadow-2xl lg:p-8"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-700">
                <FileText className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-blue-950">
                Orçamentos profissionais
              </h3>
              <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {ITENS_ORCAMENTO.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-lg bg-slate-50 p-4 font-mono text-[13px]">
                <div className="flex justify-between border-b border-dotted border-slate-200 py-1.5">
                  <span className="text-slate-500">Nº 0007 — Gol 1.6</span>
                  <span className="font-semibold text-slate-900">R$ 1.240,00</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Nº 0008 — CG 160</span>
                  <span className="font-semibold text-slate-900">R$ 480,00</span>
                </div>
              </div>
            </article>
          </Revelar>

          <Revelar className="lg:col-span-2" atraso={120}>
            <article
              id="clientes"
              className="flex h-full scroll-mt-24 flex-col rounded-xl border border-white/10 bg-white/5 p-7 text-white lg:p-8"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                <Users className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
                Seus clientes e veículos
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Cadastre cliente com nome e telefone. Adicione quantos veículos
                quiser, cada um com placa. Na hora de montar o orçamento, busque
                pela placa e o cadastro aparece sozinho.
              </p>
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5">
                  <span className="font-mono text-sm font-semibold text-white">ABC-1234</span>
                  <span className="text-xs text-slate-300">Gol 1.6 — João</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5">
                  <span className="font-mono text-sm font-semibold text-white">DEF-5678</span>
                  <span className="text-xs text-slate-300">CG 160 — Maria</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Histórico completo de orçamentos por cliente e por veículo.
              </p>
            </article>
          </Revelar>
        </div>
      </div>
    </section>
  );
}
