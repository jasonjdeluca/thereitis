/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0A1628",
        "navy-2": "#0F1E36",
        gold: "#D4AF37",
        "gold-bright": "#F2C94C",
        cream: "#F5EFE0",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 24px rgba(212, 175, 55, 0.45)",
        "gold-strong": "0 0 32px rgba(242, 201, 76, 0.85)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
        check: {
          "0%": { transform: "scale(0) rotate(-15deg)", opacity: "0" },
          "60%": { transform: "scale(1.2) rotate(8deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0)", opacity: "1" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(212,175,55,0.55)" },
          "50%": { boxShadow: "0 0 36px rgba(242,201,76,1)" },
        },
        nearmiss: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,175,55,0)" },
          "50%": { boxShadow: "0 0 0 4px rgba(212,175,55,0.55)" },
        },
        toastIn: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        celebrate: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "40%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        undoIn: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        undoOut: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-10px)", opacity: "0" },
        },
        badgeIn: {
          "0%": { transform: "translateY(20px) scale(0.8)", opacity: "0" },
          "60%": { transform: "translateY(-4px) scale(1.05)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        goldBurst: {
          "0%": { boxShadow: "0 0 0 0 rgba(212,175,55,0.8)" },
          "50%": { boxShadow: "0 0 20px 8px rgba(212,175,55,0.6)" },
          "100%": { boxShadow: "0 0 0 0 rgba(212,175,55,0)" },
        },
        pulseSubtle: {
          "0%, 100%": { borderColor: "rgba(168,85,247,0.3)" },
          "50%": { borderColor: "rgba(168,85,247,0.7)" },
        },
        countdownShrink: {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
      },
      animation: {
        pop: "pop 200ms ease-out",
        check: "check 360ms cubic-bezier(.2,.9,.3,1.2) forwards",
        glow: "glow 1.4s ease-in-out infinite",
        nearmiss: "nearmiss 1.6s ease-in-out infinite",
        toastIn: "toastIn 220ms ease-out",
        celebrate: "celebrate 600ms cubic-bezier(.2,.9,.3,1.2)",
        undoIn: "undoIn 220ms ease-out",
        undoOut: "undoOut 300ms ease-in forwards",
        badgeIn: "badgeIn 500ms cubic-bezier(.2,.9,.3,1.2) both",
        goldBurst: "goldBurst 600ms ease-out",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
