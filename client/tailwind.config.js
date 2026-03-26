/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#1a1a2e',
          surface: '#16213e',
          border: '#0f3460',
          accent: '#533483',
          highlight: '#e94560',
          text: '#eaeaea',
          muted: '#8892a4',
        },
      },
      boxShadow: {
        'block': '0 2px 8px rgba(0,0,0,0.3)',
        'block-selected': '0 0 0 2px #533483, 0 4px 12px rgba(83,52,131,0.3)',
        'chat': '0 8px 32px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
