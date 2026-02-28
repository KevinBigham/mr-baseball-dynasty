/**
 * pitchingMatchupHeatmap.ts – Pitching Matchup Heatmap
 *
 * Batter vs pitcher zone tendency analysis. Shows where a specific pitcher
 * throws to specific batters, with hot/cold zones, swing/whiff rates,
 * and overall matchup advantage breakdown.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface MatchupZoneCell {
  row: number;        // 1-5 (top to bottom)
  col: number;        // 1-5 (inside to outside)
  pitchPct: number;   // % of pitches thrown to this zone
  hitPct: number;     // hit rate when put in play from this zone
  swingPct: number;   // swing rate at pitches in this zone
  whiffPct: number;   // whiff rate on swings in this zone
}

export interface MatchupResult {
  atBats: number;
  hits: number;
  strikeouts: number;
  walks: number;
  avgExitVelo: number;
  wOBA: number;
}

export interface PitchingMatchup {
  id: string;
  pitcherName: string;
  pitcherTeam: string;
  batterName: string;
  batterTeam: string;
  batterHand: 'L' | 'R';
  zones: MatchupZoneCell[];     // 25 cells (5x5 grid)
  result: MatchupResult;
  tendency: string;
  advantage: 'pitcher' | 'batter' | 'neutral';
  notes: string;
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface MatchupHeatmapSummary {
  totalMatchups: number;
  pitcherAdvantage: number;
  batterAdvantage: number;
  highestWhiffMatchup: { pitcher: string; batter: string; whiff: number };
  highestWobaMatchup: { pitcher: string; batter: string; wOBA: number };
}

export function getMatchupHeatmapSummary(matchups: PitchingMatchup[]): MatchupHeatmapSummary {
  const n = matchups.length;
  const pitcherAdv = matchups.filter(m => m.advantage === 'pitcher').length;
  const batterAdv = matchups.filter(m => m.advantage === 'batter').length;

  // Highest avg whiff across all zones per matchup
  let bestWhiff = 0;
  let bestWhiffPitcher = '';
  let bestWhiffBatter = '';
  matchups.forEach(m => {
    const avgWhiff = m.zones.reduce((s, z) => s + z.whiffPct, 0) / m.zones.length;
    if (avgWhiff > bestWhiff) {
      bestWhiff = avgWhiff;
      bestWhiffPitcher = m.pitcherName;
      bestWhiffBatter = m.batterName;
    }
  });

  // Highest wOBA matchup
  let bestWoba = 0;
  let bestWobaPitcher = '';
  let bestWobaBatter = '';
  matchups.forEach(m => {
    if (m.result.wOBA > bestWoba) {
      bestWoba = m.result.wOBA;
      bestWobaPitcher = m.pitcherName;
      bestWobaBatter = m.batterName;
    }
  });

  return {
    totalMatchups: n,
    pitcherAdvantage: pitcherAdv,
    batterAdvantage: batterAdv,
    highestWhiffMatchup: { pitcher: bestWhiffPitcher, batter: bestWhiffBatter, whiff: Math.round(bestWhiff * 10) / 10 },
    highestWobaMatchup: { pitcher: bestWobaPitcher, batter: bestWobaBatter, wOBA: Math.round(bestWoba * 1000) / 1000 },
  };
}

// ── Zone Heat Color ────────────────────────────────────────────────────────

export function getMatchupHeatColor(value: number, mode: 'whiff' | 'hit' | 'pitch'): string {
  if (mode === 'whiff') {
    if (value >= 40) return '#ef4444';
    if (value >= 30) return '#f97316';
    if (value >= 20) return '#f59e0b';
    if (value >= 10) return '#3b82f6';
    return '#1e3a5f';
  }
  if (mode === 'hit') {
    if (value >= 35) return '#ef4444';
    if (value >= 25) return '#f97316';
    if (value >= 15) return '#f59e0b';
    if (value >= 8) return '#3b82f6';
    return '#1e3a5f';
  }
  // pitch density
  if (value >= 8) return '#ef4444';
  if (value >= 6) return '#f97316';
  if (value >= 4) return '#f59e0b';
  if (value >= 2) return '#3b82f6';
  return '#1e3a5f';
}

// ── Zone Label Helpers ─────────────────────────────────────────────────────

const ROW_LABELS = ['Up', 'Upper-mid', 'Middle', 'Lower-mid', 'Low'];
const COL_LABELS = ['Arm-side', 'Inner', 'Center', 'Outer', 'Glove-side'];

export function getMatchupZoneLabel(row: number, col: number): string {
  return `${COL_LABELS[col - 1]} ${ROW_LABELS[row - 1].toLowerCase()}`;
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const MATCHUP_DATA = [
  { pitcher: 'Corbin Burns', pTeam: 'BAL', batter: 'Juan Soto', bTeam: 'NYY', hand: 'L' as const },
  { pitcher: 'Spencer Strider', pTeam: 'ATL', batter: 'Freddie Freeman', bTeam: 'LAD', hand: 'L' as const },
  { pitcher: 'Zack Wheeler', pTeam: 'PHI', batter: 'Ronald Acuna Jr', bTeam: 'ATL', hand: 'R' as const },
  { pitcher: 'Gerrit Cole', pTeam: 'NYY', batter: 'Rafael Devers', bTeam: 'BOS', hand: 'L' as const },
  { pitcher: 'Blake Snell', pTeam: 'LAD', batter: 'Mookie Betts', bTeam: 'LAD', hand: 'R' as const },
  { pitcher: 'Emmanuel Clase', pTeam: 'CLE', batter: 'Aaron Judge', bTeam: 'NYY', hand: 'R' as const },
  { pitcher: 'Logan Webb', pTeam: 'SF', batter: 'Manny Machado', bTeam: 'SD', hand: 'R' as const },
  { pitcher: 'Framber Valdez', pTeam: 'HOU', batter: 'Corey Seager', bTeam: 'TEX', hand: 'L' as const },
];

function makeMatchupZones(seed: number, hand: 'L' | 'R'): MatchupZoneCell[] {
  const zones: MatchupZoneCell[] = [];
  const isLefty = hand === 'L';

  for (let r = 1; r <= 5; r++) {
    for (let c = 1; c <= 5; c++) {
      const inZone = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      const outerHalf = c >= 4;
      const innerHalf = c <= 2;

      // Pitchers tend to work away from lefties on outer half, inside to righties
      let pitchPct = inZone ? 4.0 + ((seed * 3 + r * c) % 4) * 0.6 : 2.0 + ((seed + r * c) % 3) * 0.4;
      if (isLefty && outerHalf) pitchPct += 1.2;
      if (!isLefty && innerHalf) pitchPct += 1.0;

      const hitPct = inZone
        ? 15 + ((seed * 2 + r * 3 + c) % 18)
        : 8 + ((seed + r * 5 + c * 3) % 12);

      const swingPct = inZone
        ? 55 + ((seed * 3 + r + c * 5) % 20)
        : 25 + ((seed * 2 + r * c) % 22);

      const whiffPct = inZone
        ? 12 + ((seed + r * 2 + c * 3) % 22)
        : 28 + ((seed * 3 + r + c) % 25);

      zones.push({
        row: r,
        col: c,
        pitchPct: Math.round(pitchPct * 10) / 10,
        hitPct: Math.round(hitPct * 10) / 10,
        swingPct: Math.round(swingPct * 10) / 10,
        whiffPct: Math.round(whiffPct * 10) / 10,
      });
    }
  }
  return zones;
}

function makeMatchupResult(seed: number): MatchupResult {
  const atBats = 18 + (seed % 20);
  const hits = Math.round(atBats * (0.180 + (seed % 12) * 0.015));
  const strikeouts = Math.round(atBats * (0.18 + (seed % 8) * 0.02));
  const walks = 2 + (seed % 5);
  const avgExitVelo = Math.round((87 + (seed % 8)) * 10) / 10;
  const wOBA = Math.round((0.260 + (seed % 15) * 0.012) * 1000) / 1000;
  return { atBats, hits, strikeouts, walks, avgExitVelo, wOBA };
}

const TENDENCIES = [
  'Pitcher attacks glove-side low corner, avoids inner half.',
  'Heavy fastball up, slider down and away to get swing-and-miss.',
  'Pitcher pounds the zone, relies on weak contact over chases.',
  'Breaking balls dominate the at-bats, fastball used as setup.',
  'Batter sits on offspeed, pitcher forced to throw harder.',
  'Elevated four-seam exploits bat-path blind spots.',
  'Pitcher works inside to set up outside breaking ball.',
  'Curveball early in counts, changeup as putaway pitch.',
];

export function generateDemoMatchupHeatmap(): PitchingMatchup[] {
  return MATCHUP_DATA.map((m, i) => {
    const zones = makeMatchupZones(i * 7 + 31, m.hand);
    const result = makeMatchupResult(i * 5 + 13);

    const advantage: PitchingMatchup['advantage'] =
      result.wOBA < 0.300 ? 'pitcher'
        : result.wOBA > 0.370 ? 'batter'
        : 'neutral';

    const notes =
      advantage === 'pitcher'
        ? `${m.pitcher} dominates this matchup. ${m.batter} struggles to make solid contact, especially on pitches down and away.`
        : advantage === 'batter'
        ? `${m.batter} owns this matchup with a ${result.wOBA} wOBA. Can drive pitches in multiple zones. Consider pitching around.`
        : `Even matchup — neither side has a clear edge. Execution and pitch sequencing will decide the outcome.`;

    return {
      id: `mh-${i}`,
      pitcherName: m.pitcher,
      pitcherTeam: m.pTeam,
      batterName: m.batter,
      batterTeam: m.bTeam,
      batterHand: m.hand,
      zones,
      result,
      tendency: TENDENCIES[i],
      advantage,
      notes,
    };
  });
}
