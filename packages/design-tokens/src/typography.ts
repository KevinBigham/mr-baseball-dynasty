/**
 * MBD Design Tokens — Typography
 * Three-font system: data (monospace), heading (geometric sans), brand (display).
 */

export const fontFamily = {
  data: "'JetBrains Mono', monospace",
  heading: "'Space Grotesk', sans-serif",
  brand: "'Bebas Neue', sans-serif",
} as const;

export interface FontSizeEntry {
  readonly size: string;
  readonly lineHeight: string;
}

export const fontSize = {
  xs: { size: '0.75rem', lineHeight: '1rem' },
  sm: { size: '0.8125rem', lineHeight: '1.125rem' },
  base: { size: '0.875rem', lineHeight: '1.25rem' },
  lg: { size: '1rem', lineHeight: '1.5rem' },
  xl: { size: '1.125rem', lineHeight: '1.75rem' },
  '2xl': { size: '1.5rem', lineHeight: '2rem' },
  '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
  '4xl': { size: '2.25rem', lineHeight: '2.5rem' },
} as const satisfies Record<string, FontSizeEntry>;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
} as const;

export type FontFamily = keyof typeof fontFamily;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
