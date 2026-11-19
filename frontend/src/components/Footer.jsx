import Container from "./Container";

const nav = ["Beranda", "Produk", "Kategori", "Tentang Kami"];
const help = ["Pusat Bantuan", "Syarat & Ketentuan", "Kebijakan Privasi"];
const legal = ["Pedoman Kurasi", "Etika Penjualan", "Privasi & Syarat"];

const InlineLinks = ({ items }) => (
  <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xm text-neutral-600">
    {items.map((t, i) => (
      <span key={t}>
        <a href="#" className="hover:text-maroon">{t}</a>
        {i < items.length - 1 && <span className="ml-2" aria-hidden="true">·</span>}
      </span>
    ))}
  </p>
);

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <Container className="py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xl font-bold text-neutral-900">LOKAMART</p>
            <p className="mt-2 text-xm text-neutral-600">Belanja lokal, dukung UMKM Makassar</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-neutral-900">Navigasi</p>
            <InlineLinks items={nav} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-stone-200 pt-4 text-xm text-neutral-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Lokamart. Semua Hak Dilindungi.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            {legal.map((t) => (<a key={t} href="#" className="hover:text-maroon">{t}</a>))}
          </p>
        </div>
      </Container>
    </footer>
  );
}