/**
 * Franchise Legacy Score
 *
 * Calculates a comprehensive franchise legacy score (0-100) based on:
 * win%, championships, playoff appearances, draft hits, development,
 * financial management, and dynasty bonuses.
 *
 * Ported from football dynasty legacy.js, adapted for baseball
 * (162-game seasons, World Series, etc.)
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface LegacyStats {
  seasons: number;
  games: number;
  wins: number;
  losses: number;
  rings: number;           // World Series wins
  playoffs: number;        // playoff appearances
  pennants: number;        // league pennants
  draftHits: number;       // drafted players who reached 80+ OVR
  devSuccesses: number;    // players who gained 5+ OVR in a season
  capMastery: number;      // seasons near luxury tax without exceeding
  neverTanked: boolean;    // never had a sub-40 win season
  firedManager: boolean;   // had to fire a manager
}

export interface LegacyBreakdown {
  winPct: number;
  rings: number;
  playoffs: number;
  pennants: number;
  draftHits: number;
  development: number;
  financial: number;
  integrity: number;
  firedPenalty: number;
  dynastyBonus: number;
  eraBonus: number;
  longevity: number;
}

export type LegacyTier = 'hall_of_fame' | 'legendary' | 'great' | 'good' | 'average' | 'poor';

export interface LegacyResult {
  score: number;
  tier: LegacyTier;
  label: string;
  winPct: number;
  breakdown: LegacyBreakdown;
}

// ── Tier config ─────────────────────────────────────────────────────────────

export const LEGACY_TIERS: Record<LegacyTier, { min: number; label: string; color: string; icon: string; desc: string }> = {
  hall_of_fame: { min: 90, label: 'Hall of Fame',  color: '#eab308', icon: '🏛️', desc: 'One of the greatest front offices in baseball history.' },
  legendary:    { min: 75, label: 'Legendary',     color: '#a855f7', icon: '👑', desc: 'A franchise that will be remembered for generations.' },
  great:        { min: 60, label: 'Great',         color: '#22c55e', icon: '⭐', desc: 'An impressive tenure with sustained excellence.' },
  good:         { min: 45, label: 'Good',          color: '#3b82f6', icon: '👍', desc: 'A solid run with memorable moments.' },
  average:      { min: 25, label: 'Average',       color: '#94a3b8', icon: '📊', desc: 'A forgettable tenure — nothing to write home about.' },
  poor:         { min: 0,  label: 'Poor',          color: '#ef4444', icon: '👎', desc: 'A dark era in franchise history.' },
};

export function getLegacyTier(score: number): LegacyTier {
  if (score >= 90) return 'hall_of_fame';
  if (score >= 75) return 'legendary';
  if (score >= 60) return 'great';
  if (score >= 45) return 'good';
  if (score >= 25) return 'average';
  return 'poor';
}

// ── Calculation ─────────────────────────────────────────────────────────────

export function calcLegacyScore(stats: LegacyStats): LegacyResult {
  const winPct = stats.games > 0 ? stats.wins / stats.games : 0;

  // Win percentage — up to 25 points
  const winPctScore = Math.min(25, winPct * 50); // .500 = 25pts

  // Championships — up to 25 points (5 per ring)
  const ringsScore = Math.min(25, stats.rings * 5);

  // Playoff appearances — up to 10 points
  const playoffsScore = Math.min(10, stats.playoffs * 1.25);

  // Pennants — up to 8 points
  const pennantsScore = Math.min(8, stats.pennants * 2);

  // Draft hits (80+ OVR) — up to 10 points
  const draftHitsScore = Math.min(10, stats.draftHits * 2);

  // Development successes — up to 7 points
  const devScore = Math.min(7, stats.devSuccesses * 0.7);

  // Financial management — up to 5 points
  const capScore = Math.min(5, stats.capMastery * 1.5);

  // Integrity — 5 points for never tanking
  const integrityBonus = stats.neverTanked ? 5 : 0;

  // Fired penalty
  const firedPenalty = stats.firedManager ? -10 : 0;

  // Dynasty bonus: 3+ rings in 10 years or fewer
  const dynastyBonus = (stats.rings >= 3 && stats.seasons <= 10) ? 10 : 0;

  // Era bonus: 2+ rings in 5 years or 3+ in 8 years
  let eraBonus = 0;
  if (stats.rings >= 3 && stats.seasons <= 8) eraBonus = 8;
  else if (stats.rings >= 2 && stats.seasons <= 5) eraBonus = 5;

  // Longevity bonus
  let longevity = 0;
  if (stats.seasons >= 10) longevity = 5;
  else if (stats.seasons >= 6) longevity = 3;

  const raw = winPctScore + ringsScore + playoffsScore + pennantsScore +
    draftHitsScore + devScore + capScore + integrityBonus + firedPenalty +
    dynastyBonus + eraBonus + longevity;

  const score = Math.min(100, Math.max(0, Math.round(raw)));
  const tier = getLegacyTier(score);

  return {
    score,
    tier,
    label: LEGACY_TIERS[tier].label,
    winPct,
    breakdown: {
      winPct: Math.round(winPctScore * 10) / 10,
      rings: ringsScore,
      playoffs: playoffsScore,
      pennants: pennantsScore,
      draftHits: draftHitsScore,
      development: Math.round(devScore * 10) / 10,
      financial: Math.round(capScore * 10) / 10,
      integrity: integrityBonus,
      firedPenalty,
      dynastyBonus,
      eraBonus,
      longevity,
    },
  };
}

// ── Init helper ─────────────────────────────────────────────────────────────

export function initLegacyStats(): LegacyStats {
  return {
    seasons: 0,
    games: 0,
    wins: 0,
    losses: 0,
    rings: 0,
    playoffs: 0,
    pennants: 0,
    draftHits: 0,
    devSuccesses: 0,
    capMastery: 0,
    neverTanked: true,
    firedManager: false,
  };
}

export function addSeason(
  stats: LegacyStats,
  wins: number,
  losses: number,
  madePlayoffs: boolean,
  wonPennant: boolean,
  wonWS: boolean,
  draftHits: number,
  devSuccesses: number,
  capMastery: boolean,
): LegacyStats {
  const updated = { ...stats };
  updated.seasons++;
  updated.games += wins + losses;
  updated.wins += wins;
  updated.losses += losses;
  if (madePlayoffs) updated.playoffs++;
  if (wonPennant) updated.pennants++;
  if (wonWS) updated.rings++;
  updated.draftHits += draftHits;
  updated.devSuccesses += devSuccesses;
  if (capMastery) updated.capMastery++;
  if (wins < 55) updated.neverTanked = false; // less than ~.340 win%
  return updated;
}
