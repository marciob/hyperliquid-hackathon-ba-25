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
        // Base surfaces
        base: "#050608",
        surface: "#080A0D",
        "surface-alt": "#0C0F13",
        panel: "#080A0D",
        "panel-2": "#050608",
        // Brand accents
        "brand-mint": "#BAFCE2",
        "brand-sky": "#C6EFFF",
        "brand-yellow": "#F7EF9A",
        "brand-pink": "#F9A8D4",
        "brand-sage": "#D6F3D2",
        // Text neutrals
        "text-main": "#E2F5EE",
        "text-subtle": "#CBD5E1",
        "text-muted": "#94A3B8",
        "text-soft": "#64748B",
        // Borders
        "border-dim": "#64748B80",
      },
      boxShadow: {
        // Glow shadows
        "mint-glow": "0 0 20px rgba(186, 252, 226, 0.35)",
        "sky-glow": "0 0 20px rgba(198, 239, 255, 0.30)",
        "yellow-glow": "0 0 20px rgba(247, 239, 154, 0.35)",
        "pink-glow": "0 0 20px rgba(249, 168, 212, 0.35)",
        "mint-glow-sm": "0 0 10px rgba(186, 252, 226, 0.28)",
        "sky-glow-sm": "0 0 10px rgba(198, 239, 255, 0.24)",
        "yellow-glow-sm": "0 0 10px rgba(247, 239, 154, 0.28)",
        "pink-glow-sm": "0 0 10px rgba(249, 168, 212, 0.28)",
      },
    },
  },
  plugins: [],
} satisfies Config;
