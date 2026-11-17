import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, HelpCircle, Plus, Store, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Container from "../components/Container";
import CartItemRow from "../components/CartItemRow";
import OrderSummary from "../components/OrderSummary";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import { fallbackProducts, formatRupiah } from "../data/products";

const isSoldOut = (it) => typeof it.product.stock === "number" && it.product.stock <= 0;

export default function CartPage() {
  const navigate = useNavigate();
  const { items, loading, loaded, error, add, setQty, setNote, remove } = useCart();
  const [unchecked, setUnchecked] = useState(() => new Set()); // item yang tidak dicentang
  const [suggest, setSuggest] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/products")
      .then((res) => {
        const list = (res.data.items ?? []).filter((p) => p.status !== "disembunyikan" && !(typeof p.stock === "number" && p.stock <= 0));
        if (!cancelled) setSuggest(list);
      })
      .catch(() => {
        if (!cancelled) setSuggest(fallbackProducts.filter((p) => (p.stock ?? 1) > 0));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const k = it.product.store_id ?? it.product.store_name ?? "lainnya";
      if (!map.has(k)) map.set(k, { key: k, name: it.product.store_name ?? "UMKM Makassar", items: [] });
      map.get(k).items.push(it);
    });
    return [...map.values()];
  }, [items]);

  const isChecked = (it) => !isSoldOut(it) && !unchecked.has(it.key);
  const selectable = items.filter((it) => !isSoldOut(it));
  const selected = items.filter(isChecked);
  const allChecked = selectable.length > 0 && selectable.every(isChecked);
  const subtotal = selected.reduce((sum, it) => sum + Number(it.product.price) * it.quantity, 0);

  const setChecked = (list, on) =>
    setUnchecked((prev) => {
      const next = new Set(prev);
      list.forEach((it) => (on ? next.delete(it.key) : next.add(it.key)));
      return next;
    });

  const removeSelected = () => {
    if (selected.length === 0) return;
    if (window.confirm(`Hapus ${selected.length} produk terpilih dari keranjang?`)) remove(selected);
  };

  const goCheckout = () => navigate("/checkout", { state: { keys: selected.map((it) => it.key) } });

  const recs = suggest.filter((p) => !items.some((it) => it.product_id === p.product_id)).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <Navbar />

      <main className="flex-1">
        <section className="bg-blush/40">
          <Container className="py-6 md:py-8">
            <h1 className="sr-only">Keranjang Belanja</h1>

            {error && (
              <p role="alert" className="mb-4 rounded-sm bg-red-50 px-3 py-2 text-xs text-red-800">
                {error}
              </p>
            )}

            {(!loaded || loading) && items.length === 0 ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-busy="true">
                <div className="h-72 animate-pulse rounded-sm bg-white" />
                <div className="h-56 animate-pulse rounded-sm bg-white" />
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-sm bg-white px-6 py-20 text-center">
                <p className="text-lg font-semibold text-neutral-900">Keranjang Anda masih kosong</p>
                <p className="mt-1 text-sm text-neutral-500">Temukan produk khas Makassar dan tambahkan ke keranjang.</p>
                <Link to="/produk" className="mt-6 inline-block rounded-sm bg-maroon-dark px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-maroon">
                  Mulai belanja
                </Link>
              </div>
            ) : (
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-4">
                  {/* Pilih semua */}
                  <div className="flex items-center justify-between gap-3 rounded-sm border border-stone-200 bg-white px-4 py-3">
                    <label className="flex cursor-pointer items-center gap-3 text-xs font-semibold text-neutral-900">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        disabled={selectable.length === 0}
                        onChange={() => setChecked(selectable, !allChecked)}
                        className="h-4 w-4 accent-maroon-dark"
                      />
                      Pilih Semua ({selected.length} Produk Terpilih)
                    </label>
                    <button
                      type="button"
                      onClick={removeSelected}
                      disabled={selected.length === 0}
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-maroon hover:underline disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus produk terpilih
                    </button>
                  </div>

                  {/* Per toko */}
                  {groups.map((g) => {
                    const sel = g.items.filter((it) => !isSoldOut(it));
                    const storeChecked = sel.length > 0 && sel.every(isChecked);
                    return (
                      <section key={g.key} className="overflow-hidden rounded-sm border border-stone-200 bg-white">
                        <header className="flex items-center gap-3 bg-stone-100/70 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={storeChecked}
                            disabled={sel.length === 0}
                            onChange={() => setChecked(sel, !storeChecked)}
                            aria-label={`Pilih semua produk dari ${g.name}`}
                            className="h-4 w-4 accent-maroon-dark"
                          />
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-maroon-dark text-white">
                            <Store className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">{g.name}</p>
                            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Makassar</p>
                          </div>
                        </header>

                        <ul className="divide-y divide-stone-200 px-4">
                          {g.items.map((it) => (
                            <CartItemRow
                              key={it.key}
                              item={it}
                              checked={isChecked(it)}
                              onToggle={() => setChecked([it], !isChecked(it))}
                              onQty={(n) => setQty(it, n)}
                              onNote={(text) => setNote(it, text)}
                              onRemove={() => remove([it])}
                            />
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>

                {/* Ringkasan */}
                <div className="lg:sticky lg:top-36">
                  <OrderSummary count={selected.length} subtotal={subtotal}>
                    <button
                      type="button"
                      onClick={goCheckout}
                      disabled={selected.length === 0}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-maroon-dark py-3.5 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon disabled:opacity-50"
                    >
                      Lanjut ke Checkout ({selected.length} Item) <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </OrderSummary>

                  <div className="mt-3 flex items-center justify-between gap-3 rounded-sm border border-stone-200 bg-white px-4 py-3 text-[11px]">
                    <span className="inline-flex items-center gap-2 text-neutral-600">
                      <HelpCircle className="h-4 w-4" /> Butuh bantuan?
                    </span>
                    <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-maroon-dark hover:underline">
                      Hubungi Penjual
                    </a>
                  </div>
                </div>
              </div>
            )}
          </Container>
        </section>

        {/* Beli bersama */}
        {recs.length > 0 && (
          <section className="border-t border-stone-200 bg-white">
            <Container className="py-8 md:py-10">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-maroon">Pelengkap pilihan</p>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Beli Bersama Karya Terkait</h2>
                  <p className="mt-0.5 text-xs text-neutral-500">Tambahkan produk UMKM kota lainnya untuk memaksimalkan satu pengiriman kurir lokal.</p>
                </div>
                <Link to="/produk" className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-maroon hover:underline">
                  Lihat semua kurasi <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recs.map((p) => (
                  <article key={p.product_id} className="overflow-hidden rounded-sm border border-stone-200 bg-white">
                    <Link to={`/produk/${p.product_id}`} className="relative block">
                      {p.image ? (
                        <img src={p.image} alt={p.product_name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                      ) : (
                        <div className="grid aspect-[4/3] w-full place-items-center bg-stone-100 text-xs text-neutral-400">Foto produk</div>
                      )}
                      {p.category_name && (
                        <span className="absolute left-2 top-2 rounded-sm bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-800">{p.category_name}</span>
                      )}
                    </Link>
                    <div className="p-4">
                      <p className="truncate text-[10px] uppercase tracking-wide text-neutral-500">{p.store_name ?? "UMKM Makassar"}</p>
                      <Link to={`/produk/${p.product_id}`} className="mt-1 block text-sm font-semibold text-neutral-900 hover:underline">
                        {p.product_name}
                      </Link>
                      {p.description && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutral-500">{p.description}</p>}
                      <div className="mt-3 flex items-baseline justify-between">
                        <p className="text-sm font-bold text-neutral-900">{formatRupiah(p.price)}</p>
                        {typeof p.stock === "number" && <p className="text-[10px] text-neutral-500">Stok: {p.stock}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => add(p, 1)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-sm bg-stone-100 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-800 transition-colors hover:bg-stone-200"
                      >
                        <Plus className="h-3.5 w-3.5" /> Tambah ke keranjang
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}