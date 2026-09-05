import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Link,
} from "react-router-dom";
import { Menu } from "lucide-react";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ExigirLogin from "./components/ExigirLogin.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import Orcamentos from "./pages/Orcamentos.jsx";
import NotFound from "./pages/NotFound.jsx";

// Estrutura das páginas internas (menu lateral + conteúdo)
// No celular o menu vira drawer; no desktop fica fixo.
function LayoutAutenticado() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar
        aberto={menuAberto}
        aoFechar={() => setMenuAberto(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        {/* Barra mobile com hamburger */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 p-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            aria-controls="menu-lateral"
            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="text-base font-bold text-slate-900">
            OrcaPro
          </Link>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// App = o "esqueleto" do sistema.
// O BrowserRouter controla a navegação entre páginas
// (igual trocar de aba, mas sem recarregar o site).
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="top-right" closeButton />
        <Routes>
          {/* Página de login é pública */}
          <Route path="/login" element={<Login />} />

          {/* Todas as demais páginas só abrem com login */}
          <Route element={<ExigirLogin />}>
            <Route element={<LayoutAutenticado />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/orcamentos" element={<Orcamentos />} />
              {/* Rota desconhecida com login: página 404 dentro do layout */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
