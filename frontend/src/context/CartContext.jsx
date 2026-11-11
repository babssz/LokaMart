import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import * as cartApi from "../services/cart";

const CartContext = createContext(null);

// Semua fungsi mengembalikan { ok, message } supaya halaman bisa menampilkan pesan kalau gagal.
// `loaded` bernilai true setelah keranjang selesai dimuat pertama kali (dipakai halaman checkout).
export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.user_id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(
    async (fn) => {
      if (!userId) return { ok: false, message: "Masuk dulu untuk berbelanja." };
      setError("");
      try {
        setItems(await fn());
        return { ok: true };
      } catch (err) {
        const message = cartApi.cartErrorMessage(err);
        setError(message);
        return { ok: false, message };
      }
    },
    [userId]
  );

  const refresh = useCallback(async () => {
    setLoaded(false);
    if (!userId) {
      setItems([]);
      setLoaded(true);
      return;
    }
    setLoading(true);
    await run(() => cartApi.fetchCart(userId));
    setLoading(false);
    setLoaded(true);
  }, [userId, run]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      items,
      count: items.length, // jumlah baris produk (sesuai lencana di desain)
      loading,
      loaded,
      error,
      refresh,
      add: (product, quantity = 1, variant = "") => run(() => cartApi.addItem(userId, product, quantity, variant)),
      setQty: (item, quantity) => run(() => cartApi.updateItem(userId, item, { quantity })),
      setNote: (item, note) => run(() => cartApi.updateItem(userId, item, { note })),
      remove: (list) => run(() => cartApi.removeItems(userId, list)),
    }),
    [items, loading, loaded, error, refresh, run, userId]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);