import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingCart, User, LogOut, Store, Package, ChevronDown, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Container from "./Container";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const currentKategori = searchParams.get("kategori");

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produk?cari=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  const getCategoryClass = (kategoriTarget) => {
    const isActive = currentKategori === kategoriTarget;
    return (
      "text-[16px] font-semibold uppercase tracking-wide transition-colors " +
      (isActive ? "text-maroon" : "text-neutral-700 hover:text-maroon")
    );
  };

  const navLinkClass = ({ isActive }) =>
    "text-[16px] font-semibold uppercase tracking-wide transition-colors " +
    (isActive ? "text-maroon" : "text-neutral-700 hover:text-maroon");

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      {/* Baris Atas: Logo, Search Bar, dan Aksi */}
      <Container className="flex h-16 items-center justify-between gap-6">
        {/* Logo */}
        <Link
          to="/"
          className="shrink-0 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900"
        >
          <img src={logo} alt="Lokamart" className="h-10 w-auto" />
        </Link>

        {/* Search Bar di Tengah — Desktop */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex relative flex-1 max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari batik tulis, kopi lokal, kerajinan tangan, camilan khas..."
            className="w-full rounded-[10px] border border-stone-200 bg-stone-50 py-2 pl-3 pr-9 text-[16px] text-neutral-800 placeholder-neutral-400 focus:border-maroon focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Cari"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-maroon"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      
        {/* Kanan: Aksi (Keranjang & Profil) */}
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <>
              {/* Keranjang */}
              <Link
                to="/keranjang"
                aria-label={`Keranjang belanja, ${count} item`}
                className="relative text-neutral-700 hover:text-maroon"
              >
                <ShoppingCart className="h-6 w-6" />
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-maroon text-[9px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>

              {/* Dropdown Profil */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 rounded-sm bg-transparent px-2 py-1 text-[16px] font-semibold text-neutral-800 transition-colors hover:bg-stone-50"
                >
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt="Foto profil"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-maroon-dark text-[10px] font-bold text-white">
                      {(user.name ?? "U")
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                  <div className="hidden text-left sm:block">
                    <span className="block text-[12px] text-neutral-400 uppercase leading-none">Halo</span>
                    <span className="block max-w-[7rem] truncate font-bold text-neutral-800">{user.name}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 shrink-0 text-neutral-500" />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-sm border border-stone-200 bg-white shadow-md">
                      <Link
                        to="/profil"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[16px] font-semibold text-neutral-800 hover:bg-stone-50"
                      >
                        <User className="h-3.5 w-3.5 text-maroon" />
                        Profil Saya
                      </Link>
                      <Link
                        to="/pesanan"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[16px] font-semibold text-neutral-800 hover:bg-stone-50"
                      >
                        <Package className="h-3.5 w-3.5 text-maroon" />
                        Pesanan Saya
                      </Link>
                      {user.role === "penjual" && (
                        <Link
                          to="/toko-saya"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-[16px] font-semibold text-neutral-800 hover:bg-stone-50"
                        >
                          <Store className="h-3.5 w-3.5 text-maroon" />
                          Toko Saya
                        </Link>
                      )}
                      <div className="border-t border-stone-200" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-[16px] font-semibold text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[16px] font-semibold uppercase tracking-wide text-neutral-700 hover:text-maroon"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="rounded-[10px] bg-maroon-dark px-3.5 py-2 text-[16px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon"
              >
                Daftar
              </Link>
            </>
          )}

          {/* Burger — Mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Menu"
            className="grid h-8 w-8 place-items-center rounded-sm text-neutral-700 hover:bg-stone-100 md:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              {menuOpen ? (
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {/* Baris Bawah: Navigasi Kategori (Desktop) */}
      <div className="hidden border-t border-stone-200 bg-white md:block">
        <Container className="flex h-11 items-center gap-8">
          <nav className="flex items-center gap-8" aria-label="Navigasi utama">
            <NavLink to="/" end className={navLinkClass}>
              Beranda
            </NavLink>
            <Link to="/produk?kategori=fashion" className={getCategoryClass("fashion")}>
              Fashion
            </Link>
            <Link to="/produk?kategori=kuliner" className={getCategoryClass("kuliner")}>
              Kuliner
            </Link>
            <Link to="/produk?kategori=kerajinan" className={getCategoryClass("kerajinan")}>
              Kerajinan
            </Link>
          </nav>
        </Container>
      </div>

      {/* Menu Dropdown Mobile */}
      {menuOpen && (
        <div className="border-t border-stone-200 bg-white md:hidden">
          <Container className="flex flex-col gap-2 py-3">
            {/* Search Bar Mobile */}
            <form onSubmit={handleSearchSubmit} className="relative mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk lokal..."
                className="w-full rounded-sm border border-stone-200 bg-stone-50 py-2 pl-3 pr-9 text-[12px] text-neutral-800 placeholder-neutral-400 focus:border-maroon focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Cari"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-maroon"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            <NavLink
              to="/"
              end
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                "rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide " +
                (isActive ? "bg-stone-100 text-maroon" : "text-neutral-700 hover:bg-stone-50")
              }
            >
              Beranda
            </NavLink>
            <Link
              to="/produk?kategori=fashion"
              onClick={() => setMenuOpen(false)}
              className={"rounded-sm px-3 py-2 " + (currentKategori === "fashion" ? "bg-stone-100 text-maroon font-semibold" : "text-neutral-700 hover:bg-stone-50 font-semibold text-[11px] uppercase tracking-wide")}
            >
              Fashion
            </Link>
            <Link
              to="/produk?kategori=kuliner"
              onClick={() => setMenuOpen(false)}
              className={"rounded-sm px-3 py-2 " + (currentKategori === "kuliner" ? "bg-stone-100 text-maroon font-semibold" : "text-neutral-700 hover:bg-stone-50 font-semibold text-[11px] uppercase tracking-wide")}
            >
              Kuliner
            </Link>
            <Link
              to="/produk?kategori=kerajinan"
              onClick={() => setMenuOpen(false)}
              className={"rounded-sm px-3 py-2 " + (currentKategori === "kerajinan" ? "bg-stone-100 text-maroon font-semibold" : "text-neutral-700 hover:bg-stone-50 font-semibold text-[11px] uppercase tracking-wide")}
            >
              Kerajinan
            </Link>

            {user && (
              <>
                <div className="my-1 border-t border-stone-200" />
                <NavLink
                  to="/keranjang"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50"
                >
                  Keranjang {count > 0 && `(${count})`}
                </NavLink>
                <NavLink
                  to="/profil"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50"
                >
                  Profil Saya
                </NavLink>
                <NavLink
                  to="/pesanan"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50"
                >
                  Pesanan Saya
                </NavLink>
                {user.role === "penjual" && (
                  <NavLink
                    to="/toko-saya"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50"
                  >
                    Toko Saya
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="rounded-sm px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-red-700 hover:bg-red-50"
                >
                  Keluar
                </button>
              </>
            )}
            {!user && (
              <>
                <div className="my-1 border-t border-stone-200" />
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50"
                >
                  Masuk
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50"
                >
                  Daftar
                </NavLink>
              </>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}