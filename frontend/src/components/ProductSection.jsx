import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Container from "./Container";
import ProductCard from "./ProductCard";
import api from "../services/api";
import { categories, fallbackProducts } from "../data/products";

const getCategory = (p) => p.category_name;

// Props supaya satu komponen bisa dipakai di beranda tamu dan beranda setelah login:
// eyebrow/subtitle boleh dikosongkan, limit membatasi jumlah produk, bg mengatur warna latar.
export default function ProductSection({
  eyebrow = "Eksplorasi katalog lokal",
  title = "Temukan produk khas Makassar",
  subtitle = "Temukan produk yang kamu suka dan dukung usaha lokal melalui Lokamart.",
  limit,
  bg = "bg-blush",
}) {
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const sectionRef = useRef(null);

  const keyword = (params.get("cari") ?? "").trim();

  useEffect(() => {
    let cancelled = false;
    api
      .get("/products")
      .then((res) => {
        // Backend mengembalikan { items, total, page, limit }
        if (!cancelled) setProducts(res.data.items ?? []);
      })
      .catch((err) => {
        console.warn("Backend belum merespons, memakai data contoh:", err.message);
        if (!cancelled) setProducts(fallbackProducts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (keyword) sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [keyword]);

  const q = keyword.toLowerCase();
  const shown = products.filter((p) => {
    const cocokKategori = active === "Semua" || getCategory(p) === active;
    const cocokKata =
      !q || [p.product_name, p.store_name, p.category_name, p.description].some((f) => String(f ?? "").toLowerCase().includes(q));
    return cocokKategori && cocokKata;
  });
  // Saat mencari, tampilkan semua hasil; batas jumlah hanya untuk tampilan awal
  const visible = limit && !keyword ? shown.slice(0, limit) : shown;

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
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={active === c}
                onClick={() => setActive(c)}
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
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}