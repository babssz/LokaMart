import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import hero1 from "../assets/hero-1.jpg";
import hero2 from "../assets/hero-2.png"
import hero3 from "../assets/hero-3.png"

const SLIDES = [
  {
    src: hero1,
    alt: "songket bugis",
  },
  {
    src: hero2,
    alt: "kopi toraja",
  },
  {
    src: hero3,
    alt: "batik phinisi",
  },
];

export default function HeroSlider({ slides = SLIDES, intervalMs = 4500 }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = slides.length;

  const prevSlide = () => {
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [paused, total, intervalMs]);

  if (total === 0) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group absolute inset-0 overflow-hidden bg-neutral-900"
    >
      {/* Track gambar background yang bergeser */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide, idx) => (
          <div key={idx} className="h-full w-full shrink-0">
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-full w-full object-cover object-center"
            />
          </div>
        ))}
      </div>

      {/* Lapisan gelap/gradasi agar teks di depan tetap kontras & mudah dibaca */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-neutral-950/55 to-neutral-950/25" />

      {/* Tombol geser kiri & kanan */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Gambar latar sebelumnya"
            className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-900 shadow transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Gambar latar berikutnya"
            className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-900 shadow transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indikator slide di bagian bawah tengah */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {slides.map((_, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Latar ${idx + 1}`}
                  className={
                    "h-2 rounded-full transition-all " +
                    (isActive ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80")
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}