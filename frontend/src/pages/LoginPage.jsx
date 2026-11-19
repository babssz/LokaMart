import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { loginRequest, getErrorMessage } from "../services/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const info = location.state?.message;
  const redirectTo = location.state?.from?.pathname || "/";

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const id = form.identifier.trim();
    if (!id.includes("@")) {
      return setError("Saat ini masuk hanya bisa dengan email. Login dengan nomor WhatsApp belum tersedia.");
    }

    setLoading(true);
    try {
      const data = await loginRequest({ email: id, password: form.password });
      login(data, form.remember);

      const userRole = data?.role || data?.user?.role;
      const userEmail = id.toLowerCase();

      if (userRole === "admin" || userEmail === "admin@lokamart.com") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Masuk" switchLabel="Daftar" switchTo="/register">
      <form onSubmit={onSubmit} className="space-y-4">
        {info && <p className="rounded-sm bg-green-50 px-3 py-2 text-xs text-green-800">{info}</p>}
        {error && (
          <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-xs text-red-800">
            {error}
          </p>
        )}

        <FormField
          id="identifier"
          name="identifier"
          label="EMAIL ATAU NOMOR WHATSAPP/HP"
          labelClass="text-[10px] tracking-wide"
          placeholder="contoh: nama@email.com atau 08122456789"
          value={form.identifier}
          onChange={onChange}
          required
          autoComplete="username"
        />

        <FormField
          id="password"
          name="password"
          type="password"
          label="KATA SANDI"
          labelClass="text-[10px] tracking-wide"
          action={
            <a href="#" onClick={(e) => e.preventDefault()} className="text-[10px] font-semibold text-maroon-dark hover:underline">
              Lupa Kata Sandi?
            </a>
          }
          placeholder="Masukkan minimal 8 karakter"
          value={form.password}
          onChange={onChange}
          required
          autoComplete="current-password"
        />

        <label className="flex items-center gap-2 text-xs text-neutral-700">
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            className="h-3.5 w-3.5 accent-maroon-dark"
          />
          Ingat saya di perangkat ini
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-maroon-dark py-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>

        <p className="border-t border-stone-200 pt-4 text-center text-[11px] text-neutral-600">
          Belum memiliki akun?{" "}
          <Link to="/register" className="font-semibold text-maroon-dark hover:underline">
            Daftar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}