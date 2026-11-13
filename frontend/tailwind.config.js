export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f2f7ff', 100: '#e4efff', 200: '#c8dcff', 300: '#9fc2ff', 400: '#6ea0fb', 500: '#1a62e8', 600: '#1450c4', 700: '#12409c', 900: '#0b2766', 950: '#081c4d' },
        sehat: '#10b5a0',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: { soft: '0 10px 30px -12px rgba(26,98,232,.25)', card: '0 4px 18px -6px rgba(11,39,102,.14)' },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'none' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(16,181,160,.5)' }, '100%': { boxShadow: '0 0 0 10px rgba(16,181,160,0)' } },
      },
      animation: { 'fade-up': 'fade-up .5s ease-out both', 'fade-in': 'fade-in .4s ease-out both', float: 'float 6s ease-in-out infinite', ring: 'pulseRing 1.8s ease-out infinite' },
    },
  },
  plugins: [],
}
