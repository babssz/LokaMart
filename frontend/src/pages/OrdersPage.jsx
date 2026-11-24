import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Container from "../components/Container";
import OrderCard from "../components/OrderCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import { fetchOrders, ordersErrorMessage } from "../services/orders";

const PAGE = 10;

const STATUS_TABS = [
  { id: "all", label: "Semua" },
  { id: "diproses", label: "Diproses" },
  { id: "dikirim", label: "Dikirim" },
  { id: "selesai", label: "Selesai" },
  { id: "dibatalkan", label: "Dibatalkan" },
];

const orderNumber = (o) => o.order_number || `ORD-${o.order_id}`;

function matchesStatusTab(rawStatus, tabId) {
  if (tabId === "all") return true;
  const s = String(rawStatus ?? "").trim().toLowerCase();

  if (tabId === "diproses") {
    return ["diproses", "proses", "dibayar", "menunggu", "menunggu pembayaran", "pending", "dikonfirmasi"].includes(s);
  }
  if (tabId === "dikirim") {
    return ["dikirim", "dalam pengiriman", "shipped", "diantar"].includes(s);
  }
  if (tabId === "selesai") {
    return ["selesai", "diterima", "completed", "done"].includes(s);
  }
  if (tabId === "dibatalkan") {
    return ["dibatalkan", "batal", "cancelled", "canceled", "gagal"].includes(s);
  }
  return s === tabId;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = user?.user_id;

  const [state, setState] = useState({ orders: [], isSample: false, loading: true, error: "" });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visible, setVisible] = useState(PAGE);
  const [busyId, setBusyId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [notice, setNotice] = useState(
    location.state?.message ? { type: "ok", text: location.state.message } : null
  );

  const loadOrders = async (initial = false, cancelledRef = { current: false }) => {
    if (cancelledRef.current) return;
    if (initial) setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const { orders, isSample } = await fetchOrders();
      if (!cancelledRef.current) setState({ orders, isSample, loading: false, error: "" });
    } catch (err) {
      if (!cancelledRef.current) {
        setState({
          orders: [],
          isSample: false,
          loading: false,
          error: ordersErrorMessage(err),
        });
      }
    }
  };

  useEffect(() => {
    const cancelledRef = { current: false };
    let requestPending = false;

    const runLoad = async (initial = false) => {
      if (cancelledRef.current || requestPending) return;
      requestPending = true;
      await loadOrders(initial, cancelledRef);
      requestPending = false;
    };

    const refreshOrders = () => runLoad();

    runLoad(true);
    const refreshInterval = window.setInterval(refreshOrders, 30000);
    window.addEventListener("focus", refreshOrders);
    document.addEventListener("visibilitychange", refreshOrders);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshOrders);
      document.removeEventListener("visibilitychange", refreshOrders);
    };
  }, [userId]);

  const q = query.trim().toLowerCase();
  const filtered = state.orders.filter((o) => {
    if (!matchesStatusTab(o.status, statusFilter)) return false;
    if (!q) return true;
    const fields = [
      orderNumber(o),
      o.status,
      ...(o.items ? o.items.map((i) => i.product_name) : []),
      ...(o.items ? o.items.map((i) => i.store_name) : []),
    ];
    return fields.some((f) => String(f ?? "").toLowerCase().includes(q));
  });
  const shown = filtered.slice(0, visible);

  const countForTab = (tabId) =>
    state.orders.filter((o) => matchesStatusTab(o.status, tabId)).length;

  const confirmReceived = async (order) => {
    if (!order?.order_id) return;
    setCompletingId(order.order_id);
    setNotice(null);
    try {
      const { data: updated } = await api.patch(`/orders/${order.order_id}/complete`);
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.order_id === order.order_id ? { ...o, ...updated, status: updated?.status ?? "selesai" } : o
        ),
      }));
      setNotice({
        type: "ok",
        text: `Pesanan ${orderNumber(order)} telah diterima. Status diperbarui menjadi Selesai.`,
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setNotice({
        type: "error",
        text: typeof detail === "string" ? detail : "Gagal mengonfirmasi penerimaan pesanan. Coba lagi.",
      });
    } finally {
      setCompletingId(null);
    }
  };

  const reorder = async (order) => {
    if (!order.items) return;
    setBusyId(order.order_id);
    setNotice(null);
    let added = 0;
    let skipped = 0;

    for (const it of order.items) {
      let product = {
        product_id: it.product_id,
        product_name: it.product_name,
        price: it.price,
        image: it.image,
        store_id: it.store_id,
        store_name: it.store_name,
      };
      try {
        product = (await api.get(`/products/${it.product_id}`)).data;
      } catch {
        /* produk tidak ditemukan: pakai data dari pesanan */
      }
      if (typeof product.stock === "number" && product.stock <= 0) {
        skipped++;
        continue;
      }
      const res = await add(product, it.quantity, it.variant ?? "");
      if (!res.ok) {
        setBusyId(null);
        return setNotice({ type: "error", text: res.message });
      }
      added++;
    }

    setBusyId(null);
    if (added === 0) return setNotice({ type: "error", text: "Semua produk dari pesanan ini sedang habis." });
    if (skipped > 0) {
      return setNotice({ type: "ok", text: `${added} produk ditambahkan ke keranjang, ${skipped} dilewati karena stok habis.`, cta: true });
    }
    navigate("/keranjang");
  };

  const unavailable = (name) => setNotice({ type: "error", text: `Fitur ${name} belum tersedia.` });

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <Navbar />

      <main className="flex-1 bg-blush/40">
        <Container className="py-8 md:py-12">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Riwayat Pesanan</h1>
                <p className="mt-1 text-[16px] text-neutral-500">Daftar seluruh transaksi belanja anda</p>
              </div>

              <div className="relative w-full sm:w-72">
                <label htmlFor="cari-pesanan" className="sr-only">Cari pesanan atau produk</label>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id="cari-pesanan"
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisible(PAGE);
                  }}
                  placeholder="Cari pesanan atau produk..."
                  className="w-full rounded-[10px] border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon/30"
                />
              </div>
            </div>

            {/* Bar filter status pesanan */}
            <div
              role="tablist"
              aria-label="Filter status pesanan"
              className="mt-6 flex gap-1 overflow-x-auto border-b border-stone-200 bg-white px-2 pt-2 rounded-t-[10px]"
            >
              {STATUS_TABS.map((tab) => {
                const active = statusFilter === tab.id;
                const count = countForTab(tab.id);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setVisible(PAGE);
                    }}
                    className={
                      "relative flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors " +
                      (active
                        ? "border-maroon-dark text-maroon-dark"
                        : "border-transparent text-neutral-500 hover:text-neutral-900")
                    }
                  >
                    <span>{tab.label}</span>
                    {!state.loading && (
                      <span
                        className={
                          "rounded-[8px] px-1.5 py-0.5 text-[12px] " +
                          (active ? "bg-blush text-maroon-dark" : "bg-stone-100 text-neutral-500")
                        }
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {notice && (
              <p
                role={notice.type === "error" ? "alert" : "status"}
                className={"mt-4 rounded-[10px] px-3 py-2 text-sm " + (notice.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800")}
              >
                {notice.text}{" "}
                {notice.cta && (
                  <Link to="/keranjang" className="font-semibold underline">
                    Lihat keranjang
                  </Link>
                )}
              </p>
            )}

            {state.error && (
              <p role="alert" className="mt-4 rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-800">
                {state.error}
              </p>
            )}

            {state.loading ? (
              <div className="mt-5 space-y-4" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-[10px] bg-white" />
                ))}
              </div>
            ) : state.orders.length === 0 && !state.error ? (
              <div className="mt-5 rounded-[10px] bg-white px-6 py-16 text-center">
                <p className="text-xl font-semibold text-neutral-900">Belum ada pesanan</p>
                <p className="mt-1 text-[16px] text-neutral-500">Pesanan yang kamu buat akan muncul di sini setelah checkout.</p>
                <Link to="/produk" className="mt-6 inline-block rounded-[10px] bg-maroon-dark px-5 py-2.5 text-[14px] font-semibold uppercase tracking-wide text-white hover:bg-maroon">
                  Mulai belanja
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-5 rounded-[10px] bg-white px-6 py-12 text-center">
                <p className="text-[16px] font-medium text-neutral-600">
                  {q
                    ? `Tidak ada pesanan yang cocok dengan “${query}” pada filter ini.`
                    : `Belum ada pesanan dengan status ${STATUS_TABS.find((t) => t.id === statusFilter)?.label.toLowerCase() ?? "tersebut"}.`}
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {shown.map((o) => {
                  const isShipped = String(o.status ?? "").trim().toLowerCase() === "dikirim";
                  const isCompleting = completingId === o.order_id;
                  return (
                    <div key={o.order_id} className="rounded-[10px] bg-white shadow-sm">
                      <OrderCard
                        order={o}
                        reordering={busyId === o.order_id}
                        completing={isCompleting}
                        onReorder={reorder}
                        onConfirmReceived={confirmReceived}
                        onUnavailable={unavailable}
                      />
                      {isShipped && (
                        <div className="flex justify-end border-t border-stone-100 px-4 py-3">
                          <button
                            type="button"
                            disabled={isCompleting}
                            onClick={() => confirmReceived(o)}
                            className="rounded-[10px] bg-maroon-dark px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-maroon disabled:opacity-60"
                          >
                            {isCompleting ? "Mengonfirmasi..." : "Terima Pesanan"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filtered.length > shown.length && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE)}
                      className="rounded-[10px] border border-stone-300 bg-white px-5 py-2.5 text-[14px] font-semibold uppercase tracking-wide text-neutral-800 hover:bg-stone-50"
                    >
                      Tampilkan lebih banyak
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}