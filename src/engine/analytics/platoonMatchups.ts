/**
 * Platoon Matchup Engine
 *
 * Tracks batter vs pitcher handedness splits and generates
 * matchup intelligence for lineup optimization. Shows L/R splits
 * for each batter and pitcher, plus positional advantages.
 *
 * Original baseball-specific system.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type Hand = 'L' | 'R' | 'S'; // S = switch-hitter

export interface PlatoonSplit {
  vsLeft: SplitStats;
  vsRight: SplitStats;
  advantage: 'vs_left' | 'vs_right' | 'neutral';
  advantageDesc: string;
}

export interface SplitStats {
  pa: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  hr: number;
  k: number;
  bb: number;
}

export interface MatchupEntry {
  playerId: number;
  name: string;
  position: string;
  hand: Hand;
  overall: number;
  splits: PlatoonSplit;
}

export interface MatchupAdvantage {
  batter: string;
  pitcher: string;
  advantage: 'batter' | 'pitcher' | 'even';
  delta: number;
  note: string;
}

// ── Split generation ────────────────────────────────────────────────────────

function genSplitStats(ovr: number, isAdv: boolean): SplitStats {
  const base = ovr / 100;
  const bonus = isAdv ? 0.03 : -0.02;
  const avg = Math.round((0.200 + base * 0.12 + bonus + (Math.random() * 0.04 - 0.02)) * 1000) / 1000;
  const obp = Math.round((avg + 0.060 + (Math.random() * 0.02)) * 1000) / 1000;
  const slg = Math.round((avg + 0.150 + (isAdv ? 0.04 : -0.02) + (Math.random() * 0.06 - 0.03)) * 1000) / 1000;
  return {
    pa: 150 + Math.floor(Math.random() * 200),
    avg: Math.min(0.400, Math.max(0.150, avg)),
    obp: Math.min(0.450, Math.max(0.200, obp)),
    slg: Math.min(0.650, Math.max(0.250, slg)),
    ops: Math.round((obp + slg) * 1000) / 1000,
    hr: Math.floor((isAdv ? 8 : 4) + Math.random() * 10),
    k: Math.floor(20 + Math.random() * 30),
    bb: Math.floor(10 + Math.random() * 20),
  };
}

export function generatePlatoonSplit(ovr: number, hand: Hand): PlatoonSplit {
  // Lefties hit righties better, righties hit lefties better
  const isSwitch = hand === 'S';
  const vsLeft = genSplitStats(ovr, hand === 'R' || isSwitch);
  const vsRight = genSplitStats(ovr, hand === 'L' || isSwitch);

  const advantageSide = vsLeft.ops > vsRight.ops + 0.030 ? 'vs_left' :
    vsRight.ops > vsLeft.ops + 0.030 ? 'vs_right' : 'neutral';

  const descs: Record<string, string> = {
    vs_left: `Mashes LHP (${vsLeft.ops} OPS vs L)`,
    vs_right: `Better vs RHP (${vsRight.ops} OPS vs R)`,
    neutral: 'No significant platoon split',
  };

  return { vsLeft, vsRight, advantage: advantageSide, advantageDesc: descs[advantageSide] };
}

// ── Matchup analysis ────────────────────────────────────────────────────────

export function analyzeMatchup(
  batterHand: Hand,
  batterOvr: number,
  pitcherHand: Hand,
  pitcherOvr: number,
): MatchupAdvantage {
  // Same-hand matchups favor the pitcher; opposite-hand favors the batter
  const sameHand = (batterHand === pitcherHand) || (batterHand !== 'S' && pitcherHand !== 'S' && batterHand === pitcherHand);
  const ovrGap = batterOvr - pitcherOvr;
  let delta = ovrGap * 0.3;

  if (sameHand) delta -= 5; // pitcher advantage
  else delta += 5;          // batter advantage

  if (batterHand === 'S') delta += 3; // switch-hitters always have an edge

  const advantage: MatchupAdvantage['advantage'] = delta > 3 ? 'batter' : delta < -3 ? 'pitcher' : 'even';

  const notes = {
    batter: sameHand ? 'Batter overcomes same-hand disadvantage with raw talent' :
      'Favorable platoon matchup for the batter',
    pitcher: sameHand ? 'Same-hand advantage plus superior stuff' :
      'Pitcher dominates despite opposite hand',
    even: 'Evenly matched — could go either way',
  };

  return {
    batter: '',
    pitcher: '',
    advantage,
    delta: Math.round(delta * 10) / 10,
    note: notes[advantage],
  };
}

// ── Summary ─────────────────────────────────────────────────────────────────

export function getPlatoonSummary(entries: MatchupEntry[]) {
  return {
    total: entries.length,
    leftHanded: entries.filter(e => e.hand === 'L').length,
    rightHanded: entries.filter(e => e.hand === 'R').length,
    switchHitters: entries.filter(e => e.hand === 'S').length,
    vsLeftAdv: entries.filter(e => e.splits.advantage === 'vs_left').length,
    vsRightAdv: entries.filter(e => e.splits.advantage === 'vs_right').length,
    neutral: entries.filter(e => e.splits.advantage === 'neutral').length,
  };
}

export const HAND_DISPLAY: Record<Hand, { label: string; color: string }> = {
  L: { label: 'LEFT',   color: '#3b82f6' },
  R: { label: 'RIGHT',  color: '#ef4444' },
  S: { label: 'SWITCH', color: '#a855f7' },
};
