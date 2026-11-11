import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, Store, Package, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Container from "./Container";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    "text-[11px] font-semibold uppercase tracking-wide transition-colors " +
    (isActive ? "text-maroon" : "text-neutral-700 hover:text-maroon");

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <Container className="flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="shrink-0 text-sm font-bold uppercase tracking-widest text-neutral-900"
        >
          Lokamart
        </Link>

        {/* Nav tengah — desktop */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Navigasi utama">
          <NavLink to="/" end className={navLinkClass}>
            Beranda
          </NavLink>
          <NavLink to="/produk" className={navLinkClass}>
            Produk
          </NavLink>
        </nav>

        {/* Kanan: aksi */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Keranjang */}
              <Link
                to="/keranjang"
                aria-label={`Keranjang belanja, ${count} item`}
                className="relative text-neutral-700 hover:text-maroon"
              >
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-maroon text-[9px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>

              {/* Dropdown profil */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-1.5 rounded-sm border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800 transition-colors hover:bg-stone-100"
                >
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt="Foto profil"
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-maroon-dark text-[9px] font-bold text-white">
                      {(user.name ?? "U")
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                  <span className="hidden max-w-[8rem] truncate sm:inline">{user.name}</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </button>

                {dropdownOpen && (
                  <>
                    {/* Overlay transparan untuk tutup dropdown saat klik luar */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-sm border border-stone-200 bg-white shadow-md">
                      <Link
                        to="/profil"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-neutral-800 hover:bg-stone-50"
                      >
                        <User className="h-3.5 w-3.5 text-maroon" />
                        Profil Saya
                      </Link>
                      <Link
                        to="/pesanan"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-neutral-800 hover:bg-stone-50"
                      >
                        <Package className="h-3.5 w-3.5 text-maroon" />
                        Pesanan Saya
                      </Link>
                      {user.role === "penjual" && (
                        <Link
                          to="/toko-saya"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-neutral-800 hover:bg-stone-50"
                        >
                          <Store className="h-3.5 w-3.5 text-maroon" />
                          Toko Saya
                        </Link>
                      )}
                      <div className="border-t border-stone-200" />
                      <button
                        type="button"
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
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:text-maroon"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="rounded-sm bg-maroon-dark px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon"
              >
                Daftar
              </Link>
            </>
          )}

          {/* Burger — mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Menu"
            className="ml-1 grid h-8 w-8 place-items-center rounded-sm text-neutral-700 hover:bg-stone-100 md:hidden"
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

      {/* Menu mobile */}
      {menuOpen && (
        <div className="border-t border-stone-200 bg-white md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            <NavLink
              to="/"
              end
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                "rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide " +
                (isActive ? "bg-blush text-maroon" : "text-neutral-700 hover:bg-stone-50")
              }
            >
              Beranda
            </NavLink>
            <NavLink
              to="/produk"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                "rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide " +
                (isActive ? "bg-blush text-maroon" : "text-neutral-700 hover:bg-stone-50")
              }
            >
              Produk
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/keranjang"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    "rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide " +
                    (isActive ? "bg-blush text-maroon" : "text-neutral-700 hover:bg-stone-50")
                  }
                >
                  Keranjang {count > 0 && `(${count})`}
                </NavLink>
                <NavLink
                  to="/profil"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    "rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide " +
                    (isActive ? "bg-blush text-maroon" : "text-neutral-700 hover:bg-stone-50")
                  }
                >
                  Profil Saya
                </NavLink>
                <NavLink
                  to="/pesanan"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    "rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide " +
                    (isActive ? "bg-blush text-maroon" : "text-neutral-700 hover:bg-stone-50")
                  }
                >
                  Pesanan Saya
                </NavLink>
                {user.role === "penjual" && (
                  <NavLink
                    to="/toko-saya"
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      "rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide " +
                      (isActive ? "bg-blush text-maroon" : "text-neutral-700 hover:bg-stone-50")
                    }
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
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    "rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide " +
                    (isActive ? "bg-blush text-maroon" : "text-neutral-700 hover:bg-stone-50")
                  }
                >
                  Masuk
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    "rounded-sm px-3 py-2 text-[11px] font-semibold uppercase tracking-wide " +
                    (isActive ? "bg-blush text-maroon" : "text-neutral-700 hover:bg-stone-50")
                  }
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