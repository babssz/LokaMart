import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Banknote, Check, Landmark, Lock, QrCode, ShieldCheck, Store } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Container from "../components/Container";
import CheckoutSection from "../components/CheckoutSection";
import AddressCard from "../components/AddressCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import { createOrder } from "../services/orders";
import { formatRupiah } from "../data/products";
import { COURIERS, PAYMENTS, loadAddress, saveAddress } from "../utils/checkout";

const fail = (userMessage) => Object.assign(new Error(userMessage), { userMessage });
const payIcons = { qris: QrCode, va: Landmark, cod: Banknote };
const storeKeyOf = (it) => it.product.store_id ?? it.product.store_name ?? "lainnya";

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, loaded, remove } = useCart();

  
  const buyNow = location.state?.buyNow;
  const keys = location.state?.keys;

  const items = useMemo(() => {
    if (buyNow) {
      const p = buyNow.product;
      return [
        {
          key: `${p.product_id}|${buyNow.variant ?? ""}`,
          product_id: p.product_id,
          variant: buyNow.variant ?? "",
          quantity: buyNow.quantity,
          note: "",
          product: {
            product_name: p.product_name,
            price: p.price,
            image: p.image,
            store_id: p.store_id,
            store_name: p.store_name,
            stock: p.stock,
            category_name: p.category_name,
          },
        },
      ];
    }
    const list = keys ? cartItems.filter((it) => keys.includes(it.key)) : cartItems;
    return list.filter((it) => !(typeof it.product.stock === "number" && it.product.stock <= 0));
  }, [buyNow, keys, cartItems]);

  const [address, setAddress] = useState(() => loadAddress(user));
  const [courierId, setCourierId] = useState("motor");
  const [paymentId, setPaymentId] = useState("qris");
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");

  // Kalau tidak ada item yang bisa dicheckout, kembali ke keranjang
  useEffect(() => {
    if (buyNow || !loaded || placed) return;
    if (items.length === 0) navigate("/keranjang", { replace: true });
  }, [buyNow, loaded, placed, items.length, navigate]);

  const courier = COURIERS.find((c) => c.id === courierId);
  const payment = PAYMENTS.find((p) => p.id === paymentId);

  const subtotal = items.reduce((s, it) => s + Number(it.product.price) * it.quantity, 0);
  const total = subtotal + courier.fee;
  const pieces = items.reduce((s, it) => s + it.quantity, 0);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const k = storeKeyOf(it);
      if (!map.has(k)) map.set(k, { key: k, name: it.product.store_name ?? "UMKM Makassar", items: [] });
      map.get(k).items.push(it);
    });
    return [...map.values()];
  }, [items]);

  const chooseCourier = (id) => {
    setCourierId(id);
    // COD hanya untuk kurir motor
    if (id !== "motor" && payment.onlyCourier) setPaymentId("qris");
  };

  const saveAddr = (addr) => {
    saveAddress(user.user_id, addr);
    setAddress(addr);
  };

  const placeOrder = async () => {
    setError("");
    if (!address.address?.trim()) return setError("Lengkapi alamat pengiriman terlebih dahulu.");
    if (!agree) return setError("Setujui ketentuan pembelian untuk melanjutkan.");

    setPaying(true);
    try {
      // 1. Cek stok dan harga terbaru dari server (BR-05, NFR07)
      const lines = [];
      for (const it of items) {
        let p = it.product;
        try {
          p = (await api.get(`/products/${it.product_id}`)).data;
        } catch (err) {
          if (err.response?.status === 404) throw fail(`"${it.product.product_name}" sudah tidak tersedia.`);
          // server tidak terjangkau: pakai data yang tersimpan
        }
        if (p.status === "disembunyikan") throw fail(`"${p.product_name}" sudah tidak tersedia.`);
        if (typeof p.stock === "number" && it.quantity > p.stock) {
          throw fail(`Stok "${p.product_name}" tersisa ${p.stock}. Kurangi jumlahnya di keranjang.`);
        }
        const price = Number(p.price);
        lines.push({
          product_id: it.product_id,
          product_name: p.product_name,
          image: p.image ?? null,
          store_id: p.store_id,
          store_name: p.store_name,
          variant: it.variant,
          note: it.note,
          quantity: it.quantity,
          price,
          subtotal: price * it.quantity,
        });
      }
      const sub = lines.reduce((s, l) => s + l.subtotal, 0);

      // 2. Pembayaran simulasi (BR-06): tidak ada transaksi uang nyata
      await new Promise((r) => setTimeout(r, 1200));

      // 3. Buat pesanan
      await createOrder(user.user_id, {
        items: lines,
        address,
        shipping: { courier: courier.name, fee: courier.fee },
        payment: {
          method: payment.srsMethod,
          label: payment.name,
          status: payment.id === "cod" ? "menunggu (bayar di tempat)" : "berhasil",
          date: new Date().toISOString(),
        },
        subtotal: sub,
        total: sub + courier.fee,
      });

      // 4. Bersihkan item yang sudah dipesan dari keranjang
      setPlaced(true);
      if (!buyNow) await remove(items);

      const how = payment.id === "cod" ? "dibayar tunai saat barang tiba" : "berhasil dibayar";
      navigate("/pesanan", { replace: true, state: { message: `Pesanan berhasil dibuat dan ${how} (simulasi, ${payment.name}).` } });
    } catch (err) {
      setError(err.userMessage ?? (err.response ? "Pesanan belum bisa dibuat. Coba lagi." : err.message));
    } finally {
      setPaying(false);
    }
  };

  if (!buyNow && !loaded) {
    return (
      <Shell>
        <Container className="py-8">
          <div className="h-96 animate-pulse rounded-sm bg-white" aria-busy="true" />
        </Container>
      </Shell>
    );
  }

  return (
    <Shell>
      <Container className="py-6 md:py-8">
        <h1 className="sr-only">Checkout</h1>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          {/* Kolom kiri: empat langkah */}
          <div className="space-y-4">
            <AddressCard address={address} onSave={saveAddr} />

            <CheckoutSection number="2" title="Metode Pengiriman Kota" subtitle="Logistik lokal & pengemasan ramah lingkungan">
              <div className="space-y-3" role="radiogroup" aria-label="Metode pengiriman">
                {COURIERS.map((c) => {
                  const selected = c.id === courierId;
                  return (
                    <label
                      key={c.id}
                      className={
                        "flex cursor-pointer items-start gap-3 rounded-sm border p-3 sm:p-4 " +
                        (selected ? "border-maroon bg-blush/50" : "border-stone-200 bg-white hover:bg-stone-50")
                      }
                    >
                      <input type="radio" name="courier" checked={selected} onChange={() => chooseCourier(c.id)} className="mt-1 h-3.5 w-3.5 shrink-0 accent-maroon-dark" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-900 sm:text-sm">
                          {c.name}
                          {c.badge && <span className="rounded-sm bg-neutral-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">{c.badge}</span>}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{c.desc}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-neutral-900">{formatRupiah(c.fee)}</p>
                        {c.originalFee && <p className="text-[10px] text-neutral-400 line-through">{formatRupiah(c.originalFee)}</p>}
                        <p className="max-w-[7.5rem] text-[9px] font-semibold uppercase leading-tight tracking-wide text-maroon">{c.note}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </CheckoutSection>

            <CheckoutSection
              number="3"
              title="Daftar Item Pesanan"
              subtitle={`${items.length} jenis barang dari ${groups.length} pengrajin lokal`}
              action={<span className="shrink-0 text-[11px] text-neutral-500">Total: {pieces} Pcs</span>}
            >
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.key} className="overflow-hidden rounded-sm bg-stone-100/70">
                    <p className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-900">
                      <Store className="h-3.5 w-3.5 text-maroon" /> {g.name}
                    </p>
                    <ul className="divide-y divide-stone-200 bg-white px-3">
                      {g.items.map((it) => (
                        <li key={it.key} className="flex items-center gap-3 py-3">
                          {it.product.image ? (
                            <img src={it.product.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-sm object-cover" />
                          ) : (
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-stone-100 text-[9px] text-neutral-400">Foto</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-xs font-semibold text-neutral-900">{it.product.product_name}</p>
                            <p className="mt-0.5 text-[11px] text-neutral-500">
                              {it.variant ? `${it.variant} • ` : ""}
                              {it.quantity} Pcs
                            </p>
                            {it.note && <p className="mt-0.5 text-[11px] italic text-neutral-400">Catatan: {it.note}</p>}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-bold text-neutral-900">{formatRupiah(Number(it.product.price) * it.quantity)}</p>
                            {it.quantity > 1 && <p className="text-[10px] text-neutral-400">@ {formatRupiah(it.product.price)}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CheckoutSection>

            <CheckoutSection number="4" title="Metode Pembayaran">
              <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Metode pembayaran">
                {PAYMENTS.map((p) => {
                  const Icon = payIcons[p.id];
                  const disabled = p.onlyCourier && p.onlyCourier !== courierId;
                  const selected = p.id === paymentId;
                  return (
                    <label
                      key={p.id}
                      className={
                        "relative flex flex-col gap-1 rounded-sm border p-3 " +
                        (disabled
                          ? "cursor-not-allowed border-stone-200 bg-stone-50 opacity-50"
                          : selected
                            ? "cursor-pointer border-maroon bg-blush/50"
                            : "cursor-pointer border-stone-200 bg-white hover:bg-stone-50")
                      }
                    >
                      <input type="radio" name="payment" disabled={disabled} checked={selected} onChange={() => setPaymentId(p.id)} className="sr-only" />
                      <span className="flex items-center justify-between">
                        <Icon className="h-4 w-4 text-maroon" />
                        {p.tag && <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-500">{p.tag}</span>}
                      </span>
                      <span className="text-xs font-semibold text-neutral-900">{p.name}</span>
                      <span className="text-[10px] leading-snug text-neutral-500">{p.detail}</span>
                      <span className={"mt-1 inline-flex items-center gap-1 text-[10px] font-semibold " + (selected ? "text-maroon" : "text-neutral-400")}>
                        {selected ? (
                          <>
                            <Check className="h-3 w-3" /> Terpilih
                          </>
                        ) : disabled ? (
                          "Khusus kurir motor"
                        ) : (
                          "Pilih Metode"
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </CheckoutSection>
          </div>

          {/* Kolom kanan: rincian dan jaminan */}
          <div className="space-y-4 lg:sticky lg:top-36">
            <aside className="rounded-sm border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-900">Rincian Pembayaran</h2>
                <Link to="/produk" className="rounded-sm border border-maroon/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-maroon hover:bg-blush/50">
                  + Barang
                </Link>
              </div>

              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-600">Subtotal Produk</dt>
                  <dd className="font-medium text-neutral-900">{formatRupiah(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-600">Biaya Pengiriman</dt>
                  <dd className="font-semibold text-maroon">{formatRupiah(courier.fee)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-600">Biaya Layanan Sistem</dt>
                  <dd className="font-medium text-neutral-900">Rp 0 <span className="text-[10px] text-neutral-400">(Bebas Komisi)</span></dd>
                </div>
              </dl>

              <div className="mt-4 rounded-sm bg-stone-100 px-3 py-3">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500">Total Tagihan Bersih</p>
                <p className="mt-0.5 flex items-baseline justify-between text-xl font-bold text-maroon">
                  {formatRupiah(total)} <span className="text-[9px] font-normal text-neutral-400">IDR Net</span>
                </p>
              </div>

            

              {error && (
                <p role="alert" className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-xs text-red-800">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={placeOrder}
                disabled={paying || items.length === 0}
                className="mt-4 w-full rounded-sm bg-maroon-dark py-3.5 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon disabled:opacity-60"
              >
                {paying ? "Memproses pembayaran..." : payment.id === "cod" ? "Buat Pesanan" : "Bayar Sekarang"}
              </button>
              <p className="mt-2 text-center text-[10px] text-neutral-400">Pembayaran bersifat simulasi, tidak ada transaksi uang nyata.</p>
            </aside>

            <aside className="rounded-sm border border-stone-200 bg-blush/50 p-5">
              <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-900">
                <ShieldCheck className="h-4 w-4 text-maroon" /> Jaminan Transaksi Aman
              </h2>
              <ul className="mt-3 space-y-3">
                {[
                  { icon: Lock, title: "Escrow Kas Kota Terpadu", text: "Dana Anda ditahan aman di rekening bersama kota hingga barang diterima dalam kondisi terverifikasi prima." },
                  { icon: Lock, title: "Enkripsi 256-Bit SSL/TLS", text: "Data kependudukan (identitas) dan privasi transaksi terlindungi standar enkripsi perbankan nasional." },
                  { icon: ShieldCheck, title: "100% Produk Terkurasi & Asli", text: "Dilampirkan langsung oleh Dinas Perdagangan & Komite Kurasi Dekranasda Kota Makassar." },
                ].map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-2.5">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-maroon" />
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-900">{title}</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-neutral-500">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </Container>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <Navbar />
      <main className="flex-1 bg-blush/40">{children}</main>
      <Footer />
    </div>
  );
}