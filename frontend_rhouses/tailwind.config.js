/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#2CA58D",
        "primary-alt": "#2ba692",
        "accent": "#AA4465",
        "neutral-text": "#333745",
        "border-subtle": "#E1E5F2",
        "background-light": "#f8f6f7",
      },
      fontFamily: {
        "display": ["Be Vietnam Pro", "sans-serif"],
        "inter": ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
