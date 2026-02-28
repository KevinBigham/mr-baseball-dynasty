/**
 * Trade Deadline Countdown
 *
 * Tracks the approach of the July 31st trade deadline
 * with buyer/seller classifications, rumor tracking,
 * and priority need identification.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type TeamPosture = 'aggressive_buyer' | 'buyer' | 'standing_pat' | 'seller' | 'fire_sale';

export const POSTURE_DISPLAY: Record<TeamPosture, { label: string; emoji: string; color: string }> = {
  aggressive_buyer: { label: 'Aggressive Buyer', emoji: '🏆', color: '#22c55e' },
  buyer:            { label: 'Buyer',            emoji: '🛒', color: '#3b82f6' },
  standing_pat:     { label: 'Standing Pat',     emoji: '🤷', color: '#6b7280' },
  seller:           { label: 'Seller',           emoji: '📦', color: '#f97316' },
  fire_sale:        { label: 'Fire Sale',        emoji: '🔥', color: '#ef4444' },
};

export interface DeadlineTarget {
  id: number;
  name: string;
  pos: string;
  team: string;
  overall: number;
  salary: number;
  yearsRemaining: number;
  isRental: boolean;
  estimatedCost: string;     // prospect cost
  fillsNeed: string;
  likelihood: number;        // 0-100
}

export interface DeadlineData {
  daysUntilDeadline: number;
  deadlineDate: string;
  teamPosture: TeamPosture;
  teamRecord: string;
  gamesBack: number;
  playoffOdds: number;
  priorityNeeds: string[];
  targets: DeadlineTarget[];
  availablePieces: string[];  // players we could trade
  recentDeals: string[];
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getPosture(playoffOdds: number, gamesBack: number): TeamPosture {
  if (playoffOdds >= 85 && gamesBack <= 0) return 'aggressive_buyer';
  if (playoffOdds >= 55) return 'buyer';
  if (playoffOdds >= 30) return 'standing_pat';
  if (playoffOdds >= 10) return 'seller';
  return 'fire_sale';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoDeadline(): DeadlineData {
  return {
    daysUntilDeadline: 12,
    deadlineDate: 'July 31',
    teamPosture: 'buyer',
    teamRecord: '55-42',
    gamesBack: 3.5,
    playoffOdds: 72,
    priorityNeeds: ['Frontline starter', 'Left-handed reliever', 'Right-handed bat off bench'],
    targets: [
      { id: 0, name: 'Tarik Skubal',   pos: 'SP', team: 'DET', overall: 85, salary: 2.5,  yearsRemaining: 2, isRental: false, estimatedCost: '2 top-10 prospects', fillsNeed: 'Frontline starter', likelihood: 25 },
      { id: 1, name: 'Jack Flaherty',   pos: 'SP', team: 'DET', overall: 78, salary: 14,   yearsRemaining: 0, isRental: true,  estimatedCost: '1 prospect + lottery ticket', fillsNeed: 'Frontline starter', likelihood: 60 },
      { id: 2, name: 'Andrew Chafin',   pos: 'RP', team: 'ARI', overall: 72, salary: 5.5,  yearsRemaining: 0, isRental: true,  estimatedCost: 'Low-level prospect', fillsNeed: 'Left-handed reliever', likelihood: 75 },
      { id: 3, name: 'Luis Robert Jr.', pos: 'CF', team: 'CWS', overall: 82, salary: 12.5, yearsRemaining: 2, isRental: false, estimatedCost: '3 top prospects', fillsNeed: 'Power bat + defense', likelihood: 20 },
      { id: 4, name: 'Mark Canha',      pos: '1B/OF', team: 'DET', overall: 68, salary: 10, yearsRemaining: 0, isRental: true, estimatedCost: 'Cash considerations', fillsNeed: 'RH bat off bench', likelihood: 80 },
    ],
    availablePieces: ['Prospect A (SS, #5 prospect)', 'Prospect B (RHP, #8 prospect)', 'Depth pitcher (28, controllable)'],
    recentDeals: [
      'NYY acquires Jazz Chisholm from MIA for 3 prospects',
      'HOU acquires Yusei Kikuchi from TOR for prospect',
      'CLE acquires Carlos Carrasco from NYM for cash',
    ],
  };
}
