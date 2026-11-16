/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mavs: {
          bg: '#FAF0E3',
          plum: '#2C1030',
          muted: '#806C80',
          subtle: '#A89AA8',
          pink: '#EC5478',
          'pink-hover': '#D93E62',
          'pink-light': '#FDF2F4',
          'pink-border': 'rgba(236, 84, 120, 0.35)',
          orange: '#FF9B36',
          'orange-hover': '#E88825',
          'orange-light': '#FFF5EB',
          card: 'rgba(255, 255, 255, 0.78)',
          'card-solid': '#FFFFFF',
          border: 'rgba(44, 16, 48, 0.10)',
          'border-strong': 'rgba(44, 16, 48, 0.18)',
        },
        brand: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F9CFD7',
          300: '#F4A2B4',
          400: '#F07A95',
          500: '#EC5478',
          600: '#D93E62',
          700: '#B82849',
          800: '#941B37',
          900: '#751329',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(44, 16, 48, 0.05)',
        'soft-md': '0 8px 30px -4px rgba(44, 16, 48, 0.08)',
        'soft-lg': '0 16px 45px -8px rgba(44, 16, 48, 0.10)',
        'accent': '0 6px 20px 0 rgba(236, 84, 120, 0.30)',
        'accent-orange': '0 6px 20px 0 rgba(255, 155, 54, 0.30)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
