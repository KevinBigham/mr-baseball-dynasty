/**
 * September Call-ups System
 *
 * When rosters expand September 1, teams can call up prospects from
 * the minors. Tracks call-up candidates, role assignments, and
 * the impact of expanded rosters on playoff pushes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CallupRole = 'spot_starter' | 'pinch_hitter' | 'defensive_sub' | 'bullpen_arm' | 'pinch_runner' | 'platoon';

export const ROLE_DISPLAY: Record<CallupRole, { label: string; emoji: string; color: string }> = {
  spot_starter:   { label: 'Spot Starter',    emoji: '🏏', color: '#f97316' },
  pinch_hitter:   { label: 'Pinch Hitter',    emoji: '🎯', color: '#eab308' },
  defensive_sub:  { label: 'Defensive Sub',   emoji: '🧤', color: '#22c55e' },
  bullpen_arm:    { label: 'Bullpen Arm',     emoji: '⚾', color: '#3b82f6' },
  pinch_runner:   { label: 'Pinch Runner',    emoji: '🏃', color: '#06b6d4' },
  platoon:        { label: 'Platoon',         emoji: '🔄', color: '#8b5cf6' },
};

export type CallupStatus = 'candidate' | 'called_up' | 'active' | 'sent_down' | 'on_roster';

export interface CallupCandidate {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  potential: number;
  level: string;       // AAA, AA, etc.
  minorStats: { avg?: string; era?: string; hr?: number; sb?: number; k?: number; ip?: number };
  suggestedRole: CallupRole;
  status: CallupStatus;
  serviceTimeDays: number;
  optionsRemaining: number;
  impactRating: number;  // 1-10 projected impact
}

export interface CallupSummary {
  rosterSize: number;
  maxRoster: number;      // 26 normally, 28 in September
  calledUp: number;
  candidates: number;
  contending: boolean;
  gamesRemaining: number;
  gamesBack: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function callUp(player: CallupCandidate): CallupCandidate {
  return { ...player, status: 'called_up' };
}

export function sendDown(player: CallupCandidate): CallupCandidate {
  return { ...player, status: 'sent_down' };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const PROSPECT_DATA = [
  { name: 'Jackson Merrill', pos: 'CF', age: 21, ovr: 68, pot: 85, level: 'AAA', role: 'spot_starter' as CallupRole, stats: { avg: '.298', hr: 18, sb: 22 } },
  { name: 'Kyle Manzardo', pos: '1B', age: 24, ovr: 66, pot: 78, level: 'AAA', role: 'pinch_hitter' as CallupRole, stats: { avg: '.285', hr: 22, sb: 2 } },
  { name: 'Chase Burns', pos: 'SP', age: 22, ovr: 64, pot: 82, level: 'AAA', role: 'bullpen_arm' as CallupRole, stats: { era: '3.12', k: 145, ip: 128 } },
  { name: 'Termarr Johnson', pos: '2B', age: 21, ovr: 62, pot: 80, level: 'AA', role: 'pinch_runner' as CallupRole, stats: { avg: '.265', hr: 12, sb: 28 } },
  { name: 'Noble Meyer', pos: 'SP', age: 21, ovr: 60, pot: 84, level: 'AAA', role: 'bullpen_arm' as CallupRole, stats: { era: '3.45', k: 112, ip: 105 } },
  { name: 'Walker Jenkins', pos: 'RF', age: 20, ovr: 58, pot: 86, level: 'AA', role: 'defensive_sub' as CallupRole, stats: { avg: '.272', hr: 15, sb: 18 } },
  { name: 'Kevin McGonigle', pos: 'SS', age: 23, ovr: 65, pot: 74, level: 'AAA', role: 'defensive_sub' as CallupRole, stats: { avg: '.258', hr: 8, sb: 14 } },
  { name: 'Tink Hence', pos: 'RP', age: 22, ovr: 63, pot: 76, level: 'AAA', role: 'bullpen_arm' as CallupRole, stats: { era: '2.88', k: 78, ip: 62 } },
  { name: 'Coby Mayo', pos: '3B', age: 22, ovr: 67, pot: 80, level: 'AAA', role: 'platoon' as CallupRole, stats: { avg: '.290', hr: 24, sb: 5 } },
  { name: 'Cade Horton', pos: 'SP', age: 23, ovr: 65, pot: 78, level: 'AAA', role: 'spot_starter' as CallupRole, stats: { era: '3.28', k: 138, ip: 120 } },
];

export function generateDemoCallups(): CallupCandidate[] {
  return PROSPECT_DATA.map((p, i) => ({
    id: i,
    name: p.name,
    pos: p.pos,
    age: p.age,
    overall: p.ovr,
    potential: p.pot,
    level: p.level,
    minorStats: p.stats,
    suggestedRole: p.role,
    status: i < 2 ? 'called_up' : 'candidate',
    serviceTimeDays: 40 + (i * 15) % 130,
    optionsRemaining: 3 - (i % 3),
    impactRating: Math.min(10, Math.max(1, Math.round((p.ovr - 55) / 3))),
  }));
}

export function getCallupSummary(candidates: CallupCandidate[]): CallupSummary {
  return {
    rosterSize: 26,
    maxRoster: 28,
    calledUp: candidates.filter(c => c.status === 'called_up').length,
    candidates: candidates.filter(c => c.status === 'candidate').length,
    contending: true,
    gamesRemaining: 28,
    gamesBack: 2.5,
  };
}
