import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Container from "./Container";
import ProductCard from "./ProductCard";
import api from "../services/api";
import { categories } from "../data/products";
import useAllProducts from "../hooks/useAllProducts";

const getCategory = (p) => p.category_name;

export default function ProductSection({
  eyebrow = "Eksplorasi katalog lokal",
  title = "Temukan produk khas Makassar",
  subtitle = "Temukan produk yang kamu suka dan dukung usaha lokal melalui Lokamart.",
  limit = 15, // Default dibatasi 15 produk per halaman
  bg = "bg-blush",
}) {
  const { products, loading } = useAllProducts();
  const [categoryFilters, setCategoryFilters] = useState(categories);
  const [active, setActive] = useState("Semua");
  const [params, setParams] = useSearchParams();
  const sectionRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);

  const keyword = (params.get("q") ?? "").trim();
  const selectedKategori = params.get("kategori");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/categories")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.items ?? [];
        if (!cancelled) {
          setCategoryFilters(["Semua", ...list.map((category) => category.category_name)]);
        }
      })
      .catch((err) => {
        console.warn("Gagal memuat kategori:", err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedKategori) {
      const formatted = selectedKategori.charAt(0).toUpperCase() + selectedKategori.slice(1);
      setActive(formatted);
    }
    setCurrentPage(1); // Reset ke halaman 1 saat kategori berubah
  }, [selectedKategori]);

  useEffect(() => {
    if (keyword) sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(1); // Reset ke halaman 1 saat mencari
  }, [keyword]);

  const q = keyword.toLowerCase();
  const shown = products.filter((p) => {
    const cocokKategori = active === "Semua" || getCategory(p) === active;
    const cocokKata =
      !q || [p.product_name, p.store_name, p.category_name, p.description].some((f) => String(f ?? "").toLowerCase().includes(q));
    return cocokKategori && cocokKata;
  });

  const itemsPerPage = limit;
  const totalPages = Math.ceil(shown.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visible = shown.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section id="produk" ref={sectionRef} className={`scroll-mt-28 ${bg}`}>
      <Container className="py-8 md:py-10">
        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-wide text-maroon">{eyebrow}</p>}

        <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold uppercase tracking-tight text-neutral-900 sm:text-2xl">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-neutral-600">{subtitle}</p>}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" role="tablist" aria-label="Filter kategori">
            {categoryFilters.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={active === c}
                onClick={() => {
                  setActive(c);
                  setCurrentPage(1); // Reset halaman ke 1 saat ganti kategori manual
                }}
                className={
                  "shrink-0 rounded px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors " +
                  (active === c ? "bg-neutral-900 text-white" : "bg-stone-100 text-neutral-700 hover:bg-stone-200")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {keyword && (
          <p className="mt-4 text-xs text-neutral-600">
            {shown.length} hasil untuk “{keyword}”
            <button onClick={() => setParams({})} className="ml-3 font-semibold text-maroon hover:underline">
              Hapus pencarian
            </button>
          </p>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-neutral-500">Memuat produk...</p>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">
            {keyword ? `Tidak ada produk yang cocok dengan “${keyword}”.` : "Belum ada produk di kategori ini."}
          </p>
        ) : (
          <>
            {/* Grid Produk */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
              {visible.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>

            {/* Navigasi Pagination (Tombol Sebelumnya & Berikutnya) */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-4">
                <p className="text-xs text-neutral-600">
                  Menampilkan <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(startIndex + itemsPerPage, shown.length)}</span> dari <span className="font-semibold">{shown.length}</span> produk
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-xs font-medium text-neutral-700">
                    Hal. {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </section>
  );
}