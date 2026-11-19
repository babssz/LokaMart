import { Link } from "react-router-dom";
import { formatRupiah } from "../data/products";

const outlineBtn = "rounded-sm border border-stone-300 bg-white px-3.5 py-2 text-[10px] font-semibold text-neutral-800 hover:bg-stone-50";
const solidBtn = "rounded-sm bg-maroon-dark px-3.5 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-maroon disabled:opacity-60";

const ORDER_STATUSES = {
  dibayar: { label: "Menunggu Diproses", tone: "bg-amber-100 text-amber-800", final: false },
  diproses: { label: "Sedang Diproses", tone: "bg-blue-100 text-blue-800", final: false },
  dikirim: { label: "Sedang dalam Pengantaran", tone: "bg-violet-100 text-violet-800", final: false },
  selesai: { label: "Selesai", tone: "bg-green-100 text-green-800", final: true },
  dibatalkan: { label: "Dibatalkan", tone: "bg-red-100 text-red-800", final: true, cancelled: true },
};

const statusInfo = (status) =>
  ORDER_STATUSES[status] ?? {
    label: String(status ?? "Status tidak diketahui").replace(/_/g, " "),
    tone: "bg-stone-100 text-neutral-700",
    final: false,
  };

const orderNumber = (order) => order.order_number || `ORD-${order.order_id}`;

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const storeLabel = (items = []) => {
  const stores = [...new Set(items.map((item) => item.store_name).filter(Boolean))];
  return stores.length ? stores.join(", ") : "LokaMart";
};

export default function OrderCard({ order, reordering, onReorder, onUnavailable }) {
  const status = statusInfo(order.status);

  return (
    <article className="overflow-hidden rounded-sm border border-stone-200 bg-white">
      {/* Kepala: nomor, tanggal, toko, status */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3">
        <p className="min-w-0 text-[11px] text-neutral-500">
          <span className="font-semibold text-neutral-900">{orderNumber(order)}</span>
          <span className="mx-1.5">·</span>
          {formatDate(order.order_date)}
          <span className="mx-1.5">·</span>
          <span className="break-words">{storeLabel(order.items)}</span>
        </p>
        <span className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-semibold ${status.tone}`}>{status.label}</span>
      </header>

      {/* Produk */}
      <ul className="divide-y divide-stone-200 px-4">
        {order.items.map((it, i) => (
          <li key={`${it.product_id}-${i}`} className="flex items-center gap-3 py-3">
            {it.image ? (
              <img src={it.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-sm object-cover" />
            ) : (
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-stone-100 text-[9px] text-neutral-400">Foto</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-semibold text-neutral-900">{it.product_name}</p>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                {it.variant ? `${it.variant} • ` : ""}
                {it.quantity} barang
              </p>
            </div>
            <p className="shrink-0 text-xs font-bold text-neutral-900">{formatRupiah(it.subtotal ?? Number(it.price) * it.quantity)}</p>
          </li>
        ))}
      </ul>

      {/* Total dan aksi */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-4 py-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500">Total Pembayaran</p>
          <p className="text-sm font-bold text-neutral-900">{formatRupiah(order.total_amount)}</p>
        </div>

        {/* <div className="flex flex-wrap items-center gap-2">
          {!status.final && (
            <>
              <Link to={`/pesanan/${order.order_id}`} className={outlineBtn}>
                Lihat Detail Status
              </Link>
              <button type="button" onClick={() => onUnavailable("Hubungi Toko")} className={solidBtn}>
                Hubungi Toko
              </button>
            </>
          )}
          {status.final && !status.cancelled && (
            <button type="button" onClick={() => onUnavailable("Invoice")} className={outlineBtn}>
              Invoice
            </button>
          )}
          {status.final && (
            <button type="button" onClick={() => onReorder(order)} disabled={reordering} className={solidBtn}>
              {reordering ? "Memproses..." : "Beli Lagi"}
            </button>
          )}
        </div> */}
      </footer>
    </article>
  );
}