import { shortRupiah } from "../utils/seller";

const BAR_AREA = 160;

export default function SalesChart({ title, subtitle, data = [], onDownload }) {
  const max = Math.max(
    1,
    ...data.flatMap((item) => [item.current, item.previous])
  );
  const peakIndex = data.reduce(
    (bestIndex, item, index) =>
      item.current > data[bestIndex].current ? index : bestIndex,
    0
  );
  const showValues = data.length <= 7;
  const summary = data
    .map((item) => `${item.label}: ${shortRupiah(item.current)}`)
    .join(", ");

  return (
    <section className="rounded-[10px] border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-neutral-900">{title}</h2>
          <p className="mt-0.5 text-[14px] text-neutral-500">{subtitle}</p>
        </div>
        <ul className="flex items-center gap-3 text-[14px] text-neutral-600">
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 bg-maroon-dark" />
            Omzet periode ini
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 bg-stone-300" />
            Periode sebelumnya
          </li>
        </ul>
      </div>

      {data.length === 0 ? (
        <p className="py-16 text-center text-[16px] text-neutral-500">
          Belum ada data penjualan pada periode ini.
        </p>
      ) : (
        <div
          className="mt-5 flex items-end gap-2 sm:gap-4"
          role="img"
          aria-label={`${title}. ${summary}`}
        >
          {data.map((item, index) => (
            <div
              key={item.label}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              {showValues && (
                <p className="mb-1 max-w-full truncate text-[16px] font-semibold text-neutral-700">
                  {shortRupiah(item.current)}
                </p>
              )}
              <div
                className="flex items-end justify-center gap-1"
                style={{ height: BAR_AREA }}
              >
                <div
                  className="w-3 bg-stone-300 sm:w-5"
                  style={{
                    height: Math.max(
                      2,
                      Math.round((item.previous / max) * BAR_AREA)
                    ),
                  }}
                  title={`Sebelumnya: ${shortRupiah(item.previous)}`}
                />
                <div
                  className={
                    "w-3 sm:w-5 " +
                    (index === peakIndex ? "bg-maroon-dark" : "bg-maroon/75")
                  }
                  style={{
                    height: Math.max(
                      2,
                      Math.round((item.current / max) * BAR_AREA)
                    ),
                  }}
                  title={`${item.label}: ${shortRupiah(item.current)}`}
                />
              </div>
              <p className="mt-2 max-w-full truncate text-[14px] text-neutral-500">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
