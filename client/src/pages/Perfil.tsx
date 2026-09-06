import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Save, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../lib/api";

// ============================================================
// Página de PERFIL (quem usa o sistema)
// ============================================================
// Na primeira entrada o sistema manda para cá criar o perfil.
// Depois serve para trocar o nome quando quiser.
// ============================================================

async function lerJsonSeguro(resp: Response): Promise<any> {
  try {
    return await resp.json();
  } catch {
    return {};
  }
}

export default function Perfil() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [primeiraVez, setPrimeiraVez] = useState(false);

  useEffect(() => {
    const controle = new AbortController();
    (async () => {
      try {
        const resp = await apiFetch("/api/perfil", { signal: controle.signal });
        if (controle.signal.aborted) return;
        if (resp.status === 404) {
          // Nunca criou: onboarding
          setPrimeiraVez(true);
          return;
        }
        const dados = await lerJsonSeguro(resp);
        if (!resp.ok) throw new Error(dados.message || "Não foi possível carregar o perfil.");
        setNome(dados.nome || "");
      } catch (e) {
        if (controle.signal.aborted) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setErro(
          e instanceof Error || e instanceof DOMException
            ? e.message || "Não foi possível carregar o perfil."
            : "Não foi possível carregar o perfil.",
        );
      } finally {
        if (!controle.signal.aborted) setCarregando(false);
      }
    })();
    return () => controle.abort();
  }, []);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (nome.trim().length < 2) {
      setErro("Digite seu nome (mínimo 2 letras).");
      return;
    }
    try {
      setSalvando(true);
      setErro("");
      const resp = await apiFetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim() }),
      });
      const dados = await lerJsonSeguro(resp);
      if (!resp.ok) {
        setErro(dados.message || "Erro ao salvar.");
        return;
      }
      const eraPrimeiraVez = primeiraVez;
      setPrimeiraVez(false);
      toast.success("Perfil salvo!");
      // Avisa o layout para liberar a navegação na hora
      window.dispatchEvent(new Event("perfil-atualizado"));
      // Primeira vez: segue para cadastrar a oficina
      if (eraPrimeiraVez) {
        navigate("/configuracoes");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <User className="h-6 w-6 text-blue-600" />
          Meu perfil
        </h2>
        <p className="text-slate-500">
          {primeiraVez
            ? "Bem-vindo! Conte quem é você para começar."
            : "Quem está usando o sistema."}
        </p>
      </div>

      {primeiraVez && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Primeiro passo concluído aqui — depois cadastre sua oficina em{" "}
          <Link to="/configuracoes" className="font-semibold underline">
            Configurações
          </Link>
          .
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {carregando ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          <form onSubmit={salvar} className="space-y-4">
            <div>
              <label
                htmlFor="perfil-nome"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Seu nome *
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="perfil-nome"
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Carlos Silva"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">
                E-mail (login)
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={usuario?.email || ""}
                  aria-label="E-mail da conta"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-500"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                O e-mail é o seu login e não pode ser trocado por aqui.
              </p>
            </div>

            {erro && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {erro}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/configuracoes"
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Store className="h-4 w-4" />
                Dados da oficina
              </Link>
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {salvando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {salvando ? "Salvando..." : "Salvar perfil"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
