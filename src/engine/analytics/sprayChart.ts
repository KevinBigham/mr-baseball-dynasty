/**
 * Spray Chart Analysis
 *
 * Visual representation of where batted balls land on the field.
 * Tracks hit distribution by zone, type, and quality of contact.
 * Used for defensive positioning and scouting.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type FieldZone = 'left_line' | 'left_field' | 'left_center' | 'center' | 'right_center' | 'right_field' | 'right_line';

export const ZONE_DISPLAY: Record<FieldZone, { label: string; abbr: string; color: string; x: number; y: number }> = {
  left_line:    { label: 'Left Line',    abbr: 'LL', color: '#ef4444', x: 15, y: 55 },
  left_field:   { label: 'Left Field',   abbr: 'LF', color: '#f97316', x: 25, y: 35 },
  left_center:  { label: 'Left-Center',  abbr: 'LC', color: '#eab308', x: 38, y: 22 },
  center:       { label: 'Center',       abbr: 'CF', color: '#22c55e', x: 50, y: 18 },
  right_center: { label: 'Right-Center', abbr: 'RC', color: '#3b82f6', x: 62, y: 22 },
  right_field:  { label: 'Right Field',  abbr: 'RF', color: '#8b5cf6', x: 75, y: 35 },
  right_line:   { label: 'Right Line',   abbr: 'RL', color: '#ec4899', x: 85, y: 55 },
};

export interface ZoneData {
  zone: FieldZone;
  count: number;
  pct: number;
  hits: number;
  avg: number;
  hr: number;
  hardHitPct: number;
}

export interface SprayChartPlayer {
  id: number;
  name: string;
  pos: string;
  hand: 'L' | 'R' | 'S';
  overall: number;
  totalBIP: number;         // balls in play
  zones: ZoneData[];
  pullPct: number;
  centerPct: number;
  oppoPct: number;
  hardHitRate: number;
  avgExitVelo: number;
  favoriteZone: FieldZone;
}

export interface SprayChartSummary {
  teamPullPct: number;
  teamCenterPct: number;
  teamOppoPct: number;
  teamHardHitRate: number;
  mostPullHitter: string;
  mostOppoHitter: string;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getSpraySummary(players: SprayChartPlayer[]): SprayChartSummary {
  const n = players.length;
  const mostPull = players.reduce((b, p) => p.pullPct > b.pullPct ? p : b, players[0]);
  const mostOppo = players.reduce((b, p) => p.oppoPct > b.oppoPct ? p : b, players[0]);
  return {
    teamPullPct: Math.round(players.reduce((s, p) => s + p.pullPct, 0) / n * 10) / 10,
    teamCenterPct: Math.round(players.reduce((s, p) => s + p.centerPct, 0) / n * 10) / 10,
    teamOppoPct: Math.round(players.reduce((s, p) => s + p.oppoPct, 0) / n * 10) / 10,
    teamHardHitRate: Math.round(players.reduce((s, p) => s + p.hardHitRate, 0) / n * 10) / 10,
    mostPullHitter: mostPull.name,
    mostOppoHitter: mostOppo.name,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

function makeZones(ll: number, lf: number, lc: number, cf: number, rc: number, rf: number, rl: number, bip: number): ZoneData[] {
  const totPct = ll + lf + lc + cf + rc + rf + rl;
  const zones: [FieldZone, number][] = [
    ['left_line', ll], ['left_field', lf], ['left_center', lc], ['center', cf],
    ['right_center', rc], ['right_field', rf], ['right_line', rl],
  ];
  return zones.map(([zone, pct]) => {
    const count = Math.round((pct / totPct) * bip);
    return {
      zone,
      count,
      pct: Math.round(pct * 10) / 10,
      hits: Math.round(count * (0.28 + Math.random() * 0.08)),
      avg: Math.round((250 + Math.random() * 80)) / 1000,
      hr: zone === 'center' || zone === 'left_center' || zone === 'right_center' ? Math.round(count * 0.06) : Math.round(count * 0.02),
      hardHitPct: Math.round(30 + Math.random() * 25),
    };
  });
}

export function generateDemoSprayCharts(): SprayChartPlayer[] {
  const data = [
    { name: 'Aaron Judge',      pos: 'RF',  hand: 'R' as const, ovr: 92, bip: 420, pull: 48, ctr: 30, opp: 22, hh: 52, ev: 95.8 },
    { name: 'Corey Seager',     pos: 'SS',  hand: 'L' as const, ovr: 86, bip: 400, pull: 44, ctr: 32, opp: 24, hh: 42, ev: 91.5 },
    { name: 'Freddie Freeman',  pos: '1B',  hand: 'L' as const, ovr: 87, bip: 430, pull: 36, ctr: 35, opp: 29, hh: 40, ev: 90.8 },
    { name: 'Kyle Schwarber',   pos: 'LF',  hand: 'L' as const, ovr: 78, bip: 340, pull: 55, ctr: 25, opp: 20, hh: 44, ev: 91.0 },
    { name: 'Bo Bichette',      pos: 'SS',  hand: 'R' as const, ovr: 76, bip: 410, pull: 38, ctr: 38, opp: 24, hh: 34, ev: 88.0 },
    { name: 'Mookie Betts',     pos: '2B',  hand: 'R' as const, ovr: 88, bip: 390, pull: 40, ctr: 33, opp: 27, hh: 42, ev: 91.2 },
    { name: 'Jose Ramirez',     pos: '3B',  hand: 'S' as const, ovr: 88, bip: 420, pull: 42, ctr: 34, opp: 24, hh: 38, ev: 89.5 },
    { name: 'Luis Arraez',      pos: '1B',  hand: 'L' as const, ovr: 76, bip: 450, pull: 30, ctr: 38, opp: 32, hh: 22, ev: 84.0 },
  ];

  return data.map((d, i) => {
    // For LHH: pull = right side; for RHH: pull = left side
    const isLeft = d.hand === 'L';
    const zones = isLeft
      ? makeZones(d.opp * 0.3, d.opp * 0.7, d.ctr * 0.5, d.ctr * 0.5, d.pull * 0.4, d.pull * 0.4, d.pull * 0.2, d.bip)
      : makeZones(d.pull * 0.2, d.pull * 0.4, d.pull * 0.4, d.ctr * 0.5, d.ctr * 0.5, d.opp * 0.7, d.opp * 0.3, d.bip);
    const favZone = zones.reduce((b, z) => z.count > b.count ? z : b, zones[0]).zone;
    return {
      id: i,
      name: d.name,
      pos: d.pos,
      hand: d.hand,
      overall: d.ovr,
      totalBIP: d.bip,
      zones,
      pullPct: d.pull,
      centerPct: d.ctr,
      oppoPct: d.opp,
      hardHitRate: d.hh,
      avgExitVelo: d.ev,
      favoriteZone: favZone,
    };
  });
}
