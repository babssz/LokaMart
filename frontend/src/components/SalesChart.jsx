import { shortRupiah } from "../utils/seller";

const BAR_AREA = 160; 
export default function SalesChart({ title, subtitle, data, onDownload }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.current, d.previous]));
  const peak = data.reduce((best, d, i) => (d.current > data[best].current ? i : best), 0);
  const showValues = data.length <= 7;
  const summary = data.map((d) => `${d.label}: ${shortRupiah(d.current)}`).join(", ");

  return (
    <section className="rounded-sm border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
          <p className="mt-0.5 text-[11px] text-neutral-500">{subtitle}</p>
        </div>
        <ul className="flex items-center gap-3 text-[10px] text-neutral-600">
          <li className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-maroon-dark" /> Omzet periode ini
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-stone-300" /> Periode sebelumnya
          </li>
        </ul>
      </div>

      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">Belum ada data penjualan pada periode ini.</p>
      ) : (
        <div className="mt-5 flex items-end gap-2 sm:gap-4" role="img" aria-label={`${title}. ${summary}`}>
          {data.map((d, i) => (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center">
              {showValues && <p className="mb-1 max-w-full truncate text-[10px] font-semibold text-neutral-700">{shortRupiah(d.current)}</p>}
              <div className="flex items-end justify-center gap-1" style={{ height: BAR_AREA }}>
                <div className="w-3 bg-stone-300 sm:w-5" style={{ height: Math.max(2, Math.round((d.previous / max) * BAR_AREA)) }} title={`Sebelumnya: ${shortRupiah(d.previous)}`} />
                <div
                  className={"w-3 sm:w-5 " + (i === peak ? "bg-maroon-dark" : "bg-maroon/75")}
                  style={{ height: Math.max(2, Math.round((d.current / max) * BAR_AREA)) }}
                  title={`${d.label}: ${shortRupiah(d.current)}`}
                />
              </div>
              <p className="mt-2 max-w-full truncate text-[10px] text-neutral-500">{d.label}</p>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={onDownload} className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-maroon hover:underline">
        Unduh rekap CSV ↓
      </button>
    </section>
  );
}