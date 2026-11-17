export default function StatCard({ title, value, icon: Icon, accent = 'brand', hint }) {
  const accents = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="card p-5 transition hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accents[accent]}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
