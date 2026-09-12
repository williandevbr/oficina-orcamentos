import Revelar from "./Revelar";

// ============================================================
// Como funciona — fluxo real, sem frases genéricas.
// ============================================================
// Layout linear à esquerda: número vazado + conteúdo.
// ============================================================

const PASSOS = [
  {
    numero: "01",
    titulo: "Cadastre a oficina uma vez só",
    detalhes: [
      "Nome, endereço e CNPJ saem em todo PDF",
      "WhatsApp da oficina fica no rodapé do documento",
      "Dados ficam salvos — não precisa digitar de novo",
    ],
  },
  {
    numero: "02",
    titulo: "Cadastre clientes e veículos",
    detalhes: [
      "Nome e telefone do cliente",
      "Veículos com placa, modelo e ano",
      "Busca por placa ou nome — achou na hora",
    ],
  },
  {
    numero: "03",
    titulo: "Monte o orçamento",
    detalhes: [
      "Puxe peças e serviços do catálogo",
      "Adicione mão de obra como item separado",
      "Aplique desconto e defina validade em dias",
      "O total calcula sozinho",
    ],
  },
  {
    numero: "04",
    titulo: "Gere o PDF e mande no WhatsApp",
    detalhes: [
      "O PDF sai com sua marca, CNPJ e telefone",
      "Mande direto pelo WhatsApp do cliente",
      "O orçamento aparece com número, placa e status",
    ],
  },
  {
    numero: "05",
    titulo: "Acompanhe o pagamento",
    detalhes: [
      "Marque como recebido ou pendente",
      "Veja no painel o total recebido e o que falta",
      "Filtre por status — só recebidos ou só pendentes",
    ],
  },
];

export default function ComoFunciona(): React.JSX.Element {
  return (
    <section id="como-funciona">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-20">
        <Revelar>
          <p className="text-sm font-semibold text-blue-300">Fluxo completo</p>
          <h2 className="mt-2 font-display text-[26px] font-bold tracking-tight text-white sm:text-[30px] lg:text-[36px]">
            Do cadastro ao recebimento em 5 passos
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] text-slate-300 lg:mt-3 lg:text-[16px]">
            Cada etapa é o que você realmente faz no sistema. Sem etapa
            inventada, sem redundância.
          </p>
        </Revelar>

        <div className="mt-8 space-y-0 lg:mt-14">
          {PASSOS.map((passo, i) => (
            <Revelar key={passo.numero} atraso={i * 80}>
              <div className="grid gap-3 border-b border-white/10 py-6 md:grid-cols-[120px_1fr] md:gap-10 md:py-8">
                <span className="font-display text-[32px] font-extrabold leading-none text-white/10 md:text-[40px]">
                  {passo.numero}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {passo.titulo}
                  </h3>
                  <ul className="mt-3 space-y-1.5">
                    {passo.detalhes.map((detalhe) => (
                      <li key={detalhe} className="flex items-start gap-2.5 text-[15px] text-slate-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
                        {detalhe}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Revelar>
          ))}
        </div>
      </div>
    </section>
  );
}
