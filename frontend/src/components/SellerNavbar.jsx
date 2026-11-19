import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Store, Package, ChevronDown, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Container from "./Container";
import logo from "../assets/logo.png";

export default function SellerNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-6">
        {/* Kiri: Logo Lokamart & Label Dashboard Penjual */}
        <div className="flex items-center gap-4">
          <Link
            to="/toko-saya"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900"
          >
            <img src={logo} alt="Lokamart" className="h-8 w-auto" />
          </Link>
        </div>


        {/* Kanan: Profil Dropdown Penjual */}
        <div className="flex items-center gap-4 shrink-0">
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-sm bg-transparent px-2 py-1 text-[11px] font-semibold text-neutral-800 transition-colors hover:bg-stone-50 cursor-pointer"
              >
                {user.photo_url ? (
                  <img
                    src={user.photo_url}
                    alt="Foto profil"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-maroon-dark text-[10px] font-bold text-white">
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
                  <span className="block text-[10px] text-neutral-400 uppercase leading-none">Halo</span>
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
                  <div className="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-sm border border-stone-200 bg-white shadow-md">
                    <Link
                      to="/"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-neutral-800 hover:bg-stone-50"
                    >
                      <Store className="h-3.5 w-3.5 text-maroon" />
                      Halaman Utama
                    </Link>
                    <Link
                      to="/profil"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-neutral-800 hover:bg-stone-50"
                    >
                      <User className="h-3.5 w-3.5 text-maroon" />
                      Profil Akun
                    </Link>
                    <Link
                      to="/pesanan"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-neutral-800 hover:bg-stone-50"
                    >
                      <Package className="h-3.5 w-3.5 text-maroon" />
                      Pesanan Saya
                    </Link>
                    <div className="border-t border-stone-200" />
                    <button
                      type="button"
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
          )}
        </div>
      </Container>
    </header>
  );
}