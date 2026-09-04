/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        darkbg: "#080c16",
        cardbg: "rgba(15, 22, 42, 0.65)",
        borderbg: "rgba(255, 255, 255, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 15px var(--primary-glow)",
        neonSec: "0 0 15px var(--secondary-glow)",
      }
    },
  },
  plugins: [],
}
