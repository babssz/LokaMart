import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({ value, onChange, min = 1, max = 99, disabled = false }) {
  const btn = "grid h-8 w-8 place-items-center text-neutral-700 hover:bg-stone-50 disabled:opacity-40";

  return (
    <div className="inline-flex items-center rounded-sm border border-stone-300 bg-white">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label="Kurangi jumlah" className={btn}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="grid h-8 min-w-9 place-items-center border-x border-stone-300 px-2 text-xs font-semibold text-neutral-900" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Tambah jumlah" className={btn}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}