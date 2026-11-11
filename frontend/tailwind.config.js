/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        maroon: { DEFAULT: "#8B1111", dark: "#6E0D0D" },
        blush: "#F6F0EE",
      },
      // Ganti dengan font dari Figma setelah dipasang lewat Google Fonts di index.html
      // fontFamily: { sans: ['"Nama Font"', "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};