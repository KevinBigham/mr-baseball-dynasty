// ─── Run Expectancy Matrix (RE24) ─────────────────────────────────────────────
// Seeded from MLB data (2018–2022 average).
// State: runners (0-7 bitmask) × outs (0-2)
// runners bitmask: bit 0 = 1st, bit 1 = 2nd, bit 2 = 3rd
// Index: runners * 3 + outs

export const RE24_MATRIX: number[] = [
  // runners=0 (bases empty)
  0.481, 0.254, 0.095,
  // runners=1 (1st only)
  0.859, 0.509, 0.214,
  // runners=2 (2nd only)
  1.100, 0.664, 0.305,
  // runners=3 (1st + 2nd)
  1.437, 0.882, 0.413,
  // runners=4 (3rd only)
  1.349, 0.952, 0.350,
  // runners=5 (1st + 3rd)
  1.784, 1.097, 0.478,
  // runners=6 (2nd + 3rd)
  1.964, 1.374, 0.572,
  // runners=7 (bases loaded)
  2.282, 1.541, 0.736,
];

export function getRunExpectancy(runners: number, outs: number): number {
  if (outs >= 3) return 0;
  const idx = (runners & 0b111) * 3 + outs;
  return RE24_MATRIX[idx] ?? 0;
}

// ─── Speed-tier-based runner advancement probabilities ────────────────────────
// P(advance extra base | opportunity) for each speed tier and situation.
// speedTier: 'slow' | 'average' | 'fast'
// These are applied in the Markov chain transition logic.

export const ADVANCEMENT_PROBS = {
  // P(score from 1st on a double)
  score_from_1st_on_double: { slow: 0.18, average: 0.30, fast: 0.50 },
  // P(go first to third on a single)
  first_to_third_on_single: { slow: 0.22, average: 0.35, fast: 0.55 },
  // P(score from 2nd on a single)
  score_from_2nd_on_single: { slow: 0.55, average: 0.72, fast: 0.90 },
  // P(score from 3rd on a sac fly opportunity)
  score_on_sac_fly:         { slow: 0.85, average: 0.90, fast: 0.95 },
  // P(take extra base on a fielder's choice)
  extra_on_fc:              { slow: 0.10, average: 0.18, fast: 0.30 },
} as const;

export type SpeedTier = 'slow' | 'average' | 'fast';

export function getSpeedTier(speed: number): SpeedTier {
  if (speed < 200) return 'slow';
  if (speed < 400) return 'average';
  return 'fast';
}
