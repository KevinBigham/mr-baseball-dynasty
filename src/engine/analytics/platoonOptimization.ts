/**
 * platoonOptimization.ts – Platoon Optimization Engine
 *
 * Evaluates platoon pair deployments across the roster:
 *   - L/R split performance analysis for each player
 *   - Optimal platoon pairing identification
 *   - Combined wOBA projections for platoon pairs
 *   - Deployment scoring (0-100) based on split advantage
 *   - Platoon grading system (elite → poor)
 *
 * Bloomberg terminal aesthetic: #22c55e good, #ef4444 bad, #f59e0b neutral.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type PlatoonRole = 'primary_L' | 'primary_R' | 'everyday' | 'bench_L' | 'bench_R';

export interface PlatoonSplitLine {
  avg: number;
  obp: number;
  slg: number;
  wOBA: number;
  ops: number;
  pa: number;
}

export interface PlatoonSplit {
  vsLHP: PlatoonSplitLine;
  vsRHP: PlatoonSplitLine;
}

export interface PlatoonPlayer {
  name: string;
  bats: 'L' | 'R' | 'S';
  role: PlatoonRole;
  splits: PlatoonSplit;
  overall: number;
}

export interface PlatoonPair {
  id: string;
  position: string;
  playerA: PlatoonPlayer;
  playerB: PlatoonPlayer;
  combinedWOBA: number;
  platoonAdvantage: number;
  deploymentScore: number;
  optimalSplit: string;
  notes: string;
}

export type PlatoonGrade = 'elite' | 'strong' | 'average' | 'weak' | 'poor';

// ── Display Maps ───────────────────────────────────────────────────────────

export const PLATOON_GRADE_DISPLAY: Record<PlatoonGrade, { label: string; color: string }> = {
  elite:   { label: 'Elite Platoon',   color: '#22c55e' },
  strong:  { label: 'Strong Platoon',  color: '#4ade80' },
  average: { label: 'Average Platoon', color: '#f59e0b' },
  weak:    { label: 'Weak Platoon',    color: '#f97316' },
  poor:    { label: 'Poor Platoon',    color: '#ef4444' },
};

export function platoonGradeFromScore(score: number): PlatoonGrade {
  if (score >= 85) return 'elite';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'average';
  if (score >= 30) return 'weak';
  return 'poor';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface PlatoonOptimizationSummary {
  totalPairs: number;
  bestPair: string;
  avgAdvantage: number;
  bestCombinedWOBA: number;
  elitePlatoons: number;
}

export function getPlatoonOptimizationSummary(pairs: PlatoonPair[]): PlatoonOptimizationSummary {
  if (pairs.length === 0) {
    return { totalPairs: 0, bestPair: '-', avgAdvantage: 0, bestCombinedWOBA: 0, elitePlatoons: 0 };
  }

  const sorted = [...pairs].sort((a, b) => b.deploymentScore - a.deploymentScore);
  const best = sorted[0];
  const avgAdv = pairs.reduce((s, p) => s + p.platoonAdvantage, 0) / pairs.length;
  const bestWOBA = Math.max(...pairs.map(p => p.combinedWOBA));
  const eliteCount = pairs.filter(p => platoonGradeFromScore(p.deploymentScore) === 'elite').length;

  return {
    totalPairs: pairs.length,
    bestPair: best.position,
    avgAdvantage: Math.round(avgAdv * 1000) / 1000,
    bestCombinedWOBA: Math.round(bestWOBA * 1000) / 1000,
    elitePlatoons: eliteCount,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sl(avg: number, obp: number, slg: number, wOBA: number, pa: number): PlatoonSplitLine {
  return { avg, obp, slg, wOBA, ops: Math.round((obp + slg) * 1000) / 1000, pa };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoPlatoonOptimization(): PlatoonPair[] {
  return [
    // ── 1. Elite L/R platoon in LF ──────────────────────────────────────
    {
      id: 'plt-lf-martinez-foster',
      position: 'LF',
      playerA: {
        name: 'Jake Martinez',
        bats: 'L',
        role: 'primary_R',
        overall: 72,
        splits: {
          vsLHP: sl(.218, .285, .328, .268, 142),
          vsRHP: sl(.292, .368, .498, .372, 386),
        },
      },
      playerB: {
        name: 'Ryan Foster',
        bats: 'R',
        role: 'primary_L',
        overall: 68,
        splits: {
          vsLHP: sl(.286, .358, .478, .358, 198),
          vsRHP: sl(.228, .298, .348, .282, 312),
        },
      },
      combinedWOBA: .362,
      platoonAdvantage: .028,
      deploymentScore: 88,
      optimalSplit: '70/30 A vs RHP',
      notes: 'Elite platoon pair. Martinez crushes RHP (.372 wOBA), Foster mashes LHP (.358). Combined production mimics an All-Star.',
    },

    // ── 2. Strong platoon at 1B ─────────────────────────────────────────
    {
      id: 'plt-1b-thompson-ruiz',
      position: '1B',
      playerA: {
        name: 'Derek Thompson',
        bats: 'L',
        role: 'primary_R',
        overall: 74,
        splits: {
          vsLHP: sl(.232, .302, .388, .298, 156),
          vsRHP: sl(.278, .355, .512, .368, 402),
        },
      },
      playerB: {
        name: 'Carlos Ruiz',
        bats: 'R',
        role: 'primary_L',
        overall: 65,
        splits: {
          vsLHP: sl(.274, .342, .465, .348, 188),
          vsRHP: sl(.215, .278, .318, .262, 298),
        },
      },
      combinedWOBA: .358,
      platoonAdvantage: .022,
      deploymentScore: 82,
      optimalSplit: '68/32 A vs RHP',
      notes: 'Strong platoon. Thompson provides power vs RHP (.512 SLG). Ruiz handles LHP well. Slight defensive edge to Thompson.',
    },

    // ── 3. Average platoon in RF ────────────────────────────────────────
    {
      id: 'plt-rf-bell-reeves',
      position: 'RF',
      playerA: {
        name: 'Marcus Bell',
        bats: 'R',
        role: 'primary_L',
        overall: 70,
        splits: {
          vsLHP: sl(.298, .372, .488, .368, 204),
          vsRHP: sl(.248, .318, .398, .312, 348),
        },
      },
      playerB: {
        name: 'Tony Reeves',
        bats: 'L',
        role: 'primary_R',
        overall: 66,
        splits: {
          vsLHP: sl(.208, .268, .302, .248, 128),
          vsRHP: sl(.272, .348, .452, .342, 362),
        },
      },
      combinedWOBA: .348,
      platoonAdvantage: .018,
      deploymentScore: 74,
      optimalSplit: '55/45 A vs LHP',
      notes: 'Solid platoon. Bell is the better overall player but Reeves adds value vs RHP. Bell could start everyday in a pinch.',
    },

    // ── 4. Strong DH platoon ────────────────────────────────────────────
    {
      id: 'plt-dh-hawkins-johnson',
      position: 'DH',
      playerA: {
        name: 'Steve Hawkins',
        bats: 'L',
        role: 'primary_R',
        overall: 68,
        splits: {
          vsLHP: sl(.198, .262, .298, .248, 108),
          vsRHP: sl(.268, .342, .468, .348, 384),
        },
      },
      playerB: {
        name: 'Andre Johnson',
        bats: 'R',
        role: 'primary_L',
        overall: 64,
        splits: {
          vsLHP: sl(.262, .332, .442, .332, 176),
          vsRHP: sl(.218, .282, .328, .268, 286),
        },
      },
      combinedWOBA: .342,
      platoonAdvantage: .024,
      deploymentScore: 78,
      optimalSplit: '65/35 A vs RHP',
      notes: 'DH platoon with large splits. Hawkins useless vs LHP (.248 wOBA) but great vs RHP. Johnson reverses the pattern. Textbook platoon.',
    },

    // ── 5. Weak catcher platoon ─────────────────────────────────────────
    {
      id: 'plt-c-park-cruz',
      position: 'C',
      playerA: {
        name: 'Kevin Park',
        bats: 'R',
        role: 'primary_L',
        overall: 72,
        splits: {
          vsLHP: sl(.268, .338, .418, .328, 186),
          vsRHP: sl(.242, .308, .378, .298, 328),
        },
      },
      playerB: {
        name: 'Danny Cruz',
        bats: 'L',
        role: 'bench_R',
        overall: 58,
        splits: {
          vsLHP: sl(.188, .248, .268, .228, 82),
          vsRHP: sl(.252, .328, .408, .318, 218),
        },
      },
      combinedWOBA: .318,
      platoonAdvantage: .008,
      deploymentScore: 42,
      optimalSplit: '75/25 A primary',
      notes: 'Weak platoon. Park is clearly the better player and defensive catcher. Cruz adds marginal value vs RHP. Mainly a rest-day backup.',
    },
  ];
}
