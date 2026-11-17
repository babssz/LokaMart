import api from "./api";

export const SERVER_ORDERS = false;

export const SHOW_SAMPLE_WHEN_EMPTY = true;


export function ordersErrorMessage(err) {
  if (!err.response) return "Tidak bisa terhubung ke server. Pastikan backend sudah menyala.";
  const code = err.response.status;
  if (code === 404 || code === 405) return "Fitur riwayat pesanan belum tersedia di server. Hubungi tim backend.";
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  return "Riwayat pesanan belum bisa dimuat. Coba lagi.";
}

/* ---------- Mode lokal ---------- */

const storageKey = (userId) => `lokamart_orders_${userId}`;
const readLocal = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId))) ?? [];
  } catch {
    return [];
  }
};

// Dipakai halaman checkout (nanti) untuk menyimpan pesanan baru di mode lokal
export function saveLocalOrder(userId, order) {
  const list = readLocal(userId);
  list.unshift(order);
  localStorage.setItem(storageKey(userId), JSON.stringify(list));
  return order;
}

/* ---------- Data contoh (mengikuti desain Figma) ---------- */

const SAMPLE_ORDERS = [
  {
    order_id: 1,
    order_date: "2025-05-15T10:00:00",
    status: "dikirim",
    total_amount: 555000,
    items: [
      { product_id: 900001, product_name: "Kemeja Batik Cap Pewarna Alami Motif Daun Parang", image: null, store_name: "Sanggar Batik Puspita", variant: "Terakota Mahoni • L", quantity: 1, price: 385000 },
      { product_id: 900002, product_name: "Biji Kopi Arabika Spesialti Sengrai Lokal 200g", image: null, store_name: "Roastery Kopi Kota", variant: "Medium Roast (Giling Halus)", quantity: 1, price: 170000 },
    ],
  },
  {
    order_id: 2,
    order_date: "2025-04-29T09:30:00",
    status: "selesai",
    total_amount: 76000,
    items: [
      { product_id: 900003, product_name: "Sambal Ikan Asap Tradisional Botol 200g", image: null, store_name: "Dapur Mama Velin", variant: "Pedas Sedang", quantity: 2, price: 38000 },
    ],
  },
  {
    order_id: 3,
    order_date: "2025-04-12T14:15:00",
    status: "selesai",
    total_amount: 110000,
    items: [
      { product_id: 900004, product_name: "Cangkir Keramik Stoneware Buatan Tangan 320ml", image: null, store_name: "Keramik Studio Genteng", variant: "Abu Granit Terakota", quantity: 1, price: 110000 },
    ],
  },
];

/* ---------- Mode server ---------- */

const normalize = (o) => ({
  order_id: o.order_id,
  order_date: o.order_date,
  status: o.status,
  total_amount: o.total_amount,
  items: (o.items ?? o.order_items ?? []).map((it) => ({
    product_id: it.product_id,
    product_name: it.product_name ?? it.product?.product_name,
    image: it.image ?? it.product?.image ?? null,
    store_id: it.store_id ?? it.product?.store_id,
    store_name: it.store_name ?? it.product?.store_name,
    variant: it.variant ?? "",
    quantity: it.quantity,
    price: it.price,
    subtotal: it.subtotal,
  })),
});

const byNewest = (a, b) => new Date(b.order_date) - new Date(a.order_date);

// Mengembalikan { orders, isSample }
export async function fetchOrders(userId) {
  const list = SERVER_ORDERS
    ? await api.get("/orders").then((r) => (Array.isArray(r.data) ? r.data : r.data.items ?? []).map(normalize))
    : readLocal(userId);

  if (list.length === 0 && SHOW_SAMPLE_WHEN_EMPTY) return { orders: SAMPLE_ORDERS, isSample: true };
  return { orders: [...list].sort(byNewest), isSample: false };
}

// Membuat pesanan baru dari halaman checkout.
// payload = { items, address, shipping, payment, subtotal, total }
// Mode server memakai usulan: POST /orders { items:[{product_id, quantity}], payment_method, shipping_method, shipping_address }
export async function createOrder(userId, payload) {
  if (SERVER_ORDERS) {
    const res = await api.post("/orders", {
      items: payload.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      payment_method: payload.payment.method,
      shipping_method: payload.shipping.courier,
      shipping_address: payload.address,
    });
    return res.data;
  }

  return saveLocalOrder(userId, {
    order_id: Date.now(),
    order_date: new Date().toISOString(),
    status: "diproses",
    total_amount: payload.total,
    ...payload,
  });
}