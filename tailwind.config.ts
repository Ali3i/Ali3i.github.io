import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#4a7ab5",
        surface: "#0e1319",
        stroke: "#1a2535",
      },
    },
  },
  plugins: [],
};

export default config;
