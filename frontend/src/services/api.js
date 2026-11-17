import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "http://127.0.0.1:8000"),
  headers: { "Content-Type": "application/json" },
});

function resolveAssetUrls(value) {
  if (Array.isArray(value)) return value.map(resolveAssetUrls);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (key === "image" && typeof item === "string") {
        const baseUrl = new URL(api.defaults.baseURL, window.location.origin);
        const assetUrl =
          baseUrl.origin === window.location.origin && baseUrl.pathname.replace(/\/$/, "") === "/api"
            ? new URL(`${baseUrl.pathname}${item}`, baseUrl.origin)
            : new URL(item, baseUrl);
        return [key, assetUrl.href];
      }
      return [key, resolveAssetUrls(item)];
    }),
  );
}

// Token disimpan di localStorage (ingat saya) atau sessionStorage (sesi saja)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => {
  response.data = resolveAssetUrls(response.data);
  return response;
});

export default api;