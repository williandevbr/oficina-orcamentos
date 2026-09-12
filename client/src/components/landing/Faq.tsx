import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Revelar from "./Revelar";

type Pergunta = {
  pergunta: string;
  resposta: string;
};

const perguntas: Pergunta[] = [
  {
    pergunta: "Preciso instalar alguma coisa?",
    resposta: "Não. Roda no navegador do celular e do computador.",
  },
  {
    pergunta: "Funciona no celular?",
    resposta: "Sim, o sistema inteiro foi feito para usar no balcão pelo celular.",
  },
  {
    pergunta: "Esqueci minha senha, e agora?",
    resposta:
      'Na tela de login, toque em "Esqueceu a senha?" e siga o e-mail.',
  },
  {
    pergunta: "O primeiro acesso demora?",
    resposta:
      "O servidor gratuito pode levar até 1 minuto para acordar no primeiro acesso do dia; depois anda normal.",
  },
  {
    pergunta: "Meus dados se misturam com os de outra oficina?",
    resposta: "Não. Cada login enxerga só os próprios clientes e orçamentos.",
  },
  {
    pergunta: "Como o cliente recebe o orçamento?",
    resposta: "Você baixa o PDF e manda no WhatsApp com um toque.",
  },
  {
    pergunta: "Em quais aparelhos funciona?",
    resposta:
      "Em qualquer um com navegador: celular, tablet e computador, sem instalar nada.",
  },
  {
    pergunta: "E se eu trocar de celular?",
    resposta:
      "É só entrar com seu e-mail e senha no aparelho novo. Tudo fica salvo na nuvem.",
  },
];

export default function Faq(): React.JSX.Element {
  const [aberto, setAberto] = useState<number | null>(0);

  function alternar(indice: number): void {
    setAberto((atual) => (atual === indice ? null : indice));
  }

  return (
    <section id="faq">
      <Revelar className="mx-auto max-w-3xl px-5 py-14 sm:px-6 lg:py-20">
        <p className="text-sm font-semibold text-blue-300">Perguntas frequentes</p>
        <h2 className="mt-2 font-display text-[26px] font-bold tracking-tight text-white sm:text-[30px]">
          O essencial sobre o acesso e o dia a dia
        </h2>

        <div className="mt-8 lg:mt-10">
          {perguntas.map((item, indice) => {
            const estaAberto = aberto === indice;
            return (
              <div key={item.pergunta} className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => alternar(indice)}
                  aria-expanded={estaAberto}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-semibold text-white"
                >
                  {item.pergunta}
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                      estaAberto ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {estaAberto && (
                  <p className="pb-5 text-[15px] leading-relaxed text-slate-300">
                    {item.resposta}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Revelar>
    </section>
  );
}
