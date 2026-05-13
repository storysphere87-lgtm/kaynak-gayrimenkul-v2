import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(10, 10, 14)",
        bg2: "rgb(16, 16, 22)",
        bg3: "rgb(22, 22, 30)",
        surface: "rgb(28, 28, 38)",
        gold: "#c8a96e",
        gold2: "#dfc08a",
        gold3: "#a8873e",
        text: "rgba(255, 255, 255, 0.92)",
        text2: "rgba(255, 255, 255, 0.55)",
        text3: "rgba(255, 255, 255, 0.30)",
        border: "rgba(255, 255, 255, 0.07)",
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
