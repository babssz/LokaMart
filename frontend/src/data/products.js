
export const categories = ["Semua", "Fashion", "Kuliner", "Kerajinan"];

export const fallbackProducts = [
  {
    product_id: 1, product_name: "Sambal Ikan Roa", price: "50000.00", stock: 24, category_name: "Kuliner",
    image: "/images/sambal-ikan-roa.jpg", store_name: "Dapur Andalan", badge: "Terlaris",
    description: "Sambal ikan roa khas Makassar dengan cita rasa pedas gurih.\n\nDibuat dari ikan roa asap pilihan dan cabai segar tanpa pengawet.",
  },
  {
    product_id: 2, product_name: "Gantungan Kunci Pinisi", price: "15000.00", stock: 60, category_name: "Kerajinan",
    image: "/images/gantungan-pinisi.jpg", store_name: "Pinisi Craft",
    description: "Gantungan kunci miniatur perahu pinisi, dibuat tangan oleh pengrajin Makassar.",
  },
  {
    product_id: 3, product_name: "Selendang Sutra Makassar", price: "210000.00", stock: 12, category_name: "Fashion",
    image: "/images/selendang-sutra.jpg", store_name: "Sutra Makassar",
    colors: [
      { label: "Indigo Biru", hex: "#2d3a6b" },
      { label: "Terakota Natural", hex: "#a0522d" },
      { label: "Kuning Gambir", hex: "#c9a227" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Selendang sutra bermotif tradisional Sulawesi Selatan.\n\nDitenun dengan pewarna alami sehingga warnanya lembut dan tahan lama.",
  },
  {
    product_id: 4, product_name: "Bagea Kacang", price: "42000.00", stock: 0, category_name: "Kuliner",
    image: "/images/bagea-kacang.jpg", store_name: "Oleh-Oleh Daeng",
    description: "Kue kering bagea kacang, oleh-oleh khas Makassar.",
  },
];

export const fallbackCategories = [
  { category_id: 1, category_name: "Fashion" },
  { category_id: 2, category_name: "Kopi" },
  { category_id: 3, category_name: "Kerajinan" },
  { category_id: 4, category_name: "Dekorasi" },
  { category_id: 5, category_name: "Kuliner Khas" },
  { category_id: 6, category_name: "Aksesoris" },
];

// price dari backend bertipe Decimal, jadi di JSON bisa berupa string ("50000.00")
export const formatRupiah = (n) => "Rp " + Number(n ?? 0).toLocaleString("id-ID");