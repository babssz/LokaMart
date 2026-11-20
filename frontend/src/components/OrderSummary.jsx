import { formatRupiah } from "../data/products";

export default function OrderSummary({ count, subtotal, shipping = 0, children }) {
  return (
    <aside className="rounded-[10px] border border-stone-200 bg-white p-5">
      <h2 className="text-[16px] font-semibold uppercase tracking-wide text-neutral-900">Ringkasan Belanja</h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-neutral-600">Total Harga ({count} Item)</dt>
          <dd className="font-medium text-neutral-900">{formatRupiah(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-neutral-600">Biaya Pengiriman</dt>
          <dd className="font-semibold text-maroon">{formatRupiah(shipping)}</dd>
        </div>
      </dl>

      <div className="mt-4 rounded-[10px] bg-stone-100 px-3 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500">Total Belanja</p>
        <p className="mt-0.5 text-lg font-bold text-neutral-900">{formatRupiah(subtotal + shipping)}</p>
      </div>

      {children}
    </aside>
  );
}