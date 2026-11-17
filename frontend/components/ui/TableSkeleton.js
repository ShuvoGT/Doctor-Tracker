export default function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="animate-pulse p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-slate-100 py-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 rounded bg-slate-200"
              style={{ width: `${100 / cols - 4}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
