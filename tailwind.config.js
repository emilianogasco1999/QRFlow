/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          accent: "#2d2c4a",  // Color principal de acento
          black: "#121212",   // Fondo base
          surface: "#181818", // Tarjetas y contenedores oscuros
          button: "#1f1f1f",  // Fondo de botones oscuros
          card: "#252525",    // Tarjeta elevada
          text: {
            primary: "#ffffff",
            secondary: "#b3b3b3",
            near: "#cbcbcb",
          },
          error: "#f3727f",
        },
      },
      borderRadius: {
        pill: "500px",
        fullPill: "9999px",
      },
    },
  },
  plugins: [],
}
