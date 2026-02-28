/**
 * Draft Capital Tracker
 *
 * Manages draft pick portfolio across multiple years.
 * Tracks pick origins (own vs acquired), trade value,
 * slot values, and historical selections.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PickOrigin = 'own' | 'acquired' | 'comp' | 'competitive_balance';
export type PickRound = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type PickTier = 'premium' | 'high' | 'mid' | 'low' | 'flier';

export const TIER_DISPLAY: Record<PickTier, { label: string; color: string }> = {
  premium: { label: 'Premium',   color: '#22c55e' },
  high:    { label: 'High',      color: '#3b82f6' },
  mid:     { label: 'Mid',       color: '#eab308' },
  low:     { label: 'Low',       color: '#f97316' },
  flier:   { label: 'Flier',     color: '#888' },
};

export interface DraftPick {
  id: number;
  year: number;
  round: PickRound;
  overallSlot: number | null;   // null if not yet known
  origin: PickOrigin;
  fromTeam: string;             // team pick originally belongs to
  slotValue: number | null;     // $ slot value (null if not set)
  tier: PickTier;
  isOwned: boolean;             // do we own it or have we traded it
  tradedTo: string | null;      // team we traded to
  notes: string;
}

export interface HistoricalPick {
  year: number;
  round: number;
  overall: number;
  playerName: string;
  pos: string;
  currentLevel: string;
  currentGrade: string;          // e.g. "Rising A+ prospect"
}

export interface DraftCapitalData {
  ownedPicks: DraftPick[];
  tradedAwayPicks: DraftPick[];
  historicalPicks: HistoricalPick[];
  totalOwnedValue: number;       // estimated total pick value $
  picksIn5Years: number;
  premiumPickCount: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getPickTier(round: number, overallSlot: number | null): PickTier {
  if (round === 1 && overallSlot !== null && overallSlot <= 10) return 'premium';
  if (round === 1) return 'high';
  if (round <= 3) return 'mid';
  if (round <= 5) return 'low';
  return 'flier';
}

export function estimateSlotValue(round: number, overall: number): number {
  if (round === 1 && overall <= 10) return 5.5 - (overall * 0.3);
  if (round === 1) return 3.0 - ((overall - 10) * 0.06);
  if (round === 2) return 1.2 - ((overall - 30) * 0.02);
  if (round <= 5) return 0.5;
  return 0.2;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoDraftCapital(): DraftCapitalData {
  const owned: DraftPick[] = [
    { id: 0, year: 2025, round: 1, overallSlot: 15, origin: 'own', fromTeam: 'OUR', slotValue: 4.2, tier: 'high', isOwned: true, tradedTo: null, notes: 'Our 1st — protected top-10' },
    { id: 1, year: 2025, round: 1, overallSlot: 28, origin: 'acquired', fromTeam: 'NYY', slotValue: 2.8, tier: 'high', isOwned: true, tradedTo: null, notes: 'Acquired from NYY in Soto trade' },
    { id: 2, year: 2025, round: 2, overallSlot: 45, origin: 'own', fromTeam: 'OUR', slotValue: 1.0, tier: 'mid', isOwned: true, tradedTo: null, notes: '' },
    { id: 3, year: 2025, round: 3, overallSlot: 75, origin: 'own', fromTeam: 'OUR', slotValue: 0.5, tier: 'mid', isOwned: true, tradedTo: null, notes: '' },
    { id: 4, year: 2025, round: 1, overallSlot: null, origin: 'comp', fromTeam: 'OUR', slotValue: null, tier: 'high', isOwned: true, tradedTo: null, notes: 'Comp pick — QO to departed FA' },
    { id: 5, year: 2026, round: 1, overallSlot: null, origin: 'own', fromTeam: 'OUR', slotValue: null, tier: 'high', isOwned: true, tradedTo: null, notes: '' },
    { id: 6, year: 2026, round: 2, overallSlot: null, origin: 'own', fromTeam: 'OUR', slotValue: null, tier: 'mid', isOwned: true, tradedTo: null, notes: '' },
    { id: 7, year: 2026, round: 1, overallSlot: null, origin: 'acquired', fromTeam: 'CWS', slotValue: null, tier: 'premium', isOwned: true, tradedTo: null, notes: 'CWS likely top-5 pick' },
    { id: 8, year: 2027, round: 1, overallSlot: null, origin: 'own', fromTeam: 'OUR', slotValue: null, tier: 'high', isOwned: true, tradedTo: null, notes: '' },
    { id: 9, year: 2027, round: 2, overallSlot: null, origin: 'own', fromTeam: 'OUR', slotValue: null, tier: 'mid', isOwned: true, tradedTo: null, notes: '' },
  ];

  const tradedAway: DraftPick[] = [
    { id: 10, year: 2025, round: 4, overallSlot: 105, origin: 'own', fromTeam: 'OUR', slotValue: 0.4, tier: 'low', isOwned: false, tradedTo: 'ARI', notes: 'Sent in Chafin deal' },
    { id: 11, year: 2026, round: 3, overallSlot: null, origin: 'own', fromTeam: 'OUR', slotValue: null, tier: 'mid', isOwned: false, tradedTo: 'DET', notes: 'Sent in Skubal deal' },
  ];

  const history: HistoricalPick[] = [
    { year: 2024, round: 1, overall: 12, playerName: 'Konnor Griffin', pos: 'SS', currentLevel: 'A', currentGrade: 'Rising A prospect — FV 55' },
    { year: 2024, round: 2, overall: 42, playerName: 'Tyler Locklear', pos: '1B', currentLevel: 'A+', currentGrade: 'Steady A+ prospect — FV 45' },
    { year: 2023, round: 1, overall: 8, playerName: 'Walker Jenkins', pos: 'OF', currentLevel: 'AA', currentGrade: 'Rising AA prospect — FV 60' },
    { year: 2023, round: 2, overall: 38, playerName: 'Colin Houck', pos: 'SS', currentLevel: 'A+', currentGrade: 'Stalling A+ — FV 40' },
    { year: 2022, round: 1, overall: 5, playerName: 'Druw Jones', pos: 'CF', currentLevel: 'AA', currentGrade: 'Rising AA prospect — FV 55' },
  ];

  return {
    ownedPicks: owned,
    tradedAwayPicks: tradedAway,
    historicalPicks: history,
    totalOwnedValue: owned.reduce((s, p) => s + (p.slotValue ?? 2.5), 0),
    picksIn5Years: owned.length + 3 * 7, // 3 more years of ~7 picks each
    premiumPickCount: owned.filter(p => p.tier === 'premium').length,
  };
}
