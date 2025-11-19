/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          red: '#ff0055',
          blue: '#00f3ff',
          green: '#00ff9d',
          yellow: '#fcee0a',
        },
        bg: {
          dark: '#050505',
        }
      },
      fontFamily: {
        mono: ['Orbitron', 'monospace'], // 建议在 _app.js 中引入 Google Fonts
      }
    },
  },
  plugins: [],
}
