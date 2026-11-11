// Fungsi bantu untuk dashboard penjual

export const PERIODS = [
  { id: "harian", label: "Harian", chip: "Hari ini", vs: "vs kemarin" },
  { id: "mingguan", label: "Mingguan", chip: "Minggu ini", vs: "vs minggu lalu" },
  { id: "bulanan", label: "Bulanan", chip: "Bulan ini", vs: "vs bulan lalu" },
  { id: "tahunan", label: "Tahunan", chip: "Tahun ini", vs: "vs tahun lalu" },
];

// Rp 4,6 jt / Rp 18 rb / Rp 1,2 M (miliar)
export function shortRupiah(n) {
  const v = Number(n) || 0;
  const fmt = (x) => x.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  if (v >= 1_000_000_000) return `Rp ${fmt(v / 1_000_000_000)} M`;
  if (v >= 1_000_000) return `Rp ${fmt(v / 1_000_000)} jt`;
  if (v >= 1_000) return `Rp ${Math.round(v / 1_000)} rb`;
  return `Rp ${v}`;
}

// Judul dan subjudul grafik mengikuti periode yang dipilih
export function chartTitles(period, now = new Date()) {
  const month = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const year = now.getFullYear();
  switch (period) {
    case "harian":
      return { title: "Tren Penjualan Harian", subtitle: "Pendapatan kotor per sesi hari ini" };
    case "mingguan":
      return { title: "Tren Penjualan Mingguan", subtitle: "Pendapatan kotor per hari minggu ini" };
    case "tahunan":
      return { title: `Tren Penjualan Bulanan (${year})`, subtitle: "Pendapatan kotor per bulan" };
    default:
      return { title: `Tren Penjualan Mingguan (${month})`, subtitle: "Klasifikasi pendapatan kotor per minggu berjalan" };
  }
}

// Unduh rekap sebagai CSV (bisa dibuka di Excel)
export function downloadCsv(report, periodId) {
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["Rekap Penjualan", periodId],
    [],
    ["Ringkasan"],
    ["Total omzet bersih", report.summary.revenue],
    ["Pesanan selesai", report.summary.orders],
    ["Produk terjual", report.summary.items],
    ["Rata-rata nilai pesanan", report.summary.aov],
    [],
    ["Tren", "Periode ini", "Periode sebelumnya"],
    ...report.trend.map((t) => [t.label, t.current, t.previous]),
    [],
    ["Produk terlaris", "Terjual", "Omzet"],
    ...report.topProducts.map((p) => [p.name, p.sold, p.revenue]),
  ];
  const csv = rows.map((r) => r.map(q).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `rekap-penjualan-${periodId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}