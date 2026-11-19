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

const orderNumber = (o) => o.order_number || `ORD-${o.order_id}`;

export default function OrdersPage() {
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = user?.user_id;

  const [state, setState] = useState({ orders: [], isSample: false, loading: true, error: "" });
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(
    location.state?.message ? { type: "ok", text: location.state.message } : null
  );

  useEffect(() => {
    let cancelled = false;
    let requestPending = false;
    const loadOrders = async (initial = false) => {
      if (cancelled || requestPending) return;
      requestPending = true;
      if (initial) setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const { orders, isSample } = await fetchOrders();
        if (!cancelled) setState({ orders, isSample, loading: false, error: "" });
      } catch (err) {
        if (!cancelled) {
          setState({
            orders: [],
            isSample: false,
            loading: false,
            error: ordersErrorMessage(err),
          });
        }
      } finally {
        requestPending = false;
      }
    };
    const refreshOrders = () => loadOrders();

    loadOrders(true);
    const refreshInterval = window.setInterval(refreshOrders, 30000);
    window.addEventListener("focus", refreshOrders);
    document.addEventListener("visibilitychange", refreshOrders);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshOrders);
      document.removeEventListener("visibilitychange", refreshOrders);
    };
  }, [userId]);

  const q = query.trim().toLowerCase();
  const filtered = state.orders.filter((o) => {
    if (!q) return true;
    const fields = [
      orderNumber(o), 
      ...(o.items ? o.items.map((i) => i.product_name) : []), 
      ...(o.items ? o.items.map((i) => i.store_name) : [])
    ];
    return fields.some((f) => String(f ?? "").toLowerCase().includes(q));
  });
  const shown = filtered.slice(0, visible);

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
                <h1 className="text-2xl font-bold text-neutral-900">Riwayat Pesanan</h1>
                <p className="mt-1 text-xs text-neutral-500">Daftar seluruh transaksi belanja anda</p>
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
                  className="w-full rounded-sm border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs text-neutral-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon/30"
                />
              </div>
            </div>

            <div className="mt-6 border-t border-stone-200" />

            {notice && (
              <p
                role={notice.type === "error" ? "alert" : "status"}
                className={"mt-4 rounded-sm px-3 py-2 text-xs " + (notice.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800")}
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
              <p role="alert" className="mt-4 rounded-sm bg-red-50 px-3 py-2 text-xs text-red-800">
                {state.error}
              </p>
            )}

            {state.loading ? (
              <div className="mt-5 space-y-4" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-sm bg-white" />
                ))}
              </div>
            ) : state.orders.length === 0 && !state.error ? (
              <div className="mt-5 rounded-sm bg-white px-6 py-16 text-center">
                <p className="text-lg font-semibold text-neutral-900">Belum ada pesanan</p>
                <p className="mt-1 text-sm text-neutral-500">Pesanan yang kamu buat akan muncul di sini setelah checkout.</p>
                <Link to="/produk" className="mt-6 inline-block rounded-sm bg-maroon-dark px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-maroon">
                  Mulai belanja
                </Link>
              </div>
            ) : filtered.length === 0 && state.orders.length > 0 ? (
              <p className="mt-8 text-center text-sm text-neutral-500">Tidak ada pesanan yang cocok dengan “{query}”.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {shown.map((o) => (
                  <OrderCard key={o.order_id} order={o} reordering={busyId === o.order_id} onReorder={reorder} onUnavailable={unavailable} />
                ))}

                {filtered.length > shown.length && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE)}
                      className="rounded-sm border border-stone-300 bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-800 hover:bg-stone-50"
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