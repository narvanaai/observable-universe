/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // CivicOS palette — serious civic infrastructure, not startup pastels
        navy: {
          50: "#f0f3f9",
          100: "#dae1f0",
          200: "#b3c3e1",
          300: "#8da5d2",
          400: "#6687c3",
          500: "#3d5a8a",
          600: "#1a2e52",
          700: "#142442",
          800: "#0f1b32",
          900: "#0a1222",
          950: "#050911",
        },
        civic: {
          red: "#DC2626", // alerts, ignored status
          green: "#16A34A", // resolved, good grades
          amber: "#D97706", // in progress, warnings
          blue: "#1a2e52", // primary navy
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
