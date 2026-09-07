import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        surface: "#FFFFFF",
        "surface-alt": "#F5F7F9",
        border: "#E2E8ED",

        // Text
        ink: "#0B1D2E",
        "ink-muted": "#5B6B78",

        // Antarctic / oceanic accent scale
        navy: {
          950: "#050B14",
          900: "#0A1622",
          800: "#0F2033",
          700: "#16324A",
          600: "#1E4560",
        },
        ice: {
          50: "#F0F7FB",
          100: "#DCEDF6",
          200: "#B8DBED",
          300: "#8FC6E0",
          400: "#5FA9CC",
          500: "#3A8AB0",
          600: "#2A6D8F",
        },

        // Status / severity
        danger: "#C4453A",
        warn: "#D69A2D",
        safe: "#2F8F5B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        // Deliberately flat — no soft/glassmorphic shadows in the palette
        crisp: "0 1px 0 0 #E2E8ED",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

export default config;