import type { FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import AuthField from "./auth/AuthField";
import TextInput from "./auth/TextInput";
import PrimaryButton from "./auth/PrimaryButton";

type Modo = "entrar" | "cadastrar";

interface LoginFormProps {
  modo: Modo;
  email: string;
  senha: string;
  mostrarSenha: boolean;
  msgErro: string;
  msgOk: string;
  ocupado: boolean;
  onEmail(v: string): void;
  onSenha(v: string): void;
  onMostrarSenha(): void;
  onTrocarModo(m: Modo): void;
  onEnviar(e: FormEvent<HTMLFormElement>): void;
  onRecuperarSenha(): void;
}

export default function LoginForm({
  modo,
  email,
  senha,
  mostrarSenha,
  msgErro,
  msgOk,
  ocupado,
  onEmail,
  onSenha,
  onMostrarSenha,
  onTrocarModo,
  onEnviar,
  onRecuperarSenha,
}: LoginFormProps) {
  const entrando = modo === "entrar";

  return (
    <div className="w-full max-w-[400px]">
      {/* Título */}
      <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
        <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">
          {entrando ? "Bem-vindo de volta." : "Crie sua conta"}
        </h1>
        <p className="mb-8 mt-2 text-[15px] text-slate-500">
          {entrando
            ? "Entre na sua conta para continuar."
            : "Leva menos de 1 minuto."}
        </p>
      </div>

      <form onSubmit={onEnviar} className="space-y-5">
        {/* E-mail */}
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <AuthField id="login-email" label="E-mail">
            <TextInput
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              disabled={ocupado}
              value={email}
              onChange={(e) => onEmail(e.target.value)}
              placeholder="voce@oficina.com"
              icone={<Mail className="h-5 w-5" />}
              comErro={Boolean(msgErro)}
            />
          </AuthField>
        </div>

        {/* Senha */}
        <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
          <AuthField
            id="login-senha"
            label="Senha"
            ladoDireito={
              entrando ? (
                <button
                  type="button"
                  onClick={onRecuperarSenha}
                  disabled={ocupado}
                  className="text-[13px] font-medium text-blue-600 transition-colors hover:text-blue-800 disabled:opacity-60"
                >
                  Esqueceu a senha?
                </button>
              ) : undefined
            }
          >
            <div className="relative">
              <TextInput
                id="login-senha"
                name="password"
                type={mostrarSenha ? "text" : "password"}
                required
                minLength={6}
                autoComplete={entrando ? "current-password" : "new-password"}
                disabled={ocupado}
                value={senha}
                onChange={(e) => onSenha(e.target.value)}
                placeholder="Sua senha"
                comErro={Boolean(msgErro)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={onMostrarSenha}
                disabled={ocupado}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-60"
              >
                {mostrarSenha ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </AuthField>
        </div>

        {/* Avisos */}
        {msgErro && (
          <div
            key={msgErro}
            role="alert"
            aria-live="polite"
            className="animate-shake rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {msgErro}
          </div>
        )}

        {msgOk && (
          <div
            role="status"
            aria-live="polite"
            className="animate-fade-up rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {msgOk}
          </div>
        )}

        {/* CTA único */}
        <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
          <PrimaryButton type="submit" disabled={ocupado} carregando={ocupado}>
            {ocupado ? (
              entrando ? (
                "Entrando…"
              ) : (
                "Criando…"
              )
            ) : (
              <>
                {entrando ? "Entrar no OrcaPro" : "Criar minha conta"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </PrimaryButton>
        </div>
      </form>

      {/* Linha secundária */}
      <p
        className="animate-fade-up mt-6 text-center text-sm text-slate-500"
        style={{ animationDelay: "240ms" }}
      >
        {entrando ? (
          <>
            Novo por aqui?{" "}
            <button
              type="button"
              onClick={() => onTrocarModo("cadastrar")}
              disabled={ocupado}
              className="font-semibold text-blue-600 transition-colors hover:text-blue-800 disabled:opacity-60"
            >
              Criar conta
            </button>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <button
              type="button"
              onClick={() => onTrocarModo("entrar")}
              disabled={ocupado}
              className="font-semibold text-blue-600 transition-colors hover:text-blue-800 disabled:opacity-60"
            >
              Entrar
            </button>
          </>
        )}
      </p>
    </div>
  );
}
