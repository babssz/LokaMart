// Pengaturan dan fungsi bantu untuk halaman checkout

// Pilihan pengiriman (sementara tetap di kode; tabel Order di ERD belum punya kolom pengiriman)
export const COURIERS = [
  {
    id: "motor",
    name: "Kurir Motor Koperasi Kota (Same Day)",
    badge: "Rekomendasi",
    desc: "Estimasi tiba hari ini (1 – 3 Jam). Pengantaran langsung dari lokawisata / galeri pengrajin.",
    fee: 0,
    originalFee: 18000,
    note: "Subsidi Dekranasda (-100%)",
  },
  {
    id: "reguler",
    name: "Kurir Ekspedisi Reguler (J&T Express / Pos Indonesia)",
    desc: "Estimasi tiba 1 hari kerja (Besok Sore). Dilengkapi nomor resi otomatis nasional.",
    fee: 9000,
    note: "Tarif flat kota-kota",
  },
];

// srsMethod = nilai payment_method yang disepakati di SRS (Transfer Bank, E-Wallet, COD)
export const PAYMENTS = [
  { id: "qris", name: "QRIS", detail: "BCA, Mandiri, GoPay, OVO, ShopeePay", srsMethod: "E-Wallet" },
  { id: "va", name: "Virtual Account (VA)", detail: "Bank Sulselbar, BCA, Mandiri, BRI", tag: "Otomatis", srsMethod: "Transfer Bank" },
  { id: "cod", name: "COD Kurir Lokal", detail: "Bayar tunai ke kurir saat barang tiba", tag: "Hanya motor", srsMethod: "COD", onlyCourier: "motor" },
];

/* ---------- Alamat pengiriman ---------- */

// Alamat disimpan di browser per pengguna sampai backend punya tempat menyimpannya.
const addressKey = (userId) => `lokamart_address_${userId}`;

export function loadAddress(user) {
  try {
    const saved = JSON.parse(localStorage.getItem(addressKey(user?.user_id)));
    if (saved) return saved;
  } catch {
    /* abaikan data rusak */
  }
  return { name: user?.name ?? "", phone: user?.phone ?? "", address: user?.address ?? "", note: "" };
}

export const saveAddress = (userId, addr) => localStorage.setItem(addressKey(userId), JSON.stringify(addr));

// Ambil angka saja dan buang awalan 62 / 0
export function phoneDigits(v) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.startsWith("62")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

// Contoh: +62 812-3456-7890
export function formatPhone(v) {
  const d = phoneDigits(v);
  if (!d) return "";
  return `+62 ${d.slice(0, 3)}${d.length > 3 ? "-" + d.slice(3, 7) : ""}${d.length > 7 ? "-" + d.slice(7) : ""}`;
}