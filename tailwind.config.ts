/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Hind Siliguri', 'sans-serif'],
        bn: ['Hind Siliguri', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          1: '#FF4500',
          2: '#FF7A00',
          3: '#FFB347',
        },
        success: '#00D68F',
        danger: '#FF3B5C',
        warning: '#FFB800',
      },
    },
  },
  plugins: [],
}
