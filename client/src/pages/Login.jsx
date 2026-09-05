import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  Wrench,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

// ============================================================
// Tela de LOGIN / CRIAR CONTA
// ============================================================
// Duas abas: "Entrar" para quem já tem conta e
// "Criar conta" para o primeiro acesso.
// ============================================================

const abas = [
  { id: "entrar", label: "Entrar", icon: LogIn },
  { id: "cadastrar", label: "Criar conta", icon: UserPlus },
];

export default function Login() {
  const { usuario, carregandoSessao, entrar, cadastrar, recuperarSenha } =
    useAuth();
  const location = useLocation();
  const destino = location.state?.from || "/";

  const [aba, setAba] = useState("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [msgErro, setMsgErro] = useState("");
  const [msgOk, setMsgOk] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // Se já está logado, volta para onde veio (evita login duplicado)
  if (!carregandoSessao && usuario) {
    return <Navigate to={destino} replace />;
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    setMsgErro("");
    setMsgOk("");
    setOcupado(true);

    try {
      if (aba === "entrar") {
        await entrar(email.trim(), senha);
      } else {
        const resultado = await cadastrar(email.trim(), senha);
        if (!resultado?.session) {
          // A conta foi criada, mas o Supabase pede confirmação por e-mail
          setMsgOk(
            "Conta criada! Enviamos um e-mail de confirmação. Abra sua caixa de entrada, clique no link e depois entre com seus dados.",
          );
          setSenha("");
          setAba("entrar");
        }
      }
    } catch (erro) {
      setMsgErro(erro.message);
    } finally {
      setOcupado(false);
    }
  }

  async function aoRecuperarSenha() {
    if (!email.trim()) {
      setMsgErro("Digite seu e-mail para enviarmos o link de recuperação.");
      return;
    }
    setMsgErro("");
    setMsgOk("");
    setOcupado(true);
    try {
      await recuperarSenha(email.trim());
      setMsgOk("Enviamos um link de recuperação para o seu e-mail.");
    } catch (erro) {
      setMsgErro(erro.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">OrcaPro</h1>
          <p className="text-sm text-blue-200">Acesso restrito à equipe</p>
        </div>

        {/* Cartão */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {/* Abas */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-blue-50 p-1">
            {abas.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAba(item.id);
                  setMsgErro("");
                  setMsgOk("");
                }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  aba === item.id
                    ? "bg-blue-600 text-white shadow"
                    : "text-blue-700 hover:bg-blue-100"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={aoEnviar} className="space-y-4">
            {/* E-mail */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@oficina.com"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="login-senha"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-senha"
                  name="password"
                  type={mostrarSenha ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={
                    aba === "entrar" ? "current-password" : "new-password"
                  }
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {msgErro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {msgErro}
              </div>
            )}

            {msgOk && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {msgOk}
              </div>
            )}

            <button
              type="submit"
              disabled={ocupado}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {ocupado ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {aba === "entrar" ? "Entrar no sistema" : "Criar minha conta"}
            </button>
          </form>

          {aba === "entrar" && (
            <button
              type="button"
              onClick={aoRecuperarSenha}
              className="mt-4 w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Esqueci minha senha
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-blue-200">
          OrcaPro — sistema de orçamentos para oficinas
        </p>
      </div>
    </div>
  );
}
