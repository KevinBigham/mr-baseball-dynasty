/**
 * Waiver Claim Strategy
 *
 * Tracks waiver priority, available players on waivers,
 * claim recommendations, and exposed player evaluations.
 * Key for picking up released/DFA'd talent.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ClaimRecommendation = 'must_claim' | 'recommend' | 'consider' | 'pass' | 'avoid';
export type WaiverType = 'outright' | 'dfa' | 'released' | 'unconditional';

export const CLAIM_DISPLAY: Record<ClaimRecommendation, { label: string; color: string; emoji: string }> = {
  must_claim: { label: 'Must Claim',  color: '#22c55e', emoji: '🟢' },
  recommend:  { label: 'Recommend',   color: '#3b82f6', emoji: '👍' },
  consider:   { label: 'Consider',    color: '#eab308', emoji: '🤔' },
  pass:       { label: 'Pass',        color: '#888',    emoji: '➖' },
  avoid:      { label: 'Avoid',       color: '#ef4444', emoji: '🚫' },
};

export interface WaiverPlayer {
  id: number;
  name: string;
  pos: string;
  team: string;
  age: number;
  overall: number;
  salary: number;           // $M remaining
  waiverType: WaiverType;
  claimDeadline: string;
  recommendation: ClaimRecommendation;
  fillsNeed: boolean;
  upside: string;
  risk: string;
  scoutNote: string;
}

export interface WaiverData {
  teamPriority: number;       // 1-30 waiver order
  availablePlayers: WaiverPlayer[];
  claimsThisSeason: number;
  successfulClaims: number;
  rosterSpotsOpen: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getClaimRecommendation(overall: number, fillsNeed: boolean, salary: number): ClaimRecommendation {
  if (overall >= 75 && fillsNeed && salary < 10) return 'must_claim';
  if (overall >= 70 && fillsNeed) return 'recommend';
  if (overall >= 65 || (overall >= 60 && fillsNeed)) return 'consider';
  if (overall >= 55) return 'pass';
  return 'avoid';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoWaiverClaims(): WaiverData {
  return {
    teamPriority: 12,
    claimsThisSeason: 4,
    successfulClaims: 2,
    rosterSpotsOpen: 1,
    availablePlayers: [
      {
        id: 0, name: 'Joey Gallo', pos: 'OF', team: 'MIN', age: 30, overall: 68,
        salary: 2.5, waiverType: 'dfa', claimDeadline: 'Aug 28',
        recommendation: 'consider', fillsNeed: true,
        upside: 'Power bat off bench, plus defense in corners',
        risk: 'Low average, high strikeout rate — one-dimensional',
        scoutNote: 'TTO player who can still mash lefties. Good clubhouse guy.',
      },
      {
        id: 1, name: 'Wander Franco', pos: 'SS', team: 'TB', age: 23, overall: 72,
        salary: 1.5, waiverType: 'outright', claimDeadline: 'Aug 30',
        recommendation: 'recommend', fillsNeed: false,
        upside: 'Premium talent with elite bat speed and plus contact',
        risk: 'Off-field concerns — check legal situation carefully',
        scoutNote: 'Pure talent is undeniable. Due diligence required on personal matters.',
      },
      {
        id: 2, name: 'Veteran Reliever', pos: 'RP', team: 'OAK', age: 34, overall: 62,
        salary: 0.5, waiverType: 'released', claimDeadline: 'Aug 27',
        recommendation: 'consider', fillsNeed: true,
        upside: 'Experienced arm, can eat innings in low leverage',
        risk: 'Declining velocity, limited upside',
        scoutNote: 'Steady veteran presence. Wont hurt you. Wont dominate either.',
      },
      {
        id: 3, name: 'AAAA Outfielder', pos: 'CF', team: 'COL', age: 27, overall: 55,
        salary: 0.7, waiverType: 'dfa', claimDeadline: 'Aug 29',
        recommendation: 'pass', fillsNeed: false,
        upside: 'Speed and defense — can play all three OF spots',
        risk: 'Cannot hit ML pitching — career .210 hitter',
        scoutNote: 'Organizational depth piece at best. Not a contributor.',
      },
      {
        id: 4, name: 'Aging Slugger', pos: '1B/DH', team: 'CWS', age: 36, overall: 60,
        salary: 15.0, waiverType: 'unconditional', claimDeadline: 'Aug 31',
        recommendation: 'avoid', fillsNeed: false,
        upside: 'Still has power, name recognition',
        risk: 'Massive salary obligation, declining performance',
        scoutNote: 'Avoid the salary. Bat is diminished. Not worth the cap hit.',
      },
    ],
  };
}
