import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import QuantityStepper from "./QuantityStepper";
import { formatRupiah } from "../data/products";

export default function CartItemRow({ item, checked, onToggle, onQty, onNote, onRemove }) {
  const p = item.product;
  const stock = typeof p.stock === "number" ? p.stock : null;
  const soldOut = stock !== null && stock <= 0;
  const price = Number(p.price);
  const detailUrl = `/produk/${item.product_id}`;

  const [note, setNote] = useState(item.note ?? "");
  useEffect(() => setNote(item.note ?? ""), [item.note]);

  return (
    <li className="flex gap-3 py-4">
      <input
        type="checkbox"
        checked={checked}
        disabled={soldOut}
        onChange={onToggle}
        aria-label={`Pilih ${p.product_name}`}
        className="mt-1 h-4 w-4 shrink-0 accent-maroon-dark"
      />

      <Link to={detailUrl} className="shrink-0">
        {p.image ? (
          <img src={p.image} alt={p.product_name} loading="lazy" className="h-16 w-16 rounded-sm object-cover sm:h-20 sm:w-20" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-sm bg-stone-100 text-[9px] text-neutral-400 sm:h-20 sm:w-20">Foto</div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {p.category_name && <p className="truncate text-[10px] uppercase tracking-wide text-neutral-500">{p.category_name}</p>}
            <Link to={detailUrl} className="line-clamp-2 text-sm font-semibold text-neutral-900 hover:underline">
              {p.product_name}
            </Link>
            {item.variant && <p className="mt-0.5 text-[11px] text-neutral-500">Varian: {item.variant}</p>}
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-sm font-bold text-maroon">
              {formatRupiah(price * item.quantity)}
              {item.quantity > 1 && <span className="ml-1 text-[10px] font-normal text-neutral-400">(@ {formatRupiah(price)})</span>}
            </p>
            <p className={"text-[10px] " + (soldOut ? "font-semibold text-red-700" : "text-neutral-500")}>
              {soldOut ? "Stok habis" : stock !== null ? `Stok: ${stock} pcs` : "Stok tersedia"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-sm bg-stone-100 px-2.5 py-1.5">
          <Pencil className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (item.note ?? "") && onNote(note)}
            maxLength={120}
            placeholder="Catatan untuk penjual (opsional)"
            aria-label={`Catatan untuk ${p.product_name}`}
            className="min-w-[8rem] flex-1 bg-transparent text-[11px] text-neutral-800 placeholder:text-stone-400 focus:outline-none"
          />
          <QuantityStepper value={item.quantity} onChange={onQty} max={stock !== null ? Math.max(stock, 1) : 99} disabled={soldOut} />
          <button type="button" onClick={onRemove} aria-label={`Hapus ${p.product_name}`} className="grid h-8 w-8 place-items-center text-neutral-500 hover:text-maroon">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}