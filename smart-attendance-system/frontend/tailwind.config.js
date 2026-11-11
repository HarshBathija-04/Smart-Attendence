/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: token("paper"),
        surface: token("surface"),
        sunken: token("sunken"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        brand: { DEFAULT: token("brand"), strong: token("brand-strong"), soft: token("brand-soft") },
        accent: { DEFAULT: token("accent"), ink: token("accent-ink"), soft: token("accent-soft") },
        present: { DEFAULT: token("present"), soft: token("present-soft") },
        late: { DEFAULT: token("late"), soft: token("late-soft") },
        absent: { DEFAULT: token("absent"), soft: token("absent-soft") },
      },
      fontFamily: {
        sans: ['"Instrument Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        card: "0 1px 0 rgb(var(--ink) / 0.04), 0 1px 3px rgb(var(--ink) / 0.06)",
        raised: "0 1px 2px rgb(var(--ink) / 0.06), 0 8px 24px -6px rgb(var(--ink) / 0.14)",
        focus: "0 0 0 3px rgb(var(--brand) / 0.28)",
      },
      keyframes: {
        scan: { "0%,100%": { top: "6%" }, "50%": { top: "92%" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        scan: "scan 2.8s ease-in-out infinite",
        shimmer: "shimmer 1.4s infinite",
      },
    },
  },
  plugins: [],
};
