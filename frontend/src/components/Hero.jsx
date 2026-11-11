import { Link } from "react-router-dom";
import Container from "./Container";
import { useAuth } from "../context/AuthContext";

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="bg-white">
      <Container className="py-14 sm:py-20 md:py-28">
        <h1 className="max-w-xl text-3xl font-semibold uppercase leading-tight tracking-tight text-neutral-900 md:text-4xl">
          Temukan karya lokal, temukan cerita Makassar
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
          Jelajahi produk pilihan dari UMKM dan pengrajin lokal Makassar. Belanja produk khas daerah, dukung usaha lokal, dan ikut menjaga karya serta kreativitas Makassar tetap hidup.
        </p>
        {/* Tombol disembunyikan kalau pengguna sudah login */}
        {!user && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="rounded bg-maroon px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-maroon-dark">
              Daftar
            </Link>
            <Link to="/login" className="rounded border border-neutral-300 bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-800 hover:bg-neutral-50">
              Masuk
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}