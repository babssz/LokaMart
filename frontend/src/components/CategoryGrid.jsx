import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Coffee, Gem, Hammer, Lamp, Package, Shirt, UtensilsCrossed } from "lucide-react";
import Container from "./Container";
import api from "../services/api";
import { fallbackCategories } from "../data/products";

// Ikon dipilih dari kata di nama kategori; kategori baru dari admin otomatis dapat ikon umum.
const iconRules = [
  [/fashion|pakaian|busana|kain/, Shirt],
  [/kopi|coffee/, Coffee],
  [/kerajinan|craft/, Hammer],
  [/dekor/, Lamp],
  [/kuliner|makan|kue|oleh/, UtensilsCrossed],
  [/aksesoris|perhiasan/, Gem],
];
const iconFor = (name) => (iconRules.find(([re]) => re.test(name.toLowerCase())) ?? [null, Package])[1];

export default function CategoryGrid() {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/categories")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.items ?? [];
        if (!cancelled) setCats(list);
      })
      .catch(() => {
        if (!cancelled) setCats(fallbackCategories);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-blush">
      <Container className="py-8 md:py-10">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">Kategori pilihan</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-xl font-semibold uppercase tracking-tight text-neutral-900 sm:text-2xl">Jelajahi produk lokal Makassar</h2>
          <Link to="/produk" className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-maroon hover:underline">
            Lihat {cats.length || ""} kategori lengkap <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cats.slice(0, 6).map((c) => {
            const Icon = iconFor(c.category_name);
            return (
              <Link
                key={c.category_id}
                to={`/produk?kategori=${encodeURIComponent(c.category_name)}`}
                className="flex flex-col items-center gap-2 rounded-lg bg-white px-3 py-5 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="grid h-9 w-9 place-items-center rounded bg-stone-100 text-maroon">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold text-neutral-900">{c.category_name}</span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}