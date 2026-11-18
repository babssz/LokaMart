import api from "./api";

// Ubah ke true supaya laporan mengambil data langsung dari backend FastAPI
export const SERVER_REPORTS = true;
export const SHOW_SAMPLE_REPORT = false;

export function reportsErrorMessage(err) {
  if (err.userMessage) return err.userMessage;
  if (!err.response) return "Tidak bisa terhubung ke server. Pastikan backend sudah menyala.";
  const code = err.response.status;
  if (code === 403) return "Halaman ini khusus akun penjual.";
  if (code === 404 || code === 405) return "Fitur laporan penjualan belum tersedia di server. Hubungi tim backend.";
  return "Laporan belum bisa dimuat. Coba lagi.";
}

/* ---------- Mode server ---------- */

const normalize = (r) => {
  const c = r.summary?.change ?? {};
  return {
    summary: {
      revenue: Number(r.total_revenue ?? r.summary?.revenue ?? 0),
      orders: Number(r.total_orders ?? r.summary?.orders ?? 0),
      items: Number(r.total_items_sold ?? r.summary?.items_sold ?? 0),
      aov: Number(r.summary?.avg_order_value ?? 0),
      changes: { revenue: c.revenue ?? null, orders: c.orders ?? null, items: c.items_sold ?? null, aov: c.avg_order_value ?? null },
    },
    trend: (r.daily ?? r.trend ?? []).map((t) => ({ 
      label: t.day ?? t.label, 
      current: Number(t.revenue ?? t.current), 
      previous: Number(t.previous ?? 0) 
    })),
    topProducts: (r.top_products ?? []).map((p) => ({ 
      id: p.product_id, 
      name: p.product_name, 
      image: p.image ?? null, 
      sold: p.quantity_sold ?? p.sold, 
      revenue: Number(p.revenue) 
    })),
    store: r.store ?? null,
  };
};

// Mengembalikan { report, isSample }
export async function fetchSalesReport(period) {
  if (SERVER_REPORTS) {
    // Mengirim parameter periode atau rentang tanggal ke endpoint backend /reports/sales
    const res = await api.get("/reports/sales", { params: { period } });
    return { report: normalize(res.data), isSample: false };
  }
  
  const err = new Error("Laporan belum tersedia");
  err.userMessage = "Fitur laporan penjualan belum diaktifkan.";
  throw err;
}