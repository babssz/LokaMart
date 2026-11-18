import { useEffect, useState } from "react";
import { CheckCircle, Clock, FileText, Truck, X } from "lucide-react";
import api from "../services/api";
import { formatRupiah } from "../data/products";

const ORDER_TABS = [
  { label: "SEMUA", value: null },
  { label: "PERLU DIPROSES", value: "dibayar" }, // Sesuai status awal di backend ("dibayar")
  { label: "SIAP KIRIM", value: "diproses" },
  { label: "SELESAI", value: "selesai" }
];

export default function SellerOrdersSection() {
  const [activeTabValue, setActiveTabValue] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mengambil data pesanan toko dari endpoint backend: GET /orders/store
  const fetchStoreOrders = async (statusFilter = null) => {
    try {
      setLoading(true);
      setError("");
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get("/orders/store", { params });
      
      // Mengambil array dari response paginasi OrderListOut (items)
      const list = Array.isArray(res.data) ? res.data : res.data.items ?? [];
      setOrders(list);
    } catch (err) {
      setError("Gagal memuat data pesanan toko.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreOrders(activeTabValue);
  }, [activeTabValue]);

  // Fungsi untuk memperbarui status pesanan (Contoh: Terima & Proses dari "dibayar" ke "diproses")
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      // Refresh ulang data pesanan setelah berhasil
      fetchStoreOrders(activeTabValue);
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal memperbarui status pesanan.");
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Filter Status Pesanan */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter status pesanan">
        {ORDER_TABS.map((tab) => {
          const isActive = activeTabValue === tab.value;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTabValue(tab.value)}
              className={
                "rounded-sm px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer " +
                (isActive ? "bg-neutral-900 text-white shadow-sm" : "bg-white text-neutral-600 border border-stone-200 hover:bg-stone-50")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-sm">{error}</p>}

      {/* List Daftar Pesanan */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">Memuat pesanan...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-sm border border-stone-200 bg-white py-12 text-center text-xs text-neutral-500">
            Tidak ada pesanan pada status ini.
          </div>
        ) : (
          orders.map((order) => {
            const firstItem = order.items?.[0] || {};
            return (
              <div
                key={order.order_id}
                className="flex flex-col justify-between gap-4 rounded-sm border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:p-5 shadow-sm"
              >
                {/* Info Sisi Kiri */}
                <div className="flex items-start gap-3.5">
                  {firstItem.image ? (
                    <img 
                      src={firstItem.image} 
                      alt={firstItem.product_name} 
                      className="h-12 w-12 shrink-0 rounded-sm object-cover border border-stone-200" 
                    />
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-stone-100 text-[9px] text-neutral-400 border">
                      Foto
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">#{order.order_id}</span>
                      <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
                        {order.status}
                      </span>
                      <span className="text-[11px] text-neutral-400">• {new Date(order.order_date).toLocaleString("id-ID")}</span>
                    </div>

                    <p className="mt-1 text-xs text-neutral-700">
                      Pembeli: <strong className="text-neutral-900">{order.buyer_name}</strong> • {order.items?.length || 1} Produk ({firstItem.product_name})
                    </p>

                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-neutral-500">
                      {order.payment && <span>🏦 {order.payment.payment_method} ({order.payment.payment_status})</span>}
                    </p>
                  </div>
                </div>

                {/* Sisi Kanan: Total & Tombol Aksi */}
                <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Total Transaksi</span>
                    <p className="text-xs font-bold text-neutral-900 sm:text-sm">{formatRupiah(order.total_amount)}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Jika status "dibayar", penjual bisa mengubah ke "diproses" (Terima Pesanan) */}
                    {order.status === "dibayar" && (
                      <button 
                        onClick={() => handleUpdateStatus(order.order_id, "diproses")}
                        className="rounded-sm bg-maroon-dark px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-maroon shadow-sm transition-colors cursor-pointer"
                      >
                        Terima & Proses
                      </button>
                    )}

                    {/* Jika status "diproses", penjual bisa mengubah ke "dikirim" */}
                    {order.status === "diproses" && (
                      <button 
                        onClick={() => handleUpdateStatus(order.order_id, "dikirim")}
                        className="rounded-sm bg-neutral-900 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-neutral-800 shadow-sm transition-colors cursor-pointer"
                      >
                        Kirim Pesanan
                      </button>
                    )}

                    {order.status === "selesai" && (
                      <span className="text-[11px] font-semibold text-emerald-600">Selesai</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}