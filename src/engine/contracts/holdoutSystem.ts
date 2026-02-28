/**
 * Holdout System
 *
 * Player holdout mechanics for contract disputes. Stars who feel
 * underpaid or are unhappy can hold out, progressing through 5 stages
 * from no-show to nuclear crisis. The GM must decide how to respond.
 *
 * Ported from football dynasty holdout-system.js, adapted for baseball
 * position tiers and salary structures.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type HoldoutStage = 1 | 2 | 3 | 4 | 5;

export interface HoldoutState {
  playerId: number;
  playerName: string;
  position: string;
  overall: number;
  week: number;
  stage: HoldoutStage;
  severity: 'moderate' | 'severe';
  demands: 'extension' | 'trade';
  tradeRequested: boolean;
}

export interface HoldoutHeadline {
  stage: HoldoutStage;
  playerName: string;
  position: string;
  headline: string;
  icon: string;
}

// ── Position market tiers (baseball) ────────────────────────────────────────

export interface PositionMarketTier {
  tier: number;
  mult: number;
  holdoutRaisePct: number;
}

const POS_MARKET: Record<string, PositionMarketTier> = {
  SP:  { tier: 1, mult: 2.2, holdoutRaisePct: 0.20 },
  SS:  { tier: 2, mult: 1.5, holdoutRaisePct: 0.18 },
  CF:  { tier: 2, mult: 1.3, holdoutRaisePct: 0.18 },
  '1B': { tier: 2, mult: 1.3, holdoutRaisePct: 0.16 },
  '3B': { tier: 2, mult: 1.3, holdoutRaisePct: 0.16 },
  C:   { tier: 2, mult: 1.2, holdoutRaisePct: 0.16 },
  RF:  { tier: 3, mult: 1.0, holdoutRaisePct: 0.14 },
  LF:  { tier: 3, mult: 1.0, holdoutRaisePct: 0.14 },
  '2B': { tier: 3, mult: 1.0, holdoutRaisePct: 0.14 },
  RP:  { tier: 3, mult: 0.9, holdoutRaisePct: 0.12 },
  CL:  { tier: 2, mult: 1.4, holdoutRaisePct: 0.16 },
  DH:  { tier: 3, mult: 1.0, holdoutRaisePct: 0.14 },
};

const DEFAULT_TIER: PositionMarketTier = { tier: 3, mult: 1.0, holdoutRaisePct: 0.14 };

export function getPositionMarketTier(pos: string): PositionMarketTier {
  return POS_MARKET[pos] ?? DEFAULT_TIER;
}

// ── Stage display ───────────────────────────────────────────────────────────

export const STAGE_DISPLAY: Record<HoldoutStage, { label: string; color: string; icon: string; desc: string }> = {
  1: { label: 'NO-SHOW',       color: '#eab308', icon: '🚫', desc: 'Player skipped spring training / camp.' },
  2: { label: 'STATEMENT',     color: '#f97316', icon: '📢', desc: 'Agent issued public statement about pay.' },
  3: { label: 'TRADE REQUEST', color: '#ef4444', icon: '🚨', desc: 'Player has officially demanded a trade.' },
  4: { label: 'CRITICAL',      color: '#dc2626', icon: '⚠️', desc: 'Situation is critical. Suspension option available.' },
  5: { label: 'NUCLEAR',       color: '#991b1b', icon: '☢️', desc: 'Full-blown franchise crisis. Act immediately.' },
};

// ── Holdout check ───────────────────────────────────────────────────────────

export interface HoldoutCandidate {
  id: number;
  name: string;
  position: string;
  overall: number;
  age: number;
  salary: number;
  contractYears: number;
  morale: number;
}

export function checkHoldoutEligibility(player: HoldoutCandidate): { eligible: boolean; chance: number; reason: string } {
  const market = getPositionMarketTier(player.position);
  const underpaidLine = Math.max(0, (player.overall - 60) * 0.4) * market.mult;
  const isUnderpaid = player.overall >= 75 && player.salary < underpaidLine;
  const isExpiring = player.contractYears <= 1;
  const isUnhappy = player.morale < 50;
  const isStar = player.overall >= 78;

  let chance = 0;
  let reason = '';

  if (isStar && isExpiring && isUnderpaid) {
    chance = 0.25;
    reason = 'Star player with expiring contract, significantly underpaid';
  } else if (isStar && isUnhappy) {
    chance = 0.15;
    reason = 'Star player deeply unhappy';
  } else if (isExpiring && isUnderpaid && player.overall >= 72) {
    chance = 0.10;
    reason = 'Expiring contract, underpaid for production';
  }

  return { eligible: chance > 0, chance, reason };
}

// ── Holdout progression ─────────────────────────────────────────────────────

export function initHoldout(player: HoldoutCandidate, isUnhappy: boolean): HoldoutState {
  return {
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    overall: player.overall,
    week: 0,
    stage: 1,
    severity: isUnhappy ? 'severe' : 'moderate',
    demands: 'extension',
    tradeRequested: false,
  };
}

export function tickHoldout(state: HoldoutState): { state: HoldoutState; headline: HoldoutHeadline; moraleDrain: number } {
  const updated = { ...state, week: state.week + 1 };
  const wk = updated.week;

  // Progress through stages
  if (wk <= 1) updated.stage = 1;
  else if (wk <= 2) updated.stage = 2;
  else if (wk <= 4) { updated.stage = 3; updated.tradeRequested = true; updated.demands = 'trade'; }
  else if (wk <= 6) updated.stage = 4;
  else updated.stage = 5;

  const moraleDrain = updated.stage >= 4 ? -8 : -4;

  const headlines: Record<HoldoutStage, string> = {
    1: `${updated.playerName} (${updated.position}) fails to report. Agent: "Exploring all options."`,
    2: `STATEMENT: ${updated.playerName} says he "deserves to be paid like a top ${updated.position}."`,
    3: `${updated.playerName} DEMANDS TRADE. Agent: "He will not report under any circumstances."`,
    4: `Week ${wk}: ${updated.playerName} holdout enters critical stage. Front office weighing options.`,
    5: `NUCLEAR: ${updated.playerName} holdout hits Week ${wk}. This is a franchise-defining crisis.`,
  };

  return {
    state: updated,
    headline: {
      stage: updated.stage,
      playerName: updated.playerName,
      position: updated.position,
      headline: headlines[updated.stage],
      icon: STAGE_DISPLAY[updated.stage].icon,
    },
    moraleDrain,
  };
}

export function resolveHoldout(state: HoldoutState, resolution: 'extend' | 'trade' | 'cave'): { moraleRecovery: number; narrative: string } {
  switch (resolution) {
    case 'extend':
      return {
        moraleRecovery: 15,
        narrative: `${state.playerName} signed a new extension. The holdout is over — peace in the clubhouse.`,
      };
    case 'trade':
      return {
        moraleRecovery: 5,
        narrative: `${state.playerName} has been traded. A bittersweet end to a franchise pillar.`,
      };
    case 'cave':
      return {
        moraleRecovery: 8,
        narrative: `${state.playerName} reported to camp after a lengthy standoff. Relations remain strained.`,
      };
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────

export function getHoldoutSummary(holdouts: HoldoutState[]) {
  return {
    total: holdouts.length,
    active: holdouts.filter(h => h.stage < 5).length,
    critical: holdouts.filter(h => h.stage >= 3).length,
    avgWeeks: holdouts.length > 0
      ? Math.round(holdouts.reduce((s, h) => s + h.week, 0) / holdouts.length * 10) / 10
      : 0,
  };
}
