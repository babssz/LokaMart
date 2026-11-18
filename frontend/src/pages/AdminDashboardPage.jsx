import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, ShoppingBag, Store, FileText, Eye, ChevronDown, LogOut } from "lucide-react";
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
  { label: "Pemantauan Pesanan", id: "pemantauan" },
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
    return {
      current: { start: today, end: today },
      previous: { start: previous, end: previous },
    };
  }

  if (period === "mingguan") {
    const mondayOffset = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setDate(start.getDate() - mondayOffset);
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 7);
    const previousEnd = new Date(previousStart);
    previousEnd.setDate(previousEnd.getDate() + mondayOffset);
    return {
      current: { start, end: today },
      previous: { start: previousStart, end: previousEnd },
    };
  }

  if (period === "tahunan") {
    const start = new Date(today.getFullYear(), 0, 1);
    const previousStart = new Date(today.getFullYear() - 1, 0, 1);
    const previousEnd = new Date(today.getFullYear() - 1, 11, 31);
    return {
      current: { start, end: today },
      previous: { start: previousStart, end: previousEnd },
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return {
    current: { start, end: today },
    previous: { start: previousStart, end: previousEnd },
  };
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
      const current = [...currentMap.entries()]
        .filter(([day]) => day.startsWith(`${currentYear}-${monthKey}`))
        .reduce((sum, [, revenue]) => sum + revenue, 0);
      const previous = [...previousMap.entries()]
        .filter(([day]) => day.startsWith(`${previousYear}-${monthKey}`))
        .reduce((sum, [, revenue]) => sum + revenue, 0);
      return {
        label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(currentYear, index, 1)),
        current,
        previous,
      };
    });
  }

  if (period === "bulanan") {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    return [1, 2, 3, 4].map((week) => {
      const startDay = (week - 1) * 7 + 1;
      const endDay = Math.min(week * 7, new Date(year, month + 1, 0).getDate());
      const current = [...currentMap.entries()]
        .filter(([day]) => {
          const date = new Date(`${day}T00:00:00`);
          return date.getMonth() === month && date.getDate() >= startDay && date.getDate() <= endDay;
        })
        .reduce((sum, [, revenue]) => sum + revenue, 0);
      const previous = [...previousMap.entries()]
        .filter(([day]) => {
          const date = new Date(`${day}T00:00:00`);
          return date.getDate() >= startDay && date.getDate() <= endDay;
        })
        .reduce((sum, [, revenue]) => sum + revenue, 0);
      return { label: `Minggu ${week}`, current, previous };
    });
  }

  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  return weekdays.map((label, index) => {
    const current = daily[index];
    const previous = previousDaily[index];
    return {
      label,
      current: current ? Number(current.revenue) : 0,
      previous: previous ? Number(previous.revenue) : 0,
    };
  });
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    let cancelled = false;
    const range = getPeriodRange(period);
    setLoading(true);
    setError("");

    Promise.all([
      api.get("/reports/transactions", {
        params: {
          start_date: toIsoDate(range.current.start),
          end_date: toIsoDate(range.current.end),
        },
      }),
      api.get("/reports/transactions", {
        params: {
          start_date: toIsoDate(range.previous.start),
          end_date: toIsoDate(range.previous.end),
        },
      }),
    ])
      .then(([currentResponse, previousResponse]) => {
        if (cancelled) return;
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
            changes: {
              revenue: percentChange(revenue, previousRevenue),
              orders: percentChange(ordersCount, previousOrders),
            },
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
      })
      .catch(() => {
        if (!cancelled) {
          setError("Data laporan penjualan gagal dimuat dari server.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  useEffect(() => {
    let cancelled = false;

    const loadTab = async () => {
      try {
        if (activeTab === "pengguna") {
          const response = await api.get("/users", { params: { page: 1, limit: 50 } });
          if (!cancelled) setUsers(response.data.items ?? []);
        }
        if (activeTab === "kategori") {
          const response = await api.get("/categories");
          if (!cancelled) setCategories(response.data);
        }
        if (activeTab === "produk") {
          const response = await api.get("/products/admin/all", { params: { page: 1, limit: 50 } });
          if (!cancelled) setProducts(response.data.items ?? []);
        }
        if (activeTab === "pemantauan") {
          const response = await api.get("/orders/admin/all", { params: { page: 1, limit: 50 } });
          if (!cancelled) setOrders(response.data.items ?? []);
        }
      } catch {
        if (!cancelled) setError("Data tab admin gagal dimuat dari server.");
      }
    };

    loadTab();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white">
        <Container className="flex h-16 items-center justify-between">
          <Link
            to="/admin-dashboard"
            className="shrink-0 text-sm font-bold uppercase tracking-widest text-neutral-900"
          >
            Lokamart
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-sm px-2 py-1 text-[11px] font-semibold text-neutral-800 hover:bg-stone-50"
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
                <button
                  type="button"
                  aria-label="Tutup menu profil"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setProfileOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1.5 w-36 overflow-hidden rounded-sm border border-stone-200 bg-white shadow-md"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
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

      <main className="flex-1 bg-blush/40">
        <Container className="py-6 md:py-8">
          <div className="pb-4 border-b border-stone-200">
            <h1 className="text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl">
              Dasbor Utama Admin
            </h1>
          </div>

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

          {activeTab === "laporan" && (
            <div className="mt-6 space-y-6">
              {error && (
                <p className="rounded-sm bg-red-50 p-3 text-xs text-red-800">{error}</p>
              )}

              <div className="inline-flex rounded-sm border border-stone-200 bg-white p-0.5">
                {["harian", "mingguan", "bulanan", "tahunan"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={
                      "rounded-sm px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:px-4 " +
                      (period === p ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-stone-100")
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
              
              {loading ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  Memuat data real dari server...
                </div>
              ) : (
                adminData && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        label="Total Perputaran Transaksi"
                        value={formatRupiah(adminData.summary.total_revenue)}
                        change={adminData.summary.changes.revenue}
                        vs="dibanding periode sebelumnya"
                        icon={Wallet}
                      />
                      <StatCard
                        label="Total Pesanan Masuk"
                        value={adminData.summary.total_orders.toLocaleString("id-ID")}
                        unit="Pesanan"
                        change={adminData.summary.changes.orders}
                        vs="dibanding periode sebelumnya"
                        icon={ShoppingBag}
                      />
                      <StatCard
                        label="Mitra Aktif Berjualan"
                        value={adminData.summary.active_stores_count}
                        unit="Toko"
                        vs="memiliki transaksi pada periode ini"
                        icon={Store}
                      />
                      <StatCard
                        label="Rata-Rata Penjualan / Toko"
                        value={formatRupiah(adminData.summary.average_sales_per_store)}
                        vs="rata-rata per toko aktif"
                        icon={FileText}
                      />
                    </div>

                    <SalesChart
                      title="Tren Transaksi Wilayah"
                      subtitle="Data realisasi transaksi seluruh toko penjual."
                      data={adminData.trend}
                      onDownload={() => {
                        const rows = [
                          ["Toko", "Pesanan", "Omzet"],
                          ...adminData.top_stores.map((store) => [
                            store.name,
                            store.orders_count,
                            store.revenue,
                          ]),
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
                            <tr>
                              <th className="px-4 py-3">Toko</th>
                              <th className="px-4 py-3">Pesanan</th>
                              <th className="px-4 py-3">Omzet</th>
                            </tr>
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
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                                  Belum ada transaksi pada periode ini.
                                </td>
                              </tr>
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
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "kategori" && (
            <div className="mt-6 overflow-x-auto rounded-sm border border-stone-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-[10px] uppercase text-neutral-500">
                  <tr><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Deskripsi</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {categories.map((item) => (
                    <tr key={item.category_id}>
                      <td className="px-4 py-3 font-semibold">{item.category_name}</td>
                      <td className="px-4 py-3">{item.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "pemantauan" && (
            <div className="mt-6 overflow-x-auto rounded-sm border border-stone-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-[10px] uppercase text-neutral-500">
                  <tr><th className="px-4 py-3">ID Pesanan</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((item) => (
                    <tr key={item.order_id}>
                      <td className="px-4 py-3 font-semibold">#{item.order_id}</td>
                      <td className="px-4 py-3">{item.order_date}</td>
                      <td className="px-4 py-3 font-bold">{formatRupiah(item.total_amount)}</td>
                      <td className="px-4 py-3 capitalize">{item.status}</td>
                    </tr>
                  ))}
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