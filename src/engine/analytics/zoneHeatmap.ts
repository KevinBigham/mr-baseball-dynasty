/**
 * zoneHeatmap.ts – Strike zone contact heatmap
 *
 * Visualizes batter performance by zone location across a 5x5 grid.
 * Tracks batting average, slugging, whiff rate, and contact quality
 * by zone for scouting and pitch selection strategy.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface ZoneCell {
  row: number;      // 0-4 (top to bottom)
  col: number;      // 0-4 (inside to outside for RHB)
  pitchCount: number;
  swingPct: number;
  whiffPct: number;
  battingAvg: number;
  slugging: number;
  hardHitPct: number;
  isStrikeZone: boolean;  // rows 1-3, cols 1-3
}

export interface HitterZoneProfile {
  id: string;
  name: string;
  pos: string;
  team: string;
  overall: number;
  batSide: 'L' | 'R' | 'S';
  zones: ZoneCell[];         // 25 cells (5x5)
  bestZone: string;          // e.g. "middle-in"
  worstZone: string;
  chaseRate: number;
  inZoneContactRate: number;
  inZoneWhiffRate: number;
  outZoneSwingRate: number;
  notes: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getZoneLabel(row: number, col: number): string {
  const rowLabels = ['High', 'Upper', 'Middle', 'Lower', 'Low'];
  const colLabels = ['In', 'Inner', 'Center', 'Outer', 'Out'];
  return `${rowLabels[row]}-${colLabels[col]}`;
}

export function getHeatColor(value: number, max: number): string {
  const pct = Math.min(value / max, 1);
  if (pct >= 0.8) return '#ef4444';   // hot
  if (pct >= 0.6) return '#f97316';
  if (pct >= 0.4) return '#f59e0b';
  if (pct >= 0.2) return '#3b82f6';
  return '#1e3a5f';                    // cold
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface ZoneSummary {
  teamChaseRate: number;
  teamInZoneContact: number;
  bestHotZoneHitter: string;
  coldZoneKing: string;
  avgHardHitInZone: number;
}

export function getZoneSummary(profiles: HitterZoneProfile[]): ZoneSummary {
  const n = profiles.length;
  const avgChase = Math.round(profiles.reduce((s, p) => s + p.chaseRate, 0) / n * 10) / 10;
  const avgContact = Math.round(profiles.reduce((s, p) => s + p.inZoneContactRate, 0) / n * 10) / 10;

  // Best hot zone = highest peak zone BA
  let bestPeak = 0, bestName = '';
  let worstOutside = 100, worstName = '';
  profiles.forEach(p => {
    const maxBA = Math.max(...p.zones.filter(z => z.isStrikeZone).map(z => z.battingAvg));
    const chasePct = p.chaseRate;
    if (maxBA > bestPeak) { bestPeak = maxBA; bestName = p.name; }
    if (chasePct < worstOutside) { worstOutside = chasePct; worstName = p.name; }
  });

  const allInZone = profiles.flatMap(p => p.zones.filter(z => z.isStrikeZone));
  const avgHardHit = Math.round(allInZone.reduce((s, z) => s + z.hardHitPct, 0) / allInZone.length * 10) / 10;

  return {
    teamChaseRate: avgChase,
    teamInZoneContact: avgContact,
    bestHotZoneHitter: bestName,
    coldZoneKing: worstName,
    avgHardHitInZone: avgHardHit,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const HITTERS = [
  { name: 'Aaron Judge', pos: 'RF', team: 'NYY', ovr: 95, side: 'R' as const },
  { name: 'Juan Soto', pos: 'LF', team: 'NYM', ovr: 93, side: 'L' as const },
  { name: 'Shohei Ohtani', pos: 'DH', team: 'LAD', ovr: 97, side: 'L' as const },
  { name: 'Freddie Freeman', pos: '1B', team: 'LAD', ovr: 88, side: 'L' as const },
  { name: 'Bobby Witt Jr.', pos: 'SS', team: 'KC', ovr: 91, side: 'R' as const },
  { name: 'Mookie Betts', pos: 'SS', team: 'LAD', ovr: 92, side: 'R' as const },
  { name: 'Corey Seager', pos: 'SS', team: 'TEX', ovr: 88, side: 'L' as const },
  { name: 'Yordan Alvarez', pos: 'DH', team: 'HOU', ovr: 91, side: 'L' as const },
  { name: 'Ronald Acuña Jr.', pos: 'CF', team: 'ATL', ovr: 94, side: 'R' as const },
  { name: 'Mike Trout', pos: 'CF', team: 'LAA', ovr: 90, side: 'R' as const },
];

function makeZones(seed: number): ZoneCell[] {
  const zones: ZoneCell[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isStrike = r >= 1 && r <= 3 && c >= 1 && c <= 3;
      const centerBonus = isStrike ? 0.08 : -0.04;
      const middleBonus = (r === 2 && c === 2) ? 0.12 : 0;
      const pitchCount = isStrike ? 25 + ((seed * 3 + r * 7 + c * 11) % 30) : 8 + ((seed + r * 5 + c * 3) % 15);
      const swingPct = isStrike ? 60 + ((seed + r * 3 + c * 7) % 25) : 20 + ((seed * 5 + r + c * 3) % 20);
      const whiff = isStrike ? 10 + ((seed * 2 + r * 5 + c) % 15) : 30 + ((seed + r * 3 + c * 5) % 25);
      const ba = Math.max(0.050, 0.220 + centerBonus + middleBonus + ((seed * 3 + r * c) % 8) * 0.015 - ((seed + r * 7) % 6) * 0.01);
      const slg = ba * (1.4 + centerBonus * 3 + middleBonus * 2);
      const hardHit = isStrike ? 35 + ((seed + r * c * 3) % 25) : 20 + ((seed * 7 + r + c) % 20);
      zones.push({
        row: r, col: c,
        pitchCount,
        swingPct: Math.round(swingPct),
        whiffPct: Math.round(whiff),
        battingAvg: Math.round(ba * 1000) / 1000,
        slugging: Math.round(slg * 1000) / 1000,
        hardHitPct: Math.round(hardHit),
        isStrikeZone: isStrike,
      });
    }
  }
  return zones;
}

export function generateDemoZoneHeatmap(): HitterZoneProfile[] {
  return HITTERS.map((h, i) => {
    const zones = makeZones(i + 42);
    const inZone = zones.filter(z => z.isStrikeZone);
    const outZone = zones.filter(z => !z.isStrikeZone);
    const bestZ = inZone.reduce((a, b) => a.battingAvg > b.battingAvg ? a : b, inZone[0]);
    const worstZ = inZone.reduce((a, b) => a.battingAvg < b.battingAvg ? a : b, inZone[0]);
    const chase = Math.round(outZone.reduce((s, z) => s + z.swingPct, 0) / outZone.length * 10) / 10;
    const izContact = Math.round((100 - inZone.reduce((s, z) => s + z.whiffPct, 0) / inZone.length) * 10) / 10;
    const izWhiff = Math.round(inZone.reduce((s, z) => s + z.whiffPct, 0) / inZone.length * 10) / 10;
    const ozSwing = Math.round(outZone.reduce((s, z) => s + z.swingPct, 0) / outZone.length * 10) / 10;
    return {
      id: `zh-${i}`,
      name: h.name,
      pos: h.pos,
      team: h.team,
      overall: h.ovr,
      batSide: h.side,
      zones,
      bestZone: getZoneLabel(bestZ.row, bestZ.col),
      worstZone: getZoneLabel(worstZ.row, worstZ.col),
      chaseRate: chase,
      inZoneContactRate: izContact,
      inZoneWhiffRate: izWhiff,
      outZoneSwingRate: ozSwing,
      notes: chase < 25 ? 'Elite plate discipline. Rarely chases out of zone.' :
             chase < 30 ? 'Good eye at the plate. Selective approach.' :
             chase < 35 ? 'Average chase rate. Can be exploited with breaking balls.' :
             'Aggressive approach. Chases pitches off the plate.',
    };
  });
}
