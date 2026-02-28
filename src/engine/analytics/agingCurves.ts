/**
 * Aging Curve Projections — Mr. Baseball Dynasty
 *
 * Models player aging trajectories to project future value:
 *   - Peak age estimation by position
 *   - WAR decline curves (fast, normal, slow, freak)
 *   - 5-year forward projections with confidence intervals
 *   - Contract risk assessment based on aging trajectory
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgingSpeed = 'fast_ager' | 'normal' | 'slow_ager' | 'freak';

export interface AgingProjection {
  age:          number;
  projectedWAR: number;
  confidence:   number; // 0-100
}

export interface AgingProfile {
  id:              string;
  name:            string;
  team:            string;
  position:        string;
  currentAge:      number;
  currentWAR:      number;
  peakAge:         number;
  peakWAR:         number;
  agingSpeed:      AgingSpeed;
  projections:     AgingProjection[]; // next 5 years
  declineStartAge: number;
  yearsOfPrime:    number;
  contractRisk:    string;
  notes:           string;
}

// ─── Display Constants ────────────────────────────────────────────────────────

export const AGING_SPEED_DISPLAY: Record<AgingSpeed, { label: string; color: string }> = {
  fast_ager: { label: 'Fast Ager',  color: '#ef4444' },
  normal:    { label: 'Normal',     color: '#f59e0b' },
  slow_ager: { label: 'Slow Ager',  color: '#22c55e' },
  freak:     { label: 'Freak',      color: '#3b82f6' },
};

// ─── Summary ──────────────────────────────────────────────────────────────────

export function getAgingCurvesSummary(profiles: AgingProfile[]): {
  totalPlayers: number;
  fastestAger:  string;
  slowestAger:  string;
  avgPeakAge:   number;
  highestPeak:  string;
  biggestRisk:  string;
} {
  if (profiles.length === 0) {
    return {
      totalPlayers: 0,
      fastestAger:  '—',
      slowestAger:  '—',
      avgPeakAge:   0,
      highestPeak:  '—',
      biggestRisk:  '—',
    };
  }

  // Fastest ager: lowest declineStartAge relative to currentAge
  const sortedByDecline = [...profiles].sort(
    (a, b) => (a.declineStartAge - a.currentAge) - (b.declineStartAge - b.currentAge),
  );
  const fastestAger = sortedByDecline[0]!.name;

  // Slowest ager: highest declineStartAge relative to currentAge
  const slowestAger = sortedByDecline[sortedByDecline.length - 1]!.name;

  // Average peak age
  const avgPeakAge = Math.round(
    profiles.reduce((sum, p) => sum + p.peakAge, 0) / profiles.length * 10,
  ) / 10;

  // Highest peak WAR
  const peakSorted = [...profiles].sort((a, b) => b.peakWAR - a.peakWAR);
  const highestPeak = `${peakSorted[0]!.name} (${peakSorted[0]!.peakWAR.toFixed(1)})`;

  // Biggest contract risk: player with worst risk assessment or fastest decline
  const riskProfiles = profiles.filter(p => p.contractRisk.toLowerCase().includes('high'));
  const biggestRisk = riskProfiles.length > 0
    ? riskProfiles[0]!.name
    : sortedByDecline[0]!.name;

  return {
    totalPlayers: profiles.length,
    fastestAger,
    slowestAger,
    avgPeakAge,
    highestPeak,
    biggestRisk,
  };
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

export function generateDemoAgingCurves(): AgingProfile[] {
  return [
    {
      id: 'ac-1',
      name: 'Marcus Rivera',
      team: 'NYY',
      position: 'CF',
      currentAge: 24,
      currentWAR: 5.2,
      peakAge: 27,
      peakWAR: 7.8,
      agingSpeed: 'slow_ager',
      projections: [
        { age: 25, projectedWAR: 5.9, confidence: 88 },
        { age: 26, projectedWAR: 6.8, confidence: 82 },
        { age: 27, projectedWAR: 7.8, confidence: 75 },
        { age: 28, projectedWAR: 7.4, confidence: 68 },
        { age: 29, projectedWAR: 6.6, confidence: 58 },
      ],
      declineStartAge: 30,
      yearsOfPrime: 8,
      contractRisk: 'Low — entering prime years with elite tools',
      notes: 'Elite speed and defense should age gracefully. Power still developing.',
    },
    {
      id: 'ac-2',
      name: 'Jake Thompson',
      team: 'BOS',
      position: '1B',
      currentAge: 31,
      currentWAR: 3.8,
      peakAge: 28,
      peakWAR: 6.1,
      agingSpeed: 'fast_ager',
      projections: [
        { age: 32, projectedWAR: 2.9, confidence: 78 },
        { age: 33, projectedWAR: 2.1, confidence: 65 },
        { age: 34, projectedWAR: 1.3, confidence: 50 },
        { age: 35, projectedWAR: 0.5, confidence: 38 },
        { age: 36, projectedWAR: -0.2, confidence: 25 },
      ],
      declineStartAge: 29,
      yearsOfPrime: 5,
      contractRisk: 'High — declining fast, avoid long-term deals',
      notes: 'Power-only profile ages poorly. Knee issues accelerating decline.',
    },
    {
      id: 'ac-3',
      name: 'Adrian Gomez',
      team: 'LAD',
      position: 'SP',
      currentAge: 28,
      currentWAR: 6.5,
      peakAge: 28,
      peakWAR: 6.5,
      agingSpeed: 'normal',
      projections: [
        { age: 29, projectedWAR: 6.0, confidence: 82 },
        { age: 30, projectedWAR: 5.2, confidence: 72 },
        { age: 31, projectedWAR: 4.3, confidence: 62 },
        { age: 32, projectedWAR: 3.4, confidence: 50 },
        { age: 33, projectedWAR: 2.6, confidence: 40 },
      ],
      declineStartAge: 29,
      yearsOfPrime: 6,
      contractRisk: 'Medium — at peak now, standard decline expected',
      notes: 'Workhorse SP. Pitch mix should hold up but velocity trending down.',
    },
    {
      id: 'ac-4',
      name: 'Carlos Delgado Jr.',
      team: 'HOU',
      position: 'SS',
      currentAge: 22,
      currentWAR: 3.1,
      peakAge: 26,
      peakWAR: 7.2,
      agingSpeed: 'slow_ager',
      projections: [
        { age: 23, projectedWAR: 4.0, confidence: 85 },
        { age: 24, projectedWAR: 5.1, confidence: 78 },
        { age: 25, projectedWAR: 6.2, confidence: 70 },
        { age: 26, projectedWAR: 7.2, confidence: 62 },
        { age: 27, projectedWAR: 7.0, confidence: 55 },
      ],
      declineStartAge: 30,
      yearsOfPrime: 9,
      contractRisk: 'Low — premium young talent, lock up now',
      notes: 'Generational talent. Extension candidate before arb years.',
    },
    {
      id: 'ac-5',
      name: 'David Park',
      team: 'SEA',
      position: 'C',
      currentAge: 35,
      currentWAR: 1.8,
      peakAge: 29,
      peakWAR: 5.4,
      agingSpeed: 'freak',
      projections: [
        { age: 36, projectedWAR: 1.5, confidence: 70 },
        { age: 37, projectedWAR: 1.1, confidence: 55 },
        { age: 38, projectedWAR: 0.6, confidence: 40 },
        { age: 39, projectedWAR: 0.1, confidence: 28 },
        { age: 40, projectedWAR: -0.4, confidence: 18 },
      ],
      declineStartAge: 33,
      yearsOfPrime: 7,
      contractRisk: 'Medium — still productive but catcher mileage is real',
      notes: 'Defied aging curves for years. Elite game-caller extends value.',
    },
    {
      id: 'ac-6',
      name: 'Tyler Washington',
      team: 'ATL',
      position: 'RF',
      currentAge: 29,
      currentWAR: 4.5,
      peakAge: 27,
      peakWAR: 5.8,
      agingSpeed: 'fast_ager',
      projections: [
        { age: 30, projectedWAR: 3.6, confidence: 80 },
        { age: 31, projectedWAR: 2.7, confidence: 68 },
        { age: 32, projectedWAR: 1.8, confidence: 55 },
        { age: 33, projectedWAR: 0.9, confidence: 42 },
        { age: 34, projectedWAR: 0.1, confidence: 30 },
      ],
      declineStartAge: 28,
      yearsOfPrime: 5,
      contractRisk: 'High — already past peak, speed declining rapidly',
      notes: 'Losing a step in the field. Bat-first profile moving forward.',
    },
  ];
}
