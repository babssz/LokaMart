import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Container from "../components/Container";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import useAllProducts from "../hooks/useAllProducts";
import { PAGE_SIZE, SORTS, categoryCounts, filterProducts, pageNumbers, rupiah, sortProducts } from "../utils/catalog";

function Pagination({ page, pages, onChange }) {
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1" aria-label="Navigasi halaman katalog">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="rounded-sm border border-stone-300 bg-white px-3 py-2 text-[10px] font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sebelumnya
      </button>
      {pageNumbers(page, pages).map((number, index) =>
        number === "…" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-xs text-neutral-500">
            {number}
          </span>
        ) : (
          <button
            key={number}
            type="button"
            aria-current={page === number ? "page" : undefined}
            onClick={() => onChange(number)}
            className={`min-w-9 rounded-sm border px-3 py-2 text-[10px] font-semibold ${
              page === number
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-stone-300 bg-white text-neutral-700 hover:bg-stone-100"
            }`}
          >
            {number}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className="rounded-sm border border-stone-300 bg-white px-3 py-2 text-[10px] font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Selanjutnya
      </button>
    </nav>
  );
}

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const { products, loading } = useAllProducts();
  const [showFilter, setShowFilter] = useState(false);

  const filters = {
    kategori: params.getAll("kategori"),
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
    stok: params.get("stok") === "ready",
    cari: params.get("cari") ?? "",
  };
  const urut = params.get("urut") ?? "terbaru";

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      next.delete(key);
      const values = Array.isArray(value) ? value : value === "" || value == null || value === false ? [] : [value];
      values.forEach((v) => next.append(key, v));
    });
    next.delete("hal"); // setiap perubahan filter kembali ke halaman 1
    setParams(next);
  };

  const resetAll = () => {
    const next = new URLSearchParams();
    if (params.get("urut")) next.set("urut", params.get("urut"));
    setParams(next);
  };

  const filtered = sortProducts(filterProducts(products, filters), urut);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.get("hal")) || 1), pages);
  const start = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const goToPage = (n) => {
    const next = new URLSearchParams(params);
    next.set("hal", String(n));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Chip filter aktif
  const priceLabel =
    filters.min && filters.max
      ? `${rupiah(filters.min)} – ${rupiah(filters.max)}`
      : filters.min
        ? `≥ ${rupiah(filters.min)}`
        : filters.max
          ? `≤ ${rupiah(filters.max)}`
          : "";
  const chips = [
    ...filters.kategori.map((k) => ({
      key: `kategori-${k}`,
      label: `Kategori: ${k}`,
      remove: () => update({ kategori: filters.kategori.filter((x) => x !== k) }),
    })),
    priceLabel && { key: "harga", label: `Harga: ${priceLabel}`, remove: () => update({ min: "", max: "" }) },
    filters.stok && { key: "stok", label: "Status: Ready Stock", remove: () => update({ stok: "" }) },
    filters.cari && { key: "cari", label: `Kata kunci: ${filters.cari}`, remove: () => update({ cari: "" }) },
  ].filter(Boolean);

  const filterKey = [filters.kategori.join("|"), filters.min, filters.max, filters.stok].join("/");

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <Navbar />

      <main className="flex-1 bg-blush/40">
        <Container className="pt-8 md:pt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-maroon">Direktori terverifikasi</p>
              <h1 className="mt-1 text-2xl font-semibold text-neutral-900 sm:text-3xl">Katalog Produk Lokal Makassar</h1>
              <p className="mt-1 text-xs text-neutral-600">
                Menampilkan {products.length} produk kriya, busana, boga, dan olahan alami terkurasi.
              </p>
            </div>
            <p className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
              <ShieldCheck className="h-3.5 w-3.5 text-maroon" /> 100% asal pengrajin lokal
            </p>
          </div>

          <div className="mt-5 border-t border-stone-200" />

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 py-3 text-[10px]">
              <span className="font-semibold uppercase tracking-wide text-neutral-500">Filter aktif:</span>
              {chips.map((c) => (
                <span key={c.key} className="inline-flex items-center gap-1.5 rounded-sm border border-stone-300 bg-white px-2 py-1 font-semibold text-neutral-800">
                  {c.label}
                  <button type="button" onClick={c.remove} aria-label={`Hapus filter ${c.label}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button type="button" onClick={resetAll} className="font-semibold text-maroon underline-offset-2 hover:underline">
                Reset Semua Filter
              </button>
            </div>
          )}
        </Container>

        <Container className="py-6 md:py-8">
          <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
            {/* Sidebar filter (di HP bisa dibuka-tutup) */}
            <div className="self-start lg:sticky lg:top-36">
              <button
                type="button"
                onClick={() => setShowFilter((s) => !s)}
                aria-expanded={showFilter}
                className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-sm border border-stone-300 bg-white py-2.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-800 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" /> {showFilter ? "Tutup filter" : "Filter pencarian"}
              </button>
              <div className={showFilter ? "block" : "hidden lg:block"}>
                <FilterSidebar
                  key={filterKey}
                  categories={categoryCounts(products)}
                  applied={filters}
                  onApply={(f) => {
                    update({ kategori: f.kategori, min: f.min, max: f.max, stok: f.stok ? "ready" : "" });
                    setShowFilter(false);
                  }}
                />
              </div>
            </div>

            {/* Hasil */}
            <section className="min-w-0">
              <div className="flex flex-col gap-3 rounded-sm border border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Urutkan:
                  <select
                    value={urut}
                    onChange={(e) => update({ urut: e.target.value })}
                    className="rounded-sm border border-stone-300 bg-white px-2 py-1.5 text-xs font-medium normal-case tracking-normal text-neutral-800"
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <p className="text-[11px] text-neutral-500">
                  {filtered.length === 0 ? "0 Barang" : `${start + 1} - ${start + visible.length} dari ${filtered.length} Barang`}
                </p>
              </div>

              {loading ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 lg:grid-cols-3" aria-busy="true">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <div key={i} className="h-64 animate-pulse rounded-lg bg-white" />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="mt-4 rounded-sm bg-white px-6 py-14 text-center">
                  <p className="text-sm font-semibold text-neutral-900">Tidak ada produk yang cocok.</p>
                  <p className="mt-1 text-xs text-neutral-500">Coba ubah atau hapus sebagian filter.</p>
                  {chips.length > 0 && (
                    <button onClick={resetAll} className="mt-4 rounded-sm bg-maroon-dark px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-maroon">
                      Reset Semua Filter
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    {visible.map((p) => (
                      <ProductCard key={p.product_id} product={p} accentPrice />
                    ))}
                  </div>
                  <Pagination page={page} pages={pages} shown={visible.length} onChange={goToPage} />
                </>
              )}
            </section>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}