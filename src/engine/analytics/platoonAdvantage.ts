/**
 * Platoon Advantage Matrix
 *
 * Detailed L/R split analysis showing how hitters and pitchers
 * perform based on handedness matchups. Identifies platoon
 * advantages and optimal lineup configurations.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlatoonSplit = 'massive' | 'significant' | 'moderate' | 'minimal' | 'reverse';

export const SPLIT_DISPLAY: Record<PlatoonSplit, { label: string; color: string; desc: string }> = {
  massive:     { label: 'Massive Split',     color: '#ef4444', desc: 'Huge platoon disadvantage — must platoon' },
  significant: { label: 'Significant Split', color: '#f97316', desc: 'Notable platoon splits — consider platooning' },
  moderate:    { label: 'Moderate Split',     color: '#eab308', desc: 'Normal platoon splits' },
  minimal:     { label: 'Minimal Split',      color: '#22c55e', desc: 'Handles both sides well' },
  reverse:     { label: 'Reverse Split',      color: '#8b5cf6', desc: 'Better against same-side pitching' },
};

export interface PlatoonHitter {
  id: number;
  name: string;
  pos: string;
  hand: 'L' | 'R' | 'S';
  overall: number;
  vsRHP: { avg: number; obp: number; slg: number; ops: number; pa: number; hr: number };
  vsLHP: { avg: number; obp: number; slg: number; ops: number; pa: number; hr: number };
  opsSplit: number;     // OPS vs RHP minus OPS vs LHP (positive = better vs RHP)
  splitGrade: PlatoonSplit;
  shouldPlatoon: boolean;
  platoonPartner: string | null;
}

export interface PlatoonPitcher {
  id: number;
  name: string;
  hand: 'L' | 'R';
  overall: number;
  vsRHB: { avg: number; obp: number; slg: number; ops: number; kRate: number };
  vsLHB: { avg: number; obp: number; slg: number; ops: number; kRate: number };
  opsSplit: number;
  splitGrade: PlatoonSplit;
}

export interface PlatoonSummary {
  avgSplit: number;
  massiveSplitCount: number;
  minimalSplitCount: number;
  reverseSplitCount: number;
  platoonPairs: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getSplitGrade(opsSplit: number): PlatoonSplit {
  const absSplit = Math.abs(opsSplit);
  if (opsSplit < -0.030) return 'reverse';
  if (absSplit <= 0.030) return 'minimal';
  if (absSplit <= 0.060) return 'moderate';
  if (absSplit <= 0.100) return 'significant';
  return 'massive';
}

export function getPlatoonSummary(hitters: PlatoonHitter[]): PlatoonSummary {
  return {
    avgSplit: Math.round(hitters.reduce((s, h) => s + Math.abs(h.opsSplit), 0) / hitters.length * 1000) / 1000,
    massiveSplitCount: hitters.filter(h => h.splitGrade === 'massive').length,
    minimalSplitCount: hitters.filter(h => h.splitGrade === 'minimal').length,
    reverseSplitCount: hitters.filter(h => h.splitGrade === 'reverse').length,
    platoonPairs: hitters.filter(h => h.platoonPartner !== null).length / 2,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoPlatoonHitters(): PlatoonHitter[] {
  const data = [
    { name: 'Joc Pederson',      pos: 'DH',  hand: 'L' as const, ovr: 72, vR: { avg: .268, obp: .368, slg: .520, ops: .888, pa: 380, hr: 22 }, vL: { avg: .195, obp: .280, slg: .320, ops: .600, pa: 120, hr: 3 }, partner: 'Mitch Haniger' },
    { name: 'Mitch Haniger',     pos: 'RF',  hand: 'R' as const, ovr: 74, vR: { avg: .230, obp: .310, slg: .400, ops: .710, pa: 250, hr: 10 }, vL: { avg: .290, obp: .375, slg: .530, ops: .905, pa: 180, hr: 14 }, partner: 'Joc Pederson' },
    { name: 'Corey Seager',      pos: 'SS',  hand: 'L' as const, ovr: 86, vR: { avg: .285, obp: .355, slg: .540, ops: .895, pa: 450, hr: 28 }, vL: { avg: .248, obp: .310, slg: .430, ops: .740, pa: 150, hr: 6 }, partner: null },
    { name: 'Marcus Semien',     pos: '2B',  hand: 'R' as const, ovr: 82, vR: { avg: .255, obp: .325, slg: .435, ops: .760, pa: 380, hr: 15 }, vL: { avg: .278, obp: .350, slg: .490, ops: .840, pa: 200, hr: 12 }, partner: null },
    { name: 'Brandon Nimmo',     pos: 'CF',  hand: 'L' as const, ovr: 78, vR: { avg: .272, obp: .380, slg: .460, ops: .840, pa: 420, hr: 18 }, vL: { avg: .225, obp: .315, slg: .360, ops: .675, pa: 140, hr: 4 }, partner: null },
    { name: 'Josh Naylor',       pos: '1B',  hand: 'L' as const, ovr: 77, vR: { avg: .280, obp: .340, slg: .510, ops: .850, pa: 390, hr: 22 }, vL: { avg: .210, obp: .270, slg: .350, ops: .620, pa: 130, hr: 4 }, partner: null },
    { name: 'Jose Abreu',        pos: '1B',  hand: 'R' as const, ovr: 68, vR: { avg: .232, obp: .290, slg: .380, ops: .670, pa: 350, hr: 10 }, vL: { avg: .268, obp: .340, slg: .460, ops: .800, pa: 160, hr: 8 }, partner: null },
    { name: 'Willy Adames',      pos: 'SS',  hand: 'R' as const, ovr: 80, vR: { avg: .248, obp: .325, slg: .440, ops: .765, pa: 380, hr: 18 }, vL: { avg: .262, obp: .345, slg: .470, ops: .815, pa: 170, hr: 10 }, partner: null },
  ];

  return data.map((d, i) => {
    const opsSplit = d.vR.ops - d.vL.ops;
    const splitGrade = getSplitGrade(opsSplit);
    return {
      id: i,
      name: d.name,
      pos: d.pos,
      hand: d.hand,
      overall: d.ovr,
      vsRHP: d.vR,
      vsLHP: d.vL,
      opsSplit: Math.round(opsSplit * 1000) / 1000,
      splitGrade,
      shouldPlatoon: splitGrade === 'massive' || splitGrade === 'significant',
      platoonPartner: d.partner,
    };
  });
}

export function generateDemoPlatoonPitchers(): PlatoonPitcher[] {
  const data = [
    { name: 'Blake Snell',      hand: 'L' as const, ovr: 84, vR: { avg: .235, obp: .320, slg: .420, ops: .740, k: 28.5 }, vL: { avg: .198, obp: .275, slg: .310, ops: .585, k: 32.0 } },
    { name: 'Corbin Burnes',    hand: 'R' as const, ovr: 87, vR: { avg: .215, obp: .280, slg: .350, ops: .630, k: 26.2 }, vL: { avg: .240, obp: .315, slg: .400, ops: .715, k: 24.0 } },
    { name: 'Max Fried',        hand: 'L' as const, ovr: 85, vR: { avg: .228, obp: .295, slg: .380, ops: .675, k: 24.8 }, vL: { avg: .205, obp: .265, slg: .320, ops: .585, k: 27.5 } },
    { name: 'Zack Wheeler',     hand: 'R' as const, ovr: 86, vR: { avg: .220, obp: .285, slg: .365, ops: .650, k: 27.0 }, vL: { avg: .235, obp: .310, slg: .410, ops: .720, k: 25.0 } },
  ];

  return data.map((d, i) => {
    const opsSplit = d.vR.ops - d.vL.ops;
    return {
      id: i,
      name: d.name,
      hand: d.hand,
      overall: d.ovr,
      vsRHB: d.vR,
      vsLHB: d.vL,
      opsSplit: Math.round(opsSplit * 1000) / 1000,
      splitGrade: getSplitGrade(opsSplit),
    };
  });
}
