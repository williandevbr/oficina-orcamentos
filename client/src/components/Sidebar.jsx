import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Wrench } from "lucide-react";

// Lista de itens do menu.
// Cada item tem: o caminho (to), o texto (label) e um ícone.
const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/orcamentos", label: "Orçamentos", icon: FileText },
];

// Sidebar = menu lateral azul escuro.
// NavLink marca visualmente o item que está selecionado.
export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-blue-950 text-white">
      {/* Logo do sistema */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold">OrcaPro</h1>
          <p className="text-xs text-blue-300">Orçamentos para oficinas</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="mt-2 flex flex-col gap-1 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-blue-200 hover:bg-blue-900 hover:text-white"
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé da sidebar */}
      <div className="mt-auto px-6 py-5 text-xs text-blue-400">
        v0.1.0 — em desenvolvimento
      </div>
    </aside>
  );
}
