import type { Config } from "tailwindcss";

export default {
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
        // LoopGuard / HypurrFi-inspired palette
        "brand-mint": "#BAFCE2",
        "brand-sky": "#C6EFFF",
        "brand-yellow": "#F7EF9A",
        "brand-sage": "#D6F3D2",
        "brand-pink": "#f9a8d4",
        // Dark surfaces
        "bg-base": "#050608",
        panel: "#0A0C0F",
        "panel-2": "#101214",
        // Subtle borders
        "border-dim": "#13161B",
        "border-dim-2": "#161A20",
      },
      boxShadow: {
        "mint-glow": "0 0 24px rgba(186, 252, 226, 0.25)",
        "mint-glow-sm": "0 0 16px rgba(186, 252, 226, 0.18)",
        "sky-glow": "0 0 28px rgba(198, 239, 255, 0.25)",
        "yellow-glow": "0 0 28px rgba(247, 239, 154, 0.25)",
        "pink-glow": "0 0 28px rgba(249, 168, 212, 0.25)",
        "panel-soft": "0 10px 30px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
