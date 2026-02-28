/**
 * platoonSplitsMatrix.ts – Detailed platoon splits matrix
 *
 * Shows batter performance splits vs LHP and RHP with detailed
 * stat breakdowns, platoon advantage calculations, and optimal
 * lineup recommendations based on opposing pitcher handedness.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface SplitLine {
  pa: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  wOBA: number;
  hr: number;
  kPct: number;
  bbPct: number;
  iso: number;
}

export interface PlatoonSplitPlayer {
  id: string;
  name: string;
  pos: string;
  team: string;
  overall: number;
  batSide: 'L' | 'R' | 'S';
  vsLHP: SplitLine;
  vsRHP: SplitLine;
  platoonDiff: number;     // OPS difference (vs weaker side - vs stronger side)
  platoonGrade: string;    // 'A+', 'A', 'B', 'C', 'D', 'F'
  strongSide: 'LHP' | 'RHP';
  recommendation: string;  // 'Everyday', 'Platoon Strong', 'Platoon Weak'
  notes: string;
}

export function platoonGradeColor(grade: string): string {
  if (grade === 'A+' || grade === 'A') return '#22c55e';
  if (grade === 'B') return '#4ade80';
  if (grade === 'C') return '#f59e0b';
  if (grade === 'D') return '#f97316';
  return '#ef4444';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface PlatoonSplitSummary {
  everydayCount: number;
  platoonCandidates: number;
  biggestSplit: string;
  teamVsLHP_OPS: number;
  teamVsRHP_OPS: number;
}

export function getPlatoonSplitSummary(players: PlatoonSplitPlayer[]): PlatoonSplitSummary {
  const everyday = players.filter(p => p.recommendation === 'Everyday').length;
  const platoon = players.filter(p => p.recommendation !== 'Everyday').length;
  const biggest = players.reduce((a, b) => Math.abs(a.platoonDiff) > Math.abs(b.platoonDiff) ? a : b, players[0]);
  const avgLHP = Math.round(players.reduce((s, p) => s + p.vsLHP.ops, 0) / players.length * 1000) / 1000;
  const avgRHP = Math.round(players.reduce((s, p) => s + p.vsRHP.ops, 0) / players.length * 1000) / 1000;
  return {
    everydayCount: everyday,
    platoonCandidates: platoon,
    biggestSplit: biggest.name,
    teamVsLHP_OPS: avgLHP,
    teamVsRHP_OPS: avgRHP,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const PLAYERS = [
  { name: 'Aaron Judge', pos: 'RF', team: 'NYY', side: 'R' as const, ovr: 95 },
  { name: 'Juan Soto', pos: 'LF', team: 'NYM', side: 'L' as const, ovr: 93 },
  { name: 'Freddie Freeman', pos: '1B', team: 'LAD', side: 'L' as const, ovr: 88 },
  { name: 'Mookie Betts', pos: 'SS', team: 'LAD', side: 'R' as const, ovr: 92 },
  { name: 'Kyle Schwarber', pos: 'LF', team: 'PHI', side: 'L' as const, ovr: 84 },
  { name: 'Pete Alonso', pos: '1B', team: 'NYM', side: 'R' as const, ovr: 83 },
  { name: 'Yordan Alvarez', pos: 'DH', team: 'HOU', side: 'L' as const, ovr: 91 },
  { name: 'Matt Olson', pos: '1B', team: 'ATL', side: 'L' as const, ovr: 86 },
  { name: 'Corey Seager', pos: 'SS', team: 'TEX', side: 'L' as const, ovr: 88 },
  { name: 'Ronald Acuña Jr.', pos: 'CF', team: 'ATL', side: 'R' as const, ovr: 94 },
];

function makeSplit(seed: number, strong: boolean): SplitLine {
  const bonus = strong ? 0.04 : -0.02;
  const avg = 0.260 + bonus + ((seed * 7) % 5) * 0.008;
  const obp = avg + 0.070 + ((seed * 3) % 4) * 0.005;
  const slg = avg + 0.180 + bonus * 3 + ((seed * 11) % 6) * 0.01;
  const ops = obp + slg;
  const woba = 0.320 + bonus * 1.5 + ((seed * 5) % 4) * 0.006;
  return {
    pa: 180 + ((seed * 13) % 120),
    avg: Math.round(avg * 1000) / 1000,
    obp: Math.round(obp * 1000) / 1000,
    slg: Math.round(slg * 1000) / 1000,
    ops: Math.round(ops * 1000) / 1000,
    wOBA: Math.round(woba * 1000) / 1000,
    hr: 8 + ((seed * 3) % 15) + (strong ? 4 : 0),
    kPct: 22 - (strong ? 3 : 0) + ((seed * 7) % 8),
    bbPct: 9 + (strong ? 2 : 0) + ((seed * 5) % 5),
    iso: Math.round((slg - avg) * 1000) / 1000,
  };
}

function makeGrade(diff: number): string {
  const absDiff = Math.abs(diff);
  if (absDiff <= 30) return 'A+';
  if (absDiff <= 60) return 'A';
  if (absDiff <= 90) return 'B';
  if (absDiff <= 120) return 'C';
  if (absDiff <= 160) return 'D';
  return 'F';
}

export function generateDemoPlatoonSplits(): PlatoonSplitPlayer[] {
  return PLAYERS.map((p, i) => {
    const isRHB = p.side === 'R';
    const vsLHP = makeSplit(i + 10, isRHB);
    const vsRHP = makeSplit(i + 50, !isRHB);
    const diff = Math.round((vsLHP.ops - vsRHP.ops) * 1000);
    const grade = makeGrade(diff);
    const strongSide = isRHB ? 'LHP' : 'RHP';
    const rec = Math.abs(diff) <= 50 ? 'Everyday' : Math.abs(diff) <= 100 ? 'Platoon Strong' : 'Platoon Weak';
    return {
      id: `ps-${i}`,
      name: p.name,
      pos: p.pos,
      team: p.team,
      overall: p.ovr,
      batSide: p.side,
      vsLHP,
      vsRHP,
      platoonDiff: diff,
      platoonGrade: grade,
      strongSide: strongSide as 'LHP' | 'RHP',
      recommendation: rec,
      notes: rec === 'Everyday' ? 'Minimal platoon split. Can face both sides effectively.' :
             Math.abs(diff) <= 100 ? `Moderate split. Stronger vs ${strongSide}. Usable against both.` :
             `Severe platoon split. Best deployed vs ${strongSide} only.`,
    };
  });
}
