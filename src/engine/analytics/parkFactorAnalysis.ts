/**
 * Park Factor Analysis — Mr. Baseball Dynasty
 *
 * Evaluates how each ballpark affects offensive production across
 * multiple statistical categories. Tracks park dimensions, surface
 * type, roof configuration, and altitude for comprehensive profiles.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParkFactorStat = 'runs' | 'hr' | 'hits' | 'doubles' | 'triples' | 'walks' | 'strikeouts';

export interface ParkFactor {
  stat: ParkFactorStat;
  factor: number;
  rank: number;
}

export interface ParkProfile {
  parkId: number;
  parkName: string;
  teamName: string;
  surface: 'grass' | 'turf';
  roofType: 'open' | 'retractable' | 'dome';
  dimensions: { lf: number; cf: number; rf: number };
  altitude: number;
  factors: ParkFactor[];
  overallFactor: number;
  pitcherFriendly: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ─── Park Database ────────────────────────────────────────────────────────────

interface ParkSeed {
  parkId: number;
  parkName: string;
  teamName: string;
  surface: 'grass' | 'turf';
  roofType: 'open' | 'retractable' | 'dome';
  dimensions: { lf: number; cf: number; rf: number };
  altitude: number;
  bias: number; // >1 = hitter-friendly, <1 = pitcher-friendly
}

const PARKS: ParkSeed[] = [
  { parkId: 1, parkName: 'Coors Field', teamName: 'Colorado Rockies', surface: 'grass', roofType: 'open', dimensions: { lf: 347, cf: 415, rf: 350 }, altitude: 5280, bias: 1.28 },
  { parkId: 2, parkName: 'Fenway Park', teamName: 'Boston Red Sox', surface: 'grass', roofType: 'open', dimensions: { lf: 310, cf: 390, rf: 302 }, altitude: 20, bias: 1.10 },
  { parkId: 3, parkName: 'Yankee Stadium', teamName: 'New York Yankees', surface: 'grass', roofType: 'open', dimensions: { lf: 318, cf: 408, rf: 314 }, altitude: 55, bias: 1.08 },
  { parkId: 4, parkName: 'Great American Ball Park', teamName: 'Cincinnati Reds', surface: 'grass', roofType: 'open', dimensions: { lf: 328, cf: 404, rf: 325 }, altitude: 490, bias: 1.12 },
  { parkId: 5, parkName: 'Globe Life Field', teamName: 'Texas Rangers', surface: 'turf', roofType: 'retractable', dimensions: { lf: 329, cf: 407, rf: 326 }, altitude: 545, bias: 0.95 },
  { parkId: 6, parkName: 'Oracle Park', teamName: 'San Francisco Giants', surface: 'grass', roofType: 'open', dimensions: { lf: 339, cf: 399, rf: 309 }, altitude: 0, bias: 0.85 },
  { parkId: 7, parkName: 'Petco Park', teamName: 'San Diego Padres', surface: 'grass', roofType: 'open', dimensions: { lf: 336, cf: 396, rf: 322 }, altitude: 20, bias: 0.88 },
  { parkId: 8, parkName: 'Dodger Stadium', teamName: 'Los Angeles Dodgers', surface: 'grass', roofType: 'open', dimensions: { lf: 330, cf: 395, rf: 330 }, altitude: 515, bias: 0.93 },
  { parkId: 9, parkName: 'Tropicana Field', teamName: 'Tampa Bay Rays', surface: 'turf', roofType: 'dome', dimensions: { lf: 315, cf: 404, rf: 322 }, altitude: 43, bias: 0.90 },
  { parkId: 10, parkName: 'Wrigley Field', teamName: 'Chicago Cubs', surface: 'grass', roofType: 'open', dimensions: { lf: 355, cf: 400, rf: 353 }, altitude: 595, bias: 1.05 },
  { parkId: 11, parkName: 'Minute Maid Park', teamName: 'Houston Astros', surface: 'grass', roofType: 'retractable', dimensions: { lf: 315, cf: 409, rf: 326 }, altitude: 80, bias: 1.02 },
  { parkId: 12, parkName: 'T-Mobile Park', teamName: 'Seattle Mariners', surface: 'grass', roofType: 'retractable', dimensions: { lf: 331, cf: 405, rf: 326 }, altitude: 20, bias: 0.91 },
  { parkId: 13, parkName: 'Kauffman Stadium', teamName: 'Kansas City Royals', surface: 'grass', roofType: 'open', dimensions: { lf: 330, cf: 410, rf: 330 }, altitude: 750, bias: 0.97 },
  { parkId: 14, parkName: 'Busch Stadium', teamName: 'St. Louis Cardinals', surface: 'grass', roofType: 'open', dimensions: { lf: 336, cf: 400, rf: 335 }, altitude: 455, bias: 0.96 },
  { parkId: 15, parkName: 'Nationals Park', teamName: 'Washington Nationals', surface: 'grass', roofType: 'open', dimensions: { lf: 336, cf: 403, rf: 335 }, altitude: 25, bias: 1.01 },
];

// ─── Factor Generation ────────────────────────────────────────────────────────

const ALL_STATS: ParkFactorStat[] = ['runs', 'hr', 'hits', 'doubles', 'triples', 'walks', 'strikeouts'];

function generateFactors(park: ParkSeed): ParkFactor[] {
  const rand = seededRandom(park.parkId * 31);

  return ALL_STATS.map(stat => {
    let base = park.bias;

    // Stat-specific modifiers
    switch (stat) {
      case 'hr':
        // Altitude and short fences boost HR
        base *= 1 + (park.altitude / 20000);
        if (park.dimensions.rf < 320 || park.dimensions.lf < 320) base *= 1.05;
        break;
      case 'doubles':
        // Walls and turf boost doubles
        if (park.surface === 'turf') base *= 1.06;
        break;
      case 'triples':
        // Big outfields boost triples
        if (park.dimensions.cf >= 405) base *= 1.08;
        if (park.surface === 'turf') base *= 1.04;
        break;
      case 'strikeouts':
        // Dome parks slightly boost K's (quieter)
        if (park.roofType === 'dome') base *= 1.02;
        // Altitude reduces K's slightly (ball moves differently)
        base *= 1 - (park.altitude / 50000);
        break;
      case 'walks':
        // Mostly neutral, small variance
        base = 1.0 + (base - 1.0) * 0.3;
        break;
      default:
        break;
    }

    // Add small noise
    const noise = (rand() - 0.5) * 0.06;
    const factor = clamp(parseFloat((base + noise).toFixed(2)), 0.70, 1.45);

    return { stat, factor, rank: 0 }; // Rank populated below
  });
}

// ─── Public Demo Generator ────────────────────────────────────────────────────

export function generateDemoParkFactors(): ParkProfile[] {
  // Generate all profiles first
  const profiles: ParkProfile[] = PARKS.map(park => {
    const factors = generateFactors(park);
    const overallFactor = parseFloat(
      (factors.reduce((s, f) => s + f.factor, 0) / factors.length).toFixed(2),
    );
    const pitcherFriendly = overallFactor < 0.98;

    return {
      parkId: park.parkId,
      parkName: park.parkName,
      teamName: park.teamName,
      surface: park.surface,
      roofType: park.roofType,
      dimensions: park.dimensions,
      altitude: park.altitude,
      factors,
      overallFactor,
      pitcherFriendly,
    };
  });

  // Assign ranks per stat
  for (const stat of ALL_STATS) {
    const sorted = [...profiles].sort((a, b) => {
      const fa = a.factors.find(f => f.stat === stat)!.factor;
      const fb = b.factors.find(f => f.stat === stat)!.factor;
      return fb - fa; // Highest factor = rank 1
    });
    sorted.forEach((profile, idx) => {
      const f = profile.factors.find(f => f.stat === stat);
      if (f) f.rank = idx + 1;
    });
  }

  // Sort by overall factor descending
  return profiles.sort((a, b) => b.overallFactor - a.overallFactor);
}
