/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'Hind Siliguri', 'sans-serif'],
        bn: ['Hind Siliguri', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: '#FF5722',
        accent: '#FF9800',
      }
    }
  },
  plugins: [],
}
