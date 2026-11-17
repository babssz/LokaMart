import { useEffect, useState } from "react";
import api from "../services/api";
import { fallbackProducts } from "../data/products";

async function fetchAll() {
  const all = [];
  const seen = new Set();
  let limit = 50;

  for (let page = 1; page <= 30; page++) {
    let res;
    try {
      res = await api.get("/products", { params: { page, limit } });
    } catch (err) {
      if (err.response?.status === 422 && limit) {
        limit = undefined;
        page--;
        continue;
      }
      throw err;
    }

    const items = res.data.items ?? [];
    const fresh = items.filter((p) => !seen.has(p.product_id));
    fresh.forEach((p) => seen.add(p.product_id));
    all.push(...fresh);

    const total = res.data.total ?? all.length;
    if (fresh.length === 0 || all.length >= total) break;
  }

  return all.filter((p) => p.status !== "disembunyikan");
}

export default function useAllProducts() {
  const [state, setState] = useState({ products: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then((products) => {
        if (!cancelled) setState({ products, loading: false, error: null });
      })
      .catch((err) => {
        console.warn("Gagal memuat produk, memakai data contoh:", err.message);
        if (!cancelled) setState({ products: fallbackProducts, loading: false, error: err });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}