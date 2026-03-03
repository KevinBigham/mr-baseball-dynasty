import type { Player } from '../types/player';

// ─── Scouting Report Interface ──────────────────────────────────────────────

export interface ScoutingReport {
  playerId: number;
  observedOverall: number;     // Noisy version of true overall
  observedPotential: number;   // Noisy version of true potential
  confidence: number;          // 0-1: increases as you scout more
  lastScoutedSeason: number;
}

// ─── Deterministic Gaussian Noise ───────────────────────────────────────────

/** Box-Muller transform for deterministic gaussian noise from a seed */
export function gaussianNoise(seed: number): number {
  // Simple hash
  let h = seed;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = (h >>> 16) ^ h;
  const u1 = (h & 0xffff) / 0xffff;
  h = ((h >>> 8) ^ (h * 0x5bd1e995)) & 0xffffffff;
  const u2 = (h & 0xffff) / 0xffff;
  // Avoid log(0)
  const safe_u1 = Math.max(0.0001, u1);
  return Math.sqrt(-2 * Math.log(safe_u1)) * Math.cos(2 * Math.PI * u2);
}

// ─── Core Scouting Report Generation ────────────────────────────────────────

/**
 * Generate a scouting report with noise.
 * scoutingAccuracy: 0.5 (bad) to 1.5 (elite). At 1.0 sigma=15 on 0-550 scale.
 * Uses Box-Muller for gaussian noise from a simple seed-based function.
 */
export function generateScoutingReport(
  player: Player,
  scoutingAccuracy: number,
  season: number,
  existingReport?: ScoutingReport,
): ScoutingReport {
  const sigma = 15 / scoutingAccuracy; // Higher accuracy = less noise

  // Simple deterministic noise based on playerId + season
  const noise1 = gaussianNoise(player.playerId * 1000 + season);
  const noise2 = gaussianNoise(player.playerId * 2000 + season + 1);

  const rawOverall = player.overall + noise1 * sigma;
  const rawPotential = player.potential + noise2 * sigma;

  // If there's an existing report, Bayesian update (average weighted by confidence)
  if (existingReport && existingReport.confidence > 0) {
    const oldWeight = existingReport.confidence;
    const newWeight = 0.4; // Each new scout pass adds this much confidence
    const totalWeight = oldWeight + newWeight;
    return {
      playerId: player.playerId,
      observedOverall: Math.round(
        (existingReport.observedOverall * oldWeight + rawOverall * newWeight) / totalWeight,
      ),
      observedPotential: Math.round(
        (existingReport.observedPotential * oldWeight + rawPotential * newWeight) / totalWeight,
      ),
      confidence: Math.min(1, totalWeight),
      lastScoutedSeason: season,
    };
  }

  return {
    playerId: player.playerId,
    observedOverall: Math.round(Math.max(50, Math.min(550, rawOverall))),
    observedPotential: Math.round(Math.max(50, Math.min(550, rawPotential))),
    confidence: 0.4,
    lastScoutedSeason: season,
  };
}

// ─── Display Grades Helper ──────────────────────────────────────────────────

/**
 * Get display grades for a player (for the UI).
 * Returns true values if isUserTeam, scouted values if report exists,
 * or rough estimate if unscouted.
 */
export function getDisplayGrades(
  player: Player,
  isUserTeam: boolean,
  report?: ScoutingReport,
): { overall: number; potential: number; confidence: number | null; scouted: boolean } {
  if (isUserTeam) {
    return { overall: player.overall, potential: player.potential, confidence: null, scouted: false };
  }
  if (report) {
    return {
      overall: report.observedOverall,
      potential: report.observedPotential,
      confidence: report.confidence,
      scouted: true,
    };
  }
  // Unscouted: show very rough estimate (±30 noise)
  const roughOverall = Math.round(
    Math.max(50, Math.min(550, player.overall + gaussianNoise(player.playerId * 3000) * 30)),
  );
  const roughPotential = Math.round(
    Math.max(50, Math.min(550, player.potential + gaussianNoise(player.playerId * 4000) * 30)),
  );
  return { overall: roughOverall, potential: roughPotential, confidence: 0, scouted: false };
}
