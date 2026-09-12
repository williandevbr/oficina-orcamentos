import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// ============================================================
// Revela o conteúdo com fade-up SÓ quando aparece na tela.
// ============================================================
// Animação de scroll sutil (uma vez só). Sem isso, os blocos
// de baixo animariam no carregamento, sem ninguém ver.
// ============================================================

export default function Revelar({
  children,
  atraso = 0,
  className = "",
}: {
  children: ReactNode;
  atraso?: number;
  className?: string;
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={visivel ? `animate-fade-up ${className}` : `opacity-0 ${className}`}
      style={visivel ? { animationDelay: `${atraso}ms` } : undefined}
    >
      {children}
    </div>
  );
}
