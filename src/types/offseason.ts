/** Offseason phase progression types */

export type OffseasonPhase =
  | 'arbitration'
  | 'waivers'
  | 'annual_draft'
  | 'rule5'
  | 'intl_signing'
  | 'free_agency'
  | 'extensions'
  | 'trading'
  | 'summary';

export const OFFSEASON_PHASE_ORDER: OffseasonPhase[] = [
  'arbitration',
  'waivers',
  'annual_draft',
  'rule5',
  'intl_signing',
  'free_agency',
  'extensions',
  'trading',
  'summary',
];

export const OFFSEASON_PHASE_LABELS: Record<OffseasonPhase, string> = {
  arbitration: 'Arbitration',
  waivers: 'Waiver Wire',
  annual_draft: 'Amateur Draft',
  rule5: 'Rule 5 Draft',
  intl_signing: 'Intl Signing',
  free_agency: 'Free Agency',
  extensions: 'Extensions',
  trading: 'Trade Center',
  summary: 'Offseason Summary',
};

/** Worker-internal coaching staff (distinct from team.CoachingStaff). */
export type { CoachingStaff } from './team';

/** Draft pick record. */
export interface DraftPick {
  playerId: number;
  playerName: string;
  teamId: number;
  round: number;
  pick: number;
  position: string;
  type: string;
}

/** Season offseason recap summary. */
export interface OffseasonRecap {
  season: number;
  retirements: number[];
  faSignings: Array<{ playerId: number; teamId: number; years: number; annualSalary: number }>;
  rule5Picks: Array<{ playerId: number; selectingTeamId: number }>;
  draftResult: { picks: DraftPick[] };
}

export type TeamStrategy = import('./team').TeamStrategy;
