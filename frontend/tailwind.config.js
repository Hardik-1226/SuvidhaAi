/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy for CTAs, text, hero
        primary: {
          50:  '#eef1f9',
          100: '#d5dcf0',
          200: '#aab8e2',
          300: '#7f95d3',
          400: '#5471c5',
          500: '#3a56b0',
          600: '#2c4191',
          700: '#1f2f6e',
          800: '#141e4d',
          900: '#0b1230',
          950: '#060b1e',
        },
        // Warm accent — dusty rose/mauve
        accent: {
          100: '#f5dee8',
          200: '#e9bcd2',
          300: '#d9a0bc',
          400: '#c47ea2',
          500: '#ab5a87',
          600: '#8e3f6d',
        },
        // Light background surfaces matching the cream palette
        surface: {
          DEFAULT: '#f4f1eb',   // warm cream
          card: '#fefcf8',      // almost white with warmth
          border: '#ddd8cc',    // muted warm border
          dark: '#0d1535',      // deep navy for sections
        },
      },
      fontFamily: {
        sans: ['Arvo', 'serif'],
        mono: ['"Courier New"', 'monospace'],
        display: ['"Courier New"', 'monospace'],
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #0d1535 0%, #1a2a5e 100%)',
        'gradient-primary': 'linear-gradient(135deg, #2c4191 0%, #3a56b0 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(254,252,248,0.95) 0%, rgba(244,241,235,0.9) 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f4f1eb 0%, #ebe6dd 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      boxShadow: {
        glow: '0 0 24px rgba(42, 65, 145, 0.2)',
        'glow-accent': '0 0 20px rgba(171, 90, 135, 0.25)',
        card: '0 4px 24px rgba(13, 21, 53, 0.08), 0 1px 4px rgba(13, 21, 53, 0.05)',
        'card-hover': '0 8px 32px rgba(13, 21, 53, 0.14), 0 2px 8px rgba(13, 21, 53, 0.08)',
      },
    },
  },
  plugins: [],
};
