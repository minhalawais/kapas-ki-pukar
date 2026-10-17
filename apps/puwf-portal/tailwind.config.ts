import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--page-admin)",
        surface: "var(--surface-default)",
        institutional: "var(--institutional-anchor)",
        action: "var(--action-primary)",
        voice: "var(--voice-active)",
        border: "var(--border)",
        ink: "var(--text-primary)",
        muted: "var(--text-secondary)",
        critical: "var(--critical)",
        info: "var(--info)",
        success: "var(--success)",
        warning: "var(--warning)",
        chart1: "var(--chart-1)",
        chart2: "var(--chart-2)",
        chart3: "var(--chart-3)",
        chart4: "var(--chart-4)",
        chart5: "var(--chart-5)",
        chart6: "var(--chart-6)",
      },
      fontFamily: {
        ui: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        urdu: ["var(--font-naskh)", "Noto Naskh Arabic", "serif"],
      },
      borderRadius: {
        control: "8px",
        card: "8px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(23, 35, 30, 0.06)",
      },
      height: {
        control: "36px",
        input: "40px",
      },
      width: {
        sidebar: "232px",
      },
      transitionDuration: {
        fast: "120ms",
        standard: "180ms",
        panel: "240ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
