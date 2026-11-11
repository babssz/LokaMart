import api from "./api";

// false = laporan memakai data contoh (SHOW_SAMPLE_REPORT) karena endpoint laporan belum ada di backend.
// true  = memakai endpoint backend di bawah ini.
export const SERVER_REPORTS = false;
export const SHOW_SAMPLE_REPORT = true;

/*
  USULAN endpoint backend (belum ada di /docs), khusus penjual (BR-13: hanya data tokonya sendiri):
    GET /reports/sales?period=harian|mingguan|bulanan|tahunan
    -> {
         summary: { revenue, orders, items_sold, avg_order_value,
                    change: { revenue, orders, items_sold, avg_order_value } },   // perubahan dalam persen
         trend: [{ label, current, previous }],                                    // omzet per hari/minggu/bulan
         top_products: [{ product_id, product_name, image, sold, revenue }],     // 3 teratas
       }
*/

export function reportsErrorMessage(err) {
  if (err.userMessage) return err.userMessage;
  if (!err.response) return "Tidak bisa terhubung ke server. Pastikan backend sudah menyala.";
  const code = err.response.status;
  if (code === 403) return "Halaman ini khusus akun penjual.";
  if (code === 404 || code === 405) return "Fitur laporan penjualan belum tersedia di server. Hubungi tim backend.";
  return "Laporan belum bisa dimuat. Coba lagi.";
}

/* ---------- Data contoh (mengikuti desain Figma) ---------- */

const PRODUCTS = [
  { id: 900001, name: "Kain Batik Tulis Tembakau Jaoe", price: 200000, base: 36 },
  { id: 900002, name: "Cangkir Keramik Stoneware 220ml", price: 110000, base: 52 },
  { id: 900003, name: "Selendang Sutra Tenun Gedog", price: 180000, base: 24 },
];

const top = (scale) =>
  PRODUCTS.map((p) => {
    const sold = Math.max(1, Math.round(p.base * scale));
    return { id: p.id, name: p.name, image: null, sold, revenue: sold * p.price };
  }).sort((a, b) => b.revenue - a.revenue);

const pairs = (labels, current, previous) => labels.map((label, i) => ({ label, current: current[i], previous: previous[i] }));

const SAMPLE_STORE = { open: true, hours: "08:00 - 20:00 WITA", rating: 4.9, reviews: 902, note: "Pesanan diproses rata-rata 4 jam" };

const SAMPLE = {
  harian: {
    summary: { revenue: 1250000, orders: 9, items: 14, aov: 139000, changes: { revenue: 6.4, orders: 12.5, items: 7.7, aov: -2.1 } },
    trend: pairs(["08–10", "10–12", "12–15", "15–20"], [150000, 320000, 410000, 370000], [220000, 280000, 330000, 300000]),
    topProducts: top(0.06),
  },
  mingguan: {
    summary: { revenue: 4380000, orders: 33, items: 51, aov: 133000, changes: { revenue: 9.1, orders: 6.5, items: 10.9, aov: 2.4 } },
    trend: pairs(["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"], [520000, 610000, 480000, 700000, 810000, 690000, 570000], [480000, 540000, 500000, 620000, 700000, 640000, 520000]),
    topProducts: top(0.25),
  },
  bulanan: {
    summary: { revenue: 18450000, orders: 142, items: 218, aov: 130000, changes: { revenue: 18.2, orders: 8.4, items: 17.2, aov: 0 } },
    trend: pairs(["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"], [3600000, 4200000, 5500000, 5150000], [3200000, 3900000, 4300000, 4800000]),
    topProducts: top(1),
  },
  tahunan: {
    summary: { revenue: 198600000, orders: 1520, items: 2340, aov: 131000, changes: { revenue: 22.7, orders: 15.3, items: 19.8, aov: 5.9 } },
    trend: pairs(
      ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      [12400000, 13100000, 14800000, 15200000, 16900000, 17500000, 18900000, 19400000, 17800000, 16200000, 18450000, 17950000],
      [11000000, 11800000, 12900000, 13600000, 14500000, 15800000, 16300000, 17100000, 16000000, 14900000, 15600000, 16100000]
    ),
    topProducts: top(11),
  },
};

/* ---------- Mode server ---------- */

const normalize = (r) => {
  const c = r.summary?.change ?? {};
  return {
    summary: {
      revenue: Number(r.summary?.revenue ?? 0),
      orders: Number(r.summary?.orders ?? 0),
      items: Number(r.summary?.items_sold ?? 0),
      aov: Number(r.summary?.avg_order_value ?? 0),
      changes: { revenue: c.revenue ?? null, orders: c.orders ?? null, items: c.items_sold ?? null, aov: c.avg_order_value ?? null },
    },
    trend: (r.trend ?? []).map((t) => ({ label: t.label, current: Number(t.current), previous: Number(t.previous ?? 0) })),
    topProducts: (r.top_products ?? []).map((p) => ({ id: p.product_id, name: p.product_name, image: p.image ?? null, sold: p.sold, revenue: Number(p.revenue) })),
    store: r.store ?? null,
  };
};

// Mengembalikan { report, isSample }
export async function fetchSalesReport(period) {
  if (SERVER_REPORTS) {
    const res = await api.get("/reports/sales", { params: { period } });
    return { report: normalize(res.data), isSample: false };
  }
  if (SHOW_SAMPLE_REPORT) return { report: { ...SAMPLE[period], store: SAMPLE_STORE }, isSample: true };
  const err = new Error("Laporan belum tersedia");
  err.userMessage = "Fitur laporan penjualan belum tersedia di server. Hubungi tim backend.";
  throw err;
}