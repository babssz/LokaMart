import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Clock, Package, Receipt, Star, Wallet } from "lucide-react";
import SellerNavbar from "../components/SellerNavbar";
import Footer from "../components/Footer";
import Container from "../components/Container";
import StatCard from "../components/StatCard";
import SalesChart from "../components/SalesChart";
import SellerOrdersSection from "../components/SellerOrdersSection";
import SellerProductsSection from "../components/SellerProductsSection";
import SellerStoreSection from "../components/SellerStoreSection";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { fetchSalesReport, reportsErrorMessage } from "../services/seller";
import { formatRupiah } from "../data/products";
import { PERIODS, chartTitles, downloadCsv, shortRupiah } from "../utils/seller";

const TABS = [
  { label: "Laporan Penjualan", id: "laporan" },
  { label: "Kelola Pesanan", id: "pesanan" },
  { label: "Kelola Produk", id: "produk" },
  { label: "Kelola Store", id: "toko" },
];

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("laporan");
  const [period, setPeriod] = useState("bulanan");
  const [state, setState] = useState({ report: null, isSample: false, loading: true, error: "" });
  
  // State untuk Nama Toko & Inisial Header
  const [storeName, setStoreName] = useState(user?.name ?? "Toko Saya");
  const [initials, setInitials] = useState("TS");

  // Fungsi untuk mengambil data profil toko terbaru dari endpoint backend: GET /profile/store
  const fetchStoreHeader = async () => {
    try {
      const res = await api.get("/profile/store");
      if (res.data?.store_name) {
        const name = res.data.store_name;
        setStoreName(name);
        const ini = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
        setInitials(ini || "TS");
      }
    } catch (err) {
      // Biarkan default jika gagal
    }
  };

  useEffect(() => {
    fetchStoreHeader();
  }, []);

  useEffect(() => {
    if (activeTab !== "laporan") return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fetchSalesReport(period)
      .then(({ report, isSample }) => {
        if (!cancelled) setState({ report, isSample, loading: false, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setState({ report: null, isSample: false, loading: false, error: reportsErrorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [period, activeTab]);

  const { report, isSample, loading, error } = state;
  const meta = PERIODS.find((p) => p.id === period);
  const store = report?.store;
  const { title, subtitle } = chartTitles(period);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <SellerNavbar />

      <main className="flex-1 bg-blush/40">
        <Container className="py-6 md:py-8">

          {/* Profil Toko (Header Atas) */}
          <section className="mt-4 overflow-hidden rounded-sm border border-stone-200 bg-white">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-md bg-maroon-dark text-lg font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl">
                  {storeName}
                </h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Toko Buka
                  </span>
                </p>
              </div>
            </div>

            {/* Menu Tabs Dashboard */}
            <div className="flex gap-1 overflow-x-auto border-t border-stone-200 bg-stone-50 px-2 sm:px-4">
              {TABS.map((t) => {
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
            <>
              <div className="mt-6 inline-flex rounded-sm border border-stone-200 bg-white p-0.5" role="tablist" aria-label="Periode laporan">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={period === p.id}
                    onClick={() => setPeriod(p.id)}
                    className={
                      "rounded-sm px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:px-4 " +
                      (period === p.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-stone-100")
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {isSample && (
                <p className="mt-4 rounded-sm bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Menampilkan <strong>data contoh</strong>.
                </p>
              )}

              {error && (
                <p role="alert" className="mt-4 rounded-sm bg-red-50 px-3 py-2 text-xs text-red-800">
                  {error}
                </p>
              )}

              {loading && !report ? (
                <div className="mt-4 space-y-4" aria-busy="true">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-28 animate-pulse rounded-sm bg-white" />
                    ))}
                  </div>
                  <div className="h-72 animate-pulse rounded-sm bg-white" />
                </div>
              ) : (
                report && (
                  <div className={"mt-4 space-y-4 transition-opacity " + (loading ? "opacity-60" : "")}>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard label="Total omzet bersih" value={formatRupiah(report.summary.revenue)} change={report.summary.changes.revenue} vs={meta.vs} icon={Wallet} />
                      <StatCard label="Pesanan selesai" value={report.summary.orders.toLocaleString("id-ID")} unit="Pesanan" change={report.summary.changes.orders} vs={meta.vs} icon={ClipboardCheck} />
                      <StatCard label="Produk terjual" value={report.summary.items.toLocaleString("id-ID")} unit="Item" change={report.summary.changes.items} vs={meta.vs} icon={Package} />
                      <StatCard label="Rata-rata beli (AOV)" value={formatRupiah(report.summary.aov)} change={report.summary.changes.aov} vs={meta.vs} icon={Receipt} />
                    </div>

                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                      <SalesChart title={title} subtitle={subtitle} data={report.trend} onDownload={() => downloadCsv(report, period)} />

                      <aside className="rounded-sm border border-stone-200 bg-white p-4 sm:p-5">
                        <h2 className="text-sm font-bold text-neutral-900">Top 3 Produk Terlaris</h2>
                        {report.topProducts.length === 0 ? (
                          <p className="py-8 text-center text-xs text-neutral-500">Belum ada penjualan.</p>
                        ) : (
                          <ol className="mt-3 divide-y divide-stone-200">
                            {report.topProducts.slice(0, 3).map((p, i) => (
                              <li key={p.id ?? p.name} className="flex items-center gap-3 py-3">
                                <span className="w-5 shrink-0 text-[11px] font-semibold text-neutral-400">{String(i + 1).padStart(2, "0")}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-xs font-semibold text-neutral-900">{p.name}</p>
                                  <p className="text-[10px] text-neutral-500">Terjual {p.sold.toLocaleString("id-ID")}</p>
                                </div>
                                <p className="shrink-0 text-xs font-bold text-neutral-900">{shortRupiah(p.revenue)}</p>
                              </li>
                            ))}
                          </ol>
                        )}
                      </aside>
                    </div>
                  </div>
                )
              )}
            </>
          )}

          {/* TAB 2: KELOLA PESANAN */}
          {activeTab === "pesanan" && <SellerOrdersSection />}

          {/* TAB 3: KELOLA PRODUK */}
          {activeTab === "produk" && <SellerProductsSection />}

          {/* TAB 4: KELOLA STORE (Dilengkapi callback onStoreUpdated) */}
          {activeTab === "toko" && <SellerStoreSection onStoreUpdated={fetchStoreHeader} />}
        </Container>
      </main>

      <Footer />
    </div>
  );
}