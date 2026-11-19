import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { registerRequest, getErrorMessage } from "../services/auth";

const phoneDigits = (v) => {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("62")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", agree: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const digits = phoneDigits(form.phone);
    if (digits.length < 9 || digits.length > 12) return setError("Nomor WhatsApp tidak valid.");
    if (form.password.length < 8) return setError("Kata sandi minimal 8 karakter.");
    if (!form.agree) return setError("Setujui Syarat & Ketentuan dan Kebijakan Privasi untuk melanjutkan.");

    setLoading(true);
    try {
      await registerRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "pembeli", 
        phone: `+62${digits}`,
        address: null,
        store_name: null,
      });
      navigate("/login", { state: { message: "Akun berhasil dibuat. Silakan masuk." } });
   } catch (err) {
      const message = getErrorMessage(err);

      if (message.includes("valid email address")) {
        setError("Format alamat email tidak valid. Pastikan email menggunakan format yang benar.");
      } else {
        setError(message);
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Daftar"
      subtitle="Lengkapi data diri Anda untuk mulai berbelanja produk lokal LokaMart"
      switchLabel="Masuk"
      switchTo="/login"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-xs text-red-800">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" name="name" label="Nama Lengkap (Sesuai KTP) *" placeholder="contoh: Budi Santoso" value={form.name} onChange={onChange} required maxLength={100} autoComplete="name" />
          <FormField id="phone" name="phone" type="tel" inputMode="numeric" prefix="+62" label="Nomor WhatsApp Aktif *" placeholder="812-3456-7890" value={form.phone} onChange={onChange} required autoComplete="tel-national" />
          <FormField id="email" name="email" type="email" label="Alamat Email *" placeholder="budi@domain.com" value={form.email} onChange={onChange} required autoComplete="email" />
          <FormField id="password" name="password" type="password" label="Kata Sandi *" placeholder="Masukkan kata sandi" value={form.password} onChange={onChange} required maxLength={72} autoComplete="new-password" />
        </div>

        <label className="flex items-start gap-2 text-[11px] leading-relaxed text-neutral-700">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(e) => setForm({ ...form, agree: e.target.checked })}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-maroon-dark"
          />
          <span>
            Saya menyetujui{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="underline">Syarat &amp; Ketentuan</a> serta{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="underline">Kebijakan Privasi</a> perlindungan data pengrajin lokal LokaMart.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-maroon-dark py-3 text-xs font-semibold text-white transition-colors hover:bg-maroon disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Daftar"}
        </button>

        <p className="text-center text-[11px] text-neutral-600">
          Sudah memiliki akun?{" "}
          <Link to="/login" className="font-semibold text-maroon-dark hover:underline">
            Masuk di sini
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}