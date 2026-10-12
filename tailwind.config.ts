import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Cloudinary-inspired blue. 600 on white and white on 600 both pass WCAG AA.
        brand: {
          50: "#eef1ff",
          100: "#dfe4ff",
          200: "#c5cdff",
          300: "#a1abff",
          400: "#7b80fb",
          500: "#5f5ff4",
          600: "#3448c5",
          700: "#2b3aa3",
          800: "#253183",
          900: "#222d69",
          950: "#141a3d",
        },
      },
    },
  },
  plugins: [],
};
export default config;
