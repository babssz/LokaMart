import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import api from "../services/api";
import { formatRupiah } from "../data/products";

export default function SellerProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    product_name: "",
    category_id: 1, // Sesuaikan kategori default atau ambil dari master kategori
    price: "",
    stock: "",
    description: "",
  });

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/products/mine");
      const list = Array.isArray(res.data) ? res.data : res.data.items ?? [];
      setProducts(list);
    } catch (err) {
      setError("Gagal memuat daftar produk toko.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({ product_name: "", category_id: 1, price: "", stock: "", description: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      category_id: product.category_id || 1,
      price: product.price,
      stock: product.stock,
      description: product.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category_id: parseInt(formData.category_id, 10),
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.product_id}`, payload);
        setSuccessMsg("Produk berhasil diperbarui!");
      } else {
        await api.post("/products", payload);
        setSuccessMsg("Produk baru berhasil ditambahkan!");
      }

      setIsModalOpen(false);
      fetchMyProducts();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menyimpan produk.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Apakah kamu yakin ingin menghapus produk ini?")) return;
    try {
      setError("");
      await api.delete(`/products/${productId}`);
      setSuccessMsg("Produk berhasil dihapus.");
      fetchMyProducts();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menghapus produk.");
    }
  };

  const handleImageUpload = async (productId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    try {
      setError("");
      await api.post(`/products/${productId}/image`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMsg("Gambar produk berhasil diunggah!");
      fetchMyProducts();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal mengunggah gambar (Maksimal 2MB).");
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Header Aksi: Judul & Tombol Tambah Produk */}
      <div className="flex items-center justify-between bg-white p-4 rounded-sm border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">Kelola Produk Toko</h2>
          <p className="text-[11px] text-neutral-500">Tambah, ubah, atau atur stok dan gambar katalog produkmu.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 rounded-sm bg-maroon-dark px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-maroon transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Tambah Produk Baru
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-sm bg-emerald-50 px-3 py-2 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-sm bg-red-50 px-3 py-2 text-xs text-red-800 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" /> {error}
        </div>
      )}

      {/* Tabel / List Produk */}
      <div className="overflow-hidden rounded-sm border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">Memuat produk toko...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">Belum ada produk yang terdaftar di toko ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="p-3">Produk</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Harga</th>
                  <th className="p-3">Stok</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {products.map((p) => (
                  <tr key={p.product_id} className="hover:bg-stone-50/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative group h-12 w-12 shrink-0">
                          {p.image ? (
                            <img src={p.image} alt="" className="h-12 w-12 rounded-sm object-cover border" />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-sm bg-stone-100 text-[9px] text-neutral-400 border">
                              Foto
                            </div>
                          )}
                          <label className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-sm text-[9px]">
                            <ImageIcon className="h-4 w-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(p.product_id, e)} />
                          </label>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900 truncate max-w-xs">{p.product_name}</p>
                          <span className="text-[10px] text-neutral-400">ID: #{p.product_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-neutral-600">{p.category_name || "-"}</td>
                    <td className="p-3 font-bold text-neutral-900">{formatRupiah(p.price)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-sm font-semibold text-[10px] ${p.stock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {p.stock} unit
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="uppercase text-[10px] font-bold text-neutral-700 bg-stone-100 px-2 py-0.5 rounded">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 rounded-sm border border-stone-300 bg-white text-neutral-700 hover:bg-stone-50 transition-colors cursor-pointer"
                        title="Edit Produk"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.product_id)}
                        className="p-1.5 rounded-sm border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-sm bg-white p-6 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-tight text-neutral-900 mb-4">
              {editingProduct ? "Edit Produk Toko" : "Tambah Produk Baru"}
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-maroon"
                  placeholder="Contoh: Kain Batik Tulis..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-maroon"
                    placeholder="150000"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Stok</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-maroon"
                    placeholder="25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Kategori ID</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-maroon"
                  placeholder="1 (Fashion / Kerajinan / Kuliner)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-maroon"
                  placeholder="Deskripsikan produkmu..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-sm border border-stone-300 bg-white px-4 py-2 text-[10px] font-semibold uppercase text-neutral-700 hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-sm bg-maroon-dark px-4 py-2 text-[10px] font-semibold uppercase text-white hover:bg-maroon cursor-pointer"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}