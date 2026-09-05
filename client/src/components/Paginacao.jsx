// Paginação simples e reutilizável (Clientes + Orçamentos).
export default function Paginacao({ pagina, totalPaginas, total, inicio, fim, aoMudar }) {
  if (total === 0) return null;
  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-sm text-slate-500 sm:flex-row">
      <span>
        Mostrando {inicio}–{fim} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pagina <= 1}
          onClick={() => aoMudar(pagina - 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Pág {pagina}/{totalPaginas}
        </span>
        <button
          type="button"
          disabled={pagina >= totalPaginas}
          onClick={() => aoMudar(pagina + 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
