/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        plottrix: {
          bg: '#090713',
          bg2: '#100b20',
          panel: '#151025',
          panel2: '#1b1430',
          panel3: '#231a3d',
          line: 'rgba(203, 183, 255, 0.15)',
          text: '#f4efff',
          muted: '#aaa0c1',
          purple: '#9b63ff',
          purple2: '#c29aff',
          violet: '#6e40d9',
          mint: '#74d9b4',
          gold: '#e9c78c',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', '"IBM Plex Sans Thai"', 'sans-serif'],
        thai: ['"IBM Plex Sans Thai"', '"DM Sans"', 'sans-serif'],
        serif: ['"Noto Serif Thai"', '"Playfair Display"', 'serif'],
        reading: ['"Sarabun"', '"IBM Plex Sans Thai"', 'sans-serif'],
        playfair: ['"Playfair Display"', '"Noto Serif Thai"', 'serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px rgba(155, 99, 255, 0.25)',
        'glow-purple-lg': '0 0 45px rgba(155, 99, 255, 0.35)',
        'glass': '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
