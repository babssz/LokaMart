import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, BadgeCheck, Share2, ShoppingBag, ShoppingCart } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Container from "../components/Container";
import ProductCard from "../components/ProductCard";
import QuantityStepper from "../components/QuantityStepper";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import { getErrorMessage } from "../services/auth";
import { fallbackProducts, formatRupiah } from "../data/products";

const optionTitle = "text-[10px] font-semibold uppercase tracking-wide text-neutral-500";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { add: addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [recs, setRecs] = useState([]);

  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { type: "ok" | "error", text, cta }

  // Muat produk (GET /products/{id}); kalau backend mati, pakai data contoh
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProduct(null);
    setNotFound(false);
    setStatus(null);
    setQty(1);
    setActiveImg(0);
    setColor(null);
    setSize(null);

    api
      .get(`/products/${id}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data.status === "disembunyikan") setNotFound(true);
        else setProduct(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 404) return setNotFound(true);
        const demo = fallbackProducts.find((p) => String(p.product_id) === id);
        if (demo) setProduct(demo);
        else setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Rekomendasi: produk sekategori dulu, sisanya dari produk lain
  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    api
      .get("/products")
      .then((res) => {
        const items = (res.data.items ?? []).filter((p) => p.product_id !== product.product_id && p.status !== "disembunyikan");
        const same = items.filter((p) => p.category_id === product.category_id);
        const rest = items.filter((p) => p.category_id !== product.category_id);
        if (!cancelled) setRecs([...same, ...rest].slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setRecs(fallbackProducts.filter((p) => p.product_id !== product.product_id).slice(0, 4));
      });
    return () => {
      cancelled = true;
    };
  }, [product]);

  if (loading) {
    return (
      <Shell>
        <Container className="py-10">
          <div className="grid gap-8 lg:grid-cols-2" aria-busy="true">
            <div className="aspect-square animate-pulse rounded-sm bg-stone-100" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-stone-100" />
              <div className="h-24 animate-pulse rounded bg-stone-100" />
              <div className="h-40 animate-pulse rounded bg-stone-100" />
            </div>
          </div>
        </Container>
      </Shell>
    );
  }

  if (notFound || !product) {
    return (
      <Shell>
        <Container className="py-24 text-center">
          <p className="text-lg font-semibold text-neutral-900">Produk tidak ditemukan</p>
          <p className="mt-1 text-sm text-neutral-500">Produk ini mungkin sudah tidak tersedia.</p>
          <Link to="/produk" className="mt-6 inline-block rounded-sm bg-maroon-dark px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-maroon">
            Kembali ke katalog
          </Link>
        </Container>
      </Shell>
    );
  }

  // Data turunan
  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const colors = product.colors ?? [];
  const sizes = product.sizes ?? [];
  const hasStock = typeof product.stock === "number";
  const soldOut = hasStock && product.stock <= 0;
  const maxQty = hasStock ? Math.max(product.stock, 1) : 99;
  const paragraphs = String(product.description ?? "").split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const storeWords = String(product.store_name ?? "UMKM").trim().split(/\s+/);
  const storeInitials = storeWords.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const original = Number(product.original_price);
  const discount = original > Number(product.price) ? Math.round((1 - Number(product.price) / original) * 100) : 0;

  // Pemeriksaan sebelum membeli: login, stok, dan pilihan varian
  const canBuy = () => {
    if (!user) {
      navigate("/login", { state: { from: location, message: "Masuk dulu untuk mulai berbelanja." } });
      return false;
    }
    if (soldOut) {
      setStatus({ type: "error", text: "Stok produk habis." });
      return false;
    }
    if (colors.length && !color) {
      setStatus({ type: "error", text: "Pilih warna terlebih dahulu." });
      return false;
    }
    if (sizes.length && !size) {
      setStatus({ type: "error", text: "Pilih ukuran terlebih dahulu." });
      return false;
    }
    return true;
  };

  const add = async () => {
    if (!canBuy()) return false;

    setBusy(true);
    setStatus(null);
    try {
      // Varian disimpan sebagai teks di keranjang (mode lokal); backend belum punya varian produk
      const variantText = [color?.label, size ? `Ukuran ${size}` : null].filter(Boolean).join(" • ");
      const res = await addItem(product, qty, variantText);
      if (!res.ok) {
        setStatus({ type: "error", text: res.message });
        return false;
      }
      setStatus({ type: "ok", text: "Produk ditambahkan ke keranjang.", cta: true });
      return true;
    } catch (err) {
      setStatus({ type: "error", text: getErrorMessage(err) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Beli Sekarang: langsung ke checkout hanya dengan produk ini (keranjang tidak berubah)
  const buyNow = () => {
    if (!canBuy()) return;
    const variantText = [color?.label, size ? `Ukuran ${size}` : null].filter(Boolean).join(" • ");
    navigate("/checkout", { state: { buyNow: { product, quantity: qty, variant: variantText } } });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus({ type: "ok", text: "Tautan produk disalin." });
    } catch {
      setStatus({ type: "error", text: "Tautan tidak bisa disalin di browser ini." });
    }
  };

  return (
    <Shell>
      <Container className="py-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Galeri */}
          <div>
            <div className="relative overflow-hidden rounded-sm bg-stone-100">
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={product.product_name} className="aspect-square w-full object-cover" />
              ) : (
                <div className="grid aspect-square w-full place-items-center text-sm text-neutral-400">Foto produk</div>
              )}
              <button
                type="button"
                onClick={share}
                aria-label="Salin tautan produk"
                title="Salin tautan produk"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-neutral-700 shadow hover:bg-white"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    aria-label={`Lihat foto ${i + 1}`}
                    aria-current={i === activeImg}
                    className={"overflow-hidden rounded-sm border-2 " + (i === activeImg ? "border-maroon" : "border-transparent hover:border-stone-300")}
                  >
                    <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info produk */}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-snug text-neutral-900 sm:text-2xl">{product.product_name}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-600">
              {product.rating != null && (
                <span>
                  <span className="text-amber-500">★</span> <strong className="text-neutral-900">{product.rating}</strong>
                  {product.reviews != null && ` (${product.reviews} ulasan)`}
                </span>
              )}
              {product.sold != null && <span>Terjual {product.sold}</span>}
              {hasStock && (
                <span className={soldOut ? "font-semibold text-red-700" : "font-semibold text-emerald-700"}>
                  ● {soldOut ? "Stok habis" : `Stok tersedia: ${product.stock}`}
                </span>
              )}
            </div>

            {/* Penjual */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-sm border border-stone-200 bg-stone-50 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-maroon-dark text-xs font-semibold text-white">{storeInitials}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold text-neutral-900">
                    {product.store_name ?? "UMKM Makassar"} <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-maroon" />
                  </p>
                  <p className="text-[11px] text-neutral-500">Pengrajin lokal Makassar</p>
                </div>
              </div>
              <Link to={`/toko/${product.store_id ?? ""}`} className="shrink-0 rounded-sm border border-stone-300 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50">
                Kunjungi Toko
              </Link>
            </div>

            {/* Harga */}
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm border border-stone-200 bg-blush/50 px-4 py-3">
              <p className="text-2xl font-bold text-maroon sm:text-3xl">{formatRupiah(product.price)}</p>
              {discount > 0 && (
                <>
                  <p className="text-xs text-neutral-400 line-through">{formatRupiah(original)}</p>
                  <span className="rounded-sm bg-red-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">-{discount}% OFF</span>
                </>
              )}
            </div>

            {/* Pilihan warna & ukuran (hanya tampil kalau produk punya varian) */}
            {colors.length > 0 && (
              <div className="mt-5">
                <p className={optionTitle}>Warna{color ? `: ${color.label}` : ""}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-pressed={color?.label === c.label}
                      className={
                        "inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs " +
                        (color?.label === c.label ? "border-maroon bg-blush/60 font-semibold text-neutral-900" : "border-stone-300 bg-white text-neutral-700 hover:bg-stone-50")
                      }
                    >
                      <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: c.hex }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mt-5">
                <p className={optionTitle}>Ukuran{size ? `: ${size}` : ""}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      aria-pressed={size === s}
                      className={
                        "grid h-9 min-w-11 place-items-center rounded-sm border px-3 text-xs font-semibold " +
                        (size === s ? "border-maroon-dark bg-maroon-dark text-white" : "border-stone-300 bg-white text-neutral-700 hover:bg-stone-50")
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Jumlah */}
            <div className="mt-5">
              <p className={optionTitle}>Jumlah pembelian</p>
              <div className="mt-2 flex items-center gap-3">
                <QuantityStepper value={qty} onChange={setQty} max={maxQty} disabled={soldOut || busy} />
                {hasStock && !soldOut && <span className="text-[11px] text-neutral-500">Sisa stok {product.stock} unit</span>}
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={add}
                disabled={busy || soldOut}
                className="inline-flex items-center justify-center gap-2 rounded-sm border-2 border-maroon-dark bg-white py-3 text-[11px] font-semibold uppercase tracking-wide text-maroon-dark transition-colors hover:bg-blush/60 disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" /> {busy ? "Memproses..." : "Tambah ke Keranjang"}
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={busy || soldOut}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-maroon-dark py-3 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" /> Beli Sekarang
              </button>
            </div>

            {status && (
              <p
                role={status.type === "error" ? "alert" : "status"}
                className={"mt-3 rounded-sm px-3 py-2 text-xs " + (status.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800")}
              >
                {status.text}{" "}
                {status.cta && (
                  <Link to="/keranjang" className="font-semibold underline">
                    Lihat keranjang
                  </Link>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Deskripsi */}
        <section className="mt-10 md:mt-12">
          <div className="border-b border-stone-200">
            <h2 className="-mb-px inline-block border-b-2 border-maroon pb-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-900">
              Deskripsi Produk
            </h2>
          </div>
          <div className="mt-5 max-w-3xl space-y-3 text-sm leading-relaxed text-neutral-700">
            {paragraphs.length > 0 ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p className="text-neutral-400">Belum ada deskripsi untuk produk ini.</p>}
          </div>
        </section>
      </Container>

      {/* Rekomendasi */}
      {recs.length > 0 && (
        <section className="border-t border-stone-200 bg-blush/40">
          <Container className="py-8 md:py-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Rekomendasi Lainnya</h2>
                <p className="mt-0.5 text-xs text-neutral-500">Produk pilihan serupa dari pengrajin lokal Makassar.</p>
              </div>
              <Link to="/produk" className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-maroon hover:underline">
                Lihat semua <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {recs.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </Shell>
  );
}

// Kerangka halaman: navbar di atas, footer di bawah
function Shell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}