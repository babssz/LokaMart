import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Save } from "lucide-react";
import api from "../services/api";

export default function SellerStoreSection({ onStoreUpdated }) {
  const [storeData, setStoreData] = useState({
    store_name: "",
    description: "",
    address: "",
    hours: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const fetchStoreProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/profile/store");
      setStoreData(res.data);
    } catch (err) {
      setError("Gagal memuat profil toko.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreProfile();
  }, []);

  const handleSaveStore = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      await api.put("/profile/store", {
        store_name: storeData.store_name,
        description: storeData.description,
        address: storeData.address,
        hours: storeData.hours,
      });
      setSuccessMsg("Profil toko berhasil diperbarui!");
      
      if (onStoreUpdated) {
        onStoreUpdated();
      }

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal memperbarui profil toko.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-neutral-500 mt-6">Memuat profil toko...</div>;
  }

  return (
    <div className="mt-6 flex justify-center">
      <div className="w-full max-w-2xl bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
        
        {successMsg && (
          <div className="flex items-center justify-center gap-2 rounded-sm bg-emerald-50 px-3 py-2 text-xs text-emerald-800 border border-emerald-200 mb-4">
            <CheckCircle className="h-4 w-4 text-emerald-600" /> {successMsg}
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 rounded-sm bg-red-50 px-3 py-2 text-xs text-red-800 border border-red-200 mb-4">
            <AlertCircle className="h-4 w-4 text-red-600" /> {error}
          </div>
        )}

        {/* Form Pengaturan Toko */}
        <form onSubmit={handleSaveStore} className="space-y-4">
          <div className="text-left">
            <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Nama Toko</label>
            <input
              type="text"
              required
              value={storeData.store_name || ""}
              onChange={(e) => setStoreData({ ...storeData, store_name: e.target.value })}
              className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-maroon"
            />
          </div>

          <div className="text-left">
            <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Jam Operasional / Buka Tutup</label>
            <input
              type="text"
              value={storeData.hours || ""}
              onChange={(e) => setStoreData({ ...storeData, hours: e.target.value })}
              className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-maroon"
              placeholder="Contoh: 08:00 - 20:00 WITA"
            />
          </div>

          <div className="text-left">
            <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Deskripsi Toko</label>
            <textarea
              rows={3}
              value={storeData.description || ""}
              onChange={(e) => setStoreData({ ...storeData, description: e.target.value })}
              className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-maroon"
              placeholder="Ceritakan sedikit tentang produk atau tokomu..."
            />
          </div>

          <div className="text-left">
            <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Alamat Toko</label>
            <input
              type="text"
              value={storeData.address || ""}
              onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
              className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-maroon"
              placeholder="Alamat fisik atau lokasi toko..."
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-center">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-sm bg-maroon-dark px-6 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-maroon transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}