import api from "./api";

const PATH = {
  login: "/auth/login",
  register: "/auth/register",
  me: "/auth/me",
  profile: "/profile",
  password: "/profile/password",
};

export const loginRequest = (data) => api.post(PATH.login, data).then((r) => r.data);
export const registerRequest = (data) => api.post(PATH.register, data).then((r) => r.data);
export const fetchMe = () => api.get(PATH.me).then((r) => r.data);

export const updateMe = (data) => api.put(PATH.profile, data).then((r) => r.data);
export const uploadProfilePhoto = (file) => {
  const data = new FormData();
  data.append("file", file);
  return api
    .post("/profile/photo", data, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};

export const updatePassword = (data) => api.put(PATH.password, data).then((r) => r.data);

export function getErrorMessage(err) {
  if (!err.response) return "Tidak mendapat respons dari API. Periksa alamat API, backend, dan koneksi browser (CORS).";
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  return "Terjadi kesalahan. Coba lagi.";
}