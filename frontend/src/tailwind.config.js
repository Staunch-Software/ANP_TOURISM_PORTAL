/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: { DEFAULT: '#053A5E', light: '#0A5C8F' },
        turquoise: { DEFAULT: '#12B0BC', light: '#38D6DE' },
        sea: '#0E8F6F',
        sand: { DEFAULT: '#FBF6EC', deep: '#F3E9D7' },
        coral: { DEFAULT: '#FF6B4A', light: '#FF8A6B' },
        ink: '#10222F',
        muted: '#5C7182',
        line: '#E3EBF1',
      },
      fontFamily: {
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '18px', xl3: '26px' },
    },
  },
  plugins: [],
};
