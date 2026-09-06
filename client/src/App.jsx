import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Menu } from "lucide-react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import ExigirLogin from "./components/ExigirLogin.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import Orcamentos from "./pages/Orcamentos.jsx";
import Catalogo from "./pages/Catalogo.jsx";
import Perfil from "./pages/Perfil.jsx";
import Configuracoes from "./pages/Configuracoes.jsx";
import NotFound from "./pages/NotFound.jsx";
import { apiFetch } from "./lib/api.js";

// Estrutura das páginas internas (menu lateral + conteúdo).
// No celular o menu vira drawer; no desktop ele recolhe/expande
// pelo botão de 3 tracinhos (hambúrguer) no topo.
function LayoutAutenticado() {
  const { usuario } = useAuth();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false); // drawer (celular)
  const [recolhido, setRecolhido] = useState(false); // menu escondido (desktop)
  const [perfilOk, setPerfilOk] = useState(null); // null = checando

  // Onboarding: na primeira entrada (sem perfil) manda criar o perfil
  useEffect(() => {
    let ativo = true;

    async function verificarPerfil() {
      try {
        const resp = await apiFetch("/api/perfil");
        if (!ativo) return;
        if (resp.status === 404) {
          setPerfilOk(false);
          return;
        }
        const dados = await resp.json().catch(() => ({}));
        setPerfilOk(Boolean(dados?.nome));
      } catch {
        // Sem conexão: não trava o sistema (tenta de novo no próximo login)
        if (ativo) setPerfilOk(true);
      }
    }

    verificarPerfil();

    // A página de perfil avisa quando salva (para liberar na hora).
    // Liberação otimista: acabou de salvar, então libera de imediato
    // e confirma com o servidor em seguida (evita piscar de tela).
    function aoAtualizar() {
      setPerfilOk(true);
      verificarPerfil();
    }
    window.addEventListener("perfil-atualizado", aoAtualizar);
    return () => {
      ativo = false;
      window.removeEventListener("perfil-atualizado", aoAtualizar);
    };
  }, [usuario]);

  // Sem perfil e fora da página de perfil -> vai criar o perfil
  if (perfilOk === false && location.pathname !== "/perfil") {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar
        aberto={menuAberto}
        aoFechar={() => setMenuAberto(false)}
        recolhido={recolhido}
        aoRecolher={() => setRecolhido(true)}
      />
      <div
        className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${
          recolhido ? "lg:ml-0" : "lg:ml-64"
        }`}
      >
        {/* Barra do topo com o botão de 3 tracinhos.
            Ele só aparece quando o menu está escondido:
            no celular some com o menu aberto; no computador
            some com o menu visível (para fechar, use o X do menu). */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 p-4 backdrop-blur">
          <button
            type="button"
            onClick={() => {
              // No celular abre o menu; no computador mostra o menu
              if (window.innerWidth < 1024) {
                setMenuAberto(true);
              } else {
                setRecolhido(false);
              }
            }}
            aria-label="Mostrar menu"
            aria-controls="menu-lateral"
            title="Mostrar menu"
            className={`rounded-lg border border-slate-300 p-2 text-slate-600 transition-all duration-300 hover:rotate-90 hover:bg-slate-50 active:scale-95 ${
              menuAberto ? "hidden" : recolhido ? "" : "lg:hidden"
            }`}
          >
            <Menu className="h-5 w-5" />
          </button>
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
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              {/* Rota desconhecida com login: página 404 dentro do layout */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
