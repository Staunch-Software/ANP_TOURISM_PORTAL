/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#071a2e",
          800: "#0a2540",
          700: "#123a5e",
          600: "#1c4f7c",
        },
        gov: {
          gold: "#b45309",
        },
        andaman: {
          blue: "#006699",
          deep: "#003366",
          teal: "#008080",
          sand: "#FFF8DC",
          gold: "#D4AF37",
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
