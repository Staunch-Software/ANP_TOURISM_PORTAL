/** @type {import('tailwindcss').Config} */
//
// Colour system -- one palette for every screen.
//   navy   : the government / trust colour (headers, headings, primary text on light)
//   cyan   : the ocean-teal BRAND colour (primary buttons, links, active states).
//            Tailwind's default "cyan" is deliberately replaced so every existing
//            bg-cyan-* / text-cyan-* class in the app picks up the same ramp.
//   sand   : a warm highlight (prices, "filling fast", featured items), used sparingly
//   slate  : neutrals; emerald = success, amber = warning, red = danger (Tailwind defaults)
// Rule of thumb: ONE strong action colour (cyan-700) per view; navy for structure.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#051a30",
          900: "#07203a",
          800: "#0b2f52",
          700: "#134571",
          600: "#1d5a8e",
          500: "#2a73ae",
        },
        cyan: {
          50: "#eefafb",
          100: "#d2f0f3",
          200: "#a6e1e8",
          300: "#6ccad6",
          400: "#33afc1",
          500: "#1596aa",
          600: "#0e7d90",
          700: "#0a6678",
          800: "#09515f",
          900: "#08404b",
          950: "#042b33",
        },
        sand: {
          50: "#fdf8ef",
          100: "#faefd6",
          200: "#f4dcaa",
          300: "#ecc274",
          400: "#e2a53f",
          500: "#cf8a1c",
          600: "#a96b14",
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
