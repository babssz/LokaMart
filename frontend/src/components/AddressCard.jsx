import { useState } from "react";
import { MapPin } from "lucide-react";
import FormField from "./FormField";
import CheckoutSection from "./CheckoutSection";
import { formatPhone, phoneDigits } from "../utils/checkout";

export default function AddressCard({ address, onSave }) {
  const empty = !address.address?.trim();
  const [editing, setEditing] = useState(empty);
  const [draft, setDraft] = useState({ ...address, phone: phoneDigits(address.phone) });
  const [error, setError] = useState("");

  const onChange = (e) => setDraft({ ...draft, [e.target.name]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    const digits = phoneDigits(draft.phone);
    if (!draft.name.trim()) return setError("Nama penerima wajib diisi.");
    if (digits.length < 9 || digits.length > 12) return setError("Nomor WhatsApp tidak valid.");
    if (draft.address.trim().length < 10) return setError("Tulis alamat selengkap mungkin (jalan, kelurahan, kecamatan).");
    setError("");
    onSave({ name: draft.name.trim(), phone: `+62${digits}`, address: draft.address.trim(), note: draft.note.trim() });
    setEditing(false);
  };

  const openEdit = () => {
    setDraft({ ...address, phone: phoneDigits(address.phone) });
    setError("");
    setEditing(true);
  };

  return (
    <CheckoutSection
      number="1"
      title="Alamat Pengiriman Utama"
      subtitle="Identitas penerima terverifikasi"
      action={
        !editing && (
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-stone-300 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-maroon-dark hover:bg-stone-50"
          >
            <MapPin className="h-3 w-3" /> Ubah alamat
          </button>
        )
      }
    >
      {editing ? (
        <form onSubmit={save} className="space-y-4">
          {empty && <p className="rounded-sm bg-amber-50 px-3 py-2 text-xs text-amber-800">Belum ada alamat pengiriman. Lengkapi dulu untuk melanjutkan.</p>}
          {error && (
            <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-xs text-red-800">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="a-name" name="name" label="Nama Penerima *" value={draft.name} onChange={onChange} maxLength={100} autoComplete="name" />
            <FormField id="a-phone" name="phone" type="tel" inputMode="numeric" prefix="+62" label="Nomor WhatsApp *" placeholder="812-3456-7890" value={draft.phone} onChange={onChange} autoComplete="tel-national" />
          </div>
          <div>
            <label htmlFor="a-address" className="mb-1.5 block text-[11px] font-semibold text-neutral-800">Alamat Lengkap *</label>
            <textarea
              id="a-address"
              name="address"
              rows={3}
              value={draft.address}
              onChange={onChange}
              placeholder="Jalan, nomor rumah, kelurahan, kecamatan, Makassar"
              className="w-full rounded-sm bg-stone-100 px-3 py-2.5 text-xs text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon/30"
            />
          </div>
          <FormField id="a-note" name="note" label="Patokan & Catatan Kurir (opsional)" placeholder="contoh: Toko Diaztektra, depan SMA 88" value={draft.note} onChange={onChange} maxLength={120} />
          <div className="flex justify-end gap-2">
            {!empty && (
              <button type="button" onClick={() => setEditing(false)} className="rounded-sm bg-stone-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-stone-200">
                Batal
              </button>
            )}
            <button type="submit" className="rounded-sm bg-maroon-dark px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-maroon">
              Simpan alamat
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {address.name} <span className="ml-1 text-xs font-normal text-neutral-500">({formatPhone(address.phone)})</span>
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{address.address}</p>
          {address.note && (
            <p className="mt-3 flex items-start gap-2 rounded-sm bg-stone-100 px-3 py-2 text-[11px] text-neutral-600">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-maroon" />
              <span>
                <strong className="text-neutral-800">Patokan &amp; Catatan Kurir:</strong> {address.note}
              </span>
            </p>
          )}
        </div>
      )}
    </CheckoutSection>
  );
}