/**
 * GM Reputation Engine
 *
 * Tracks the front-office reputation across three axes:
 * - fairDealer: How fairly the GM deals in trades
 * - aggressive: Willingness to make bold moves
 * - loyalty: How well the GM treats players/staff
 *
 * Reputation affects trade willingness from other teams,
 * free agent interest, and media perception.
 *
 * Ported from football dynasty gm-reputation.js, adapted for baseball.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface GMReputation {
  fairDealer: number;   // 0-100
  aggressive: number;   // 0-100
  loyalty: number;      // 0-100
  overall: number;      // weighted composite
  label: string;
  history: ReputationEvent[];
}

export interface ReputationEvent {
  season: number;
  gameDay: number;
  action: string;
  axis: 'fairDealer' | 'aggressive' | 'loyalty';
  delta: number;
}

export type ReputationTier = 'elite' | 'respected' | 'average' | 'questionable' | 'untrusted';

// ── Tier config ─────────────────────────────────────────────────────────────

export const REPUTATION_TIERS: Record<ReputationTier, { min: number; label: string; color: string; icon: string; desc: string }> = {
  elite:        { min: 85, label: 'Elite GM',      color: '#eab308', icon: '👑', desc: 'Top-tier reputation. Teams seek you out for trades.' },
  respected:    { min: 65, label: 'Respected',      color: '#22c55e', icon: '🤝', desc: 'Well-regarded around the league. Fair trade partner.' },
  average:      { min: 45, label: 'Average',        color: '#94a3b8', icon: '📊', desc: 'Middle of the pack. Nothing notable either way.' },
  questionable: { min: 25, label: 'Questionable',   color: '#f97316', icon: '⚠️', desc: 'Teams are wary of dealing with you.' },
  untrusted:    { min: 0,  label: 'Untrusted',      color: '#ef4444', icon: '🚫', desc: 'Burned too many bridges. Trade partners avoid you.' },
};

export function getReputationTier(overall: number): ReputationTier {
  if (overall >= 85) return 'elite';
  if (overall >= 65) return 'respected';
  if (overall >= 45) return 'average';
  if (overall >= 25) return 'questionable';
  return 'untrusted';
}

// ── Axis display ────────────────────────────────────────────────────────────

export const AXIS_DISPLAY = {
  fairDealer: { label: 'FAIR DEALER',  icon: '⚖️', desc: 'How fairly you negotiate trades. Balanced deals build trust.' },
  aggressive: { label: 'AGGRESSION',   icon: '🔥', desc: 'Willingness to make bold moves. Other GMs respect decisiveness.' },
  loyalty:    { label: 'LOYALTY',      icon: '💙', desc: 'How you treat players and staff. Affects FA interest and morale.' },
} as const;

// ── Init & update ───────────────────────────────────────────────────────────

export function initReputation(): GMReputation {
  return {
    fairDealer: 50,
    aggressive: 50,
    loyalty: 50,
    overall: 50,
    label: 'Average',
    history: [],
  };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function computeOverall(rep: GMReputation): number {
  // Weighted: fair dealing matters most
  return Math.round(rep.fairDealer * 0.4 + rep.aggressive * 0.25 + rep.loyalty * 0.35);
}

export function adjustReputation(
  rep: GMReputation,
  axis: 'fairDealer' | 'aggressive' | 'loyalty',
  delta: number,
  action: string,
  season: number,
  gameDay: number,
): GMReputation {
  const updated = { ...rep };
  updated[axis] = clamp(updated[axis] + delta);
  updated.overall = computeOverall(updated);
  updated.label = REPUTATION_TIERS[getReputationTier(updated.overall)].label;
  updated.history = [
    ...updated.history,
    { season, gameDay, action, axis, delta },
  ];
  return updated;
}

// ── Action templates ────────────────────────────────────────────────────────

export interface ReputationAction {
  id: string;
  label: string;
  axis: 'fairDealer' | 'aggressive' | 'loyalty';
  delta: number;
  desc: string;
}

export const REPUTATION_ACTIONS: ReputationAction[] = [
  // Fair dealing
  { id: 'fair_trade',    label: 'Fair Trade',          axis: 'fairDealer', delta: 5,  desc: 'Completed a balanced trade' },
  { id: 'lopsided_win',  label: 'Fleece Job',          axis: 'fairDealer', delta: -8, desc: 'Clearly won a trade by a wide margin' },
  { id: 'lopsided_loss', label: 'Overpaid in Trade',   axis: 'fairDealer', delta: 3,  desc: 'Overpaid — but teams trust you more' },
  { id: 'trade_back',    label: 'Trade-Back',          axis: 'fairDealer', delta: -5, desc: 'Traded back a recently acquired player' },

  // Aggression
  { id: 'big_splash',    label: 'Blockbuster Move',    axis: 'aggressive', delta: 8,  desc: 'Made a headline-grabbing trade or signing' },
  { id: 'deadline_deal', label: 'Deadline Buyer',      axis: 'aggressive', delta: 5,  desc: 'Active buyer at the trade deadline' },
  { id: 'stood_pat',     label: 'Stood Pat',           axis: 'aggressive', delta: -3, desc: 'Made no moves at the deadline' },
  { id: 'fire_sale',     label: 'Fire Sale',           axis: 'aggressive', delta: 10, desc: 'Sold off multiple assets at the deadline' },

  // Loyalty
  { id: 'extend_vet',    label: 'Extended Veteran',    axis: 'loyalty', delta: 6,  desc: 'Rewarded a loyal veteran with an extension' },
  { id: 'cut_fan_fav',   label: 'Cut Fan Favorite',    axis: 'loyalty', delta: -8, desc: 'Released a beloved player' },
  { id: 'trade_homegrown', label: 'Traded Homegrown', axis: 'loyalty', delta: -6, desc: 'Traded a player drafted by the organization' },
  { id: 'promoted_prospect', label: 'Promoted Prospect', axis: 'loyalty', delta: 4, desc: 'Called up a top prospect when ready' },
  { id: 'rushed_prospect', label: 'Rushed Prospect',  axis: 'loyalty', delta: -5, desc: 'Called up a prospect before he was ready' },
  { id: 'kept_core',     label: 'Kept Core Together',  axis: 'loyalty', delta: 5,  desc: 'Retained all key players through the offseason' },
];

// ── Effects on gameplay ─────────────────────────────────────────────────────

export interface ReputationEffects {
  tradeWillingness: number;    // 0.5 - 1.5 multiplier on AI trade acceptance
  faDiscount: number;          // % discount/premium on free agent signings
  moraleBonus: number;         // flat morale modifier
  mediaPerception: string;
}

export function getReputationEffects(rep: GMReputation): ReputationEffects {
  const tier = getReputationTier(rep.overall);

  const effects: Record<ReputationTier, ReputationEffects> = {
    elite:        { tradeWillingness: 1.3, faDiscount: -10, moraleBonus: 3, mediaPerception: 'The front office is best-in-class.' },
    respected:    { tradeWillingness: 1.1, faDiscount: -5,  moraleBonus: 1, mediaPerception: 'A well-run organization.' },
    average:      { tradeWillingness: 1.0, faDiscount: 0,   moraleBonus: 0, mediaPerception: 'Nothing notable about the front office.' },
    questionable: { tradeWillingness: 0.8, faDiscount: 5,   moraleBonus: -1, mediaPerception: 'Questions surround the front office.' },
    untrusted:    { tradeWillingness: 0.6, faDiscount: 15,  moraleBonus: -3, mediaPerception: 'Nobody wants to deal with this GM.' },
  };

  return effects[tier];
}

// ── Seasonal decay ──────────────────────────────────────────────────────────

export function decayReputation(rep: GMReputation): GMReputation {
  // Each offseason, reputation drifts toward 50 by 10%
  const drift = (axis: number) => Math.round(axis + (50 - axis) * 0.1);

  return {
    ...rep,
    fairDealer: drift(rep.fairDealer),
    aggressive: drift(rep.aggressive),
    loyalty: drift(rep.loyalty),
    overall: computeOverall({
      ...rep,
      fairDealer: drift(rep.fairDealer),
      aggressive: drift(rep.aggressive),
      loyalty: drift(rep.loyalty),
    }),
    label: REPUTATION_TIERS[getReputationTier(computeOverall({
      ...rep,
      fairDealer: drift(rep.fairDealer),
      aggressive: drift(rep.aggressive),
      loyalty: drift(rep.loyalty),
    }))].label,
  };
}
