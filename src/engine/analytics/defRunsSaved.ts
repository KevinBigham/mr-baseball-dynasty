/**
 * defRunsSaved.ts – Defensive runs saved (DRS) tracker
 *
 * Tracks defensive value by player with runs saved components:
 * range runs, arm runs, double play runs, error runs, and
 * good play/misplay tracking.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type DefGrade = 'gold_glove' | 'plus' | 'average' | 'below' | 'liability';

export interface DRSComponents {
  rangeRuns: number;
  armRuns: number;
  dpRuns: number;
  errorRuns: number;
  goodPlays: number;
  misplays: number;
}

export interface DefRunsPlayer {
  id: string;
  name: string;
  pos: string;
  team: string;
  overall: number;
  innings: number;
  totalDRS: number;
  components: DRSComponents;
  uzr: number;           // ultimate zone rating
  oaa: number;           // outs above average
  defGrade: DefGrade;
  percentileRank: number;  // 0-100 among position
  notes: string;
}

export const DEF_GRADE_DISPLAY: Record<DefGrade, { label: string; color: string; emoji: string }> = {
  gold_glove: { label: 'Gold Glove',  color: '#f59e0b', emoji: '🏆' },
  plus:       { label: 'Plus Def',    color: '#22c55e', emoji: '✦' },
  average:    { label: 'Average',     color: '#888',    emoji: '▬' },
  below:      { label: 'Below Avg',   color: '#f97316', emoji: '▼' },
  liability:  { label: 'Liability',   color: '#ef4444', emoji: '⬇' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface DRSSummary {
  teamDRS: number;
  teamUZR: number;
  bestDefender: string;
  worstDefender: string;
  goldGloveContenders: number;
}

export function getDRSSummary(players: DefRunsPlayer[]): DRSSummary {
  const teamDRS = players.reduce((s, p) => s + p.totalDRS, 0);
  const teamUZR = Math.round(players.reduce((s, p) => s + p.uzr, 0) * 10) / 10;
  const sorted = [...players].sort((a, b) => b.totalDRS - a.totalDRS);
  const ggCount = players.filter(p => p.defGrade === 'gold_glove').length;
  return {
    teamDRS: teamDRS,
    teamUZR: teamUZR,
    bestDefender: sorted[0]?.name ?? '',
    worstDefender: sorted[sorted.length - 1]?.name ?? '',
    goldGloveContenders: ggCount,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEFENDERS = [
  { name: 'Matt Chapman', pos: '3B', team: 'SF', ovr: 82 },
  { name: 'Andrés Giménez', pos: '2B', team: 'CLE', ovr: 85 },
  { name: 'Nico Hoerner', pos: '2B', team: 'CHC', ovr: 80 },
  { name: 'Ke\'Bryan Hayes', pos: '3B', team: 'PIT', ovr: 78 },
  { name: 'Dansby Swanson', pos: 'SS', team: 'CHC', ovr: 82 },
  { name: 'Kevin Kiermaier', pos: 'CF', team: 'TOR', ovr: 68 },
  { name: 'Mookie Betts', pos: 'SS', team: 'LAD', ovr: 92 },
  { name: 'Steven Kwan', pos: 'LF', team: 'CLE', ovr: 81 },
  { name: 'Trea Turner', pos: 'SS', team: 'PHI', ovr: 85 },
  { name: 'J.P. Crawford', pos: 'SS', team: 'SEA', ovr: 79 },
  { name: 'Austin Hays', pos: 'LF', team: 'BAL', ovr: 72 },
  { name: 'Pete Alonso', pos: '1B', team: 'NYM', ovr: 83 },
];

function makeGrade(drs: number): DefGrade {
  if (drs >= 15) return 'gold_glove';
  if (drs >= 5) return 'plus';
  if (drs >= -3) return 'average';
  if (drs >= -10) return 'below';
  return 'liability';
}

export function generateDemoDefRunsSaved(): DefRunsPlayer[] {
  return DEFENDERS.map((d, i) => {
    const range = 10 - i * 2 + ((i * 7) % 6);
    const arm = 3 - ((i * 5) % 6) + ((i * 3) % 4);
    const dp = 2 - ((i * 3) % 4);
    const err = 1 - ((i * 7) % 4);
    const total = range + arm + dp + err;
    const uzr = Math.round((total * 0.85 + ((i * 3) % 5) - 2) * 10) / 10;
    const oaa = Math.round(total * 0.7 + ((i * 5) % 4) - 1);
    const gp = 15 + ((i * 11) % 15) - (total < 0 ? 5 : 0);
    const mp = 3 + ((i * 7) % 8) + (total < 0 ? 4 : 0);
    return {
      id: `drs-${i}`,
      name: d.name,
      pos: d.pos,
      team: d.team,
      overall: d.ovr,
      innings: 900 + ((i * 50) % 300),
      totalDRS: total,
      components: {
        rangeRuns: range,
        armRuns: arm,
        dpRuns: dp,
        errorRuns: err,
        goodPlays: gp,
        misplays: mp,
      },
      uzr,
      oaa,
      defGrade: makeGrade(total),
      percentileRank: Math.min(99, Math.max(1, 85 - i * 7 + ((i * 5) % 12))),
      notes: total >= 15 ? 'Elite defender. Gold Glove-caliber at the position.' :
             total >= 5 ? 'Plus defender. Adds clear value with the glove.' :
             total >= -3 ? 'Average defender. Neither helps nor hurts.' :
             'Defensive liability. Bat needs to carry the value.',
    };
  });
}
