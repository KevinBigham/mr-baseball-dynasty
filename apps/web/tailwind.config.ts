import type { Config } from 'tailwindcss';
import { tailwindPreset } from '@mbd/design-tokens';

export default {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [tailwindPreset],
} satisfies Config;
