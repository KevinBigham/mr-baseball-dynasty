import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [
    function({ addBase }: { addBase: (styles: Record<string, Record<string, string>>) => void }) {
      addBase({
        'button:focus-visible, a:focus-visible, select:focus-visible, [role="button"]:focus-visible': {
          outline: 'none',
          'box-shadow': '0 0 0 2px rgb(249 115 22)',
        },
      });
    },
  ],
} satisfies Config;
