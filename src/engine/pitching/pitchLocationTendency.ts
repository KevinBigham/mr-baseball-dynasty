/**
 * Pitch Location Tendency Analysis
 *
 * Tracks where a pitcher tends to throw by count, hand, and pitch type.
 * Heat-map style zone usage percentages with whiff rate and contact rate
 * overlays for each zone location across all count states.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CountState =
  | '0-0' | '0-1' | '0-2'
  | '1-0' | '1-1' | '1-2'
  | '2-0' | '2-1' | '2-2'
  | '3-0' | '3-1' | '3-2';

export type ZoneLocation =
  | 'up_in' | 'up_mid' | 'up_away'
  | 'mid_in' | 'heart' | 'mid_away'
  | 'low_in' | 'low_mid' | 'low_away'
  | 'waste';

export const ALL_COUNTS: CountState[] = [
  '0-0', '0-1', '0-2',
  '1-0', '1-1', '1-2',
  '2-0', '2-1', '2-2',
  '3-0', '3-1', '3-2',
];

export const ZONE_GRID: ZoneLocation[][] = [
  ['up_in', 'up_mid', 'up_away'],
  ['mid_in', 'heart', 'mid_away'],
  ['low_in', 'low_mid', 'low_away'],
];

export const ZONE_LABELS: Record<ZoneLocation, string> = {
  up_in: 'Up/In',
  up_mid: 'Up/Mid',
  up_away: 'Up/Away',
  mid_in: 'Mid/In',
  heart: 'Heart',
  mid_away: 'Mid/Away',
  low_in: 'Low/In',
  low_mid: 'Low/Mid',
  low_away: 'Low/Away',
  waste: 'Waste',
};

export interface LocationTendency {
  zone: ZoneLocation;
  pct: number;
  whiffRate: number;
  contactRate: number;
}

export interface CountTendency {
  count: CountState;
  totalPitches: number;
  zones: LocationTendency[];
  primaryZone: ZoneLocation;
}

export interface PitcherLocationProfile {
  pitcherId: number;
  name: string;
  throws: 'L' | 'R';
  counts: CountTendency[];
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getZoneTendency(
  profile: PitcherLocationProfile,
  count: CountState,
): CountTendency | undefined {
  return profile.counts.find(c => c.count === count);
}

export function getHeatColor(pct: number): string {
  if (pct >= 20) return '#ef4444';
  if (pct >= 15) return '#f97316';
  if (pct >= 10) return '#f59e0b';
  if (pct >= 6) return '#eab308';
  if (pct >= 3) return '#3b82f6';
  return '#1e293b';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const ALL_ZONES: ZoneLocation[] = [
  'up_in', 'up_mid', 'up_away',
  'mid_in', 'heart', 'mid_away',
  'low_in', 'low_mid', 'low_away',
  'waste',
];

function makeZones(
  weights: number[],
  whiffBase: number,
  contactBase: number,
): LocationTendency[] {
  const total = weights.reduce((s, w) => s + w, 0);
  return ALL_ZONES.map((zone, i) => {
    const pct = Math.round((weights[i] / total) * 1000) / 10;
    const isWaste = zone === 'waste';
    const isHeart = zone === 'heart';
    return {
      zone,
      pct,
      whiffRate: Math.round((isWaste ? whiffBase * 1.8 : isHeart ? whiffBase * 0.5 : whiffBase + (i % 3) * 2) * 10) / 10,
      contactRate: Math.round((isWaste ? contactBase * 0.4 : isHeart ? contactBase * 1.3 : contactBase - (i % 3) * 3) * 10) / 10,
    };
  });
}

function makeCountTendency(
  count: CountState,
  totalPitches: number,
  weights: number[],
  whiffBase: number,
  contactBase: number,
): CountTendency {
  const zones = makeZones(weights, whiffBase, contactBase);
  const primary = zones.reduce((best, z) => (z.pct > best.pct ? z : best), zones[0]);
  return { count, totalPitches, zones, primaryZone: primary.zone };
}

interface PitcherSeed {
  name: string;
  throws: 'L' | 'R';
  countSeeds: Array<{ count: CountState; n: number; w: number[]; whiff: number; contact: number }>;
}

const PITCHER_DATA: PitcherSeed[] = [
  {
    name: 'Gerrit Cole',
    throws: 'R',
    countSeeds: [
      { count: '0-0', n: 520, w: [8, 12, 10, 6, 15, 8, 7, 14, 10, 10], whiff: 22, contact: 72 },
      { count: '0-1', n: 340, w: [6, 10, 12, 5, 10, 12, 9, 15, 11, 10], whiff: 26, contact: 68 },
      { count: '0-2', n: 210, w: [4, 6, 14, 3, 4, 10, 8, 8, 13, 30], whiff: 38, contact: 52 },
      { count: '1-0', n: 280, w: [10, 14, 8, 8, 18, 6, 6, 12, 8, 10], whiff: 20, contact: 75 },
      { count: '1-1', n: 310, w: [8, 12, 10, 6, 14, 10, 8, 14, 10, 8], whiff: 24, contact: 70 },
      { count: '1-2', n: 250, w: [5, 7, 13, 4, 6, 12, 7, 10, 14, 22], whiff: 35, contact: 55 },
      { count: '2-0', n: 140, w: [10, 16, 8, 8, 22, 6, 4, 12, 6, 8], whiff: 18, contact: 78 },
      { count: '2-1', n: 180, w: [9, 14, 9, 7, 18, 8, 6, 13, 8, 8], whiff: 21, contact: 74 },
      { count: '2-2', n: 220, w: [6, 8, 12, 5, 8, 12, 8, 12, 13, 16], whiff: 30, contact: 60 },
      { count: '3-0', n: 60, w: [8, 18, 6, 6, 30, 6, 2, 14, 4, 6], whiff: 12, contact: 82 },
      { count: '3-1', n: 110, w: [8, 16, 8, 7, 24, 7, 4, 14, 6, 6], whiff: 16, contact: 79 },
      { count: '3-2', n: 180, w: [7, 10, 10, 6, 14, 10, 7, 13, 11, 12], whiff: 26, contact: 66 },
    ],
  },
  {
    name: 'Blake Snell',
    throws: 'L',
    countSeeds: [
      { count: '0-0', n: 480, w: [10, 14, 8, 7, 16, 7, 6, 12, 8, 12], whiff: 24, contact: 68 },
      { count: '0-1', n: 310, w: [8, 10, 10, 5, 10, 12, 7, 14, 12, 12], whiff: 28, contact: 64 },
      { count: '0-2', n: 190, w: [5, 6, 12, 3, 5, 10, 6, 8, 14, 31], whiff: 42, contact: 48 },
      { count: '1-0', n: 300, w: [10, 15, 8, 8, 18, 7, 5, 12, 7, 10], whiff: 22, contact: 72 },
      { count: '1-1', n: 290, w: [8, 12, 10, 6, 14, 10, 7, 13, 10, 10], whiff: 26, contact: 66 },
      { count: '1-2', n: 240, w: [4, 7, 14, 3, 5, 12, 6, 9, 15, 25], whiff: 38, contact: 50 },
      { count: '2-0', n: 160, w: [10, 16, 8, 8, 22, 6, 4, 12, 6, 8], whiff: 20, contact: 76 },
      { count: '2-1', n: 190, w: [9, 14, 9, 7, 18, 8, 6, 12, 9, 8], whiff: 24, contact: 70 },
      { count: '2-2', n: 230, w: [5, 8, 12, 4, 8, 12, 7, 11, 14, 19], whiff: 34, contact: 56 },
      { count: '3-0', n: 80, w: [8, 18, 6, 6, 28, 6, 2, 16, 4, 6], whiff: 14, contact: 80 },
      { count: '3-1', n: 130, w: [8, 16, 8, 7, 22, 8, 4, 14, 7, 6], whiff: 18, contact: 76 },
      { count: '3-2', n: 200, w: [6, 10, 10, 5, 14, 10, 6, 13, 12, 14], whiff: 28, contact: 62 },
    ],
  },
  {
    name: 'Zack Wheeler',
    throws: 'R',
    countSeeds: [
      { count: '0-0', n: 540, w: [7, 10, 9, 8, 14, 9, 10, 16, 10, 7], whiff: 20, contact: 76 },
      { count: '0-1', n: 360, w: [6, 8, 10, 6, 10, 12, 10, 16, 12, 10], whiff: 24, contact: 72 },
      { count: '0-2', n: 220, w: [4, 5, 10, 4, 5, 10, 10, 12, 14, 26], whiff: 34, contact: 56 },
      { count: '1-0', n: 260, w: [8, 12, 8, 8, 16, 8, 8, 16, 8, 8], whiff: 18, contact: 78 },
      { count: '1-1', n: 320, w: [7, 10, 10, 7, 14, 10, 8, 15, 11, 8], whiff: 22, contact: 74 },
      { count: '1-2', n: 260, w: [4, 6, 12, 4, 6, 12, 8, 12, 16, 20], whiff: 32, contact: 58 },
      { count: '2-0', n: 130, w: [8, 14, 8, 8, 20, 8, 6, 16, 6, 6], whiff: 16, contact: 80 },
      { count: '2-1', n: 170, w: [7, 12, 9, 7, 18, 9, 6, 15, 9, 8], whiff: 20, contact: 76 },
      { count: '2-2', n: 240, w: [5, 7, 11, 5, 8, 12, 8, 14, 14, 16], whiff: 28, contact: 64 },
      { count: '3-0', n: 50, w: [6, 16, 6, 6, 30, 6, 4, 16, 4, 6], whiff: 10, contact: 84 },
      { count: '3-1', n: 100, w: [7, 14, 8, 7, 24, 8, 5, 15, 6, 6], whiff: 14, contact: 80 },
      { count: '3-2', n: 190, w: [6, 9, 10, 6, 14, 10, 8, 14, 12, 11], whiff: 24, contact: 68 },
    ],
  },
  {
    name: 'Logan Webb',
    throws: 'R',
    countSeeds: [
      { count: '0-0', n: 560, w: [5, 8, 7, 8, 12, 10, 14, 18, 12, 6], whiff: 16, contact: 80 },
      { count: '0-1', n: 380, w: [4, 6, 8, 6, 8, 12, 14, 18, 14, 10], whiff: 20, contact: 76 },
      { count: '0-2', n: 230, w: [3, 4, 8, 4, 4, 10, 12, 14, 16, 25], whiff: 30, contact: 60 },
      { count: '1-0', n: 250, w: [6, 10, 7, 8, 14, 8, 12, 18, 10, 7], whiff: 14, contact: 82 },
      { count: '1-1', n: 330, w: [5, 8, 8, 7, 12, 10, 12, 18, 12, 8], whiff: 18, contact: 78 },
      { count: '1-2', n: 270, w: [3, 5, 10, 4, 5, 12, 12, 14, 16, 19], whiff: 28, contact: 62 },
      { count: '2-0', n: 120, w: [6, 12, 6, 8, 18, 8, 10, 18, 8, 6], whiff: 12, contact: 84 },
      { count: '2-1', n: 160, w: [5, 10, 7, 7, 16, 9, 10, 18, 10, 8], whiff: 16, contact: 80 },
      { count: '2-2', n: 250, w: [4, 6, 10, 5, 7, 12, 10, 16, 14, 16], whiff: 24, contact: 66 },
      { count: '3-0', n: 45, w: [4, 14, 4, 6, 28, 6, 8, 20, 4, 6], whiff: 8, contact: 86 },
      { count: '3-1', n: 90, w: [5, 12, 6, 7, 22, 8, 8, 18, 8, 6], whiff: 12, contact: 82 },
      { count: '3-2', n: 180, w: [5, 8, 9, 6, 12, 10, 10, 16, 13, 11], whiff: 20, contact: 72 },
    ],
  },
  {
    name: 'Spencer Strider',
    throws: 'R',
    countSeeds: [
      { count: '0-0', n: 500, w: [12, 16, 8, 6, 14, 6, 5, 10, 8, 15], whiff: 28, contact: 64 },
      { count: '0-1', n: 330, w: [10, 12, 10, 5, 10, 10, 6, 10, 10, 17], whiff: 32, contact: 58 },
      { count: '0-2', n: 200, w: [6, 8, 12, 3, 4, 8, 4, 6, 10, 39], whiff: 44, contact: 42 },
      { count: '1-0', n: 290, w: [12, 16, 8, 7, 18, 6, 4, 12, 7, 10], whiff: 26, contact: 68 },
      { count: '1-1', n: 300, w: [10, 14, 10, 6, 14, 8, 6, 12, 10, 10], whiff: 30, contact: 62 },
      { count: '1-2', n: 230, w: [6, 8, 14, 3, 5, 10, 4, 8, 12, 30], whiff: 40, contact: 46 },
      { count: '2-0', n: 150, w: [12, 18, 6, 8, 22, 6, 3, 12, 5, 8], whiff: 22, contact: 72 },
      { count: '2-1', n: 180, w: [10, 16, 8, 7, 18, 7, 5, 12, 8, 9], whiff: 26, contact: 68 },
      { count: '2-2', n: 220, w: [7, 9, 12, 4, 8, 10, 5, 10, 12, 23], whiff: 36, contact: 52 },
      { count: '3-0', n: 70, w: [10, 20, 6, 6, 28, 6, 2, 12, 4, 6], whiff: 16, contact: 78 },
      { count: '3-1', n: 120, w: [10, 18, 8, 6, 22, 8, 4, 12, 6, 6], whiff: 20, contact: 74 },
      { count: '3-2', n: 210, w: [8, 12, 10, 5, 14, 8, 5, 11, 11, 16], whiff: 30, contact: 60 },
    ],
  },
];

export function generateDemoPitchLocation(): PitcherLocationProfile[] {
  return PITCHER_DATA.map((p, i) => ({
    pitcherId: i,
    name: p.name,
    throws: p.throws,
    counts: p.countSeeds.map(cs =>
      makeCountTendency(cs.count, cs.n, cs.w, cs.whiff, cs.contact),
    ),
  }));
}
