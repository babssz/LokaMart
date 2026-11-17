export default function StatCard({ label, value, unit, change, vs, icon: Icon }) {
  const stable = change == null || change === 0;
  const tone = stable ? "text-neutral-500" : change > 0 ? "text-emerald-700" : "text-red-700";
  const pct = stable ? "" : `${change > 0 ? "▲ +" : "▼ "}${change.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;

  return (
    <div className="rounded-sm border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-blush text-maroon">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-2 text-xl font-bold text-neutral-900">
        {value} {unit && <span className="text-xs font-semibold text-neutral-500">{unit}</span>}
      </p>
      <p className={`mt-1 text-[10px] font-semibold ${tone}`}>
        {stable ? "● Stabil" : pct} <span className="font-normal text-neutral-400">{vs}</span>
      </p>
    </div>
  );
}