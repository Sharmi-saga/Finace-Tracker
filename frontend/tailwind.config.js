/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        income: {
          DEFAULT: '#10b981',
          light: '#ecfdf5',
          dark: '#059669',
        },
        expense: {
          DEFAULT: '#ef4444',
          light: '#fef2f2',
          dark: '#dc2626',
        },
        transfer: {
          DEFAULT: '#3b82f6',
          light: '#eff6ff',
          dark: '#2563eb',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'soft': '0 4px 20px -2px rgba(124, 58, 237, 0.06)',
      }
    },
  },
  plugins: [],
}
