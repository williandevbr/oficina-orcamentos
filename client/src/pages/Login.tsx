import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Wrench } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/LoginForm";

// ============================================================
// Tela de LOGIN / CRIAR CONTA
// ============================================================
// Cartão branco centralizado sobre gradiente azul animado.
// Sem painel lateral: a mesma composição no celular e no
// computador. A lógica de autenticação fica aqui; o visual
// do formulário está em LoginForm.
// ============================================================

type Modo = "entrar" | "cadastrar";

export default function Login() {
  const { usuario, carregandoSessao, entrar, cadastrar, recuperarSenha } =
    useAuth();
  const location = useLocation();
  const destino =
    (location.state as { from?: string } | null)?.from || "/app";

  const [modo, setModo] = useState<Modo>(() => {
    // Quem vem da landing escolhe direto: Cadastrar ou Entrar
    const peloEstado = (location.state as { modo?: Modo } | null)?.modo;
    if (peloEstado === "cadastrar" || peloEstado === "entrar") return peloEstado;
    const pelaUrl = new URLSearchParams(location.search).get("modo");
    return pelaUrl === "cadastrar" ? "cadastrar" : "entrar";
  });
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

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsgErro("");
    setMsgOk("");
    setOcupado(true);

    try {
      if (modo === "entrar") {
        await entrar(email.trim(), senha);
      } else {
        const resultado = await cadastrar(email.trim(), senha);
        if (!resultado?.session) {
          // A conta foi criada, mas o Supabase pede confirmação por e-mail
          setMsgOk(
            "Conta criada! Enviamos um e-mail de confirmação. Abra sua caixa de entrada, clique no link e depois entre com seus dados.",
          );
          setSenha("");
          setModo("entrar");
        }
      }
    } catch (erro) {
      setMsgErro(erro instanceof Error ? erro.message : "Não foi possível continuar.");
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
      setMsgErro(erro instanceof Error ? erro.message : "Não foi possível continuar.");
    } finally {
      setOcupado(false);
    }
  }

  function trocarModo(novo: Modo) {
    setModo(novo);
    setMsgErro("");
    setMsgOk("");
    setMostrarSenha(false);
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-blue-950 px-4 py-10">
      {/* Gradiente azul animado de fundo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#172554_0%,#1e3a8a_50%,#1d4ed8_100%)]" />
        <div className="absolute -top-32 left-[12%] h-[420px] w-[420px] animate-deriva rounded-full bg-blue-500/30 blur-3xl" />
        <div
          className="absolute -bottom-32 right-[8%] h-[380px] w-[380px] animate-deriva rounded-full bg-cyan-400/20 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black_20%,transparent_75%)]" />
      </div>

      <main className="relative w-full max-w-[440px]">
        <div className="animate-fade-up rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
          {/* Marca centralizada no topo do cartão */}
          <div className="mb-8 flex items-center justify-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700">
              <Wrench className="h-5 w-5 text-white" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-blue-950">
              OrcaPro
            </span>
          </div>

          <LoginForm
            modo={modo}
            email={email}
            senha={senha}
            mostrarSenha={mostrarSenha}
            msgErro={msgErro}
            msgOk={msgOk}
            ocupado={ocupado}
            onEmail={setEmail}
            onSenha={setSenha}
            onMostrarSenha={() => setMostrarSenha((v) => !v)}
            onTrocarModo={trocarModo}
            onEnviar={aoEnviar}
            onRecuperarSenha={aoRecuperarSenha}
          />
        </div>

        <p className="mt-6 text-center text-sm text-blue-200/70">
          <Link to="/" className="transition-colors hover:text-white">
            ← Voltar ao início
          </Link>
        </p>
      </main>
    </div>
  );
}
