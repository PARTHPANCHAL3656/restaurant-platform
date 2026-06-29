/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-navy": "#1A1F2C",
        "ink-navy": "#1A1F2C",
        "saffron-gold": "#D4AF37",
        "canvas-cream": "#FDFCFB",
        "muted-border": "#E5E1DA",
        "subtle-text": "#5E626E",
        "primary-container": "#1a1f2c",
        "surface-container-low": "#f4f3f2",
        "surface-container-lowest": "#ffffff",
        "background": "#faf9f8",
        "surface": "#faf9f8",
      },
      spacing: {
        "gutter": "24px",
        "section-gap": "120px",
        "margin-mobile": "20px",
        "container-max": "1280px",
        "margin-desktop": "64px",
        "element-gap": "32px",
      },
      fontFamily: {
        "serif": ["Playfair Display", "Georgia", "serif"],
        "sans": ["Hanken Grotesk", "sans-serif"],
        "display-lg": ["Playfair Display", "serif"],
        "headline-md": ["Playfair Display", "serif"],
        "headline-sm": ["Playfair Display", "serif"],
        "body-lg": ["Hanken Grotesk", "sans-serif"],
        "body-md": ["Hanken Grotesk", "sans-serif"],
        "label-caps": ["Hanken Grotesk", "sans-serif"],
        "cta-label": ["Hanken Grotesk", "sans-serif"],
      },
      fontSize: {
        "headline-sm": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "display-lg": ["64px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-md": ["32px", { lineHeight: "40px", fontWeight: "600" }],
        "display-lg-mobile": ["40px", { lineHeight: "48px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "cta-label": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "600" }],
      }
    },
  },
  plugins: [],
}
