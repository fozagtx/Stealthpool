const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "gradient-shift": "gradient-shift 8s ease infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "particle-drift": "particle-drift 20s linear infinite",
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", filter: "blur(80px)" },
          "50%": { opacity: "0.8", filter: "blur(60px)" },
        },
        "particle-drift": {
          "0%": { transform: "translate(0, 0) scale(1)", opacity: "0.3" },
          "25%": { transform: "translate(100px, -50px) scale(1.2)", opacity: "0.5" },
          "50%": { transform: "translate(200px, 0px) scale(0.8)", opacity: "0.2" },
          "75%": { transform: "translate(100px, 50px) scale(1.1)", opacity: "0.4" },
          "100%": { transform: "translate(0, 0) scale(1)", opacity: "0.3" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};
