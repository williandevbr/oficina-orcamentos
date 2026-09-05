// Skeleton de carregamento (evita tela vazia / texto seco "Carregando...")
export function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
  );
}

export function SkeletonTabela({ linhas = 5, colunas = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-3 p-5">
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} className="flex gap-3">
            {Array.from({ length: colunas }).map((_, j) => (
              <Skeleton key={j} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-8 w-1/3" />
        </div>
      ))}
    </div>
  );
}
