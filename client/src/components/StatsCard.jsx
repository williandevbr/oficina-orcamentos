// Card pequeno usado no Dashboard para mostrar números importantes.
// Recebe: título, valor, um ícone e uma cor de destaque.
export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = "blue",
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    orange: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
