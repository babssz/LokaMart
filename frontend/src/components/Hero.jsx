import { Link } from "react-router-dom";
import Container from "./Container";
import { useAuth } from "../context/AuthContext";
import HeroSlider from "./HeroSlider";

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-white">
      <HeroSlider />

      <Container className="relative z-10 py-14 sm:py-20 md:py-28">
        <h1 className="max-w-xl text-3xl font-semibold uppercase leading-tight tracking-tight text-white md:text-4xl">
          Temukan karya lokal, temukan cerita Makassar
        </h1>
        <p className="mt-3 max-w-md text-[16px] leading-relaxed text-neutral-100/90">
          Jelajahi produk pilihan dari UMKM dan pengrajin lokal Makassar. Belanja produk khas daerah, dukung usaha lokal, dan ikut menjaga karya serta kreativitas Makassar tetap hidup.
        </p>
        {/* Tombol disembunyikan kalau pengguna sudah login */}
        {!user && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-[10px] bg-maroon px-5 py-2.5 text-[14px] font-semibold uppercase tracking-wide text-white hover:bg-maroon-dark"
            >
              Daftar
            </Link>
            <Link
              to="/login"
              className="rounded-[10px] border border-white/80 bg-white/95 px-5 py-2.5 text-[14px] font-semibold uppercase tracking-wide text-neutral-900 hover:bg-white"
            >
              Masuk
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}