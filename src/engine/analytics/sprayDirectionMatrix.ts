/**
 * Spray Direction Matrix – directional hitting tendency engine
 *
 * Models pull/center/oppo tendencies by zone (inner/middle/outer third),
 * wOBA by spray direction, hard-hit rates, and batted-ball event distribution.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type SprayDirection = 'pull' | 'center' | 'oppo';
export type ZoneThird = 'inner' | 'middle' | 'outer';

export interface ZoneSprayCell {
  zone: ZoneThird;
  direction: SprayDirection;
  pct: number;       // % of BIP in this zone going that direction
  wOBA: number;      // wOBA on balls hit that direction from that zone
  hardHitPct: number; // hard-hit % (95+ mph)
  avgEV: number;      // average exit velocity
  babip: number;      // BABIP for that cell
}

export interface SprayProfile {
  id: string;
  name: string;
  team: string;
  position: string;
  bats: 'L' | 'R' | 'S';
  overallPullPct: number;
  overallCenterPct: number;
  overallOppoPct: number;
  overallWOBA: number;
  bestDirection: SprayDirection;
  worstDirection: SprayDirection;
  cells: ZoneSprayCell[];       // 9 cells (3 zones x 3 directions)
  groundBallPullPct: number;    // GB pull rate
  flyBallOppoPct: number;       // FB oppo rate
  lineupSlot: number;
  notes: string;
}

export interface SprayDirectionSummary {
  totalBatters: number;
  avgPullPct: string;
  heaviestPuller: string;
  bestOppoHitter: string;
  bestOverallWOBA: string;
  avgHardHitPct: string;
}

// ── Display helpers ────────────────────────────────────────────────────────

export const DIRECTION_DISPLAY: Record<SprayDirection, { label: string; color: string }> = {
  pull:   { label: 'PULL', color: '#ef4444' },
  center: { label: 'CENTER', color: '#f59e0b' },
  oppo:   { label: 'OPPO', color: '#3b82f6' },
};

export const ZONE_DISPLAY: Record<ZoneThird, { label: string }> = {
  inner:  { label: 'Inner Third' },
  middle: { label: 'Middle' },
  outer:  { label: 'Outer Third' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export function getSprayDirectionSummary(batters: SprayProfile[]): SprayDirectionSummary {
  if (batters.length === 0) {
    return { totalBatters: 0, avgPullPct: '0', heaviestPuller: '-', bestOppoHitter: '-', bestOverallWOBA: '-', avgHardHitPct: '0' };
  }
  const avgPull = batters.reduce((s, b) => s + b.overallPullPct, 0) / batters.length;
  const puller = [...batters].sort((a, b) => b.overallPullPct - a.overallPullPct)[0];
  const oppo = [...batters].sort((a, b) => {
    const aOppo = a.cells.filter(c => c.direction === 'oppo').reduce((s, c) => s + c.wOBA, 0) / 3;
    const bOppo = b.cells.filter(c => c.direction === 'oppo').reduce((s, c) => s + c.wOBA, 0) / 3;
    return bOppo - aOppo;
  })[0];
  const bestWoba = [...batters].sort((a, b) => b.overallWOBA - a.overallWOBA)[0];
  const avgHH = batters.reduce((s, b) => s + b.cells.reduce((ss, c) => ss + c.hardHitPct, 0) / 9, 0) / batters.length;
  return {
    totalBatters: batters.length,
    avgPullPct: avgPull.toFixed(1),
    heaviestPuller: puller.name,
    bestOppoHitter: oppo.name,
    bestOverallWOBA: bestWoba.name,
    avgHardHitPct: avgHH.toFixed(1),
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function makeCell(zone: ZoneThird, dir: SprayDirection, pct: number, wOBA: number, hh: number, ev: number, bab: number): ZoneSprayCell {
  return { zone, direction: dir, pct, wOBA, hardHitPct: hh, avgEV: ev, babip: bab };
}

export function generateDemoSprayDirection(): SprayProfile[] {
  return [
    {
      id: 'sd1', name: 'Juan Ramirez', team: 'NYM', position: 'LF', bats: 'L',
      overallPullPct: 44.2, overallCenterPct: 33.1, overallOppoPct: 22.7, overallWOBA: .362,
      bestDirection: 'pull', worstDirection: 'oppo', lineupSlot: 3,
      groundBallPullPct: 68.4, flyBallOppoPct: 18.2,
      cells: [
        makeCell('inner', 'pull', 52.1, .418, 48.3, 94.2, .342),
        makeCell('inner', 'center', 30.4, .352, 38.1, 91.0, .318),
        makeCell('inner', 'oppo', 17.5, .288, 22.0, 86.4, .280),
        makeCell('middle', 'pull', 42.3, .396, 44.8, 93.1, .335),
        makeCell('middle', 'center', 35.8, .368, 40.2, 91.8, .322),
        makeCell('middle', 'oppo', 21.9, .312, 28.5, 88.2, .295),
        makeCell('outer', 'pull', 38.1, .342, 36.2, 90.5, .310),
        makeCell('outer', 'center', 33.2, .358, 34.8, 89.8, .305),
        makeCell('outer', 'oppo', 28.7, .328, 30.1, 87.6, .298),
      ],
      notes: 'Elite pull power from inner third. Vulnerable to oppo-field approach vs outer half. Ground balls heavily pulled — shift candidate.',
    },
    {
      id: 'sd2', name: 'Derek Williams', team: 'BOS', position: '1B', bats: 'R',
      overallPullPct: 48.6, overallCenterPct: 28.3, overallOppoPct: 23.1, overallWOBA: .388,
      bestDirection: 'pull', worstDirection: 'oppo', lineupSlot: 4,
      groundBallPullPct: 72.1, flyBallOppoPct: 14.8,
      cells: [
        makeCell('inner', 'pull', 56.2, .442, 52.1, 96.4, .358),
        makeCell('inner', 'center', 26.8, .362, 40.5, 92.2, .320),
        makeCell('inner', 'oppo', 17.0, .278, 20.1, 85.8, .268),
        makeCell('middle', 'pull', 48.1, .424, 49.2, 95.0, .348),
        makeCell('middle', 'center', 29.4, .378, 42.8, 92.8, .325),
        makeCell('middle', 'oppo', 22.5, .302, 26.4, 87.6, .288),
        makeCell('outer', 'pull', 41.4, .362, 38.4, 91.2, .315),
        makeCell('outer', 'center', 28.6, .344, 32.1, 89.4, .302),
        makeCell('outer', 'oppo', 30.0, .318, 28.8, 86.8, .292),
      ],
      notes: 'Pure pull hitter with massive power to the pull side. Inner third is damage zone — 56% pull rate with .442 wOBA. Shift heavily.',
    },
    {
      id: 'sd3', name: 'Marcus Chen', team: 'HOU', position: 'CF', bats: 'S',
      overallPullPct: 34.8, overallCenterPct: 38.4, overallOppoPct: 26.8, overallWOBA: .356,
      bestDirection: 'center', worstDirection: 'pull', lineupSlot: 1,
      groundBallPullPct: 48.2, flyBallOppoPct: 28.4,
      cells: [
        makeCell('inner', 'pull', 38.2, .348, 36.4, 90.8, .312),
        makeCell('inner', 'center', 36.8, .372, 38.8, 91.4, .322),
        makeCell('inner', 'oppo', 25.0, .332, 30.2, 88.6, .298),
        makeCell('middle', 'pull', 34.1, .358, 38.2, 91.2, .318),
        makeCell('middle', 'center', 39.4, .382, 42.4, 92.6, .328),
        makeCell('middle', 'oppo', 26.5, .342, 32.8, 89.2, .305),
        makeCell('outer', 'pull', 32.0, .328, 30.1, 88.4, .295),
        makeCell('outer', 'center', 39.1, .368, 36.2, 90.2, .315),
        makeCell('outer', 'oppo', 28.9, .352, 34.5, 89.8, .308),
      ],
      notes: 'True all-fields hitter with excellent center-field coverage. Switch-hitter advantage gives balanced spray. Hard to shift against.',
    },
    {
      id: 'sd4', name: 'Tyler Brooks', team: 'LAD', position: 'RF', bats: 'R',
      overallPullPct: 38.2, overallCenterPct: 32.8, overallOppoPct: 29.0, overallWOBA: .374,
      bestDirection: 'oppo', worstDirection: 'center', lineupSlot: 2,
      groundBallPullPct: 52.8, flyBallOppoPct: 32.6,
      cells: [
        makeCell('inner', 'pull', 42.8, .388, 44.2, 93.6, .332),
        makeCell('inner', 'center', 30.4, .348, 36.8, 90.4, .310),
        makeCell('inner', 'oppo', 26.8, .362, 38.4, 91.2, .318),
        makeCell('middle', 'pull', 37.2, .372, 40.8, 92.4, .325),
        makeCell('middle', 'center', 33.6, .358, 38.2, 91.0, .315),
        makeCell('middle', 'oppo', 29.2, .378, 42.1, 92.8, .328),
        makeCell('outer', 'pull', 34.5, .348, 34.6, 89.8, .305),
        makeCell('outer', 'center', 34.2, .342, 32.8, 89.2, .300),
        makeCell('outer', 'oppo', 31.3, .388, 40.2, 92.0, .325),
      ],
      notes: 'Elite oppo-field power — rare .388 wOBA to opposite field on outer third. Can drive the outside pitch. Very hard to pitch to.',
    },
    {
      id: 'sd5', name: 'Andre Jackson', team: 'CHC', position: '3B', bats: 'L',
      overallPullPct: 42.8, overallCenterPct: 31.2, overallOppoPct: 26.0, overallWOBA: .345,
      bestDirection: 'pull', worstDirection: 'oppo', lineupSlot: 5,
      groundBallPullPct: 64.8, flyBallOppoPct: 20.1,
      cells: [
        makeCell('inner', 'pull', 50.2, .402, 46.8, 94.0, .340),
        makeCell('inner', 'center', 29.8, .338, 34.2, 89.8, .305),
        makeCell('inner', 'oppo', 20.0, .275, 18.4, 84.2, .265),
        makeCell('middle', 'pull', 42.1, .378, 42.4, 92.6, .328),
        makeCell('middle', 'center', 32.4, .352, 36.8, 90.4, .312),
        makeCell('middle', 'oppo', 25.5, .298, 24.2, 86.8, .282),
        makeCell('outer', 'pull', 36.2, .332, 32.8, 89.4, .300),
        makeCell('outer', 'center', 31.4, .342, 30.4, 88.6, .295),
        makeCell('outer', 'oppo', 32.4, .308, 26.8, 87.2, .288),
      ],
      notes: 'Heavy pull tendency with power concentrated on inner third. Struggles going oppo on anything inside. Prime shift candidate.',
    },
    {
      id: 'sd6', name: 'Sam Nakamura', team: 'SEA', position: 'SS', bats: 'R',
      overallPullPct: 36.4, overallCenterPct: 36.8, overallOppoPct: 26.8, overallWOBA: .338,
      bestDirection: 'center', worstDirection: 'oppo', lineupSlot: 6,
      groundBallPullPct: 54.2, flyBallOppoPct: 24.8,
      cells: [
        makeCell('inner', 'pull', 40.8, .358, 38.2, 91.2, .318),
        makeCell('inner', 'center', 35.2, .348, 36.4, 90.4, .312),
        makeCell('inner', 'oppo', 24.0, .305, 26.2, 87.0, .285),
        makeCell('middle', 'pull', 35.8, .342, 36.8, 90.6, .310),
        makeCell('middle', 'center', 37.4, .358, 38.4, 91.2, .318),
        makeCell('middle', 'oppo', 26.8, .322, 28.8, 87.8, .292),
        makeCell('outer', 'pull', 32.6, .318, 30.2, 88.2, .295),
        makeCell('outer', 'center', 37.8, .342, 34.6, 89.8, .308),
        makeCell('outer', 'oppo', 29.6, .328, 30.4, 88.4, .298),
      ],
      notes: 'Balanced approach with slight center-field lean. Uses middle of field effectively. Gap-to-gap hitter profile.',
    },
  ];
}
