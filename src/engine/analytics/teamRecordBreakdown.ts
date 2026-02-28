/**
 * teamRecordBreakdown.ts – Team Record Breakdown by Category
 *
 * Breaks down team record into meaningful splits: home/away, day/night,
 * vs division, vs winning teams, one-run games, extra innings, monthly,
 * and more. Identifies strengths and weaknesses in team performance.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface RecordSplit {
  label: string;
  category: string;
  wins: number;
  losses: number;
  pct: number;
}

export interface TeamRecordProfile {
  teamName: string;
  totalWins: number;
  totalLosses: number;
  totalPct: number;
  splits: RecordSplit[];
  bestSplit: RecordSplit;
  worstSplit: RecordSplit;
  clutchRecord: { wins: number; losses: number; pct: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(w: number, l: number): number {
  return w + l > 0 ? Math.round((w / (w + l)) * 1000) / 1000 : 0;
}

export function getRecordColor(winPct: number): string {
  if (winPct >= 0.600) return '#22c55e';
  if (winPct >= 0.530) return '#4ade80';
  if (winPct >= 0.470) return '#f59e0b';
  if (winPct >= 0.400) return '#f97316';
  return '#ef4444';
}

export function getTeamRecordSummary(profile: TeamRecordProfile) {
  const aboveAvg = profile.splits.filter(s => s.pct >= 0.550);
  const belowAvg = profile.splits.filter(s => s.pct < 0.450);
  return {
    strengths: aboveAvg.length,
    weaknesses: belowAvg.length,
    bestLabel: profile.bestSplit.label,
    bestPct: profile.bestSplit.pct,
    worstLabel: profile.worstSplit.label,
    worstPct: profile.worstSplit.pct,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoTeamRecordBreakdown(): TeamRecordProfile {
  const splits: RecordSplit[] = [
    { label: 'Home', category: 'venue', wins: 48, losses: 33, pct: pct(48, 33) },
    { label: 'Away', category: 'venue', wins: 40, losses: 41, pct: pct(40, 41) },
    { label: 'Day Games', category: 'time', wins: 28, losses: 24, pct: pct(28, 24) },
    { label: 'Night Games', category: 'time', wins: 60, losses: 50, pct: pct(60, 50) },
    { label: 'vs Division', category: 'opponent', wins: 38, losses: 30, pct: pct(38, 30) },
    { label: 'vs Non-Division', category: 'opponent', wins: 50, losses: 44, pct: pct(50, 44) },
    { label: 'vs Winning Teams', category: 'quality', wins: 30, losses: 32, pct: pct(30, 32) },
    { label: 'vs Losing Teams', category: 'quality', wins: 58, losses: 42, pct: pct(58, 42) },
    { label: 'One-Run Games', category: 'margin', wins: 22, losses: 20, pct: pct(22, 20) },
    { label: 'Blowouts (5+)', category: 'margin', wins: 30, losses: 18, pct: pct(30, 18) },
    { label: 'Extra Innings', category: 'extras', wins: 8, losses: 10, pct: pct(8, 10) },
    { label: 'April', category: 'month', wins: 14, losses: 12, pct: pct(14, 12) },
    { label: 'May', category: 'month', wins: 16, losses: 12, pct: pct(16, 12) },
    { label: 'June', category: 'month', wins: 15, losses: 12, pct: pct(15, 12) },
    { label: 'July', category: 'month', wins: 14, losses: 13, pct: pct(14, 13) },
    { label: 'August', category: 'month', wins: 16, losses: 11, pct: pct(16, 11) },
    { label: 'September', category: 'month', wins: 13, losses: 14, pct: pct(13, 14) },
    { label: 'After Loss', category: 'streak', wins: 42, losses: 36, pct: pct(42, 36) },
    { label: 'After Win', category: 'streak', wins: 46, losses: 38, pct: pct(46, 38) },
  ];

  const sorted = [...splits].sort((a, b) => b.pct - a.pct);
  const clutchSplits = splits.filter(s => s.label === 'One-Run Games' || s.label === 'Extra Innings');
  const clutchW = clutchSplits.reduce((s, x) => s + x.wins, 0);
  const clutchL = clutchSplits.reduce((s, x) => s + x.losses, 0);

  return {
    teamName: 'San Francisco Giants',
    totalWins: 88,
    totalLosses: 74,
    totalPct: pct(88, 74),
    splits,
    bestSplit: sorted[0],
    worstSplit: sorted[sorted.length - 1],
    clutchRecord: { wins: clutchW, losses: clutchL, pct: pct(clutchW, clutchL) },
  };
}
