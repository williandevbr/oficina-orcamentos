import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Wrench, X } from "lucide-react";
import { irPara } from "../../utils/rolar";

const NAV_LINKS = [
  { label: "Recursos", id: "recursos" },
  { label: "Como funciona", id: "como-funciona" },
  { label: "FAQ", id: "faq" },
] as const;

export default function Navbar(): React.JSX.Element {
  const [open, setOpen] = useState<boolean>(false);

  function closeMenu(): void {
    setOpen(false);
  }

  return (
    <header className="animate-queda sticky top-0 z-50 border-b border-white/10 bg-blue-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a
          href="#topo"
          onClick={(e) => {
            e.preventDefault();
            irPara("topo");
          }}
          className="flex items-center gap-2.5" aria-label="OrcaPro — voltar ao topo">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Wrench className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            OrcaPro
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                irPara(link.id);
              }}
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Entrar
          </Link>
          <Link
            to="/login"
            state={{ modo: "cadastrar" }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-[0.98]"
          >
            Cadastrar
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 lg:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-blue-950 px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Navegação móvel">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  irPara(link.id);
                }}
                className="rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2.5 border-t border-white/10 pt-4">
              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10 active:scale-[0.99]"
              >
                Entrar
              </Link>
              <Link
                to="/login"
                state={{ modo: "cadastrar" }}
                onClick={closeMenu}
                className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-[0.99]"
              >
                Cadastrar
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
