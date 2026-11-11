import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Lock, Save, Store, User as UserIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Container from "../components/Container";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { fetchMe, updateMe, updatePassword, uploadPhoto, getErrorMessage } from "../services/auth";

const labelCls = "text-[10px] uppercase tracking-wide";
const emptyPw = { current: "", next: "", confirm: "" };

// Ambil angka saja dan buang awalan 62 / 0, karena awalan +62 sudah ada di kolomnya.
const phoneToDigits = (v) => {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.startsWith("62")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
};

const fromUser = (u) => ({ name: u?.name ?? "", phone: phoneToDigits(u?.phone), email: u?.email ?? "" });

const SectionTitle = ({ icon: Icon, children }) => (
  <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
    <Icon className="h-4 w-4 text-maroon" /> {children}
  </h2>
);

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState(() => fromUser(user));
  const [pw, setPw] = useState(emptyPw);
  const [photo, setPhoto] = useState(null); // { file, preview }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: "ok" | "error", text }

  // Ambil data terbaru dari backend (GET /auth/me)
  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        updateUser(me);
        setForm(fromUser(me));
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) {
          logout();
          navigate("/login", { replace: true, state: { message: "Sesi Anda berakhir atau tidak valid. Silakan masuk lagi." } });
          return;
        }
        setStatus({ type: "error", text: getErrorMessage(err) });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [updateUser, logout, navigate]);

  // Lepas URL pratinjau foto yang sudah tidak dipakai
  useEffect(() => () => photo?.preview && URL.revokeObjectURL(photo.preview), [photo]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onChangePw = (e) => setPw({ ...pw, [e.target.name]: e.target.value });

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return setStatus({ type: "error", text: "Format foto harus JPG atau PNG." });
    }
    if (file.size > 2 * 1024 * 1024) {
      return setStatus({ type: "error", text: "Ukuran foto maksimal 2 MB." });
    }
    setStatus(null);
    setPhoto({ file, preview: URL.createObjectURL(file) });
  };

  const onCancel = () => {
    setForm(fromUser(user));
    setPw(emptyPw);
    setPhoto(null);
    setStatus(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const digits = phoneToDigits(form.phone);
    const wantsPassword = Boolean(pw.current || pw.next || pw.confirm);

    if (!form.name.trim()) return setStatus({ type: "error", text: "Nama lengkap wajib diisi." });
    if (digits.length < 9 || digits.length > 12) return setStatus({ type: "error", text: "Nomor WhatsApp tidak valid." });
    if (wantsPassword) {
      if (!pw.current || !pw.next || !pw.confirm) {
        return setStatus({ type: "error", text: "Lengkapi ketiga kolom kata sandi, atau kosongkan semuanya." });
      }
      if (pw.next.length < 8) return setStatus({ type: "error", text: "Kata sandi baru minimal 8 karakter." });
      if (pw.next !== pw.confirm) return setStatus({ type: "error", text: "Konfirmasi kata sandi baru tidak sama." });
    }

    const payload = { name: form.name.trim(), phone: `+62${digits}`, email: form.email.trim() };
    const dataChanged = payload.name !== user.name || payload.phone !== user.phone || payload.email !== user.email;

    if (!dataChanged && !wantsPassword && !photo) {
      return setStatus({ type: "ok", text: "Tidak ada perubahan untuk disimpan." });
    }

    setSaving(true);
    let step = "ubah profil";
    try {
      let next = { ...user };

      if (dataChanged) {
        await updateMe(payload);
        next = { ...next, ...payload };
        updateUser(next);
      }

      if (wantsPassword) {
        step = "ubah kata sandi";
        await updatePassword({ current_password: pw.current, new_password: pw.next });
        setPw(emptyPw);
      }

      if (photo) {
        step = "unggah foto";
        const res = await uploadPhoto(photo.file);
        next = { ...next, photo_url: res?.photo_url ?? next.photo_url };
        updateUser(next);
        setPhoto(null);
      }

      setStatus({ type: "ok", text: "Perubahan berhasil disimpan." });
    } catch (err) {
      const code = err.response?.status;
      setStatus({
        type: "error",
        text:
          code === 404 || code === 405
            ? `Fitur ${step} belum tersedia di server. Hubungi tim backend.`
            : getErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const words = (user?.name ?? "").trim().split(/\s+/);
  const initials = words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const avatarSrc = photo?.preview ?? user?.photo_url;
  const busy = loading || saving;

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <Navbar />

      <main className="flex-1 bg-blush/40">
        <Container className="py-8 md:py-10">
          <h1 className="sr-only">Profil Saya</h1>

          <div className="mx-auto max-w-3xl space-y-4">
            <form onSubmit={onSubmit} className="rounded-sm bg-white p-5 shadow-sm sm:p-8">
              {/* Foto profil */}
              <div className="flex items-center gap-4 border-b border-stone-200 pb-6">
                <div className="relative shrink-0">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Foto profil" className="h-[72px] w-[72px] rounded-md object-cover" />
                  ) : (
                    <span className="grid h-[72px] w-[72px] place-items-center rounded-md bg-maroon-dark text-xl font-semibold text-white">
                      {initials}
                    </span>
                  )}
                  <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded bg-maroon text-white">
                    <Camera className="h-3 w-3" />
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{user?.name}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">Format gambar JPG atau PNG (Maksimal 2 MB).</p>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPickPhoto} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="mt-2 rounded-sm border border-stone-300 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-50 disabled:opacity-60"
                  >
                    Ganti foto
                  </button>
                </div>
              </div>

              {status && (
                <p
                  role={status.type === "error" ? "alert" : "status"}
                  className={
                    "mt-5 rounded-sm px-3 py-2 text-xs " +
                    (status.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800")
                  }
                >
                  {status.text}
                </p>
              )}

              <fieldset disabled={busy} className="min-w-0">
                {/* Biodata utama */}
                <div className="space-y-4 border-b border-stone-200 py-6">
                  <SectionTitle icon={UserIcon}>Biodata Utama</SectionTitle>
                  <FormField id="name" name="name" label="Nama Lengkap *" labelClass={labelCls} value={form.name} onChange={onChange} required maxLength={100} autoComplete="name" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="phone" name="phone" type="tel" inputMode="numeric" prefix="+62" label="Nomor WhatsApp / HP *" labelClass={labelCls} placeholder="812-3456-7890" value={form.phone} onChange={onChange} required autoComplete="tel-national" />
                    <FormField id="email" name="email" type="email" label="Alamat Email *" labelClass={labelCls} value={form.email} onChange={onChange} required autoComplete="email" />
                  </div>
                </div>

                {/* Perbarui kata sandi */}
                <div className="space-y-4 border-b border-stone-200 py-6">
                  <div>
                    <SectionTitle icon={Lock}>Perbarui Kata Sandi</SectionTitle>
                    <p className="mt-1 text-[11px] text-neutral-500">Kosongkan jika Anda tidak ingin mengubah kata sandi.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField id="current" name="current" type="password" label="Kata Sandi Saat Ini" labelClass={labelCls} value={pw.current} onChange={onChangePw} autoComplete="current-password" />
                    <FormField id="next" name="next" type="password" label="Kata Sandi Baru" labelClass={labelCls} placeholder="Min. 8 karakter" value={pw.next} onChange={onChangePw} maxLength={72} autoComplete="new-password" />
                    <FormField id="confirm" name="confirm" type="password" label="Konfirmasi Sandi Baru" labelClass={labelCls} placeholder="Ketik ulang sandi" value={pw.confirm} onChange={onChangePw} maxLength={72} autoComplete="new-password" />
                  </div>
                </div>
              </fieldset>

              <div className="flex justify-end gap-2 pt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={busy}
                  className="rounded-sm bg-stone-100 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-200 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-sm bg-maroon-dark px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? "Menyimpan..." : "Simpan perubahan"}
                </button>
              </div>
            </form>

            {/* Ajakan membuka toko, hanya untuk pembeli */}
            {user?.role === "pembeli" && (
              <div className="flex items-center justify-between gap-4 rounded-sm bg-blush p-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-maroon-dark text-white">
                    <Store className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-semibold text-neutral-900 sm:text-sm">Ingin Menjual Produk Lokal?</p>
                </div>
                <Link
                  to="/buka-toko"
                  className="shrink-0 rounded-sm bg-maroon-dark px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-maroon"
                >
                  Buka Toko
                </Link>
              </div>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}