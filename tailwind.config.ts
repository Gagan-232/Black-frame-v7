import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#000000', charcoal: '#0d0d0d', panel: '#141414', line: '#2a2a2a', bone: '#f2f2f2', mute: '#8a8a8a', blood: '#8b2a2a' },
      fontFamily: { serif: ['var(--font-serif)', 'Georgia', 'serif'], sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
