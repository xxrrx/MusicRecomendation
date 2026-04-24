/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Spotify-inspired dark palette ──────────────────────────────────
        sp: {
          black:   '#0a0a0a', // page background
          dark:    '#121212', // main content bg
          card:    '#181818', // card surfaces
          hover:   '#282828', // hover states
          border:  '#2a2a2a', // subtle separators
          green:   '#1DB954', // primary accent
          'green-light': '#1ed760', // hover accent
          gray:    '#b3b3b3', // secondary text
          'gray-dark': '#6a6a6a', // muted text
          player:  '#181818', // player bar bg
        },
      },
      borderRadius: {
        // Design-system radii
        card:   '12px',
        'card-lg': '16px',
        pill:   '9999px',
      },
      boxShadow: {
        card:   '0 4px 24px rgba(0,0,0,0.4)',
        player: '0 -4px 32px rgba(0,0,0,0.6)',
        modal:  '0 8px 48px rgba(0,0,0,0.7)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      keyframes: {
        // Subtle equaliser bars used on the playing indicator
        bar1: { '0%,100%': { height: '8px' }, '50%': { height: '16px' } },
        bar2: { '0%,100%': { height: '16px' }, '50%': { height: '6px' } },
        bar3: { '0%,100%': { height: '10px' }, '50%': { height: '18px' } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        bar1:   'bar1 0.8s ease-in-out infinite',
        bar2:   'bar2 0.8s ease-in-out infinite 0.15s',
        bar3:   'bar3 0.8s ease-in-out infinite 0.3s',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
