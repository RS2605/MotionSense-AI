module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        body: ['"Manrope"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        sky: {
          light: "#e0f2fe",
          soft: "#bae6fd",
          bright: "#38bdf8",
          deep: "#0284c7",
          ink: "#0c4a6e",
        },
        sunlight: "#fbbf24",
        peach: "#fed7aa",
        violet: {
          soft: "#c4b5fd",
          bright: "#8b5cf6",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        cloudDriftSlow: {
          "0%":   { transform: "translateX(-15%)" },
          "100%": { transform: "translateX(115%)" },
        },
        cloudDriftMed: {
          "0%":   { transform: "translateX(-20%)" },
          "100%": { transform: "translateX(120%)" },
        },
        cloudDriftFast: {
          "0%":   { transform: "translateX(-25%)" },
          "100%": { transform: "translateX(125%)" },
        },
        sunGlow: {
          "0%, 100%": { opacity: "0.85", transform: "scale(1)" },
          "50%":       { opacity: "1",    transform: "scale(1.03)" },
        },
        floatParticle: {
          "0%":   { transform: "translateY(0) translateX(0)", opacity: "0" },
          "10%":  { opacity: "0.8" },
          "90%":  { opacity: "0.8" },
          "100%": { transform: "translateY(-100vh) translateX(60px)", opacity: "0" },
        },
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.5" },
          "50%":       { opacity: "1" },
        },
        signalWave: {
          "0%":   { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "cloud-slow":  "cloudDriftSlow 90s linear infinite",
        "cloud-med":   "cloudDriftMed 60s linear infinite",
        "cloud-fast":  "cloudDriftFast 45s linear infinite",
        "sun-glow":    "sunGlow 6s ease-in-out infinite",
        "float":       "floatParticle 12s linear infinite",
        "fade-in-up":  "fadeInUp 0.7s ease-out both",
        "pulse-soft":  "pulseSoft 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
