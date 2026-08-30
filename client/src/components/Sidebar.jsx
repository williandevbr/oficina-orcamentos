import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Wrench, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

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
  const { usuario, sair } = useAuth();

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

      {/* Usuário logado + sair */}
      <div className="mt-auto border-t border-blue-900 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {usuario?.email}
            </p>
            <p className="text-xs text-blue-400">Logado</p>
          </div>
          <button
            onClick={sair}
            title="Sair"
            className="rounded-lg p-2 text-blue-300 transition-colors hover:bg-blue-900 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
