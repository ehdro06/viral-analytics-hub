import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  // hover: styles only on devices that can hover (no sticky hover on touch)
  future: { hoverOnlyWhenSupported: true },
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      // Role scale: page title, section title, big metric, metric, body, meta
      fontSize: {
        "page-title": ["1.75rem", { lineHeight: "2.125rem", letterSpacing: "-0.015em", fontWeight: "600" }],
        "section-title": ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        "metric-xl": ["3.5rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "600" }],
        metric: ["1.625rem", { lineHeight: "2rem", letterSpacing: "-0.015em", fontWeight: "600" }],
        meta: ["0.8125rem", { lineHeight: "1.25rem" }],
      },
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--primary) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        surface: "oklch(var(--surface) / <alpha-value>)",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        // shadcn names kept so existing primitives compile; they map onto the same few tokens
        secondary: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--surface) / <alpha-value>)",
          foreground: "oklch(var(--foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--surface) / <alpha-value>)",
          foreground: "oklch(var(--foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--danger) / <alpha-value>)",
          foreground: "oklch(var(--danger-foreground) / <alpha-value>)",
        },
        // Status: never the only signal, always next to a word
        status: {
          live: "oklch(var(--live) / <alpha-value>)",
          paused: "oklch(var(--paused) / <alpha-value>)",
          danger: "oklch(var(--danger) / <alpha-value>)",
        },
        "chart-grid": "oklch(var(--chart-grid) / <alpha-value>)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-md)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
      transitionDuration: {
        250: "250ms",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms cubic-bezier(0.23, 1, 0.32, 1)",
        "accordion-up": "accordion-up 200ms cubic-bezier(0.23, 1, 0.32, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
