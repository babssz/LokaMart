import { MapPin } from "lucide-react";
import Container from "./Container";

export default function StorySection() {
  return (
    <section className="bg-blush">
      <Container className="py-8 md:py-10">
        <div className="grid overflow-hidden rounded-sm bg-white shadow-sm md:grid-cols-2">
          <img
            src="/images/jejak-lokal.jpg"
            alt="Pengrajin lokal Makassar memegang hasil karyanya"
            loading="lazy"
            className="h-64 w-full bg-stone-200 object-cover md:h-full md:min-h-[22rem]"
          />
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
              <MapPin className="h-3.5 w-3.5 text-maroon" /> Jejak Lokal Makassar
            </p>
            <h2 className="text-xl font-semibold uppercase leading-snug tracking-tight text-neutral-900 sm:text-2xl">
              “Bukan sekadar produk, tapi cerita yang dibuat dengan tangan”
            </h2>
            <p className="max-w-md text-xs leading-relaxed text-neutral-600">
              Dari proses yang penuh ketelatenan hingga menjadi sebuah karya, setiap produk di LokaMart membawa cerita pembuatnya. LokaMart mengisahkan kisah di balik UMKM dan pengrajin lokal Makassar: tentang karya, jati diri, dan semangat yang terukir di setiap produk.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}