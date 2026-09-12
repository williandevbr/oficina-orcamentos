// ============================================================
// Fundo animado da landing: gradiente azul escuro em tela cheia.
// ============================================================
// Fixo na tela (acompanha a rolagem):
// - base em 4 tons de azul marinho
// - 4 manchas derivando em ritmos diferentes (12s/14s/18s/22s)
// - brilho cônico girando bem devagar (36s por volta)
// - pontinhos subindo sem parar (cada um no seu tempo)
// - grade sutil no topo
// ============================================================

const PONTOS = [
  { left: "6%", bottom: "12%", tamanho: 5, atraso: "0s", duracao: "5s" },
  { left: "14%", bottom: "4%", tamanho: 3, atraso: "-2s", duracao: "6.5s" },
  { left: "28%", bottom: "18%", tamanho: 4, atraso: "-4s", duracao: "5.5s" },
  { left: "42%", bottom: "6%", tamanho: 3, atraso: "-1s", duracao: "7s" },
  { left: "55%", bottom: "14%", tamanho: 5, atraso: "-3.5s", duracao: "5s" },
  { left: "68%", bottom: "5%", tamanho: 3, atraso: "-2.5s", duracao: "6s" },
  { left: "79%", bottom: "16%", tamanho: 4, atraso: "-0.5s", duracao: "5.5s" },
  { left: "90%", bottom: "8%", tamanho: 3, atraso: "-3s", duracao: "7s" },
  { left: "22%", bottom: "2%", tamanho: 3, atraso: "-5s", duracao: "6.5s" },
  { left: "61%", bottom: "1%", tamanho: 4, atraso: "-4.5s", duracao: "5s" },
] as const;

export default function FundoAnimado(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0">
      {/* Base: 4 tons de azul marinho */}
      {/* Base um tom mais clara: azul marinho → azul vivo */}
      <div className="absolute inset-0 bg-[linear-gradient(140deg,#10265e_0%,#1e3a8a_35%,#1e40af_65%,#2563eb_100%)]" />

      {/* 4 manchas em ritmos rápidos e diferentes */}
      <div className="absolute -top-40 left-[8%] h-[560px] w-[560px] animate-deriva rounded-full bg-blue-500/40 blur-3xl" />
      <div
        className="absolute right-[5%] top-[30%] h-[480px] w-[480px] animate-deriva rounded-full bg-cyan-400/25 blur-3xl"
        style={{ animationDelay: "-3s", animationDuration: "7s" }}
      />
      <div
        className="absolute -bottom-48 left-[25%] h-[520px] w-[520px] animate-deriva rounded-full bg-blue-400/25 blur-3xl"
        style={{ animationDelay: "-5s", animationDuration: "9s" }}
      />
      <div
        className="absolute -right-40 top-[8%] h-[420px] w-[420px] animate-deriva rounded-full bg-sky-300/20 blur-3xl"
        style={{ animationDelay: "-1.5s", animationDuration: "11s" }}
      />

      {/* Brilho cônico girando devagar */}
      <div className="absolute left-1/2 top-[-30%] h-[900px] w-[900px] -translate-x-1/2 animate-giro bg-[conic-gradient(from_0deg,transparent_0deg,rgba(147,197,253,0.10)_50deg,transparent_110deg,transparent_180deg,rgba(103,232,249,0.08)_240deg,transparent_300deg)] blur-2xl [mask-image:radial-gradient(circle,black_20%,transparent_65%)]" />

      {/* Pontinhos subindo */}
      {PONTOS.map((ponto, i) => (
        <span
          key={i}
          className="absolute animate-subir rounded-full bg-blue-200/60 blur-[1px]"
          style={{
            left: ponto.left,
            bottom: ponto.bottom,
            width: ponto.tamanho,
            height: ponto.tamanho,
            animationDelay: ponto.atraso,
            animationDuration: ponto.duracao,
          }}
        />
      ))}

      {/* Grade sutil no topo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_10%,transparent_70%)]" />
    </div>
  );
}
