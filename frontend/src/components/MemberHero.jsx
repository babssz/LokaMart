import { Link } from "react-router-dom";
import Container from "./Container";
import HeroSlider from "./HeroSlider";

export default function MemberHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <HeroSlider />

      <Container className="relative z-10 py-14 sm:py-20 md:py-28">
        <h1 className="max-w-xl text-3xl font-semibold uppercase leading-tight tracking-tight text-white md:text-4xl">
          Karya terbaik dari Makassar, langsung dari UMKM &amp; pengrajin lokal
        </h1>
        <p className="mt-3 max-w-md text-[16px] leading-relaxed text-neutral-100/90">
          Dukung perekonomian lokal dengan produk autentik berstandar kurasi tinggi. Hadir langsung dari tangan pembuatnya, tanpa perantara berlebih.
        </p>
        <Link
          to="/produk"
          className="mt-6 inline-block rounded-[10px] bg-maroon-dark px-5 py-3 text-[14px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon"
        >
          Jelajahi Katalog
        </Link>
      </Container>
    </section>
  );
}