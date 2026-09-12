import { irPara } from "../../utils/rolar";

const PRODUCT_LINKS = [
  { label: "Recursos", id: "recursos" },
  { label: "Como funciona", id: "como-funciona" },
] as const;

const HELP_LINKS = [{ label: "FAQ", id: "faq" }] as const;

// ============================================================
// Rodapé enxuto: navegação + direitos. Sem logo, sem botões.
// ============================================================

export default function Footer(): React.JSX.Element {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">
            Sistema de gestão de orçamentos para oficinas mecânicas.
          </p>

          <div className="flex gap-16">
            <nav aria-label="Produto">
              <p className="text-sm font-semibold text-white">Produto</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        irPara(link.id);
                      }}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Ajuda">
              <p className="text-sm font-semibold text-white">Ajuda</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {HELP_LINKS.map((link) => (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        irPara(link.id);
                      }}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="/login"
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    Entrar
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-slate-500">
          © 2026 — Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
