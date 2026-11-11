// Fungsi bantu untuk halaman katalog: pencocokan kategori, filter, urutan, dan nomor halaman.

export const PAGE_SIZE = 8;

export const PRICE_PRESETS = [
  { label: "< Rp 50.000", min: "", max: "50000" },
  { label: "Rp 50.000 - Rp 150.000", min: "50000", max: "150000" },
  { label: "Rp 150.000 - Rp 300.000", min: "150000", max: "300000" },
  { label: "> Rp 300.000", min: "300000", max: "" },
];

export const SORTS = [
  { value: "terbaru", label: "Terbaru" },
  { value: "harga-asc", label: "Harga Terendah" },
  { value: "harga-desc", label: "Harga Tertinggi" },
  { value: "nama", label: "Nama A–Z" },
];

export const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

// Menu navbar (Fashion/Kuliner/Kerajinan) memakai kata umum, sedangkan nama kategori di database
// bisa lebih panjang (misalnya "Makanan & Minuman"). Alias ini menjembatani keduanya.
const ALIASES = {
  fashion: ["fashion", "batik", "busana"],
  kuliner: ["kuliner", "makanan", "minuman"],
  kerajinan: ["kerajinan", "kriya"],
};

export function matchCat(name, selected) {
  const n = String(name ?? "").toLowerCase();
  const s = String(selected ?? "").toLowerCase();
  if (!s) return false;
  if (n === s) return true;
  return (ALIASES[s] ?? [s]).some((t) => n.includes(t));
}

export function filterProducts(products, { kategori, min, max, stok, cari }) {
  const q = cari.trim().toLowerCase();
  return products.filter((p) => {
    const price = Number(p.price);
    if (kategori.length && !kategori.some((k) => matchCat(p.category_name, k))) return false;
    if (min !== "" && price < Number(min)) return false;
    if (max !== "" && price > Number(max)) return false;
    if (stok && !((p.stock ?? 1) > 0)) return false;
    if (q) {
      const fields = [p.product_name, p.store_name, p.category_name, p.description];
      if (!fields.some((f) => String(f ?? "").toLowerCase().includes(q))) return false;
    }
    return true;
  });
}

export function sortProducts(list, urut) {
  const arr = [...list];
  if (urut === "harga-asc") arr.sort((a, b) => Number(a.price) - Number(b.price));
  else if (urut === "harga-desc") arr.sort((a, b) => Number(b.price) - Number(a.price));
  else if (urut === "nama") arr.sort((a, b) => String(a.product_name).localeCompare(String(b.product_name), "id"));
  else arr.sort((a, b) => b.product_id - a.product_id); // terbaru: ID terbesar dulu
  return arr;
}

// Daftar kategori beserta jumlah produknya, dibuat dari data yang dimuat
export function categoryCounts(products) {
  const map = new Map();
  products.forEach((p) => {
    if (!p.category_name) return;
    map.set(p.category_name, (map.get(p.category_name) ?? 0) + 1);
  });
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

// Contoh hasil: [1, 2, 3, 4, "…", 12]
export function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}