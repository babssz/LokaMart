import { Link } from "react-router-dom";
import Container from "./Container";
import Footer from "./Footer";
import logo from "../assets/logo.png";

export default function AuthLayout({ title, subtitle, switchLabel, switchTo, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <header className="border-b border-stone-200 bg-blush/40">
        <Container className="flex items-center justify-between py-4">
          <Link to="/" className="shrink-0">
            <img src={logo} alt="Lokamart" className="h-10 w-auto" />
          </Link>
          <Link to={switchTo} className="text-xl font-semibold text-maroon-dark hover:underline">
            {switchLabel}
          </Link>
        </Container>
      </header>

      <main className="flex flex-1 items-center justify-center bg-blush/40 px-4 py-12 sm:py-16">
        <div className="w-full max-w-xl">
          <h1 className="text-center text-3xl font-semibold text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-1 text-center text-2sm text-neutral-500">{subtitle}</p>}
          <div className="mt-6 rounded-[10px] bg-white p-6 shadow-sm sm:p-8">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}