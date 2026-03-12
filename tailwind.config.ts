import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
