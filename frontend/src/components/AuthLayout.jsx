import { Link } from "react-router-dom";
import Container from "./Container";
import Footer from "./Footer";

// Kerangka halaman login/register: header sederhana, kartu di tengah, footer yang sama dengan beranda.
export default function AuthLayout({ title, subtitle, switchLabel, switchTo, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <header className="border-b border-stone-200 bg-blush/40">
        <Container className="flex items-center justify-between py-4">
          <Link to="/" className="shrink-0">
            <img src="/logo.svg" alt="Lokamart" className="h-8 w-auto" />
          </Link>
          <Link to={switchTo} className="text-xs font-semibold text-maroon-dark hover:underline">
            {switchLabel}
          </Link>
        </Container>
      </header>

      <main className="flex flex-1 items-center justify-center bg-blush/40 px-4 py-12 sm:py-16">
        <div className="w-full max-w-xl">
          <h1 className="text-center text-2xl font-semibold text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-1 text-center text-xs text-neutral-500">{subtitle}</p>}
          <div className="mt-6 rounded-sm bg-white p-6 shadow-sm sm:p-8">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}