/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Kayan Design System Colors ──────────────────────────
      colors: {
        kayan: {
          bg:      '#07070E',
          surf:    '#0C0C1A',
          card:    '#111124',
          gold:    '#C9A84C',
          'gold-l':'#EFC95A',
          text:    '#F0EBE0',
          sub:     '#8A8AA8',
          muted:   '#505068',
          border:  'rgba(201,168,76,0.18)',
          'border-dim': 'rgba(255,255,255,0.05)',
          green:   '#22C55E',
          red:     '#EF4444',
          amber:   '#F59E0B',
          indigo:  '#818CF8',
        },
      },
      // ── Typography ──────────────────────────────────────────
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
      },
      // ── Animations ──────────────────────────────────────────
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        pulse2: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '.55', transform: 'scale(.96)' },
        },
        glow: {
          '0%,100%': { boxShadow: '0 0 30px rgba(201,168,76,.04)' },
          '50%':     { boxShadow: '0 0 50px rgba(201,168,76,.16)' },
        },
        notiBounce: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        bgPulse: {
          '0%,100%': { opacity: '.6' },
          '50%':     { opacity: '1' },
        },
      },
      animation: {
        'fade-up':   'fadeUp .45s ease both',
        'fade-in':   'fadeIn .3s ease both',
        shimmer:     'shimmer 5s linear infinite',
        pulse2:      'pulse2 2s ease-in-out infinite',
        glow:        'glow 5s ease-in-out infinite',
        'noti-bounce':'notiBounce .5s ease 3',
        'bg-pulse':  'bgPulse 3s ease-in-out infinite',
      },
      // ── Box shadows ─────────────────────────────────────────
      boxShadow: {
        gold: '0 0 30px rgba(201,168,76,0.15)',
        glass:'0 8px 32px rgba(0,0,0,0.5)',
        card: '0 4px 20px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
