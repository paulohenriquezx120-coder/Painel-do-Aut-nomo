/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1f1e',
        brand: {
          50: '#eef4f3',
          100: '#d8e6e3',
          200: '#b3cdc8',
          300: '#89b1a9',
          400: '#5f958a',
          500: '#3f7a6e',
          600: '#2c5f56',
          700: '#1e4d4a',
          800: '#173d3b',
          900: '#122f2d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
