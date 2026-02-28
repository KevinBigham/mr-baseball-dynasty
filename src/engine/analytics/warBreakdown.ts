/**
 * WAR Breakdown Dashboard
 *
 * Wins Above Replacement decomposed into components:
 * batting, baserunning, fielding, positional adjustment,
 * and for pitchers: FIP-based WAR.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type WARComponent = 'batting' | 'baserunning' | 'fielding' | 'positional' | 'replacement' | 'pitching';

export const COMPONENT_DISPLAY: Record<WARComponent, { label: string; color: string; desc: string }> = {
  batting:     { label: 'Batting',     color: '#f97316', desc: 'wRC+-based batting runs above average' },
  baserunning: { label: 'Baserunning', color: '#22c55e', desc: 'Stolen base and baserunning value' },
  fielding:    { label: 'Fielding',    color: '#3b82f6', desc: 'UZR/DRS defensive runs saved' },
  positional:  { label: 'Positional',  color: '#8b5cf6', desc: 'Position scarcity adjustment' },
  replacement: { label: 'Replacement', color: '#6b7280', desc: 'Baseline replacement level (~20 runs)' },
  pitching:    { label: 'Pitching',    color: '#ef4444', desc: 'FIP-based pitching runs above replacement' },
};

export interface WARPlayer {
  id: number;
  name: string;
  pos: string;
  team: string;
  age: number;
  isPitcher: boolean;
  totalWAR: number;
  components: Partial<Record<WARComponent, number>>;
  salary: number;    // M
  dollarsPerWAR: number;
  warRank: number;
  percentile: number;
}

export interface WARTeamSummary {
  totalWAR: number;
  positionWAR: number;
  pitchingWAR: number;
  bestPlayer: string;
  avgDollarsPerWAR: number;
  warPerDollar: number;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const PLAYER_WAR_DATA: Array<{
  name: string; pos: string; team: string; age: number; pitcher: boolean; war: number; salary: number;
  bat?: number; run?: number; field?: number; positional?: number; pitch?: number;
}> = [
  { name: 'Shohei Ohtani', pos: 'DH/SP', team: 'LAD', age: 30, pitcher: false, war: 9.2, salary: 70, bat: 5.8, run: 0.4, field: -0.3, positional: -1.2 },
  { name: 'Aaron Judge', pos: 'RF', team: 'NYY', age: 32, pitcher: false, war: 8.1, salary: 40, bat: 6.2, run: -0.3, field: 0.1, positional: -0.2 },
  { name: 'Mookie Betts', pos: '2B', team: 'LAD', age: 31, pitcher: false, war: 7.5, salary: 30.4, bat: 4.1, run: 1.2, field: 1.5, positional: -1.0 },
  { name: 'Bobby Witt Jr.', pos: 'SS', team: 'KC', age: 24, pitcher: false, war: 7.8, salary: 4.2, bat: 3.5, run: 1.8, field: 1.2, positional: 0.8 },
  { name: 'Gunnar Henderson', pos: 'SS', team: 'BAL', age: 23, pitcher: false, war: 6.9, salary: 0.72, bat: 3.8, run: 0.5, field: 0.8, positional: 0.8 },
  { name: 'Corbin Burnes', pos: 'SP', team: 'BAL', age: 29, pitcher: true, war: 6.5, salary: 15.6, pitch: 5.8 },
  { name: 'Zack Wheeler', pos: 'SP', team: 'PHI', age: 34, pitcher: true, war: 6.2, salary: 23.6, pitch: 5.5 },
  { name: 'Gerrit Cole', pos: 'SP', team: 'NYY', age: 34, pitcher: true, war: 5.8, salary: 36, pitch: 5.1 },
  { name: 'Trea Turner', pos: 'SS', team: 'PHI', age: 31, pitcher: false, war: 5.5, salary: 27.3, bat: 2.5, run: 1.5, field: 0.3, positional: 0.8 },
  { name: 'Freddie Freeman', pos: '1B', team: 'LAD', age: 35, pitcher: false, war: 5.2, salary: 27, bat: 4.0, run: -0.2, field: 0.5, positional: -1.2 },
  { name: 'Tarik Skubal', pos: 'SP', team: 'DET', age: 27, pitcher: true, war: 7.2, salary: 2.6, pitch: 6.5 },
  { name: 'Chris Sale', pos: 'SP', team: 'ATL', age: 35, pitcher: true, war: 5.0, salary: 18, pitch: 4.3 },
  { name: 'Jose Ramirez', pos: '3B', team: 'CLE', age: 31, pitcher: false, war: 5.8, salary: 14, bat: 3.2, run: 0.8, field: 0.5, positional: 0.0 },
  { name: 'Juan Soto', pos: 'LF', team: 'NYY', age: 25, pitcher: false, war: 6.8, salary: 31, bat: 5.5, run: -0.1, field: -0.4, positional: -0.5 },
];

export function generateDemoWAR(): WARPlayer[] {
  const sorted = [...PLAYER_WAR_DATA].sort((a, b) => b.war - a.war);
  return sorted.map((p, i) => {
    const replacement = 2.0;
    const components: Partial<Record<WARComponent, number>> = {};

    if (p.pitcher) {
      components.pitching = p.pitch ?? 0;
      components.replacement = replacement;
    } else {
      components.batting = p.bat ?? 0;
      components.baserunning = p.run ?? 0;
      components.fielding = p.field ?? 0;
      components.positional = p.positional ?? 0;
      components.replacement = replacement;
    }

    const dPerWAR = p.war > 0 ? Math.round((p.salary / p.war) * 10) / 10 : 0;

    return {
      id: i,
      name: p.name,
      pos: p.pos,
      team: p.team,
      age: p.age,
      isPitcher: p.pitcher,
      totalWAR: p.war,
      components,
      salary: p.salary,
      dollarsPerWAR: dPerWAR,
      warRank: i + 1,
      percentile: Math.round((1 - i / sorted.length) * 100),
    };
  });
}

export function getTeamWARSummary(players: WARPlayer[]): WARTeamSummary {
  const totalWAR = Math.round(players.reduce((s, p) => s + p.totalWAR, 0) * 10) / 10;
  const positionWAR = Math.round(players.filter(p => !p.isPitcher).reduce((s, p) => s + p.totalWAR, 0) * 10) / 10;
  const pitchingWAR = Math.round(players.filter(p => p.isPitcher).reduce((s, p) => s + p.totalWAR, 0) * 10) / 10;
  const totalSalary = players.reduce((s, p) => s + p.salary, 0);
  const best = players.reduce((b, p) => p.totalWAR > (b?.totalWAR ?? 0) ? p : b, players[0]);

  return {
    totalWAR,
    positionWAR,
    pitchingWAR,
    bestPlayer: best.name,
    avgDollarsPerWAR: totalWAR > 0 ? Math.round((totalSalary / totalWAR) * 10) / 10 : 0,
    warPerDollar: totalSalary > 0 ? Math.round((totalWAR / totalSalary) * 1000) / 1000 : 0,
  };
}
