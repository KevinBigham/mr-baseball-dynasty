/**
 * runExpectancy.ts – Run expectancy matrix
 *
 * Provides base-out state run expectancy values, compares team performance
 * vs expected, and identifies situational strengths/weaknesses.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BaseState = '---' | '1--' | '-2-' | '--3' | '12-' | '1-3' | '-23' | '123';

export interface RECell {
  baseState: BaseState;
  outs: number;
  leagueRE: number;      // league average run expectancy
  teamRE: number;         // team's actual RE
  diff: number;           // team - league
  opportunities: number;  // # of times in this state
}

export interface RunExpectancyData {
  id: string;
  teamName: string;
  abbr: string;
  matrix: RECell[];
  totalRunsAboveExpected: number;
  biggestStrength: string;       // base-out state description
  biggestWeakness: string;
  clutchRE: number;              // RE in high-leverage states
  notes: string;
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface RunExpectancySummary {
  totalTeams: number;
  bestTeam: string;
  worstTeam: string;
  avgRunsAboveExpected: number;
  bestClutch: string;
}

export function getRunExpectancySummary(teams: RunExpectancyData[]): RunExpectancySummary {
  const best = teams.reduce((a, b) => a.totalRunsAboveExpected > b.totalRunsAboveExpected ? a : b);
  const worst = teams.reduce((a, b) => a.totalRunsAboveExpected < b.totalRunsAboveExpected ? a : b);
  const avg = teams.reduce((s, t) => s + t.totalRunsAboveExpected, 0) / teams.length;
  const bestClutch = teams.reduce((a, b) => a.clutchRE > b.clutchRE ? a : b);

  return {
    totalTeams: teams.length,
    bestTeam: best.abbr,
    worstTeam: worst.abbr,
    avgRunsAboveExpected: Math.round(avg * 10) / 10,
    bestClutch: bestClutch.abbr,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const BASE_STATE_LABELS: Record<BaseState, string> = {
  '---': 'Empty', '1--': '1st', '-2-': '2nd', '--3': '3rd',
  '12-': '1st & 2nd', '1-3': '1st & 3rd', '-23': '2nd & 3rd', '123': 'Loaded',
};

export function baseStateLabel(s: BaseState): string {
  return BASE_STATE_LABELS[s];
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

function makeMatrix(offsets: number[]): RECell[] {
  // League average RE matrix (base state x outs: 0, 1, 2)
  const leagueRE: [BaseState, number, number, number][] = [
    ['---', 0.481, 0.254, 0.098],
    ['1--', 0.859, 0.509, 0.224],
    ['-2-', 1.100, 0.664, 0.319],
    ['--3', 1.354, 0.950, 0.353],
    ['12-', 1.437, 0.884, 0.429],
    ['1-3', 1.798, 1.140, 0.471],
    ['-23', 1.946, 1.352, 0.570],
    ['123', 2.282, 1.520, 0.736],
  ];

  let idx = 0;
  const cells: RECell[] = [];
  for (const [bs, re0, re1, re2] of leagueRE) {
    for (let outs = 0; outs < 3; outs++) {
      const leagueVal = [re0, re1, re2][outs];
      const teamVal = Math.round((leagueVal + offsets[idx]) * 1000) / 1000;
      cells.push({
        baseState: bs, outs, leagueRE: leagueVal,
        teamRE: teamVal, diff: Math.round((teamVal - leagueVal) * 1000) / 1000,
        opportunities: 150 + Math.floor(Math.random() * 200),
      });
      idx++;
    }
  }
  return cells;
}

export function generateDemoRunExpectancy(): RunExpectancyData[] {
  const teams: Array<{ name: string; abbr: string; offsets: number[]; notes: string }> = [
    {
      name: 'Los Angeles Dodgers', abbr: 'LAD',
      offsets: [0.05, 0.03, 0.02, 0.08, 0.06, 0.04, 0.10, 0.07, 0.05, 0.12, 0.09, 0.06, 0.08, 0.05, 0.03, 0.15, 0.12, 0.08, 0.14, 0.10, 0.06, 0.18, 0.14, 0.10],
      notes: 'Elite run production across all base-out states. Especially dominant with runners in scoring position.',
    },
    {
      name: 'Atlanta Braves', abbr: 'ATL',
      offsets: [0.04, 0.02, 0.01, 0.06, 0.05, 0.03, 0.08, 0.06, 0.04, 0.10, 0.08, 0.05, 0.07, 0.04, 0.02, 0.12, 0.09, 0.06, 0.11, 0.08, 0.05, 0.15, 0.11, 0.08],
      notes: 'Consistently above average. Strong with runners on, excellent two-out clutch hitting.',
    },
    {
      name: 'Kansas City Royals', abbr: 'KC',
      offsets: [-0.05, -0.03, -0.02, -0.08, -0.05, -0.04, -0.10, -0.08, -0.05, -0.12, -0.09, -0.06, -0.08, -0.06, -0.03, -0.14, -0.11, -0.08, -0.12, -0.09, -0.06, -0.16, -0.12, -0.09],
      notes: 'Below average in nearly every base-out state. Struggle with RISP and bases loaded situations.',
    },
    {
      name: 'Houston Astros', abbr: 'HOU',
      offsets: [0.03, 0.01, 0.00, 0.05, 0.04, 0.02, 0.06, 0.04, 0.03, 0.08, 0.06, 0.04, 0.05, 0.03, 0.01, 0.10, 0.08, 0.05, 0.09, 0.07, 0.04, 0.12, 0.09, 0.06],
      notes: 'Above average across the board. Particularly strong in bases loaded situations.',
    },
    {
      name: 'Chicago White Sox', abbr: 'CWS',
      offsets: [-0.08, -0.05, -0.03, -0.10, -0.08, -0.06, -0.14, -0.10, -0.07, -0.16, -0.12, -0.08, -0.12, -0.09, -0.05, -0.18, -0.14, -0.10, -0.15, -0.12, -0.08, -0.20, -0.16, -0.12],
      notes: 'Worst run production relative to expected. Bases loaded with less than 2 outs is a major weakness.',
    },
    {
      name: 'New York Yankees', abbr: 'NYY',
      offsets: [0.06, 0.04, 0.02, 0.04, 0.02, -0.01, 0.08, 0.05, 0.02, 0.06, 0.03, 0.00, 0.10, 0.06, 0.03, 0.05, 0.02, -0.02, 0.12, 0.08, 0.04, 0.08, 0.04, 0.00],
      notes: 'Feast or famine. Very strong with bases empty (homers), but struggle to string hits together with RISP.',
    },
  ];

  return teams.map((t, i) => {
    const matrix = makeMatrix(t.offsets);
    const totalAbove = matrix.reduce((s, c) => s + c.diff * (c.opportunities / 100), 0);
    const bestCell = matrix.reduce((a, b) => a.diff > b.diff ? a : b);
    const worstCell = matrix.reduce((a, b) => a.diff < b.diff ? a : b);
    const clutchCells = matrix.filter(c => ['1-3', '-23', '123'].includes(c.baseState));
    const clutchRE = clutchCells.reduce((s, c) => s + c.diff, 0) / clutchCells.length;

    return {
      id: `re-${i}`,
      teamName: t.name, abbr: t.abbr,
      matrix,
      totalRunsAboveExpected: Math.round(totalAbove * 10) / 10,
      biggestStrength: `${baseStateLabel(bestCell.baseState)}, ${bestCell.outs} out`,
      biggestWeakness: `${baseStateLabel(worstCell.baseState)}, ${worstCell.outs} out`,
      clutchRE: Math.round(clutchRE * 1000) / 1000,
      notes: t.notes,
    };
  });
}
