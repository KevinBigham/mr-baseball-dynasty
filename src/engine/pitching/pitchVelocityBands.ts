/**
 * Pitch Velocity Bands – velocity distribution & decay engine
 *
 * Models pitch velocity distributions across bands, inning-by-inning decay,
 * stamina grades, consistency scores, and per-pitch-type velocity profiles.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type StaminaGrade = 'elite' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export interface PitchTypeVelo {
  pitchType: string;
  avgVelo: number;
  maxVelo: number;
  p95: number;
  p5: number;
  spread: number;  // p95 - p5
}

export interface VelocityBand {
  range: string;       // e.g. "95-97"
  pct: number;         // % of pitches in this band
  whiffPct: number;    // whiff rate on pitches in this band
  wOBA: number;        // wOBA against in this band
}

export interface InningVelo {
  inning: number;
  avgVelo: number;
  maxVelo: number;
  veloDrop: number;    // drop from 1st inning avg
}

export interface VelocityProfile {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP' | 'CL';
  primaryPitch: string;
  primaryVelo: number;
  maxVelo: number;
  consistencyScore: number;   // 0-100
  staminaGrade: StaminaGrade;
  veloDropPerInning: number;  // avg mph lost per inning
  pitchTypes: PitchTypeVelo[];
  velocityBands: VelocityBand[];
  inningByInning: InningVelo[];
  notes: string;
}

export interface VelocityBandsSummary {
  totalPitchers: number;
  hardestThrower: string;
  bestStamina: string;
  avgFBVelo: string;
  avgVeloDrop: string;
}

// ── Display helpers ────────────────────────────────────────────────────────

export const STAMINA_GRADE_DISPLAY: Record<StaminaGrade, { label: string; color: string }> = {
  elite:      { label: 'ELITE',     color: '#22c55e' },
  above_avg:  { label: 'ABOVE AVG', color: '#86efac' },
  average:    { label: 'AVERAGE',   color: '#facc15' },
  below_avg:  { label: 'BELOW AVG', color: '#f97316' },
  poor:       { label: 'POOR',      color: '#ef4444' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export function getVelocityBandsSummary(pitchers: VelocityProfile[]): VelocityBandsSummary {
  if (pitchers.length === 0) {
    return { totalPitchers: 0, hardestThrower: '-', bestStamina: '-', avgFBVelo: '0', avgVeloDrop: '0' };
  }
  const hardest = [...pitchers].sort((a, b) => b.maxVelo - a.maxVelo)[0];
  const bestStam = [...pitchers].sort((a, b) => {
    const order: StaminaGrade[] = ['elite', 'above_avg', 'average', 'below_avg', 'poor'];
    return order.indexOf(a.staminaGrade) - order.indexOf(b.staminaGrade);
  })[0];
  const avgFB = pitchers.reduce((s, p) => s + p.primaryVelo, 0) / pitchers.length;
  const avgDrop = pitchers.reduce((s, p) => s + p.veloDropPerInning, 0) / pitchers.length;
  return {
    totalPitchers: pitchers.length,
    hardestThrower: hardest.name,
    bestStamina: bestStam.name,
    avgFBVelo: avgFB.toFixed(1),
    avgVeloDrop: avgDrop.toFixed(2),
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoVelocityBands(): VelocityProfile[] {
  return [
    {
      id: 'vp1', name: 'Ryan Caldwell', team: 'NYY', role: 'SP',
      primaryPitch: '4-Seam FB', primaryVelo: 96.2, maxVelo: 99.4, consistencyScore: 82,
      staminaGrade: 'elite', veloDropPerInning: 0.3,
      pitchTypes: [
        { pitchType: '4-Seam FB', avgVelo: 96.2, maxVelo: 99.4, p95: 98.1, p5: 93.8, spread: 4.3 },
        { pitchType: 'Slider', avgVelo: 87.4, maxVelo: 90.2, p95: 89.6, p5: 84.8, spread: 4.8 },
        { pitchType: 'Changeup', avgVelo: 88.1, maxVelo: 91.0, p95: 90.2, p5: 85.6, spread: 4.6 },
        { pitchType: 'Curveball', avgVelo: 80.4, maxVelo: 83.8, p95: 82.9, p5: 77.6, spread: 5.3 },
      ],
      velocityBands: [
        { range: '98-100', pct: 12.4, whiffPct: 34.2, wOBA: .248 },
        { range: '96-98', pct: 38.8, whiffPct: 28.6, wOBA: .278 },
        { range: '94-96', pct: 32.1, whiffPct: 24.1, wOBA: .302 },
        { range: '92-94', pct: 12.8, whiffPct: 18.4, wOBA: .338 },
        { range: '<92', pct: 3.9, whiffPct: 14.2, wOBA: .372 },
      ],
      inningByInning: [
        { inning: 1, avgVelo: 96.8, maxVelo: 99.4, veloDrop: 0 },
        { inning: 2, avgVelo: 96.6, maxVelo: 99.1, veloDrop: 0.2 },
        { inning: 3, avgVelo: 96.4, maxVelo: 98.8, veloDrop: 0.4 },
        { inning: 4, avgVelo: 96.1, maxVelo: 98.4, veloDrop: 0.7 },
        { inning: 5, avgVelo: 95.8, maxVelo: 98.0, veloDrop: 1.0 },
        { inning: 6, avgVelo: 95.5, maxVelo: 97.6, veloDrop: 1.3 },
        { inning: 7, avgVelo: 95.2, maxVelo: 97.2, veloDrop: 1.6 },
      ],
      notes: 'Elite velocity maintenance through 7 innings. Fastball plays up with carry and ride. Minimal decay makes him a true workhorse.',
    },
    {
      id: 'vp2', name: 'Marcus Webb', team: 'LAD', role: 'SP',
      primaryPitch: 'Sinker', primaryVelo: 94.8, maxVelo: 97.6, consistencyScore: 74,
      staminaGrade: 'average', veloDropPerInning: 0.6,
      pitchTypes: [
        { pitchType: 'Sinker', avgVelo: 94.8, maxVelo: 97.6, p95: 96.8, p5: 92.4, spread: 4.4 },
        { pitchType: 'Slider', avgVelo: 85.2, maxVelo: 88.4, p95: 87.6, p5: 82.6, spread: 5.0 },
        { pitchType: 'Changeup', avgVelo: 86.4, maxVelo: 89.8, p95: 88.9, p5: 83.8, spread: 5.1 },
      ],
      velocityBands: [
        { range: '96-98', pct: 18.2, whiffPct: 22.4, wOBA: .268 },
        { range: '94-96', pct: 42.6, whiffPct: 18.8, wOBA: .292 },
        { range: '92-94', pct: 28.4, whiffPct: 14.2, wOBA: .324 },
        { range: '90-92', pct: 8.6, whiffPct: 10.8, wOBA: .358 },
        { range: '<90', pct: 2.2, whiffPct: 8.4, wOBA: .392 },
      ],
      inningByInning: [
        { inning: 1, avgVelo: 95.6, maxVelo: 97.6, veloDrop: 0 },
        { inning: 2, avgVelo: 95.2, maxVelo: 97.2, veloDrop: 0.4 },
        { inning: 3, avgVelo: 94.8, maxVelo: 96.8, veloDrop: 0.8 },
        { inning: 4, avgVelo: 94.2, maxVelo: 96.2, veloDrop: 1.4 },
        { inning: 5, avgVelo: 93.6, maxVelo: 95.6, veloDrop: 2.0 },
        { inning: 6, avgVelo: 93.0, maxVelo: 95.0, veloDrop: 2.6 },
      ],
      notes: 'Significant velocity drop after 4th inning. Sinker loses sink as velocity dips below 93. Best used through 5 innings.',
    },
    {
      id: 'vp3', name: 'Jake Thornton', team: 'HOU', role: 'RP',
      primaryPitch: '4-Seam FB', primaryVelo: 98.4, maxVelo: 101.8, consistencyScore: 88,
      staminaGrade: 'above_avg', veloDropPerInning: 0.2,
      pitchTypes: [
        { pitchType: '4-Seam FB', avgVelo: 98.4, maxVelo: 101.8, p95: 100.6, p5: 96.0, spread: 4.6 },
        { pitchType: 'Slider', avgVelo: 89.8, maxVelo: 93.2, p95: 92.0, p5: 87.4, spread: 4.6 },
      ],
      velocityBands: [
        { range: '100+', pct: 22.8, whiffPct: 38.4, wOBA: .218 },
        { range: '98-100', pct: 42.4, whiffPct: 32.6, wOBA: .242 },
        { range: '96-98', pct: 26.2, whiffPct: 26.8, wOBA: .278 },
        { range: '<96', pct: 8.6, whiffPct: 18.2, wOBA: .322 },
      ],
      inningByInning: [
        { inning: 1, avgVelo: 98.8, maxVelo: 101.8, veloDrop: 0 },
        { inning: 2, avgVelo: 98.4, maxVelo: 101.2, veloDrop: 0.4 },
      ],
      notes: 'Elite velocity reliever. Touches 101+ consistently. Two-pitch mix dominates in short stints. Fastball whiff rate elite above 100.',
    },
    {
      id: 'vp4', name: 'Chris Yamamoto', team: 'SF', role: 'SP',
      primaryPitch: '4-Seam FB', primaryVelo: 93.4, maxVelo: 96.8, consistencyScore: 90,
      staminaGrade: 'elite', veloDropPerInning: 0.2,
      pitchTypes: [
        { pitchType: '4-Seam FB', avgVelo: 93.4, maxVelo: 96.8, p95: 95.8, p5: 91.2, spread: 4.6 },
        { pitchType: 'Cutter', avgVelo: 89.2, maxVelo: 92.4, p95: 91.6, p5: 86.8, spread: 4.8 },
        { pitchType: 'Curveball', avgVelo: 78.6, maxVelo: 82.0, p95: 81.2, p5: 76.0, spread: 5.2 },
        { pitchType: 'Changeup', avgVelo: 84.8, maxVelo: 88.2, p95: 87.4, p5: 82.2, spread: 5.2 },
      ],
      velocityBands: [
        { range: '96-98', pct: 8.4, whiffPct: 26.8, wOBA: .262 },
        { range: '94-96', pct: 28.6, whiffPct: 22.4, wOBA: .288 },
        { range: '92-94', pct: 42.2, whiffPct: 20.1, wOBA: .298 },
        { range: '90-92', pct: 16.4, whiffPct: 16.8, wOBA: .318 },
        { range: '<90', pct: 4.4, whiffPct: 12.4, wOBA: .342 },
      ],
      inningByInning: [
        { inning: 1, avgVelo: 93.8, maxVelo: 96.8, veloDrop: 0 },
        { inning: 2, avgVelo: 93.6, maxVelo: 96.4, veloDrop: 0.2 },
        { inning: 3, avgVelo: 93.4, maxVelo: 96.2, veloDrop: 0.4 },
        { inning: 4, avgVelo: 93.2, maxVelo: 95.8, veloDrop: 0.6 },
        { inning: 5, avgVelo: 93.0, maxVelo: 95.6, veloDrop: 0.8 },
        { inning: 6, avgVelo: 92.8, maxVelo: 95.4, veloDrop: 1.0 },
        { inning: 7, avgVelo: 92.6, maxVelo: 95.2, veloDrop: 1.2 },
        { inning: 8, avgVelo: 92.4, maxVelo: 95.0, veloDrop: 1.4 },
      ],
      notes: 'Highest consistency score on staff. Remarkable velocity maintenance through 8 innings. Command-first pitcher who maximizes every mph.',
    },
    {
      id: 'vp5', name: 'Devon Reyes', team: 'ATL', role: 'CL',
      primaryPitch: '4-Seam FB', primaryVelo: 97.8, maxVelo: 100.6, consistencyScore: 78,
      staminaGrade: 'below_avg', veloDropPerInning: 0.8,
      pitchTypes: [
        { pitchType: '4-Seam FB', avgVelo: 97.8, maxVelo: 100.6, p95: 99.8, p5: 95.4, spread: 4.4 },
        { pitchType: 'Slider', avgVelo: 88.6, maxVelo: 92.0, p95: 91.2, p5: 85.8, spread: 5.4 },
        { pitchType: 'Splitter', avgVelo: 90.2, maxVelo: 93.4, p95: 92.6, p5: 87.6, spread: 5.0 },
      ],
      velocityBands: [
        { range: '100+', pct: 14.6, whiffPct: 36.8, wOBA: .228 },
        { range: '98-100', pct: 38.2, whiffPct: 30.4, wOBA: .252 },
        { range: '96-98', pct: 32.8, whiffPct: 24.6, wOBA: .288 },
        { range: '<96', pct: 14.4, whiffPct: 16.2, wOBA: .342 },
      ],
      inningByInning: [
        { inning: 1, avgVelo: 98.6, maxVelo: 100.6, veloDrop: 0 },
        { inning: 2, avgVelo: 97.2, maxVelo: 99.8, veloDrop: 1.4 },
      ],
      notes: 'Dominant first-inning closer but velocity falls off sharply in multi-inning outings. Best in strict 1-inning role.',
    },
    {
      id: 'vp6', name: 'Tony Marchetti', team: 'CHW', role: 'SP',
      primaryPitch: '4-Seam FB', primaryVelo: 92.6, maxVelo: 95.8, consistencyScore: 68,
      staminaGrade: 'below_avg', veloDropPerInning: 0.8,
      pitchTypes: [
        { pitchType: '4-Seam FB', avgVelo: 92.6, maxVelo: 95.8, p95: 94.8, p5: 90.2, spread: 4.6 },
        { pitchType: 'Curveball', avgVelo: 79.8, maxVelo: 83.2, p95: 82.4, p5: 77.0, spread: 5.4 },
        { pitchType: 'Changeup', avgVelo: 83.4, maxVelo: 86.8, p95: 86.0, p5: 80.6, spread: 5.4 },
      ],
      velocityBands: [
        { range: '94-96', pct: 14.2, whiffPct: 22.8, wOBA: .282 },
        { range: '92-94', pct: 38.6, whiffPct: 18.4, wOBA: .308 },
        { range: '90-92', pct: 32.4, whiffPct: 14.6, wOBA: .338 },
        { range: '<90', pct: 14.8, whiffPct: 10.2, wOBA: .378 },
      ],
      inningByInning: [
        { inning: 1, avgVelo: 93.8, maxVelo: 95.8, veloDrop: 0 },
        { inning: 2, avgVelo: 93.2, maxVelo: 95.4, veloDrop: 0.6 },
        { inning: 3, avgVelo: 92.6, maxVelo: 94.8, veloDrop: 1.2 },
        { inning: 4, avgVelo: 91.8, maxVelo: 94.0, veloDrop: 2.0 },
        { inning: 5, avgVelo: 91.0, maxVelo: 93.2, veloDrop: 2.8 },
      ],
      notes: 'Significant velocity fade after 3rd inning. Below-average stamina limits him to 5 innings max. Fastball becomes hittable under 92.',
    },
  ];
}
