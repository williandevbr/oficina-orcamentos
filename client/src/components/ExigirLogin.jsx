import { Navigate, Outlet } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

// ============================================================
// Porteiro do site
// ============================================================
// Envolve as páginas que exigem login.
// - Enquanto checa a sessão -> mostra um carregando
// - Sem usuário logado -> manda para a tela de login
// - Logado -> libera a página (contéudo da rota)
// ============================================================
export default function ExigirLogin() {
  const { usuario, carregandoSessao } = useAuth();

  if (carregandoSessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-950">
        <div className="flex flex-col items-center gap-3 text-blue-300">
          <Lock className="h-8 w-8 animate-pulse" />
          <p className="text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
