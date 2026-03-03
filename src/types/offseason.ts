/** Offseason phase progression types */

export type OffseasonPhase =
  | 'arbitration'
  | 'waivers'
  | 'annual_draft'
  | 'rule5'
  | 'free_agency'
  | 'trading'
  | 'summary';

export const OFFSEASON_PHASE_ORDER: OffseasonPhase[] = [
  'arbitration',
  'waivers',
  'annual_draft',
  'rule5',
  'free_agency',
  'trading',
  'summary',
];

export const OFFSEASON_PHASE_LABELS: Record<OffseasonPhase, string> = {
  arbitration: 'Arbitration',
  waivers: 'Waiver Wire',
  annual_draft: 'Amateur Draft',
  rule5: 'Rule 5 Draft',
  free_agency: 'Free Agency',
  trading: 'Trade Center',
  summary: 'Offseason Summary',
};
