/**
 * MBD Design Tokens — Density
 * Three display density modes for data-heavy views.
 */

export interface DensityConfig {
  readonly rowHeight: string;
  readonly fontSize: string;
  readonly padding: string;
  readonly gap: string;
}

export type DensityMode = 'comfortable' | 'standard' | 'dense';

export const density: Readonly<Record<DensityMode, DensityConfig>> = {
  comfortable: { rowHeight: '48px', fontSize: '14px', padding: '12px 16px', gap: '12px' },
  standard: { rowHeight: '36px', fontSize: '13px', padding: '8px 12px', gap: '8px' },
  dense: { rowHeight: '28px', fontSize: '12px', padding: '4px 8px', gap: '4px' },
} as const;
