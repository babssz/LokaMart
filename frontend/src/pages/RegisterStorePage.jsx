import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Store, MapPin, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Container from "../components/Container";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function RegisterStorePage() {
  const [formData, setFormData] = useState({
    store_name: "",
    description: "",
    address: "",
    category_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/stores", {
        ...formData,
        category_id: Number(formData.category_id),
      });
      updateUser(response.data.user);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal mendaftarkan toko. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <Navbar />

      <main className="flex-1 bg-blush/40 py-8">
        <Container className="max-w-3xl">
          {/* Breadcrumb & Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl">
              Pendaftaran Toko Mitra LokaMart
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Lengkapi informasi di bawah ini untuk mulai memasarkan produk lokal khas Makassar secara luas.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-sm border border-stone-200 bg-white p-6 shadow-sm">
            {error && (
              <div className="mb-4 rounded-sm bg-red-50 p-3 text-xs text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-200 text-maroon-dark">
                <Store className="h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wide">Informasi Toko</h2>
              </div>

              {/* Nama Toko */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-700 mb-1.5">
                  NAMA TOKO *
                </label>
                <input
                  type="text"
                  name="store_name"
                  required
                  value={formData.store_name}
                  onChange={handleChange}
                  placeholder="Contoh: Sanggar Seni & Kerajinan Makassar"
                  className="w-full rounded-sm border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
                />
              </div>

              {/* Deskripsi Toko */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-700 mb-1.5">
                  DESKRIPSI / PROFIL SINGKAT TOKO *
                </label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ceritakan sedikit tentang produk atau keunggulan toko Anda..."
                  className="w-full rounded-sm border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
                />
              </div>

              {/* Alamat Toko */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-700 mb-1.5">
                  ALAMAT OPERASIONAL / LOKASI USAHA *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Contoh: Jl. Somba Opu No. 45, Makassar"
                    className="w-full rounded-sm border border-stone-200 bg-stone-50 pl-9 pr-3 py-2.5 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
                  />
                </div>
              </div>

              {/* Kategori Utama / Catatan */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-700 mb-1.5">
                  KATEGORI UTAMA USAHA *
                </label>
                <select
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full rounded-sm border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
                >
                  <option value="">-- Pilih Kategori Produk --</option>
                  <option value="1">Fashion & Batik</option>
                  <option value="2">Kuliner Khas</option>
                  <option value="3">Kriya & Kerajinan</option>
                  <option value="4">Kopi & Teh Lokal</option>
                </select>
              </div>

              {/* Catatan Info */}
              <div className="rounded-sm bg-stone-50 p-3.5 border border-stone-200 text-[11px] text-neutral-600 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-maroon shrink-0 mt-0.5" />
                <p>
                  Dengan mendaftarkan toko, akun Anda akan ditingkatkan menjadi mitra penjual dan dapat langsung mengelola katalog produk setelah disetujui sistem.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <Link
                  to="/profil"
                  className="rounded-sm border border-stone-300 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-100 transition-colors"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-sm bg-maroon px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-maroon-dark transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Memproses..." : "Daftarkan Toko"}
                </button>
              </div>
            </form>
          </div>
        </Container>
      </main>

      <Footer />

      {success && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-neutral-950/50 px-4 py-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-registration-success-title"
            aria-describedby="store-registration-success-description"
            className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 text-center shadow-xl sm:p-8"
          >
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush text-maroon-dark">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-maroon">
              Selamat bergabung
            </p>
            <h2 id="store-registration-success-title" className="mt-2 text-xl font-bold tracking-tight text-neutral-900">
              Toko berhasil didaftarkan
            </h2>
            <p id="store-registration-success-description" className="mt-2 text-sm leading-relaxed text-neutral-600">
              <span className="font-semibold text-neutral-800">{formData.store_name}</span> sudah tersimpan. Akun Anda kini dapat mengelola toko dan produk di LokaMart.
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => navigate("/toko-saya", { replace: true })}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-maroon-dark px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon"
            >
              Buka Dashboard Toko
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}