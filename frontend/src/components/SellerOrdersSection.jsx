import { useState } from "react";
import { Clock, Truck, CheckCircle, X, FileText } from "lucide-react";

const ORDER_TABS = ["SEMUA", "PERLU DIPROSES", "SIAP KIRIM", "SELESAI"];

export default function SellerOrdersSection() {
  const [activeOrderTab, setActiveOrderTab] = useState("SEMUA");

  // Contoh data pesanan untuk penjual
  const [orders] = useState([
    {
      id: "#KTK-20250520-001",
      status: "PERLU DIPROSES",
      statusType: "warning",
      tanggal: "20 Mei 2025 • 10:24 WIB",
      pembeli: "Siti Rahma",
      item: "1x Kain Batik Tulis Tembakau Jawa (Warna Alam)",
      metodeBayar: "QRIS Instant (Lunas)",
      kurir: "Pengiriman Instan se-Kota",
      total: "Rp 385.000",
    },
    {
      id: "#KTK-20250519-088",
      status: "SIAP KIRIM / MENUNGGU KURIR",
      statusType: "info",
      tanggal: "19 Mei 2025 • 16:40 WIB",
      pembeli: "Budi Santoso",
      item: "2x Cangkir Keramik Stoneware Buatan Tangan",
      metodeBayar: "Transfer Bank Mandiri (Lunas)",
      kurir: "Kotakarya Express Sameday",
      total: "Rp 220.000",
    },
    {
      id: "#KTK-20250518-042",
      status: "PESANAN SELESAI",
      statusType: "success",
      tanggal: "18 Mei 2025 • Diterima Pembeli",
      pembeli: "Dewi Lestari",
      item: "1x Selendang Sutra Tenun Gedog Tuban",
      keteranganDana: "Dana Rp 450.000 telah dilepaskan ke saldo toko",
      ulasan: "★★★★★ (5.0)",
      total: "Rp 450.000",
    },
  ]);

  // Filter pesanan berdasarkan tab status
  const filteredOrders = orders.filter((o) => {
    if (activeOrderTab === "SEMUA") return true;
    if (activeOrderTab === "PERLU DIPROSES" && o.status.includes("PERLU DIPROSES")) return true;
    if (activeOrderTab === "SIAP KIRIM" && o.status.includes("SIAP KIRIM")) return true;
    if (activeOrderTab === "SELESAI" && o.status.includes("PESANAN SELESAI")) return true;
    return false;
  });

  return (
    <div className="mt-6 space-y-4">
      {/* Filter Status Pesanan */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter status pesanan">
        {ORDER_TABS.map((tab) => {
          const isActive = activeOrderTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveOrderTab(tab)}
              className={
                "rounded-sm px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer " +
                (isActive ? "bg-neutral-900 text-white shadow-sm" : "bg-white text-neutral-600 border border-stone-200 hover:bg-stone-50")
              }
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* List Daftar Pesanan */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-sm border border-stone-200 bg-white py-12 text-center text-xs text-neutral-500">
            Tidak ada pesanan dengan status ini.
          </div>
        ) : (
          filteredOrders.map((order, idx) => (
            <div
              key={order.id ?? idx}
              className="flex flex-col justify-between gap-4 rounded-sm border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:p-5 shadow-sm"
            >
              {/* Info Sisi Kiri */}
              <div className="flex items-start gap-3.5">
                <div
                  className={
                    "grid h-10 w-10 shrink-0 place-items-center rounded-sm " +
                    (order.statusType === "warning"
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : order.statusType === "info"
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-200")
                  }
                >
                  {order.statusType === "warning" && <Clock className="h-5 w-5" />}
                  {order.statusType === "info" && <Truck className="h-5 w-5" />}
                  {order.statusType === "success" && <CheckCircle className="h-5 w-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">{order.id}</span>
                    <span
                      className={
                        "rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider " +
                        (order.statusType === "warning"
                          ? "bg-amber-100 text-amber-800"
                          : order.statusType === "info"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800")
                      }
                    >
                      {order.status}
                    </span>
                    <span className="text-[11px] text-neutral-400">• {order.tanggal}</span>
                  </div>

                  <p className="mt-1 text-xs text-neutral-700">
                    Pembeli: <strong className="text-neutral-900">{order.pembeli}</strong> • {order.item}
                  </p>

                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-neutral-500">
                    {order.metodeBayar && <span>🏦 {order.metodeBayar}</span>}
                    {order.kurir && <span>📦 {order.kurir}</span>}
                    {order.keteranganDana && <span className="font-medium text-emerald-600">✓ {order.keteranganDana}</span>}
                    {order.ulasan && <span className="text-amber-600 font-medium">Ulasan: {order.ulasan}</span>}
                  </p>
                </div>
              </div>

              {/* Sisi Kanan: Total & Tombol Aksi */}
              <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                    {order.statusType === "success" ? "Selesai" : "Total Transaksi"}
                  </span>
                  <p className="text-xs font-bold text-neutral-900 sm:text-sm">{order.total}</p>
                </div>

                {/* Tombol Aksi Sesuai Status */}
                <div className="flex items-center gap-1.5">
                  {order.statusType === "warning" && (
                    <>
                      <button className="rounded-sm bg-maroon-dark px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-maroon shadow-sm transition-colors cursor-pointer">
                        Terima & Proses
                      </button>
                      <button className="rounded-sm border border-stone-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50 transition-colors cursor-pointer">
                        Detail
                      </button>
                      <button aria-label="Tolak pesanan" className="rounded-sm p-1 text-neutral-400 hover:text-red-600 cursor-pointer">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {order.statusType === "info" && (
                    <>
                      <button className="rounded-sm bg-neutral-900 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-neutral-800 shadow-sm transition-colors cursor-pointer">
                        Panggil Kurir / Resi
                      </button>
                      <button className="rounded-sm border border-stone-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50 transition-colors cursor-pointer">
                        Label
                      </button>
                    </>
                  )}

                  {order.statusType === `success` && (
                    <button className="inline-flex items-center gap-1.5 rounded-sm border border-stone-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50 transition-colors cursor-pointer">
                      <FileText className="h-3.5 w-3.5 text-neutral-500" /> Bukti Kirim
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}