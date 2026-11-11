import api from "./api";

// Path login, register, dan me sudah dicocokkan dengan /docs backend.
// Path password dan photo adalah USULAN untuk tim backend (belum ada di /docs).
const PATH = {
  login: "/auth/login",
  register: "/auth/register",
  me: "/auth/me",
  password: "/auth/me/password",
  photo: "/auth/me/photo",
};

export const loginRequest = (data) => api.post(PATH.login, data).then((r) => r.data);
export const registerRequest = (data) => api.post(PATH.register, data).then((r) => r.data);
export const fetchMe = () => api.get(PATH.me).then((r) => r.data);

// Ubah biodata: { name, phone, email }
export const updateMe = (data) => api.put(PATH.me, data).then((r) => r.data);

// Ubah kata sandi: { current_password, new_password }
export const updatePassword = (data) => api.put(PATH.password, data).then((r) => r.data);

// Unggah foto profil (multipart). Diharapkan mengembalikan { photo_url }
export const uploadPhoto = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(PATH.photo, fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};

// Mengubah error dari axios/FastAPI jadi pesan yang bisa ditampilkan ke pengguna
export function getErrorMessage(err) {
  if (!err.response) return "Tidak bisa terhubung ke server. Pastikan backend sudah menyala.";
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  return "Terjadi kesalahan. Coba lagi.";
}