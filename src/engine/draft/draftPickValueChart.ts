/**
 * Draft Pick Value Chart — Mr. Baseball Dynasty
 *
 * Assigns surplus value to each draft slot (1-40+), tracks historical
 * hit rates per slot position, and evaluates trade scenarios involving
 * draft picks. Each slot maps to an expected player value range.
 *
 * Key concepts:
 *   - Surplus value: expected WAR above replacement over cost-controlled years
 *   - Hit rate: % of picks at that slot who became MLB regulars (2+ WAR seasons)
 *   - Star rate: % of picks at that slot who became stars (4+ WAR seasons)
 *   - Equivalent player value: what caliber of proven player a pick is "worth"
 *   - Trade comparison: is the pick worth more than the player you'd get back?
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DraftSlotValue {
  pick: number;
  round: number;
  surplusValue: number;       // $M surplus over cost-controlled years
  expectedWAR: number;        // career WAR expectation
  hitRate: number;            // % chance of becoming MLB regular (0-1)
  starRate: number;           // % chance of becoming star (0-1)
  bustRate: number;           // % chance of never reaching MLB (0-1)
  signingBonus: number;       // expected slot bonus $M
  yearsToMLB: number;         // avg years to debut
  equivalentPlayerOVR: number; // overall rating of equivalent proven player
  equivalentPlayerLabel: string; // description like "League-Avg Starter"
  historicalNotables: string[];  // famous players picked at this slot
}

export interface TradeScenario {
  id: number;
  title: string;
  description: string;
  side1Label: string;
  side1Picks: number[];       // pick numbers
  side1Players: string[];     // player names
  side1TotalValue: number;    // $M
  side2Label: string;
  side2Picks: number[];
  side2Players: string[];
  side2TotalValue: number;
  verdict: 'side1' | 'side2' | 'even';
  analysis: string;
}

export interface ValueTierBand {
  tier: string;
  label: string;
  color: string;
  pickRange: [number, number];
  avgSurplus: number;
  avgHitRate: number;
}

export interface DraftPickValueData {
  slots: DraftSlotValue[];
  tradeScenarios: TradeScenario[];
  tiers: ValueTierBand[];
  leagueAvgWAR: number;
  costControlledYears: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getRound(pick: number): number {
  if (pick <= 30) return 1;
  if (pick <= 60) return 2;
  if (pick <= 90) return 3;
  if (pick <= 120) return 4;
  return 5;
}

function getEquivalentLabel(ovr: number): string {
  if (ovr >= 85) return 'Perennial All-Star';
  if (ovr >= 78) return 'Above-Avg Starter';
  if (ovr >= 70) return 'League-Avg Starter';
  if (ovr >= 62) return 'Platoon / Utility Player';
  if (ovr >= 55) return 'Bench Piece';
  if (ovr >= 48) return 'AAAA Player';
  return 'Org Filler';
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

const HISTORICAL_NOTABLES: Record<number, string[]> = {
  1:  ['Bryce Harper (2010)', 'Adrian Gonzalez (2000)', 'Ken Griffey Jr. (1987)'],
  2:  ['Mike Trout (…almost)', 'Mark Appel (2013)', 'Alex Rodriguez (1993)'],
  3:  ['Manny Machado (2010)', 'B.J. Surhoff (1985)', 'Evan Longoria (2006)'],
  4:  ['Andrew McCutchen (2005)', 'Mike Piazza (…62nd!)', 'CC Sabathia (1998)'],
  5:  ['Corey Seager (2012)', 'Albert Pujols (402nd!)', 'Matt Wieters (2007)'],
  6:  ['Kris Bryant (2013)', 'Clayton Kershaw (2006)'],
  7:  ['Jose Fernandez (2011)', 'Prince Fielder (2002)'],
  8:  ['Buster Posey (2008)', 'Gerrit Cole (2011)'],
  9:  ['Mike Moustakas (2007)', 'Jered Weaver (2004)'],
  10: ['Justin Upton (2005)', 'Josh Beckett (1999)'],
  15: ['Carlos Correa (2012)', 'Anthony Rizzo (2007)'],
  20: ['Madison Bumgarner (2007)', 'David Price (2007)'],
  25: ['Mike Trout (2009)', 'Giancarlo Stanton (2007)'],
  30: ['Max Scherzer (2006)', 'Cole Hamels (2002)'],
};

export function generateDemoDraftPickValue(): DraftPickValueData {
  const slots: DraftSlotValue[] = [];

  for (let pick = 1; pick <= 50; pick++) {
    // Surplus value decays roughly exponentially
    const baseSurplus = 42 * Math.exp(-0.055 * (pick - 1)) + 3;
    const surplus = Math.round(baseSurplus * 10) / 10;

    // Expected WAR follows similar curve
    const expectedWAR = Math.round((18 * Math.exp(-0.045 * (pick - 1)) + 1.5) * 10) / 10;

    // Hit rate: top picks ~ 65%, decays to ~20%
    const hitRate = Math.round((0.65 * Math.exp(-0.028 * (pick - 1)) + 0.12) * 1000) / 1000;

    // Star rate: top picks ~ 35%, decays quickly
    const starRate = Math.round((0.35 * Math.exp(-0.06 * (pick - 1)) + 0.02) * 1000) / 1000;

    // Bust rate is inverse of hit rate, with some floor
    const bustRate = Math.round(Math.max(0.15, 1 - hitRate - 0.15) * 1000) / 1000;

    // Signing bonus decays
    const signingBonus = Math.round((8.5 * Math.exp(-0.05 * (pick - 1)) + 0.3) * 10) / 10;

    // Years to MLB: top picks faster (~2.5), later picks slower (~4.5)
    const yearsToMLB = Math.round((2.5 + 2.0 * (1 - Math.exp(-0.04 * (pick - 1)))) * 10) / 10;

    // Equivalent player overall
    const equivalentOVR = Math.round(90 - (pick - 1) * 0.95);
    const clampedOVR = Math.max(40, Math.min(90, equivalentOVR));

    slots.push({
      pick,
      round: getRound(pick),
      surplusValue: surplus,
      expectedWAR: expectedWAR,
      hitRate,
      starRate,
      bustRate,
      signingBonus,
      yearsToMLB,
      equivalentPlayerOVR: clampedOVR,
      equivalentPlayerLabel: getEquivalentLabel(clampedOVR),
      historicalNotables: HISTORICAL_NOTABLES[pick] ?? [],
    });
  }

  const tradeScenarios: TradeScenario[] = [
    {
      id: 1,
      title: 'Top Pick for MLB Star',
      description: 'Trading the #3 overall pick for a proven 4-WAR shortstop on a team-friendly deal.',
      side1Label: 'Team A (sends pick)',
      side1Picks: [3],
      side1Players: [],
      side1TotalValue: slots[2].surplusValue,
      side2Label: 'Team B (sends player)',
      side2Picks: [],
      side2Players: ['Marcus Vega (SS, 82 OVR, 3yr/$36M)'],
      side2TotalValue: 35.5,
      verdict: 'side1',
      analysis: 'The #3 pick carries $38.8M surplus value with a 60% hit rate. The proven shortstop provides guaranteed production but at higher cost. Edge to the pick side for rebuilding teams.',
    },
    {
      id: 2,
      title: 'Two Late Firsts for a Top-10 Pick',
      description: 'Packaging picks #22 and #28 to move up to #8 overall.',
      side1Label: 'Moving Up (sends 2 picks)',
      side1Picks: [22, 28],
      side1Players: [],
      side1TotalValue: (slots[21].surplusValue + slots[27].surplusValue),
      side2Label: 'Moving Down (sends 1 pick)',
      side2Picks: [8],
      side2Players: [],
      side2TotalValue: slots[7].surplusValue,
      verdict: 'side1',
      analysis: 'Two late first-rounders combine for more total expected value than a single top-10 pick, but the top pick has a significantly higher star probability. Depends on team philosophy.',
    },
    {
      id: 3,
      title: 'Prospect Package Deal',
      description: 'Trading #12 pick plus a B-prospect for a front-line starter with 2 years of control.',
      side1Label: 'Acquiring Ace',
      side1Picks: [12],
      side1Players: ['Tyler Banks (B-prospect, 55 OVR)'],
      side1TotalValue: slots[11].surplusValue + 8.0,
      side2Label: 'Selling Ace',
      side2Picks: [],
      side2Players: ['Derek Liang (SP, 86 OVR, 2yr/$52M)'],
      side2TotalValue: 28.0,
      verdict: 'side2',
      analysis: 'The ace provides elite certainty for a contending window. The pick + prospect package offers more raw value but with 3-4 year delay. Win-now teams should take the ace.',
    },
    {
      id: 4,
      title: 'Three-Team Pick Swap',
      description: 'Complex deal: Team A sends #5 to Team B, gets #15 + #35 from Team C, Team B sends reliever to Team C.',
      side1Label: 'Team A (gets depth)',
      side1Picks: [15, 35],
      side1Players: [],
      side1TotalValue: slots[14].surplusValue + slots[34].surplusValue,
      side2Label: 'Team B (gets premium)',
      side2Picks: [5],
      side2Players: [],
      side2TotalValue: slots[4].surplusValue,
      verdict: 'even',
      analysis: 'Remarkably close in value. Team A gains two lottery tickets with solid combined probability, while Team B concentrates value into one premium asset. Fair deal for both sides.',
    },
    {
      id: 5,
      title: 'Veteran Rental + Pick',
      description: 'Contender sends #18 pick for a rental slugger (.290/35 HR) with 3 months of control.',
      side1Label: 'Contender (sends pick)',
      side1Picks: [18],
      side1Players: [],
      side1TotalValue: slots[17].surplusValue,
      side2Label: 'Seller (sends rental)',
      side2Picks: [],
      side2Players: ['James Okafor (1B, 80 OVR, rental)'],
      side2TotalValue: 6.5,
      verdict: 'side1',
      analysis: 'Massive overpay for a 3-month rental. The #18 pick has ~$16.5M in surplus value vs ~$6.5M for the rental. Only justifiable if the contender is a lock for the World Series.',
    },
  ];

  const tiers: ValueTierBand[] = [
    { tier: 'elite',     label: 'Elite Tier',      color: '#22c55e', pickRange: [1, 5],   avgSurplus: 0, avgHitRate: 0 },
    { tier: 'premium',   label: 'Premium Tier',    color: '#3b82f6', pickRange: [6, 10],  avgSurplus: 0, avgHitRate: 0 },
    { tier: 'solid',     label: 'Solid Tier',      color: '#f59e0b', pickRange: [11, 20], avgSurplus: 0, avgHitRate: 0 },
    { tier: 'depth',     label: 'Depth Tier',      color: '#f97316', pickRange: [21, 30], avgSurplus: 0, avgHitRate: 0 },
    { tier: 'lottery',   label: 'Lottery Tier',    color: '#ef4444', pickRange: [31, 40], avgSurplus: 0, avgHitRate: 0 },
    { tier: 'longshot',  label: 'Long Shot Tier',  color: '#6b7280', pickRange: [41, 50], avgSurplus: 0, avgHitRate: 0 },
  ];

  // Compute tier averages
  for (const tier of tiers) {
    const [lo, hi] = tier.pickRange;
    const tierSlots = slots.filter(s => s.pick >= lo && s.pick <= hi);
    tier.avgSurplus = Math.round(tierSlots.reduce((s, t) => s + t.surplusValue, 0) / tierSlots.length * 10) / 10;
    tier.avgHitRate = Math.round(tierSlots.reduce((s, t) => s + t.hitRate, 0) / tierSlots.length * 1000) / 1000;
  }

  return {
    slots,
    tradeScenarios,
    tiers,
    leagueAvgWAR: 2.0,
    costControlledYears: 6,
  };
}
