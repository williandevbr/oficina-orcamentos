import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ExigirLogin from "./components/ExigirLogin.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import Orcamentos from "./pages/Orcamentos.jsx";

// Estrutura das páginas internas (menu lateral + conteúdo)
function LayoutAutenticado() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
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
        <Routes>
          {/* Página de login é pública */}
          <Route path="/login" element={<Login />} />

          {/* Todas as demais páginas só abrem com login */}
          <Route element={<ExigirLogin />}>
            <Route element={<LayoutAutenticado />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/orcamentos" element={<Orcamentos />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
