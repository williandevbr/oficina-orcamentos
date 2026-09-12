import { Link } from "react-router-dom";
import Revelar from "./Revelar";

// ============================================================
// Fechamento: painel branco sobre o fundo escuro.
// ============================================================
// O contraste marca o momento da decisão — diferente do hero.
// ============================================================

export default function CtaFinal(): React.JSX.Element {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-6 py-20">
        <Revelar>
          <div className="rounded-2xl bg-white p-8 shadow-2xl sm:p-12">
            <div className="max-w-2xl">
              <h2 className="font-display text-[30px] font-bold tracking-tight text-blue-950 lg:text-[36px]">
                Organize sua oficina a partir de hoje
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
                Crie sua conta, cadastre sua oficina e monte o primeiro orçamento
                em minutos. Sem cartão, sem instalação.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  state={{ modo: "cadastrar" }}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Criar conta gratuita
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-[15px] font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </Revelar>
      </div>
    </section>
  );
}
