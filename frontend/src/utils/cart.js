import api from "./api";

// false = keranjang disimpan di browser (localStorage) per pengguna, supaya alur belanja
//         bisa dicoba sebelum endpoint keranjang di backend siap.
// true  = memakai endpoint backend di bawah ini.
export const SERVER_CART = false;

/*
  USULAN endpoint backend (belum ada di /docs):
    GET    /cart               -> { items: [{ cart_item_id, product_id, quantity, note, product: ProductOut }] }
    POST   /cart/items         { product_id, quantity }
    PATCH  /cart/items/{id}    { quantity?, note? }
    DELETE /cart/items/{id}
  Catatan: kolom `note` belum ada di tabel Cart_Item pada ERD.
*/

// Bentuk item keranjang di frontend:
// { key, product_id, variant, quantity, note, product: { product_name, price, image, store_id, store_name, stock, category_name } }

const fail = (userMessage) => Object.assign(new Error(userMessage), { userMessage });
const maxFor = (p) => (typeof p.stock === "number" ? Math.max(p.stock, 0) : 99);

export function cartErrorMessage(err) {
  if (err.userMessage) return err.userMessage;
  if (!err.response) return "Tidak bisa terhubung ke server. Pastikan backend sudah menyala.";
  const code = err.response.status;
  if (code === 404 || code === 405) return "Fitur keranjang belum tersedia di server. Hubungi tim backend.";
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  return "Terjadi kesalahan pada keranjang. Coba lagi.";
}

/* ---------- Mode lokal (localStorage) ---------- */

const storageKey = (userId) => `lokamart_cart_${userId}`;
const readLocal = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId))) ?? [];
  } catch {
    return [];
  }
};
const writeLocal = (userId, items) => localStorage.setItem(storageKey(userId), JSON.stringify(items));
const makeKey = (productId, variant) => `${productId}|${variant ?? ""}`;
const snapshot = (p) => ({
  product_name: p.product_name,
  price: p.price,
  image: p.image,
  store_id: p.store_id,
  store_name: p.store_name,
  stock: p.stock,
  category_name: p.category_name,
});

const local = {
  fetch: async (userId) => readLocal(userId),

  add: async (userId, product, quantity, variant = "") => {
    const max = maxFor(product);
    if (max <= 0) throw fail("Stok produk habis.");
    const items = readLocal(userId);
    const key = makeKey(product.product_id, variant);
    const found = items.find((it) => it.key === key);
    if (found) {
      found.quantity = Math.min(found.quantity + quantity, max);
      found.product = snapshot(product); // perbarui harga dan stok terbaru
    } else {
      items.push({ key, product_id: product.product_id, variant, quantity: Math.min(quantity, max), note: "", product: snapshot(product) });
    }
    writeLocal(userId, items);
    return items;
  },

  update: async (userId, item, patch) => {
    const items = readLocal(userId);
    const found = items.find((it) => it.key === item.key);
    if (!found) return items;
    if (patch.quantity != null) {
      const max = Math.max(maxFor(found.product), 1);
      found.quantity = Math.min(Math.max(1, patch.quantity), max);
    }
    if (patch.note != null) found.note = patch.note;
    writeLocal(userId, items);
    return items;
  },

  remove: async (userId, list) => {
    const keys = new Set(list.map((it) => it.key));
    const items = readLocal(userId).filter((it) => !keys.has(it.key));
    writeLocal(userId, items);
    return items;
  },
};

/* ---------- Mode server ---------- */

const normalize = (it) => ({
  key: String(it.cart_item_id ?? it.product_id),
  cart_item_id: it.cart_item_id,
  product_id: it.product_id ?? it.product?.product_id,
  variant: it.variant ?? "",
  quantity: it.quantity,
  note: it.note ?? "",
  product: it.product ?? {
    product_name: it.product_name,
    price: it.price,
    image: it.image,
    store_id: it.store_id,
    store_name: it.store_name,
    stock: it.stock,
    category_name: it.category_name,
  },
});

const server = {
  fetch: () =>
    api.get("/cart").then((r) => (Array.isArray(r.data) ? r.data : r.data.items ?? []).map(normalize)),

  add: async (userId, product, quantity) => {
    await api.post("/cart/items", { product_id: product.product_id, quantity });
    return server.fetch();
  },

  update: async (userId, item, patch) => {
    await api.patch(`/cart/items/${item.cart_item_id}`, patch);
    return server.fetch();
  },

  remove: async (userId, list) => {
    await Promise.all(list.map((it) => api.delete(`/cart/items/${it.cart_item_id}`)));
    return server.fetch();
  },
};

const impl = SERVER_CART ? server : local;

export const fetchCart = (userId) => impl.fetch(userId);
export const addItem = (userId, product, quantity, variant) => impl.add(userId, product, quantity, variant);
export const updateItem = (userId, item, patch) => impl.update(userId, item, patch);
export const removeItems = (userId, list) => impl.remove(userId, list);