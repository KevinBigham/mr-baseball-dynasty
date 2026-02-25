import { STABILIZATION_POINTS, LEAGUE_RATES } from '../../data/positionalPriors';

// ─── Bayesian regression to the mean ─────────────────────────────────────────
// Used for stat evaluation when sample size is small.
// effective_rate = (PA / (PA + K)) * observed + (K / (PA + K)) * prior
// where K = stabilization point for that stat.

export function bayesianRate(
  observed: number,
  prior: number,
  sampleSize: number,
  stabilizationPoint: number,
): number {
  const weight = sampleSize / (sampleSize + stabilizationPoint);
  return weight * observed + (1 - weight) * prior;
}

// ─── Stabilize key rates using Bayesian priors ────────────────────────────────
export interface HitterObservedRates {
  pa: number;
  kRate?: number;
  bbRate?: number;
  babip?: number;
  iso?: number; // Isolated Power = SLG - AVG
}

export interface StabilizedHitterRates {
  kRate: number;
  bbRate: number;
  babip: number;
  iso: number;
}

export function stabilizeHitterRates(
  observed: HitterObservedRates,
  positionalPriorBabip?: number, // Position-specific BABIP prior
): StabilizedHitterRates {
  const babipPrior = positionalPriorBabip ?? LEAGUE_RATES.babip;

  return {
    kRate:  bayesianRate(
      observed.kRate  ?? LEAGUE_RATES.kRate,
      LEAGUE_RATES.kRate,
      observed.pa,
      STABILIZATION_POINTS.kRate,
    ),
    bbRate: bayesianRate(
      observed.bbRate ?? LEAGUE_RATES.bbRate,
      LEAGUE_RATES.bbRate,
      observed.pa,
      STABILIZATION_POINTS.bbRate,
    ),
    babip:  bayesianRate(
      observed.babip  ?? babipPrior,
      babipPrior,
      observed.pa,
      STABILIZATION_POINTS.babip,
    ),
    iso:    bayesianRate(
      observed.iso    ?? 0.135, // League average ISO ~.135
      0.135,
      observed.pa,
      STABILIZATION_POINTS.isopower,
    ),
  };
}

export interface PitcherObservedRates {
  bf: number;
  kRate?: number;
  bbRate?: number;
  hrRate?: number;
  babip?: number;
}

export interface StabilizedPitcherRates {
  kRate: number;
  bbRate: number;
  hrRate: number;
  babip: number;
}

export function stabilizePitcherRates(
  observed: PitcherObservedRates,
): StabilizedPitcherRates {
  return {
    kRate:  bayesianRate(
      observed.kRate  ?? LEAGUE_RATES.pitcherKRate,
      LEAGUE_RATES.pitcherKRate,
      observed.bf,
      STABILIZATION_POINTS.pitcherK,
    ),
    bbRate: bayesianRate(
      observed.bbRate ?? LEAGUE_RATES.pitcherBBRate,
      LEAGUE_RATES.pitcherBBRate,
      observed.bf,
      STABILIZATION_POINTS.pitcherBB,
    ),
    hrRate: bayesianRate(
      observed.hrRate ?? LEAGUE_RATES.pitcherHRRate,
      LEAGUE_RATES.pitcherHRRate,
      observed.bf,
      STABILIZATION_POINTS.pitcherK, // Use K stabilization for HR too
    ),
    // NEVER adjust pitcher on short BABIP stretch
    babip: bayesianRate(
      observed.babip ?? LEAGUE_RATES.babip,
      LEAGUE_RATES.babip,
      observed.bf,
      STABILIZATION_POINTS.pitcherBABIP,
    ),
  };
}

// ─── Pythagorean win expectation ──────────────────────────────────────────────
// Pythagenpat: exponent varies with run environment
export function pythagenpatWinPct(runsScored: number, runsAllowed: number): number {
  if (runsScored === 0 && runsAllowed === 0) return 0.5;
  const avgRuns = (runsScored + runsAllowed) / 2;
  // Pythagenpat exponent: ~1.83 at ~4.5 RPG
  const exponent = Math.pow(avgRuns, 0.287);
  const rs = Math.pow(runsScored, exponent);
  const ra = Math.pow(runsAllowed, exponent);
  return rs / (rs + ra);
}
