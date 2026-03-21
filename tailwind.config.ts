import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        brand: ['Bebas Neue', 'Space Grotesk', 'sans-serif'],
      },
      spacing: {
        'mbd-xs': 'var(--mbd-sp-xs)',
        'mbd-sm': 'var(--mbd-sp-sm)',
        'mbd-md': 'var(--mbd-sp-md)',
        'mbd-lg': 'var(--mbd-sp-lg)',
        'mbd-xl': 'var(--mbd-sp-xl)',
        'mbd-2xl': 'var(--mbd-sp-2xl)',
      },
      borderRadius: {
        'mbd-xs': 'var(--mbd-radius-xs)',
        'mbd-sm': 'var(--mbd-radius-sm)',
        'mbd-md': 'var(--mbd-radius-md)',
        'mbd-lg': 'var(--mbd-radius-lg)',
        'mbd-xl': 'var(--mbd-radius-xl)',
      },
      boxShadow: {
        'mbd-0': 'var(--mbd-shadow-0)',
        'mbd-1': 'var(--mbd-shadow-1)',
        'mbd-2': 'var(--mbd-shadow-2)',
        'mbd-3': 'var(--mbd-shadow-3)',
      },
      fontSize: {
        'mbd-xs': 'var(--mbd-fz-xs)',
        'mbd-sm': 'var(--mbd-fz-sm)',
        'mbd-md': 'var(--mbd-fz-md)',
        'mbd-lg': 'var(--mbd-fz-lg)',
        'mbd-xl': 'var(--mbd-fz-xl)',
      },
      colors: {
        // ── Surface tiers (ink navy depth, not pure black) ──────
        dynasty: {
          base: '#0B1020',    // App background — deep ink navy
          surface: '#0F1930', // Cards, panels — slight warmth
          elevated: '#142447', // Modals, dropdowns, hover states
          overlay: '#1A2D5A',  // Highest elevation — popovers
        },
        // ── Semantic accents ─────────────────────────────────────
        accent: {
          primary: '#f97316',   // Orange — CTAs, active states (KEEP)
          glow: '#fb923c',      // Orange hover/glow
          success: '#22C55E',   // Good outcomes, upgrades
          warning: '#F59E0B',   // Risk, nearing limits
          danger: '#F43F5E',    // Injuries, critical, penalties
          info: '#38BDF8',      // Neutral analytics, FYI
        },
        // ── Text hierarchy ───────────────────────────────────────
        txt: {
          headline: '#F8FAFC',  // Page titles, key outcomes
          body: '#E2E8F0',      // Primary reading
          secondary: '#A7B3C7', // Metadata, secondary columns
          muted: '#64748B',     // Disabled, tertiary
          dim: '#3B4A6B',       // Borders, ultra-subtle
        },
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
