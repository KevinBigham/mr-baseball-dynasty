/**
 * Pitch Effectiveness by Count — Mr. Baseball Dynasty (Wave 54)
 *
 * Analyzes how effective each pitch type is in different count situations.
 * Tracks whiff rates, called-strike-edge percentages, exit velocities, and
 * putaway rates for every pitch/count combination.
 *
 * Uses the 0-550 internal attribute scale (400 = MLB avg, display as 20-80).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type CountBucket =
  | 'ahead'
  | 'behind'
  | 'even'
  | 'full'
  | 'first_pitch'
  | 'two_strike';

export type PitchTypeLabel =
  | 'FB'
  | 'SL'
  | 'CH'
  | 'CB'
  | 'CT'
  | 'SI'
  | 'SP'
  | 'KN';

export interface CountPitchEffectiveness {
  pitchType: PitchTypeLabel;
  count: CountBucket;
  usage: number;        // 0-100 pct
  whiffRate: number;    // 0-50 pct
  csePct: number;       // called-strike-edge pct, 0-30
  avgEV: number;        // avg exit velocity mph
  xwOBA: number;        // expected wOBA, .100-.500
  putawayRate: number;  // 0-40 pct
}

export interface PitcherCountProfile {
  pitcherId: number;
  name: string;
  data: CountPitchEffectiveness[];
  bestPutaway: { pitchType: PitchTypeLabel; rate: number };
  worstCount: { bucket: CountBucket; xwOBA: number };
}

// ── Constants ────────────────────────────────────────────────────────────────

export const COUNT_BUCKETS: CountBucket[] = [
  'first_pitch',
  'ahead',
  'even',
  'behind',
  'two_strike',
  'full',
];

export const COUNT_LABELS: Record<CountBucket, string> = {
  first_pitch: '0-0',
  ahead: 'AHEAD',
  even: 'EVEN',
  behind: 'BEHIND',
  two_strike: '2 STR',
  full: 'FULL',
};

const PITCH_LABELS: Record<PitchTypeLabel, string> = {
  FB: 'Fastball',
  SL: 'Slider',
  CH: 'Changeup',
  CB: 'Curveball',
  CT: 'Cutter',
  SI: 'Sinker',
  SP: 'Splitter',
  KN: 'Knuckleball',
};

export { PITCH_LABELS };

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function roundTo(val: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(val * f) / f;
}

// ── Demo data generation ─────────────────────────────────────────────────────

interface DemoPitcher {
  id: number;
  name: string;
  pitches: PitchTypeLabel[];
  skill: number; // 0-1
}

const DEMO_PITCHERS: DemoPitcher[] = [
  { id: 200, name: "James O'Brien",  pitches: ['FB', 'SL', 'CH', 'CB'], skill: 0.82 },
  { id: 201, name: 'Jake Morrison',   pitches: ['FB', 'CT', 'SL', 'CH'], skill: 0.72 },
  { id: 202, name: 'Sam Williams',    pitches: ['SI', 'SL', 'CH'],       skill: 0.65 },
  { id: 203, name: 'Ryan Parker',     pitches: ['FB', 'SL', 'SP'],       skill: 0.60 },
  { id: 204, name: 'Chris Lee',       pitches: ['FB', 'CB', 'CH'],       skill: 0.55 },
];

function generatePitcherProfile(p: DemoPitcher): PitcherCountProfile {
  const data: CountPitchEffectiveness[] = [];

  for (const pitchType of p.pitches) {
    for (const count of COUNT_BUCKETS) {
      // Modifiers by count situation
      const isAhead = count === 'ahead' || count === 'two_strike';
      const isBehind = count === 'behind' || count === 'full';
      const countMod = isAhead ? 0.12 : isBehind ? -0.08 : 0;

      // Fastball used more in behind/first_pitch, breaking stuff more when ahead
      const isFB = pitchType === 'FB' || pitchType === 'SI';
      let usage: number;
      if (isFB) {
        usage = isBehind ? rand(40, 60) : isAhead ? rand(20, 35) : rand(30, 45);
      } else {
        usage = isAhead ? rand(15, 35) : isBehind ? rand(8, 18) : rand(12, 25);
      }

      const baseWhiff = (pitchType === 'SL' || pitchType === 'SP')
        ? rand(25, 38)
        : pitchType === 'FB' || pitchType === 'SI'
          ? rand(15, 26)
          : rand(20, 32);
      const whiffRate = roundTo(
        Math.max(5, Math.min(50, baseWhiff * (1 + countMod) * (0.7 + p.skill * 0.5))),
        1,
      );

      const csePct = roundTo(rand(8, 22) * (0.8 + p.skill * 0.3), 1);

      // Exit velocity — lower is better for pitcher
      const avgEV = roundTo(
        rand(82, 94) - (p.skill * 4) + (isBehind ? 2 : isAhead ? -1.5 : 0),
        1,
      );

      const xwOBA = roundTo(
        Math.max(0.100, Math.min(0.500,
          rand(0.250, 0.380) - (p.skill * 0.06) + (isBehind ? 0.035 : isAhead ? -0.025 : 0),
        )),
        3,
      );

      const putawayRate = count === 'two_strike'
        ? roundTo(Math.max(5, rand(18, 38) * (0.7 + p.skill * 0.5)), 1)
        : roundTo(Math.max(0, rand(5, 18) * (0.6 + p.skill * 0.4)), 1);

      data.push({
        pitchType,
        count,
        usage: roundTo(usage, 1),
        whiffRate,
        csePct,
        avgEV,
        xwOBA,
        putawayRate,
      });
    }
  }

  // Best putaway pitch (two-strike only)
  const twoStrikeData = data.filter(d => d.count === 'two_strike');
  const bestPutawayEntry = twoStrikeData.reduce(
    (best, d) => (d.putawayRate > best.putawayRate ? d : best),
    twoStrikeData[0],
  );

  // Worst count situation (highest avg xwOBA across pitches)
  const countAvgs = COUNT_BUCKETS.map(bucket => {
    const entries = data.filter(d => d.count === bucket);
    const avg = entries.reduce((s, d) => s + d.xwOBA, 0) / entries.length;
    return { bucket, xwOBA: roundTo(avg, 3) };
  });
  const worstCountEntry = countAvgs.reduce(
    (worst, c) => (c.xwOBA > worst.xwOBA ? c : worst),
    countAvgs[0],
  );

  return {
    pitcherId: p.id,
    name: p.name,
    data,
    bestPutaway: { pitchType: bestPutawayEntry.pitchType, rate: bestPutawayEntry.putawayRate },
    worstCount: { bucket: worstCountEntry.bucket, xwOBA: worstCountEntry.xwOBA },
  };
}

export function generateDemoPitchEffectiveness(): PitcherCountProfile[] {
  return DEMO_PITCHERS.map(generatePitcherProfile);
}
