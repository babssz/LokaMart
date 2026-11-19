import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, ShoppingBag, Store, FileText, ChevronDown, LogOut, FolderPlus, Pencil, Trash2, Plus, Layers, CheckCircle2, X } from "lucide-react";
import Footer from "../components/Footer";
import Container from "../components/Container";
import StatCard from "../components/StatCard";
import SalesChart from "../components/SalesChart";
import { formatRupiah } from "../data/products";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const ADMIN_TABS = [
  { label: "Laporan Penjualan", id: "laporan" },
  { label: "Kelola Pengguna", id: "pengguna" },
  { label: "Kelola Kategori", id: "kategori" },
  { label: "Kelola Produk", id: "produk" },
];  

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPeriodRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "harian") {
    const previous = new Date(today);
    previous.setDate(previous.getDate() - 1);
    return { current: { start: today, end: today }, previous: { start: previous, end: previous } };
  }
  if (period === "mingguan") {
    const mondayOffset = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setDate(start.getDate() - mondayOffset);
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 7);
    const previousEnd = new Date(previousStart);
    previousEnd.setDate(previousEnd.getDate() + mondayOffset);
    return { current: { start, end: today }, previous: { start: previousStart, end: previousEnd } };
  }
  if (period === "tahunan") {
    const start = new Date(today.getFullYear(), 0, 1);
    const previousStart = new Date(today.getFullYear() - 1, 0, 1);
    const previousEnd = new Date(today.getFullYear() - 1, 11, 31);
    return { current: { start, end: today }, previous: { start: previousStart, end: previousEnd } };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return { current: { start, end: today }, previous: { start: previousStart, end: previousEnd } };
};

const percentChange = (current, previous) => {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
};

const buildTrend = (daily, previousDaily, period) => {
  const currentMap = new Map(daily.map((item) => [item.day, Number(item.revenue)]));
  const previousMap = new Map(previousDaily.map((item) => [item.day, Number(item.revenue)]));

  if (period === "harian") {
    const current = daily.reduce((sum, item) => sum + Number(item.revenue), 0);
    const previous = previousDaily.reduce((sum, item) => sum + Number(item.revenue), 0);
    return [{ label: "Hari ini", current, previous }];
  }
  if (period === "tahunan") {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthKey = String(month).padStart(2, "0");
      const current = [...currentMap.entries()].filter(([day]) => day.startsWith(`${currentYear}-${monthKey}`)).reduce((sum, [, rev]) => sum + rev, 0);
      const previous = [...previousMap.entries()].filter(([day]) => day.startsWith(`${previousYear}-${monthKey}`)).reduce((sum, [, rev]) => sum + rev, 0);
      return { label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(currentYear, index, 1)), current, previous };
    });
  }
  if (period === "bulanan") {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    return [1, 2, 3, 4].map((week) => {
      const startDay = (week - 1) * 7 + 1;
      const endDay = Math.min(week * 7, new Date(year, month + 1, 0).getDate());
      const current = [...currentMap.entries()].filter(([day]) => {
        const date = new Date(`${day}T00:00:00`);
        return date.getMonth() === month && date.getDate() >= startDay && date.getDate() <= endDay;
      }).reduce((sum, [, rev]) => sum + rev, 0);
      const previous = [...previousMap.entries()].filter(([day]) => {
        const date = new Date(`${day}T00:00:00`);
        return date.getDate() >= startDay && date.getDate() <= endDay;
      }).reduce((sum, [, rev]) => sum + rev, 0);
      return { label: `Minggu ${week}`, current, previous };
    });
  }

  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  return weekdays.map((label, index) => ({
    label,
    current: daily[index] ? Number(daily[index].revenue) : 0,
    previous: previousDaily[index] ? Number(previousDaily[index].revenue) : 0,
  }));
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("laporan");
  const [period, setPeriod] = useState("bulanan");
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ category_name: "", description: "" });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [categoryError, setCategoryError] = useState("");
  const [categoryNotice, setCategoryNotice] = useState("");

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    let cancelled = false;
    let requestPending = false;
    const loadReport = async (initial = false) => {
      if (cancelled || requestPending || activeTab !== "laporan") return;
      requestPending = true;
      if (initial) setLoading(true);
      setError("");
      const range = getPeriodRange(period);
      try {
        const [currentResponse, previousResponse] = await Promise.all([
          api.get("/reports/transactions", { params: { start_date: toIsoDate(range.current.start), end_date: toIsoDate(range.current.end) } }),
          api.get("/reports/transactions", { params: { start_date: toIsoDate(range.previous.start), end_date: toIsoDate(range.previous.end) } }),
        ]);
        if (!cancelled) {
        const current = currentResponse.data;
        const previous = previousResponse.data;
        const activeStores = current.by_store?.length ?? 0;
        const revenue = Number(current.total_revenue ?? 0);
        const previousRevenue = Number(previous.total_revenue ?? 0);
        const ordersCount = Number(current.total_orders ?? 0);
        const previousOrders = Number(previous.total_orders ?? 0);

        setAdminData({
          summary: {
            total_revenue: revenue,
            total_orders: ordersCount,
            active_stores_count: activeStores,
            average_sales_per_store: activeStores ? revenue / activeStores : 0,
            changes: { revenue: percentChange(revenue, previousRevenue), orders: percentChange(ordersCount, previousOrders) },
          },
          trend: buildTrend(current.daily ?? [], previous.daily ?? [], period),
          top_stores: (current.by_store ?? []).map((store) => ({
            id: store.store_id,
            name: store.store_name,
            orders_count: store.orders,
            revenue: Number(store.revenue),
          })),
        });
        setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Data laporan penjualan gagal dimuat dari server.");
          setLoading(false);
        }
      } finally {
        requestPending = false;
      }
    };
    const refreshReport = () => loadReport();

    loadReport(true);
    const refreshInterval = activeTab === "laporan" ? window.setInterval(refreshReport, 30000) : null;
    window.addEventListener("focus", refreshReport);
    document.addEventListener("visibilitychange", refreshReport);

    return () => {
      cancelled = true;
      if (refreshInterval !== null) window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshReport);
      document.removeEventListener("visibilitychange", refreshReport);
    };
  }, [period, activeTab]);

  useEffect(() => {
    let cancelled = false;
    const loadTab = async () => {
      try {
        if (activeTab === "pengguna") {
          const res = await api.get("/users", { params: { page: 1, limit: 50 } });
          if (!cancelled) setUsers(res.data.items ?? []);
        }
        if (activeTab === "kategori") {
          const res = await api.get("/categories");
          const list = Array.isArray(res.data) ? res.data : res.data.items ?? [];
          if (!cancelled) setCategories(list);
        }
        if (activeTab === "produk") {
          const res = await api.get("/products/admin/all", { params: { page: 1, limit: 50 } });
          if (!cancelled) setProducts(res.data.items ?? []);
        }
        if (activeTab === "pemantauan") {
          const res = await api.get("/orders/admin/all", { params: { page: 1, limit: 50 } });
          if (!cancelled) setOrders(res.data.items ?? []);
        }
      } catch {
        if (!cancelled) setError("Data tab admin gagal dimuat dari server.");
      }
    };
    loadTab();
    const refreshInterval =
      activeTab === "pengguna" || activeTab === "pemantauan"
        ? window.setInterval(loadTab, 30000)
        : null;
    const refreshTab = () => loadTab();
    window.addEventListener("focus", refreshTab);
    document.addEventListener("visibilitychange", refreshTab);
    return () => {
      cancelled = true;
      if (refreshInterval !== null) window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshTab);
      document.removeEventListener("visibilitychange", refreshTab);
    };
  }, [activeTab]);

  const handleAddCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ category_name: "", description: "" });
    setCategoryError("");
    setCategoryNotice("");
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.category_id);
    setCategoryForm({
      category_name: category.category_name,
      description: category.description ?? "",
    });
    setCategoryError("");
    setCategoryNotice("");
    setShowCategoryForm(true);
  };

  const handleCloseCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setCategoryError("");
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const categoryName = categoryForm.category_name.trim();
    if (!categoryName) {
      setCategoryError("Nama kategori wajib diisi.");
      return;
    }

    setCategorySaving(true);
    setCategoryError("");
    setCategoryNotice("");
    try {
      const payload = {
        category_name: categoryName,
        description: categoryForm.description.trim() || null,
      };
      const response = editingCategoryId === null
        ? await api.post("/categories", payload)
        : await api.put(`/categories/${editingCategoryId}`, payload);
      if (editingCategoryId === null) {
        setCategories((current) => [response.data, ...current]);
      } else {
        setCategories((current) =>
          current.map((category) =>
            category.category_id === editingCategoryId ? response.data : category
          )
        );
      }
      setShowCategoryForm(false);
      setEditingCategoryId(null);
      setCategoryForm({ category_name: "", description: "" });
      setCategoryNotice(
        editingCategoryId === null
          ? `Kategori “${response.data.category_name}” berhasil ditambahkan.`
          : `Nama kategori berhasil diperbarui menjadi “${response.data.category_name}”.`
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      setCategoryError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg).join(", ")
            : editingCategoryId === null
              ? "Kategori gagal ditambahkan. Periksa koneksi lalu coba lagi."
              : "Nama kategori gagal diperbarui. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;

    setDeletingCategoryId(id);
    setCategoryError("");
    setCategoryNotice("");
    try {
      await api.delete(`/categories/${id}`);
      setCategories((current) => current.filter((item) => item.category_id !== id));
      setCategoryNotice("Kategori berhasil dihapus.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setCategoryError(
        typeof detail === "string"
          ? detail
          : "Kategori gagal dihapus. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setDeletingCategoryId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      {/* Header Admin */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white">
        <Container className="flex h-16 items-center justify-between">
          <Link to="/admin-dashboard" className="shrink-0 text-sm font-bold uppercase tracking-widest text-neutral-900">
            Lokamart
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-sm px-2 py-1 text-[11px] font-semibold text-neutral-800 hover:bg-stone-50 cursor-pointer"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-maroon-dark text-[10px] font-bold text-white">
                AD
              </span>
              <span className="hidden max-w-28 truncate sm:block">
                {user?.name ?? "Administrator"}
              </span>
              <ChevronDown className="h-3 w-3 text-neutral-500" />
            </button>

            {profileOpen && (
              <>
                <button type="button" aria-label="Tutup menu profil" className="fixed inset-0 z-10 cursor-default" onClick={() => setProfileOpen(false)} />
                <div role="menu" className="absolute right-0 z-20 mt-1.5 w-36 overflow-hidden rounded-sm border border-stone-200 bg-white shadow-md">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-blush/40">
        <Container className="py-6 md:py-8">
          <div className="pb-4 border-b border-stone-200">
            <h1 className="text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl">
              Dasbor Utama Admin
            </h1>
          </div>

          {/* Navigation Tabs */}
          <section className="mt-4 overflow-hidden rounded-sm border border-stone-200 bg-white">
            <div className="flex gap-1 overflow-x-auto bg-stone-50 px-2 sm:px-4 py-1">
              {ADMIN_TABS.map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={
                      "shrink-0 border-b-2 px-3 py-3 text-[10px] font-semibold uppercase tracking-wide sm:px-4 cursor-pointer transition-colors " +
                      (isActive ? "border-maroon-dark text-maroon-dark bg-white" : "border-transparent text-neutral-500 hover:text-neutral-900")
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* TAB 1: LAPORAN PENJUALAN */}
          {activeTab === "laporan" && (
            <div className="mt-6 space-y-6">
              {error && <p className="rounded-sm bg-red-50 p-3 text-xs text-red-800">{error}</p>}

              <div className="inline-flex rounded-sm border border-stone-200 bg-white p-0.5">
                {["harian", "mingguan", "bulanan", "tahunan"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={
                      "rounded-sm px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:px-4 cursor-pointer " +
                      (period === p ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-stone-100")
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
              
              {loading ? (
                <div className="py-12 text-center text-xs text-neutral-500">Memuat data real dari server...</div>
              ) : (
                adminData && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard label="Total Perputaran Transaksi" value={formatRupiah(adminData.summary.total_revenue)} change={adminData.summary.changes.revenue} vs="dibanding periode sebelumnya" icon={Wallet} />
                      <StatCard label="Total Pesanan Masuk" value={adminData.summary.total_orders.toLocaleString("id-ID")} unit="Pesanan" change={adminData.summary.changes.orders} vs="dibanding periode sebelumnya" icon={ShoppingBag} />
                      <StatCard label="Mitra Aktif Berjualan" value={adminData.summary.active_stores_count} unit="Toko" vs="memiliki transaksi pada periode ini" icon={Store} />
                      <StatCard label="Rata-Rata Penjualan / Toko" value={formatRupiah(adminData.summary.average_sales_per_store)} vs="rata-rata per toko aktif" icon={FileText} />
                    </div>

                    <SalesChart
                      title="Tren Transaksi Wilayah"
                      subtitle="Data realisasi transaksi seluruh toko penjual."
                      data={adminData.trend}
                      onDownload={() => {
                        const rows = [
                          ["Toko", "Pesanan", "Omzet"],
                          ...adminData.top_stores.map((store) => [store.name, store.orders_count, store.revenue]),
                        ];
                        const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
                        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `laporan-admin-${period}.csv`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                    />

                    <div className="overflow-hidden rounded-sm border border-stone-200 bg-white">
                      <div className="border-b border-stone-200 px-4 py-3">
                        <h2 className="text-sm font-bold text-neutral-900">Performa Toko Penjual</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-stone-50 text-[10px] uppercase text-neutral-500">
                            <tr><th className="px-4 py-3">Toko</th><th className="px-4 py-3">Pesanan</th><th className="px-4 py-3">Omzet</th></tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {adminData.top_stores.map((store) => (
                              <tr key={store.id}>
                                <td className="px-4 py-3 font-semibold text-neutral-900">{store.name}</td>
                                <td className="px-4 py-3">{store.orders_count.toLocaleString("id-ID")}</td>
                                <td className="px-4 py-3 font-bold">{formatRupiah(store.revenue)}</td>
                              </tr>
                            ))}
                            {adminData.top_stores.length === 0 && (
                              <tr><td colSpan={3} className="px-4 py-8 text-center text-neutral-500">Belum ada transaksi pada periode ini.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* TAB 2: KELOLA PENGGUNA */}
          {activeTab === "pengguna" && (
            <div className="mt-6 overflow-x-auto rounded-sm border border-stone-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-[10px] uppercase text-neutral-500">
                  <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {users.map((item) => (
                    <tr key={item.user_id}>
                      <td className="px-4 py-3 font-semibold">{item.name}</td>
                      <td className="px-4 py-3">{item.email}</td>
                      <td className="px-4 py-3 capitalize">{item.role}</td>
                      <td className="px-4 py-3">{item.is_active ? "Aktif" : "Nonaktif"}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Belum ada data pengguna.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: KELOLA KATEGORI (GRID KARTU MODERN) */}
          {activeTab === "kategori" && (
            <div className="mt-6 space-y-6">
              <div>
                <button
                  onClick={handleAddCategory}
                  className="flex items-center gap-2 rounded-sm bg-maroon px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-maroon-dark transition-colors cursor-pointer shadow-sm"
                >
                  <FolderPlus className="h-4 w-4" />
                  + Tambah Kategori Baru
                </button>
              </div>

              {categoryNotice && (
                <p role="status" className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {categoryNotice}
                </p>
              )}
              {categoryError && (
                <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                  {categoryError}
                </p>
              )}

              {showCategoryForm && (
                <form onSubmit={handleSaveCategory} className="rounded-sm border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-blush text-maroon">
                        {editingCategoryId === null ? <FolderPlus className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900">
                          {editingCategoryId === null ? "Tambah Kategori Baru" : "Edit Nama Kategori"}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-neutral-500">
                          {editingCategoryId === null
                            ? "Kategori akan tersimpan dan langsung tampil di katalog."
                            : "Nama baru akan tersimpan dan langsung diperbarui di katalog."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseCategoryForm}
                      disabled={categorySaving}
                      aria-label="Tutup form kategori"
                      className="rounded-sm p-1.5 text-neutral-400 transition-colors hover:bg-stone-100 hover:text-neutral-800 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className={`block text-[10px] font-semibold uppercase tracking-wide text-neutral-700 ${editingCategoryId !== null ? "sm:col-span-2" : ""}`}>
                      Nama Kategori *
                      <input
                        autoFocus
                        required
                        maxLength={100}
                        value={categoryForm.category_name}
                        onChange={(e) => setCategoryForm((current) => ({ ...current, category_name: e.target.value }))}
                        placeholder="Contoh: Kerajinan Lokal"
                        className="mt-1.5 w-full rounded-sm border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-neutral-900 outline-none transition focus:border-maroon focus:bg-white focus:ring-2 focus:ring-maroon/10"
                      />
                    </label>
                    {editingCategoryId === null && (
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-neutral-700">
                        Deskripsi
                        <textarea
                          rows={2}
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm((current) => ({ ...current, description: e.target.value }))}
                          placeholder="Jelaskan jenis produk dalam kategori ini"
                          className="mt-1.5 w-full resize-y rounded-sm border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-neutral-900 outline-none transition focus:border-maroon focus:bg-white focus:ring-2 focus:ring-maroon/10"
                        />
                      </label>
                    )}
                  </div>

                  <div className="mt-5 flex justify-end gap-2 border-t border-stone-100 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseCategoryForm}
                      disabled={categorySaving}
                      className="rounded-sm border border-stone-300 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={categorySaving}
                      className="rounded-sm bg-maroon px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon-dark disabled:cursor-wait disabled:opacity-60"
                    >
                      {categorySaving
                        ? "Menyimpan..."
                        : editingCategoryId === null
                          ? "Simpan Kategori"
                          : "Simpan Perubahan"}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((item) => (
                  <div key={item.category_id} className="flex flex-col justify-between rounded-sm border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-blush text-maroon">
                            <Layers className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-900">{item.category_name}</h3>
                          </div>
                        </div>
                        <span className="inline-flex items-center rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {item.status || "Ditampilkan"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mb-4 line-clamp-2">{item.description || "Perluas pengelompokan produk perajin khas daerah."}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-100 pt-3 mt-2">
                      <span className="text-[11px] font-bold text-neutral-700">{item.product_count ?? 0} Produk Terdaftar</span>
                      <div className="flex items-center gap-2 text-neutral-500">
                        <button onClick={() => handleEditCategory(item)} className="rounded p-1 hover:bg-stone-100 hover:text-neutral-900 transition-colors cursor-pointer" title="Edit" aria-label={`Edit nama kategori ${item.category_name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCategory(item.category_id)} disabled={deletingCategoryId !== null} className="rounded p-1 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-50" title="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleAddCategory}
                  className="flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-stone-300 bg-stone-50/50 p-6 text-center hover:border-maroon/50 hover:bg-stone-50 transition-all cursor-pointer group min-h-[160px]"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-stone-200 text-stone-600 group-hover:bg-maroon group-hover:text-white transition-colors mb-2">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">Tambah Sub-Kategori</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">Perluas pengelompokan produk perajin khas daerah.</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: KELOLA PRODUK */}
          {activeTab === "produk" && (
            <div className="mt-6 overflow-x-auto rounded-sm border border-stone-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-[10px] uppercase text-neutral-500">
                  <tr><th className="px-4 py-3">Produk</th><th className="px-4 py-3">Toko</th><th className="px-4 py-3">Harga</th><th className="px-4 py-3">Stok</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((item) => (
                    <tr key={item.product_id}>
                      <td className="px-4 py-3 font-semibold">{item.product_name}</td>
                      <td className="px-4 py-3">{item.store_name}</td>
                      <td className="px-4 py-3">{formatRupiah(item.price)}</td>
                      <td className="px-4 py-3">{item.stock}</td>
                      <td className="px-4 py-3 capitalize">{item.status}</td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">Belum ada data produk.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
        </Container>
      </main>

      <Footer />
    </div>
  );
}