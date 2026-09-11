/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f4f5f9',
          100: '#e6e8f2',
          400: '#5b6394',
          500: '#3d4571',
          600: '#2a3159',
          700: '#1f2547',
          800: '#1b2559',
          900: '#12153a',
        },
        amber: {
          50: '#fdf6ea',
          100: '#faebce',
          300: '#eec37e',
          400: '#e0a458',
          500: '#cc8a3a',
          600: '#a86c28',
        },
        parchment: {
          DEFAULT: '#faf7f1',
          dark: '#f0ead9',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(27,37,89,0.04), 0 8px 24px rgba(27,37,89,0.06)',
        card: '0 2px 8px rgba(27,37,89,0.05)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.95) translateY(4px)' },
          to: { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
};