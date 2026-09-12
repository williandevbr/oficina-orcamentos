import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { irPara } from "../../utils/rolar";
import HeroVisual from "./HeroVisual";

export default function Hero(): React.JSX.Element {
  return (
    <section id="topo" className="relative">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.08fr_1fr] lg:items-center lg:gap-16 lg:pb-32 lg:pt-24">
        <div>
          <h1
            className="animate-fade-up font-display text-[34px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[42px] sm:leading-[1.06] lg:text-[58px]"
            style={{ animationDelay: "50ms" }}
          >
            Orçamentos profissionais para sua oficina
          </h1>

          <p
            className="animate-fade-up mt-4 max-w-lg text-[16px] leading-relaxed text-slate-300 lg:mt-5 lg:text-[17px]"
            style={{ animationDelay: "150ms" }}
          >
            Monte o orçamento com peças, serviços e mão de obra, gere o PDF
            com a marca da oficina e mande no WhatsApp do cliente. Tudo com
            placa, status e controle de pagamento.
          </p>

          <div
            className="animate-fade-up mt-7 flex flex-col gap-2.5 sm:flex-row sm:gap-3 lg:mt-8"
            style={{ animationDelay: "250ms" }}
          >
            <Link
              to="/login"
              state={{ modo: "cadastrar" }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-900/50 transition-colors hover:bg-blue-500 active:scale-[0.98]"
            >
              Criar conta gratuita
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#recursos"
              onClick={(e) => {
                e.preventDefault();
                irPara("recursos");
              }}
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 active:scale-[0.98]"
            >
              Ver recursos
            </a>
          </div>

          <p
            className="animate-fade-up mt-6 text-sm text-slate-400"
            style={{ animationDelay: "350ms" }}
          >
            Sem cartão de crédito. Sem instalação. Acesse pelo celular ou computador.
          </p>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
