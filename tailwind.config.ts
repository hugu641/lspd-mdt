import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        police: {
          950: "#070b14",
          900: "#0b1329",
          850: "#0f1b3b",
          800: "#142552",
          700: "#1e3774",
          600: "#2a4c9b",
          500: "#3b6ac8",
          400: "#608bf0",
          accent: "#38bdf8",
          gold: "#f59e0b",
          danger: "#ef4444",
          success: "#10b981",
          warning: "#f97316",
        },
      },
    },
  },
  plugins: [],
};
export default config;
