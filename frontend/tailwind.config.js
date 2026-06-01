/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          dark: {
            400: '#5eead4',
            500: '#2dd4bf',
            600: '#14b8a6',
          }
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        sepia: {
          50: '#faf6f0',
          100: '#f0e8d8',
          200: '#e0d4c0',
          300: '#d0c0a8',
          400: '#b8a490',
          500: '#a08a74',
          600: '#887058',
          700: '#6a5540',
          800: '#4a3d30',
          900: '#2f261e',
          950: '#1a1410',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
