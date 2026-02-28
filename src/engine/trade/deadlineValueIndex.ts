/**
 * deadlineValueIndex.ts – Trade Deadline Value Index
 *
 * Evaluates player trade value specifically around the trade deadline.
 * Factors in contract status, team contention status, positional scarcity,
 * and recent performance to produce a deadline-specific trade value.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ContractStatus = 'rental' | 'controlled' | 'extension_candidate';
export type ContenderStatus = 'buyer' | 'seller' | 'on_fence';

export interface DeadlineAsset {
  playerId: number;
  name: string;
  position: string;
  age: number;
  contractStatus: ContractStatus;
  currentWAR: number;
  deadlineValue: number;
  scarcityBonus: number;
  recentPerformance: number;
  projectedReturn: string;
}

export interface TeamDeadlineProfile {
  teamId: string;
  teamName: string;
  status: ContenderStatus;
  record: string;
  gamesBack: number;
  assets: DeadlineAsset[];
  totalDeadlineValue: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export const STATUS_DISPLAY: Record<ContenderStatus, { label: string; color: string }> = {
  buyer:    { label: 'BUYER',    color: '#22c55e' },
  seller:   { label: 'SELLER',   color: '#ef4444' },
  on_fence: { label: 'ON FENCE', color: '#f59e0b' },
};

export const CONTRACT_DISPLAY: Record<ContractStatus, { label: string; color: string }> = {
  rental:               { label: 'RENTAL',    color: '#f97316' },
  controlled:           { label: 'CTRL',      color: '#22c55e' },
  extension_candidate:  { label: 'EXT CAND',  color: '#3b82f6' },
};

export function getDeadlineValueColor(value: number): string {
  if (value >= 80) return '#22c55e';
  if (value >= 60) return '#4ade80';
  if (value >= 40) return '#f59e0b';
  if (value >= 20) return '#f97316';
  return '#ef4444';
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoDeadlineIndex(): TeamDeadlineProfile[] {
  return [
    {
      teamId: 'COL', teamName: 'Colorado Rockies', status: 'seller', record: '36-76', gamesBack: 28,
      totalDeadlineValue: 285,
      assets: [
        { playerId: 1, name: 'Ryan McMahon', position: '3B', age: 29, contractStatus: 'controlled', currentWAR: 2.8, deadlineValue: 72, scarcityBonus: 12, recentPerformance: 68, projectedReturn: 'Top-100 prospect + lottery ticket' },
        { playerId: 2, name: 'Cal Quantrill', position: 'SP', age: 29, contractStatus: 'rental', currentWAR: 1.5, deadlineValue: 48, scarcityBonus: 15, recentPerformance: 55, projectedReturn: 'Mid-tier prospect' },
        { playerId: 3, name: 'Elias Diaz', position: 'C', age: 33, contractStatus: 'rental', currentWAR: 1.2, deadlineValue: 35, scarcityBonus: 20, recentPerformance: 52, projectedReturn: 'Low-tier prospect or roster player' },
      ],
    },
    {
      teamId: 'CHW', teamName: 'Chicago White Sox', status: 'seller', record: '34-78', gamesBack: 32,
      totalDeadlineValue: 320,
      assets: [
        { playerId: 4, name: 'Garrett Crochet', position: 'SP', age: 25, contractStatus: 'controlled', currentWAR: 3.5, deadlineValue: 92, scarcityBonus: 18, recentPerformance: 85, projectedReturn: 'Multi-prospect haul including Top-50' },
        { playerId: 5, name: 'Luis Robert Jr.', position: 'CF', age: 26, contractStatus: 'extension_candidate', currentWAR: 2.1, deadlineValue: 78, scarcityBonus: 10, recentPerformance: 60, projectedReturn: 'Premium package, health-dependent' },
        { playerId: 6, name: 'Erick Fedde', position: 'SP', age: 31, contractStatus: 'rental', currentWAR: 2.0, deadlineValue: 55, scarcityBonus: 15, recentPerformance: 72, projectedReturn: 'Solid mid-tier prospect' },
      ],
    },
    {
      teamId: 'MIA', teamName: 'Miami Marlins', status: 'seller', record: '40-72', gamesBack: 22,
      totalDeadlineValue: 195,
      assets: [
        { playerId: 7, name: 'Tanner Scott', position: 'RP', age: 29, contractStatus: 'rental', currentWAR: 1.8, deadlineValue: 62, scarcityBonus: 22, recentPerformance: 78, projectedReturn: 'Top-10 org prospect + extra' },
        { playerId: 8, name: 'Josh Bell', position: '1B', age: 31, contractStatus: 'rental', currentWAR: 0.8, deadlineValue: 28, scarcityBonus: 5, recentPerformance: 45, projectedReturn: 'Minor league depth piece' },
      ],
    },
    {
      teamId: 'LAD', teamName: 'Los Angeles Dodgers', status: 'buyer', record: '72-40', gamesBack: 0,
      totalDeadlineValue: 0,
      assets: [],
    },
    {
      teamId: 'KC', teamName: 'Kansas City Royals', status: 'on_fence', record: '54-58', gamesBack: 6,
      totalDeadlineValue: 90,
      assets: [
        { playerId: 9, name: 'Michael Lorenzen', position: 'SP', age: 32, contractStatus: 'rental', currentWAR: 0.5, deadlineValue: 30, scarcityBonus: 10, recentPerformance: 40, projectedReturn: 'Low-level prospect' },
        { playerId: 10, name: 'Nick Pratto', position: '1B', age: 25, contractStatus: 'controlled', currentWAR: 0.3, deadlineValue: 22, scarcityBonus: 3, recentPerformance: 35, projectedReturn: 'Change of scenery swap' },
      ],
    },
  ];
}
