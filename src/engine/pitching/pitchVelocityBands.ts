/**
 * pitchVelocityBands.ts – Velocity distribution & decay analysis
 *
 * Bloomberg-terminal-style velocity analytics for pitchers.
 * Models pitch velocity distributions across bands, inning-by-inning
 * decay curves, stamina grades, consistency scores, and per-pitch-type
 * velocity profiles with percentile breakdowns.
 * All demo data — no sim engine changes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VelocityBand {
  range: string;        // e.g. "95-96", "100+"
  count: number;        // total pitches in this band
  pct: number;          // % of pitches in this band
  whiffPct: number;     // whiff rate on pitches in this band
  wOBA: number;         // wOBA against in this band
}

export interface InningVelocity {
  inning: number;
  avgVelo: number;
  maxVelo: number;
  minVelo: number;
  veloDropFromFirst: number;  // mph lost vs 1st inning avg
}

export interface PitchTypeVelo {
  pitchType: string;    // e.g. "4-Seam Fastball", "Slider"
  avgVelo: number;      // average velocity (mph)
  maxVelo: number;      // peak velocity (mph)
  p95Velo: number;      // 95th percentile velocity
  p5Velo: number;       // 5th percentile velocity
  veloSpread: number;   // p95 - p5 spread
  bands: VelocityBand[];
}

export interface VelocityProfile {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP' | 'CL';
  primaryFBVelo: number;      // primary fastball average velocity
  maxFBVelo: number;          // max fastball velocity recorded
  avgVeloDrop: number;        // avg mph lost over game (1st to last inning)
  staminaGrade: string;       // 'A+' through 'F'
  pitchTypes: PitchTypeVelo[];
  inningByInning: InningVelocity[];
  veloConsistency: number;    // 0-100 score
  overallGrade: string;       // overall velocity profile grade
  notes: string;
}

// ─── Display Map ────────────────────────────────────────────────────────────

export const STAMINA_GRADE_DISPLAY: Record<string, { label: string; color: string }> = {
  'A+': { label: 'ELITE',      color: '#22c55e' },
  'A':  { label: 'EXCELLENT',  color: '#22c55e' },
  'B+': { label: 'ABOVE AVG',  color: '#4ade80' },
  'B':  { label: 'AVERAGE',    color: '#f59e0b' },
  'C':  { label: 'BELOW AVG',  color: '#f97316' },
  'D':  { label: 'POOR',       color: '#ef4444' },
  'F':  { label: 'FAILING',    color: '#dc2626' },
};

export function staminaGradeColor(grade: string): string {
  return STAMINA_GRADE_DISPLAY[grade]?.color ?? '#f59e0b';
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface VelocityBandsSummary {
  totalPitchers: number;
  hardestThrower: string;   // name + velo
  bestStamina: string;
  avgFBVelo: string;
  avgVeloDrop: string;
  mostConsistent: string;
}

export function getVelocityBandsSummary(profiles: VelocityProfile[]): VelocityBandsSummary {
  if (profiles.length === 0) {
    return {
      totalPitchers: 0,
      hardestThrower: 'N/A',
      bestStamina: 'N/A',
      avgFBVelo: '0.0',
      avgVeloDrop: '0.00',
      mostConsistent: 'N/A',
    };
  }

  const hardest = [...profiles].sort((a, b) => b.maxFBVelo - a.maxFBVelo)[0];

  const gradeOrder = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];
  const bestStam = [...profiles].sort(
    (a, b) => gradeOrder.indexOf(a.staminaGrade) - gradeOrder.indexOf(b.staminaGrade),
  )[0];

  const avgFB = profiles.reduce((s, p) => s + p.primaryFBVelo, 0) / profiles.length;
  const avgDrop = profiles.reduce((s, p) => s + p.avgVeloDrop, 0) / profiles.length;

  const mostCons = [...profiles].sort((a, b) => b.veloConsistency - a.veloConsistency)[0];

  return {
    totalPitchers: profiles.length,
    hardestThrower: `${hardest.name} (${hardest.maxFBVelo.toFixed(1)} mph)`,
    bestStamina: bestStam.name,
    avgFBVelo: avgFB.toFixed(1),
    avgVeloDrop: avgDrop.toFixed(2),
    mostConsistent: mostCons.name,
  };
}

// ─── Demo Data Builders ─────────────────────────────────────────────────────

function band(range: string, count: number, pct: number, whiffPct: number, wOBA: number): VelocityBand {
  return { range, count, pct, whiffPct, wOBA };
}

function inning(inn: number, avg: number, max: number, min: number, drop: number): InningVelocity {
  return { inning: inn, avgVelo: avg, maxVelo: max, minVelo: min, veloDropFromFirst: drop };
}

// ─── Demo Generator ─────────────────────────────────────────────────────────

export function generateDemoVelocityBands(): VelocityProfile[] {
  return [
    // 1 — Elite SP workhorse (high velo, elite stamina)
    {
      id: 'vb-1',
      name: 'Ryan Caldwell',
      team: 'NYY',
      role: 'SP',
      primaryFBVelo: 96.2,
      maxFBVelo: 99.4,
      avgVeloDrop: 1.6,
      staminaGrade: 'A+',
      veloConsistency: 88,
      overallGrade: 'A+',
      pitchTypes: [
        {
          pitchType: '4-Seam Fastball', avgVelo: 96.2, maxVelo: 99.4, p95Velo: 98.1, p5Velo: 93.8, veloSpread: 4.3,
          bands: [
            band('98-99', 148, 14.8, 34.2, 0.248),
            band('97-98', 224, 22.4, 30.8, 0.262),
            band('96-97', 268, 26.8, 28.4, 0.278),
            band('95-96', 212, 21.2, 24.6, 0.298),
            band('94-95', 102, 10.2, 20.2, 0.318),
            band('<94', 46, 4.6, 15.8, 0.352),
          ],
        },
        {
          pitchType: 'Slider', avgVelo: 87.4, maxVelo: 90.2, p95Velo: 89.6, p5Velo: 84.8, veloSpread: 4.8,
          bands: [
            band('89-90', 82, 13.6, 38.4, 0.218),
            band('88-89', 148, 24.6, 35.2, 0.232),
            band('87-88', 172, 28.6, 32.8, 0.248),
            band('86-87', 118, 19.6, 28.4, 0.272),
            band('<86', 82, 13.6, 22.6, 0.308),
          ],
        },
        {
          pitchType: 'Changeup', avgVelo: 88.1, maxVelo: 91.0, p95Velo: 90.2, p5Velo: 85.6, veloSpread: 4.6,
          bands: [
            band('90-91', 64, 12.8, 32.4, 0.238),
            band('89-90', 112, 22.4, 28.8, 0.258),
            band('88-89', 148, 29.6, 26.2, 0.272),
            band('87-88', 108, 21.6, 22.4, 0.298),
            band('<87', 68, 13.6, 18.6, 0.328),
          ],
        },
      ],
      inningByInning: [
        inning(1, 96.8, 99.4, 94.6, 0.0),
        inning(2, 96.6, 99.1, 94.4, 0.2),
        inning(3, 96.4, 98.8, 94.2, 0.4),
        inning(4, 96.1, 98.4, 93.8, 0.7),
        inning(5, 95.8, 98.0, 93.4, 1.0),
        inning(6, 95.5, 97.6, 93.0, 1.3),
        inning(7, 95.2, 97.2, 92.6, 1.6),
      ],
      notes: 'Elite velocity maintenance through 7 innings. Fastball plays up with carry and ride. Only 1.6 mph avg drop makes him a true workhorse ace. Best swing-and-miss above 97 mph.',
    },

    // 2 — Power reliever (max velo, short outings)
    {
      id: 'vb-2',
      name: 'Jake Thornton',
      team: 'HOU',
      role: 'RP',
      primaryFBVelo: 98.4,
      maxFBVelo: 101.8,
      avgVeloDrop: 0.4,
      staminaGrade: 'B+',
      veloConsistency: 84,
      overallGrade: 'A',
      pitchTypes: [
        {
          pitchType: '4-Seam Fastball', avgVelo: 98.4, maxVelo: 101.8, p95Velo: 100.6, p5Velo: 96.0, veloSpread: 4.6,
          bands: [
            band('100-101', 86, 17.2, 38.4, 0.218),
            band('99-100', 118, 23.6, 34.6, 0.232),
            band('98-99', 132, 26.4, 32.2, 0.248),
            band('97-98', 94, 18.8, 27.8, 0.272),
            band('96-97', 48, 9.6, 22.4, 0.302),
            band('<96', 22, 4.4, 16.8, 0.348),
          ],
        },
        {
          pitchType: 'Slider', avgVelo: 89.8, maxVelo: 93.2, p95Velo: 92.0, p5Velo: 87.4, veloSpread: 4.6,
          bands: [
            band('92-93', 42, 14.0, 40.2, 0.208),
            band('91-92', 68, 22.6, 36.8, 0.225),
            band('90-91', 82, 27.4, 34.4, 0.242),
            band('89-90', 62, 20.6, 30.2, 0.268),
            band('<89', 46, 15.4, 24.8, 0.298),
          ],
        },
      ],
      inningByInning: [
        inning(1, 98.8, 101.8, 96.2, 0.0),
        inning(2, 98.4, 101.2, 95.8, 0.4),
      ],
      notes: 'Elite velocity reliever. Touches 101+ consistently in the 1st inning. Two-pitch mix dominates in short stints. Fastball whiff rate jumps to 38% above 100 mph. Slider tunnels off heater.',
    },

    // 3 — Command SP with elite consistency (lower velo, minimal decay)
    {
      id: 'vb-3',
      name: 'Chris Yamamoto',
      team: 'SF',
      role: 'SP',
      primaryFBVelo: 93.4,
      maxFBVelo: 96.8,
      avgVeloDrop: 1.4,
      staminaGrade: 'A',
      veloConsistency: 92,
      overallGrade: 'A',
      pitchTypes: [
        {
          pitchType: '4-Seam Fastball', avgVelo: 93.4, maxVelo: 96.8, p95Velo: 95.8, p5Velo: 91.2, veloSpread: 4.6,
          bands: [
            band('95-96', 124, 12.4, 26.8, 0.262),
            band('94-95', 218, 21.8, 24.2, 0.278),
            band('93-94', 298, 29.8, 22.4, 0.288),
            band('92-93', 222, 22.2, 20.0, 0.302),
            band('91-92', 98, 9.8, 17.4, 0.322),
            band('<91', 40, 4.0, 14.2, 0.348),
          ],
        },
        {
          pitchType: 'Cutter', avgVelo: 89.2, maxVelo: 92.4, p95Velo: 91.6, p5Velo: 86.8, veloSpread: 4.8,
          bands: [
            band('91-92', 68, 13.6, 30.4, 0.232),
            band('90-91', 112, 22.4, 28.2, 0.248),
            band('89-90', 148, 29.6, 26.4, 0.262),
            band('88-89', 102, 20.4, 22.8, 0.285),
            band('<88', 70, 14.0, 18.6, 0.312),
          ],
        },
        {
          pitchType: 'Curveball', avgVelo: 78.6, maxVelo: 82.0, p95Velo: 81.2, p5Velo: 76.0, veloSpread: 5.2,
          bands: [
            band('81-82', 52, 11.6, 34.8, 0.212),
            band('80-81', 86, 19.2, 32.2, 0.228),
            band('79-80', 118, 26.4, 30.6, 0.242),
            band('78-79', 104, 23.2, 26.8, 0.268),
            band('<78', 88, 19.6, 22.4, 0.298),
          ],
        },
      ],
      inningByInning: [
        inning(1, 93.8, 96.8, 91.6, 0.0),
        inning(2, 93.6, 96.4, 91.4, 0.2),
        inning(3, 93.4, 96.2, 91.2, 0.4),
        inning(4, 93.2, 95.8, 91.0, 0.6),
        inning(5, 93.0, 95.6, 90.8, 0.8),
        inning(6, 92.8, 95.4, 90.6, 1.0),
        inning(7, 92.6, 95.2, 90.4, 1.2),
        inning(8, 92.4, 95.0, 90.2, 1.4),
      ],
      notes: 'Highest consistency score on staff at 92. Remarkable velocity maintenance through 8 innings despite modest top-end velo. Command-first pitcher who maximizes every mph. Cutter/curve combo neutralizes both sides.',
    },

    // 4 — Closer with explosive but volatile arm
    {
      id: 'vb-4',
      name: 'Devon Reyes',
      team: 'ATL',
      role: 'CL',
      primaryFBVelo: 97.8,
      maxFBVelo: 100.6,
      avgVeloDrop: 1.4,
      staminaGrade: 'C',
      veloConsistency: 72,
      overallGrade: 'B+',
      pitchTypes: [
        {
          pitchType: '4-Seam Fastball', avgVelo: 97.8, maxVelo: 100.6, p95Velo: 99.8, p5Velo: 95.4, veloSpread: 4.4,
          bands: [
            band('99-100', 92, 18.4, 36.8, 0.228),
            band('98-99', 126, 25.2, 32.4, 0.245),
            band('97-98', 118, 23.6, 28.6, 0.268),
            band('96-97', 88, 17.6, 24.2, 0.292),
            band('95-96', 52, 10.4, 18.8, 0.325),
            band('<95', 24, 4.8, 14.2, 0.362),
          ],
        },
        {
          pitchType: 'Slider', avgVelo: 88.6, maxVelo: 92.0, p95Velo: 91.2, p5Velo: 85.8, veloSpread: 5.4,
          bands: [
            band('91-92', 38, 12.6, 38.6, 0.215),
            band('90-91', 64, 21.4, 35.2, 0.232),
            band('89-90', 78, 26.0, 32.4, 0.248),
            band('87-89', 72, 24.0, 26.8, 0.278),
            band('<87', 48, 16.0, 20.4, 0.312),
          ],
        },
        {
          pitchType: 'Splitter', avgVelo: 90.2, maxVelo: 93.4, p95Velo: 92.6, p5Velo: 87.6, veloSpread: 5.0,
          bands: [
            band('92-93', 34, 13.6, 36.2, 0.222),
            band('91-92', 58, 23.2, 32.8, 0.238),
            band('90-91', 72, 28.8, 30.4, 0.255),
            band('88-90', 56, 22.4, 25.6, 0.282),
            band('<88', 30, 12.0, 19.8, 0.318),
          ],
        },
      ],
      inningByInning: [
        inning(1, 98.6, 100.6, 95.8, 0.0),
        inning(2, 97.2, 99.8, 94.4, 1.4),
      ],
      notes: 'Dominant 9th-inning closer but velocity drops sharply in multi-inning outings. Three-pitch mix is elite for 1 inning. Wide velo spread (5.4 on slider) indicates command inconsistency. Best used strictly in save situations.',
    },

    // 5 — Fading SP with below-avg stamina
    {
      id: 'vb-5',
      name: 'Marcus Webb',
      team: 'LAD',
      role: 'SP',
      primaryFBVelo: 94.8,
      maxFBVelo: 97.6,
      avgVeloDrop: 2.6,
      staminaGrade: 'D',
      veloConsistency: 64,
      overallGrade: 'C',
      pitchTypes: [
        {
          pitchType: 'Sinker', avgVelo: 94.8, maxVelo: 97.6, p95Velo: 96.8, p5Velo: 92.4, veloSpread: 4.4,
          bands: [
            band('96-97', 86, 12.2, 22.4, 0.268),
            band('95-96', 154, 22.0, 20.6, 0.282),
            band('94-95', 182, 26.0, 18.8, 0.298),
            band('93-94', 148, 21.2, 16.2, 0.318),
            band('92-93', 84, 12.0, 13.4, 0.342),
            band('<92', 46, 6.6, 10.2, 0.378),
          ],
        },
        {
          pitchType: 'Slider', avgVelo: 85.2, maxVelo: 88.4, p95Velo: 87.6, p5Velo: 82.6, veloSpread: 5.0,
          bands: [
            band('87-88', 54, 13.4, 32.4, 0.228),
            band('86-87', 88, 22.0, 28.8, 0.248),
            band('85-86', 108, 27.0, 26.2, 0.265),
            band('84-85', 86, 21.4, 22.6, 0.288),
            band('<84', 64, 16.2, 18.4, 0.318),
          ],
        },
        {
          pitchType: 'Changeup', avgVelo: 86.4, maxVelo: 89.8, p95Velo: 88.9, p5Velo: 83.8, veloSpread: 5.1,
          bands: [
            band('88-89', 42, 10.4, 28.6, 0.245),
            band('87-88', 82, 20.4, 26.2, 0.262),
            band('86-87', 116, 28.8, 24.4, 0.278),
            band('85-86', 96, 23.8, 20.8, 0.302),
            band('<85', 66, 16.6, 16.4, 0.335),
          ],
        },
      ],
      inningByInning: [
        inning(1, 95.6, 97.6, 93.4, 0.0),
        inning(2, 95.2, 97.2, 93.0, 0.4),
        inning(3, 94.8, 96.8, 92.6, 0.8),
        inning(4, 94.2, 96.2, 91.8, 1.4),
        inning(5, 93.6, 95.6, 91.0, 2.0),
        inning(6, 93.0, 95.0, 90.2, 2.6),
      ],
      notes: 'Significant velocity drop after 4th inning. Sinker loses bite as velocity dips below 93 — ground ball rate drops 15% in late innings. Best used through 5 innings with quick hook. Bullpen should be ready by the 4th.',
    },

    // 6 — SP with moderate velo and poor stamina
    {
      id: 'vb-6',
      name: 'Tony Marchetti',
      team: 'CHW',
      role: 'SP',
      primaryFBVelo: 92.6,
      maxFBVelo: 95.8,
      avgVeloDrop: 2.8,
      staminaGrade: 'D',
      veloConsistency: 58,
      overallGrade: 'C',
      pitchTypes: [
        {
          pitchType: '4-Seam Fastball', avgVelo: 92.6, maxVelo: 95.8, p95Velo: 94.8, p5Velo: 90.2, veloSpread: 4.6,
          bands: [
            band('94-95', 72, 10.2, 22.8, 0.282),
            band('93-94', 158, 22.6, 20.4, 0.295),
            band('92-93', 192, 27.4, 18.4, 0.308),
            band('91-92', 154, 22.0, 15.6, 0.328),
            band('90-91', 82, 11.8, 12.8, 0.352),
            band('<90', 42, 6.0, 9.4, 0.388),
          ],
        },
        {
          pitchType: 'Curveball', avgVelo: 79.8, maxVelo: 83.2, p95Velo: 82.4, p5Velo: 77.0, veloSpread: 5.4,
          bands: [
            band('82-83', 36, 10.0, 30.6, 0.232),
            band('81-82', 62, 17.2, 28.4, 0.248),
            band('80-81', 94, 26.2, 26.2, 0.265),
            band('79-80', 86, 24.0, 23.8, 0.285),
            band('<79', 82, 22.6, 20.2, 0.312),
          ],
        },
        {
          pitchType: 'Changeup', avgVelo: 83.4, maxVelo: 86.8, p95Velo: 86.0, p5Velo: 80.6, veloSpread: 5.4,
          bands: [
            band('85-86', 44, 11.0, 26.8, 0.248),
            band('84-85', 78, 19.4, 24.4, 0.262),
            band('83-84', 104, 26.0, 22.6, 0.278),
            band('82-83', 92, 23.0, 19.8, 0.298),
            band('<82', 82, 20.6, 16.2, 0.328),
          ],
        },
      ],
      inningByInning: [
        inning(1, 93.8, 95.8, 91.6, 0.0),
        inning(2, 93.2, 95.4, 91.0, 0.6),
        inning(3, 92.6, 94.8, 90.2, 1.2),
        inning(4, 91.8, 94.0, 89.4, 2.0),
        inning(5, 91.0, 93.2, 88.6, 2.8),
        inning(6, 90.4, 92.6, 87.8, 3.4),
        inning(7, 89.8, 92.0, 87.2, 4.0),
      ],
      notes: 'Significant velocity fade throughout start. Loses nearly 4 mph by the 7th inning. Fastball becomes very hittable under 91. Curveball and changeup lose effectiveness as arm speed drops. Best used as 5-inning pitcher or long relief.',
    },
  ];
}
