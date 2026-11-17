import { createContext, useCallback, useContext, useState } from "react";

const AuthContext = createContext(null);

const readUser = () => {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const u = JSON.parse(store.getItem("user"));
      if (u) return u;
    } catch {
    }
  }
  return null;
};

const clearAll = () => {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem("token");
    store.removeItem("user");
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const login = useCallback((data, remember = true) => {
    clearAll();
    const store = remember ? localStorage : sessionStorage;
    store.setItem("token", data.access_token);
    store.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearAll();
    setUser(null);
  }, []);

  // Perbarui data user (misalnya setelah ubah profil) di tempat penyimpanan yang sama dengan login
  const updateUser = useCallback((next) => {
    const store = localStorage.getItem("user") ? localStorage : sessionStorage;
    store.setItem("user", JSON.stringify(next));
    setUser(next);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);