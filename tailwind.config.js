/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#05050d',
        surface: '#0b0b17',
        panel: '#0e0e1c',
        panel2: '#111122',
        border: '#161628',
        border2: '#1f1f36',
        accent: '#00f0ff',
        violet: '#7c3aed',
        amber: '#f59e0b',
        muted: '#4a4a72',
        faint: '#1c1c30',
        green: '#00ffaa',
        pink: '#f472b6',
        orange: '#fb923c',
        red: '#f87171',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 240, 255, 0.35), 0 0 20px rgba(124, 58, 237, 0.15)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
