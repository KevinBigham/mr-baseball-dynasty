/**
 * clutchPitchingIndex.ts – Clutch pitching performance index
 *
 * Evaluates pitcher performance in high-leverage situations including
 * RISP splits, late & close stats, high-LI performance, and composure grades.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ComposureGrade = 'ice_cold' | 'steady' | 'average' | 'shaky' | 'meltdown';

export interface ClutchPitcherProfile {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP';
  ip: number;
  // Overall clutch metrics
  clutchScore: number;          // -10 to +10
  composure: ComposureGrade;
  // High leverage splits
  highLevERA: number;
  lowLevERA: number;
  highLevKPct: number;
  highLevBBPct: number;
  highLevWhip: number;
  // RISP splits
  rispBA: number;
  rispOPS: number;
  rispKPct: number;
  // Late & Close
  lateCloseERA: number;
  lateCloseOPS: number;
  // Bases loaded
  basesLoadedBA: number;
  basesLoadedK: number;
  basesLoadedBB: number;
  // Big moments
  inheritedScored: number;      // % of inherited runners that scored
  strandRate: number;           // LOB %
  shutdownPct: number;          // % of high-leverage appearances that are shutdowns
  notes: string;
}

export const COMPOSURE_DISPLAY: Record<ComposureGrade, { label: string; color: string; emoji: string }> = {
  ice_cold: { label: 'ICE COLD', color: '#22c55e', emoji: '🧊' },
  steady: { label: 'STEADY', color: '#4ade80', emoji: '✓' },
  average: { label: 'AVERAGE', color: '#facc15', emoji: '—' },
  shaky: { label: 'SHAKY', color: '#f97316', emoji: '⚠' },
  meltdown: { label: 'MELTDOWN', color: '#ef4444', emoji: '🔥' },
};

// ─── Summary ────────────────────────────────────────────────────────────────

export interface ClutchPitchingSummary {
  totalPitchers: number;
  bestClutch: string;
  worstClutch: string;
  avgClutchScore: number;
  iceCount: number;
  meltdownCount: number;
}

export function getClutchPitchingSummary(pitchers: ClutchPitcherProfile[]): ClutchPitchingSummary {
  const best = pitchers.reduce((a, b) => a.clutchScore > b.clutchScore ? a : b);
  const worst = pitchers.reduce((a, b) => a.clutchScore < b.clutchScore ? a : b);
  const avg = pitchers.reduce((s, p) => s + p.clutchScore, 0) / pitchers.length;

  return {
    totalPitchers: pitchers.length,
    bestClutch: best.name,
    worstClutch: worst.name,
    avgClutchScore: Math.round(avg * 10) / 10,
    iceCount: pitchers.filter(p => p.composure === 'ice_cold').length,
    meltdownCount: pitchers.filter(p => p.composure === 'meltdown').length,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoClutchPitching(): ClutchPitcherProfile[] {
  const data: Omit<ClutchPitcherProfile, 'id'>[] = [
    {
      name: 'Ryan Kowalski', team: 'ATL', role: 'RP', ip: 68.2,
      clutchScore: 8.5, composure: 'ice_cold',
      highLevERA: 1.85, lowLevERA: 2.95, highLevKPct: 38.5, highLevBBPct: 5.2, highLevWhip: 0.82,
      rispBA: .165, rispOPS: .485, rispKPct: 40.2,
      lateCloseERA: 1.62, lateCloseOPS: .465,
      basesLoadedBA: .125, basesLoadedK: 8, basesLoadedBB: 1,
      inheritedScored: 15.5, strandRate: 84.5, shutdownPct: 82,
      notes: 'Truly elite in high-leverage spots. Gets better when the pressure rises. Bases loaded? He gets K after K.',
    },
    {
      name: 'Marcus Webb', team: 'NYM', role: 'SP', ip: 198.2,
      clutchScore: 5.2, composure: 'steady',
      highLevERA: 2.65, lowLevERA: 3.15, highLevKPct: 28.5, highLevBBPct: 6.8, highLevWhip: 1.02,
      rispBA: .215, rispOPS: .620, rispKPct: 26.8,
      lateCloseERA: 2.85, lateCloseOPS: .645,
      basesLoadedBA: .200, basesLoadedK: 5, basesLoadedBB: 2,
      inheritedScored: 22.5, strandRate: 78.2, shutdownPct: 68,
      notes: 'Reliable in big spots. Raises his game slightly when runners are on. Steady presence on the mound.',
    },
    {
      name: 'Austin Pierce', team: 'BOS', role: 'RP', ip: 65.0,
      clutchScore: 6.8, composure: 'ice_cold',
      highLevERA: 1.95, lowLevERA: 3.45, highLevKPct: 36.2, highLevBBPct: 6.5, highLevWhip: 0.88,
      rispBA: .178, rispOPS: .510, rispKPct: 38.5,
      lateCloseERA: 1.80, lateCloseOPS: .490,
      basesLoadedBA: .143, basesLoadedK: 6, basesLoadedBB: 1,
      inheritedScored: 18.2, strandRate: 82.1, shutdownPct: 78,
      notes: 'Filthy in high-leverage. Fastball/splitter combo is nearly unhittable late in games. True shutdown reliever.',
    },
    {
      name: 'Terrence Miles', team: 'CWS', role: 'SP', ip: 165.0,
      clutchScore: -3.5, composure: 'shaky',
      highLevERA: 5.85, lowLevERA: 3.65, highLevKPct: 18.2, highLevBBPct: 12.5, highLevWhip: 1.55,
      rispBA: .295, rispOPS: .842, rispKPct: 16.5,
      lateCloseERA: 6.15, lateCloseOPS: .875,
      basesLoadedBA: .350, basesLoadedK: 2, basesLoadedBB: 4,
      inheritedScored: 42.5, strandRate: 62.8, shutdownPct: 32,
      notes: 'Collapses under pressure. Walk rate skyrockets in high-leverage. Should be pulled before things get tense.',
    },
    {
      name: 'Carlos Medina', team: 'SD', role: 'SP', ip: 185.0,
      clutchScore: 2.8, composure: 'steady',
      highLevERA: 3.15, lowLevERA: 3.45, highLevKPct: 25.8, highLevBBPct: 7.2, highLevWhip: 1.10,
      rispBA: .228, rispOPS: .668, rispKPct: 24.5,
      lateCloseERA: 3.25, lateCloseOPS: .680,
      basesLoadedBA: .210, basesLoadedK: 4, basesLoadedBB: 2,
      inheritedScored: 28.5, strandRate: 74.5, shutdownPct: 58,
      notes: 'Slightly better under pressure. Curveball is his go-to in tough spots. Consistent but not dominant.',
    },
    {
      name: 'Nate Livingston', team: 'SEA', role: 'SP', ip: 178.0,
      clutchScore: 0.5, composure: 'average',
      highLevERA: 3.55, lowLevERA: 3.42, highLevKPct: 22.5, highLevBBPct: 8.5, highLevWhip: 1.18,
      rispBA: .248, rispOPS: .715, rispKPct: 21.8,
      lateCloseERA: 3.68, lateCloseOPS: .728,
      basesLoadedBA: .250, basesLoadedK: 3, basesLoadedBB: 3,
      inheritedScored: 32.5, strandRate: 70.2, shutdownPct: 48,
      notes: 'Neither rises nor falls in big spots. Average clutch performance across the board. Ground ball approach helps limit damage.',
    },
    {
      name: 'Jason Park', team: 'STL', role: 'RP', ip: 58.0,
      clutchScore: -5.8, composure: 'meltdown',
      highLevERA: 7.25, lowLevERA: 2.85, highLevKPct: 15.5, highLevBBPct: 14.8, highLevWhip: 1.78,
      rispBA: .325, rispOPS: .935, rispKPct: 14.2,
      lateCloseERA: 7.85, lateCloseOPS: .965,
      basesLoadedBA: .400, basesLoadedK: 1, basesLoadedBB: 5,
      inheritedScored: 55.2, strandRate: 55.8, shutdownPct: 18,
      notes: 'Completely falls apart in pressure situations. Walking the ballpark. Cannot be used in high-leverage under any circumstances.',
    },
    {
      name: 'Derek Calloway', team: 'HOU', role: 'SP', ip: 192.0,
      clutchScore: 4.2, composure: 'steady',
      highLevERA: 2.85, lowLevERA: 3.32, highLevKPct: 30.2, highLevBBPct: 6.8, highLevWhip: 0.98,
      rispBA: .205, rispOPS: .598, rispKPct: 28.5,
      lateCloseERA: 2.95, lateCloseOPS: .612,
      basesLoadedBA: .190, basesLoadedK: 6, basesLoadedBB: 1,
      inheritedScored: 20.5, strandRate: 80.2, shutdownPct: 72,
      notes: 'Big-game pitcher. Ramps up the fastball and attacks. Low walk rate in big spots shows confidence and composure.',
    },
  ];

  return data.map((d, i) => ({ ...d, id: `cpi-${i}` }));
}
