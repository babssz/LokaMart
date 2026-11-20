import { Truck, Tag, ShieldCheck } from "lucide-react";
import Container from "./Container";

const reasons = [
  { icon: Truck, title: "Pengiriman Mudah seluruh Indonesia", text: "Nikmati kemudahan pengiriman produk ke berbagai wilayah di Nusantara dengan pilihan layanan kurir lokal." },
  { icon: Tag, title: "Mendukung UMKM Lokal", text: "Setiap transaksi menjadi bentuk dukungan terhadap pelaku UMKM di Makassar agar terus berkembang dan berdaya." },
  { icon: ShieldCheck, title: "Informasi Produk Transparan", text: "Temukan informasi produk, harga, serta identitas penjual secara jelas sebelum melakukan pembelian." },
];

export default function WhyShop({ showHeading = true, bg = "bg-blush/50" }) {
  return (
    <section className={bg}>
      <Container className="py-10 md:py-12">
        {showHeading && (
          <div className="mx-auto mb-8 max-w-xl text-center">
            {/* <p className="text-[16px] font-semibold uppercase tracking-wide text-maroon">Prinsip pasar bersama</p> */}
            <h2 className="mt-1 text-xl font-semibold uppercase tracking-tight text-neutral-900 sm:text-2xl">Mengapa berbelanja di Lokamart?</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Lokamart hadir untuk mempertemukan masyarakat dengan produk lokal Makassar secara lebih mudah, transparan, dan terpercaya. Kami mendukung UMKM dan pengrajin lokal agar produk mereka dapat dikenal dan dijangkau lebih luas.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {reasons.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[10px] bg-white p-5 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded bg-neutral-100 text-maroon">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-[16px] font-semibold text-neutral-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}