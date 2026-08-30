import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

// ============================================================
// Contexto de AUTENTICAÇÃO
// ============================================================
// Guarda quem está logado e oferece as ações: entrar, cadastrar e sair.
// Qualquer componente que queira saber o usuário usa useAuth().
// ============================================================

const AuthContext = createContext(null);

// Transforma mensagens do Supabase em português amigável
function traduzirErroAuth(mensagem) {
  if (/invalid login credentials/i.test(mensagem)) {
    return "E-mail ou senha incorretos.";
  }
  if (/already registered/i.test(mensagem)) {
    return "Este e-mail já está cadastrado. Use a aba Entrar.";
  }
  if (/email not confirmed/i.test(mensagem)) {
    return "Confirme seu e-mail antes de entrar (veja sua caixa de entrada).";
  }
  if (/rate limit/i.test(mensagem)) {
    return "Muitas tentativas seguidas. Espere um pouco e tente novamente.";
  }
  if (/password should be at least/i.test(mensagem)) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  return mensagem || "Não foi possível continuar.";
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  // Ao abrir o site, verifica se já existe uma sessão salva
  // (quem já entrou antes continua logado depois de fechar o app)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null);
      setCarregandoSessao(false);
    });

    // Fica ouvindo mudanças na sessão (login, logout, expiração)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {
        setUsuario(sessao?.user ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function entrar(email, senha) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) throw new Error(traduzirErroAuth(error.message));
  }

  async function cadastrar(email, senha) {
    // O Supabase pode responder de duas formas:
    // 1) usuário já logado direto (confirmação de e-mail desligada)
    // 2) usuário criado, aguardando confirmar a conta pelo e-mail (session vem nula)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });
    if (error) throw new Error(traduzirErroAuth(error.message));
    return data;
  }

  async function recuperarSenha(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(traduzirErroAuth(error.message));
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregandoSessao,
        entrar,
        cadastrar,
        recuperarSenha,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  }
  return contexto;
}
