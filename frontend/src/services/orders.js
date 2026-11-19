import api from "./api";

const PAGE_SIZE = 50;

export function ordersErrorMessage(err) {
  if (!err.response) return "Tidak bisa terhubung ke server. Pastikan backend sudah menyala.";
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(", ");
  return "Riwayat pesanan belum bisa dimuat. Coba lagi.";
}

const normalize = (order) => ({
  order_id: order.order_id,
  order_date: order.order_date,
  status: order.status,
  total_amount: order.total_amount,
  items: (order.items ?? order.order_items ?? []).map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name ?? item.product?.product_name,
    image: item.image ?? item.product?.image ?? null,
    store_id: item.store_id ?? order.store_id ?? item.product?.store_id,
    store_name: item.store_name ?? order.store_name ?? item.product?.store_name,
    variant: item.variant ?? "",
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
  })),
});

const byNewest = (a, b) => new Date(b.order_date) - new Date(a.order_date);

export async function fetchOrders() {
  const orders = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await api.get("/orders", {
      params: { page, limit: PAGE_SIZE },
    });
    if (Array.isArray(response.data)) {
      orders.push(...response.data.map(normalize));
      break;
    }

    const items = Array.isArray(response.data?.items) ? response.data.items : [];
    if (items.length === 0) break;
    orders.push(...items.map(normalize));
    const total = Number(response.data?.total);
    hasMore = Number.isFinite(total) ? orders.length < total : items.length === PAGE_SIZE;
    page += 1;
  }

  return { orders: orders.sort(byNewest), isSample: false };
}

export async function createOrder(payload) {
  const response = await api.post("/orders/checkout", {
    items: payload.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      variant: item.variant || null,
    })),
    payment_method: payload.payment.method,
  });
  return Array.isArray(response.data) ? response.data.map(normalize) : [normalize(response.data)];
}
