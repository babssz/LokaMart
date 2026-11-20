import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({ value, onChange, min = 1, max = 99, disabled = false }) {
  const btn = "grid h-9 w-9 place-items-center text-neutral-700 hover:bg-stone-50 disabled:opacity-40";

  return (
    <div className="inline-flex items-center rounded-[10px] border border-stone-300 bg-white">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label="Kurangi jumlah" className={btn}>
        <Minus className="h-4.5 w-4.5" />
      </button>
      <span className="grid h-9 min-w-10 place-items-center border-x border-stone-300 px-2 text-sm font-semibold text-neutral-900" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Tambah jumlah" className={btn}>
        <Plus className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}