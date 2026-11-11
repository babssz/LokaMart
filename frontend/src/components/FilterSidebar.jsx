import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { PRICE_PRESETS, matchCat } from "../utils/catalog";

const sectionTitle = "text-[10px] font-semibold uppercase tracking-wide text-neutral-800";

// Pilihan di sini baru berlaku setelah tombol "Terapkan Filter" ditekan.
// Parent memberi `key` yang berubah saat filter di URL berubah, sehingga isinya ikut tersinkron.
export default function FilterSidebar({ categories, applied, onApply }) {
  const [sel, setSel] = useState(applied.kategori);
  const [min, setMin] = useState(applied.min);
  const [max, setMax] = useState(applied.max);
  const [stok, setStok] = useState(applied.stok);
  const [openCat, setOpenCat] = useState(true);

  const isChecked = (name) => sel.some((s) => matchCat(name, s));
  const toggle = (name) => setSel(isChecked(name) ? sel.filter((s) => !matchCat(name, s)) : [...sel, name]);

  const selectedCount = sel.length + (min || max ? 1 : 0) + (stok ? 1 : 0);

  const submit = (e) => {
    e.preventDefault();
    let lo = min.trim();
    let hi = max.trim();
    if (lo && hi && Number(lo) > Number(hi)) [lo, hi] = [hi, lo]; // tukar kalau terbalik
    onApply({ kategori: sel, min: lo, max: hi, stok });
  };

  return (
    <form onSubmit={submit} className="rounded-sm border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-900">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filter Pencarian
        </h2>
        <span className="text-[10px] text-neutral-400">{selectedCount} Terpilih</span>
      </div>

      {/* Kategori */}
      <div className="mt-4 border-t border-stone-200 pt-4">
        <button
          type="button"
          onClick={() => setOpenCat((o) => !o)}
          aria-expanded={openCat}
          className="flex w-full items-center justify-between"
        >
          <span className={sectionTitle}>Kategori Produk</span>
          <ChevronDown className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${openCat ? "rotate-180" : ""}`} />
        </button>

        {openCat && (
          <ul className="mt-3 max-h-60 space-y-2.5 overflow-y-auto pr-1">
            {categories.length === 0 && <li className="text-[11px] text-neutral-400">Belum ada kategori.</li>}
            {categories.map((c) => (
              <li key={c.name}>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
                  <input type="checkbox" checked={isChecked(c.name)} onChange={() => toggle(c.name)} className="h-3.5 w-3.5 accent-maroon-dark" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-[10px] text-neutral-400">{c.count}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Harga */}
      <div className="mt-4 border-t border-stone-200 pt-4">
        <p className={sectionTitle}>Rentang Harga (Rp)</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ["Min", min, setMin],
            ["Max", max, setMax],
          ].map(([label, value, set]) => (
            <label key={label} className="block rounded-sm bg-stone-100 px-2 py-1.5">
              <span className="block text-[9px] font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-xs font-semibold text-neutral-900 placeholder:text-stone-400 focus:outline-none"
              />
            </label>
          ))}
        </div>

        <div className="mt-3 space-y-2" role="radiogroup" aria-label="Pilihan cepat harga">
          {PRICE_PRESETS.map((p) => (
            <label key={p.label} className="flex cursor-pointer items-center gap-2 text-[11px] text-neutral-700">
              <input
                type="radio"
                name="harga"
                checked={min === p.min && max === p.max}
                onChange={() => {
                  setMin(p.min);
                  setMax(p.max);
                }}
                className="h-3 w-3 accent-maroon-dark"
              />
              {p.label}
            </label>
          ))}
        </div>
      </div>

      {/* Ketersediaan */}
      <div className="mt-4 border-t border-stone-200 pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
          <input type="checkbox" checked={stok} onChange={(e) => setStok(e.target.checked)} className="h-3.5 w-3.5 accent-maroon-dark" />
          Hanya yang ready stock
        </label>
      </div>

      <button
        type="submit"
        className="mt-5 w-full rounded-sm bg-maroon-dark py-3 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon"
      >
        Terapkan Filter
      </button>
    </form>
  );
}