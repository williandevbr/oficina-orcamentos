import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import Orcamentos from "./pages/Orcamentos.jsx";

// App = o "esqueleto" do sistema.
// O BrowserRouter controla a navegação entre páginas
// (igual trocar de aba, mas sem recarregar o site).
export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* Menu lateral azul (fica fixo no lado esquerdo) */}
        <Sidebar />

        {/* Área principal: muda conforme a página selecionada */}
        <main className="ml-64 flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/orcamentos" element={<Orcamentos />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
