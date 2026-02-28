/**
 * Defensive Metrics Dashboard
 *
 * Comprehensive defensive analytics including DRS, OAA,
 * range factor, UZR, and position-specific metrics.
 * Helps evaluate defensive value vs offensive production.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DefenseGrade = 'gold_glove' | 'above_avg' | 'average' | 'below_avg' | 'liability';

export const DEFENSE_GRADE_DISPLAY: Record<DefenseGrade, { label: string; emoji: string; color: string }> = {
  gold_glove: { label: 'Gold Glove',  emoji: '🥇', color: '#eab308' },
  above_avg:  { label: 'Above Avg',   emoji: '👍', color: '#22c55e' },
  average:    { label: 'Average',      emoji: '➖', color: '#6b7280' },
  below_avg:  { label: 'Below Avg',    emoji: '👎', color: '#f97316' },
  liability:  { label: 'Liability',    emoji: '⚠️', color: '#ef4444' },
};

export interface DefensivePlayer {
  id: number;
  name: string;
  pos: string;
  overall: number;
  defenseRating: number;     // 20-80 scale
  drs: number;               // Defensive Runs Saved
  oaa: number;               // Outs Above Average
  uzr: number;               // Ultimate Zone Rating
  rangeFactor: number;        // range per 9 innings
  fieldingPct: number;        // .xxx format
  errors: number;
  assists: number;
  putouts: number;
  doublePlays: number;
  innings: number;            // defensive innings
  armStrength: number;        // 20-80 (for OF/C)
  grade: DefenseGrade;
  defWAR: number;             // defensive WAR component
}

export interface DefenseSummary {
  teamDRS: number;
  teamOAA: number;
  goldGloveCount: number;
  liabilityCount: number;
  teamFieldingPct: number;
  teamErrors: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getDefenseGrade(drs: number, oaa: number): DefenseGrade {
  const composite = drs + oaa;
  if (composite >= 15) return 'gold_glove';
  if (composite >= 5) return 'above_avg';
  if (composite >= -5) return 'average';
  if (composite >= -15) return 'below_avg';
  return 'liability';
}

export function getDefenseSummary(players: DefensivePlayer[]): DefenseSummary {
  return {
    teamDRS: players.reduce((s, p) => s + p.drs, 0),
    teamOAA: players.reduce((s, p) => s + p.oaa, 0),
    goldGloveCount: players.filter(p => p.grade === 'gold_glove').length,
    liabilityCount: players.filter(p => p.grade === 'liability').length,
    teamFieldingPct: Math.round(players.reduce((s, p) => s + p.fieldingPct, 0) / players.length * 1000) / 1000,
    teamErrors: players.reduce((s, p) => s + p.errors, 0),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoDefense(): DefensivePlayer[] {
  const data = [
    { name: 'Matt Chapman',     pos: '3B', ovr: 78, def: 75, drs: 18, oaa: 12, uzr: 15.2, rf: 2.85, fp: .978, err: 6,  ast: 280, po: 95,  dp: 28, inn: 1200, arm: 65, dw: 2.5 },
    { name: 'Andrelton Simmons',pos: 'SS', ovr: 62, def: 80, drs: 14, oaa: 10, uzr: 12.5, rf: 4.25, fp: .982, err: 5,  ast: 350, po: 180, dp: 85, inn: 1100, arm: 60, dw: 2.2 },
    { name: 'J.T. Realmuto',    pos: 'C',  ovr: 80, def: 72, drs: 12, oaa: 8,  uzr: 0,    rf: 0,    fp: .995, err: 3,  ast: 65,  po: 800, dp: 5,  inn: 1050, arm: 75, dw: 1.8 },
    { name: 'Mookie Betts',     pos: '2B', ovr: 88, def: 70, drs: 8,  oaa: 6,  uzr: 7.5,  rf: 4.50, fp: .985, err: 4,  ast: 320, po: 200, dp: 90, inn: 1250, arm: 55, dw: 1.2 },
    { name: 'Harrison Bader',   pos: 'CF', ovr: 65, def: 78, drs: 15, oaa: 14, uzr: 13.8, rf: 2.70, fp: .990, err: 2,  ast: 8,   po: 300, dp: 0,  inn: 1150, arm: 68, dw: 2.0 },
    { name: 'Freddie Freeman',  pos: '1B', ovr: 87, def: 55, drs: -2, oaa: -1, uzr: -1.5, rf: 8.50, fp: .994, err: 5,  ast: 85,  po: 1100, dp: 100, inn: 1300, arm: 45, dw: -0.2 },
    { name: 'Kyle Schwarber',   pos: 'LF', ovr: 78, def: 30, drs: -12, oaa: -10, uzr: -10.2, rf: 1.60, fp: .975, err: 8, ast: 4, po: 150, dp: 0, inn: 900, arm: 40, dw: -1.5 },
    { name: 'Jose Abreu',       pos: 'DH', ovr: 68, def: 25, drs: -15, oaa: -12, uzr: -8.5, rf: 7.50, fp: .988, err: 10, ast: 50, po: 800, dp: 75, inn: 600, arm: 35, dw: -2.0 },
  ];

  return data.map((d, i) => ({
    id: i,
    name: d.name,
    pos: d.pos,
    overall: d.ovr,
    defenseRating: d.def,
    drs: d.drs,
    oaa: d.oaa,
    uzr: d.uzr,
    rangeFactor: d.rf,
    fieldingPct: d.fp,
    errors: d.err,
    assists: d.ast,
    putouts: d.po,
    doublePlays: d.dp,
    innings: d.inn,
    armStrength: d.arm,
    grade: getDefenseGrade(d.drs, d.oaa),
    defWAR: d.dw,
  }));
}
