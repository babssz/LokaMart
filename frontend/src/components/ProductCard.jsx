import { Link } from "react-router-dom";
import { formatRupiah } from "../data/products";

const badgeTone = (text = "") => {
  const s = text.toLowerCase();
  if (s.includes("organik")) return "bg-emerald-700 text-white";
  if (s.includes("terbatas")) return "bg-red-700 text-white";
  if (s.includes("halal")) return "bg-neutral-800 text-white";
  if (s.includes("pengawet")) return "bg-amber-300 text-neutral-900";
  if (s.includes("habis")) return "bg-neutral-500 text-white";
  return "bg-maroon text-white";
};

export default function ProductCard({ product, accentPrice = false }) {
  const image = product.image;
  const badge = product.badge ?? (product.stock === 0 ? "Stok habis" : null);

  return (
    <article className="h-full overflow-hidden rounded-[10px] bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/produk/${product.product_id}`} className="flex h-full flex-col">
        <div className="relative">
          {image ? (
            <img src={image} alt={product.product_name} loading="lazy" className="aspect-square w-full object-cover" />
          ) : ( 
            <div className="grid aspect-square w-full place-items-center bg-neutral-100 text-xs text-neutral-400">
              Foto produk
            </div>
          )}
          {badge && (
            <span className={`absolute left-2 top-2 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${badgeTone(badge)}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="truncate text-[14px] uppercase tracking-wide text-neutral-500">
            {product.store_name || "UMKM Makassar"}
          </p>
          <h3 className="line-clamp-2 text-[16px] font-semibold text-neutral-900">{product.product_name}</h3>
          <p className={`mt-auto pt-1 text-[16px] font-semibold ${accentPrice ? "text-maroon" : "text-neutral-900"}`}>
            {formatRupiah(product.price)}
          </p>
        </div>
      </Link>
    </article>
  );
}