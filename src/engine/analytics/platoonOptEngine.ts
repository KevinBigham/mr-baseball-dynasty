/**
 * platoonOptEngine.ts – Platoon Optimization Engine
 *
 * Identifies optimal platoon pairings by analyzing each player's
 * splits vs LHP/RHP. Computes combined wOBA, platoon advantage,
 * and overall team platoon benefit.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type Hand = 'L' | 'R' | 'S';

export interface PlatoonPlayer {
  name: string;
  hand: Hand;
  wOBAvsR: number;
  wOBAvsL: number;
  overallWOBA: number;
  pa: number;
}

export interface PlatoonPairing {
  id: string;
  playerA: PlatoonPlayer;
  playerB: PlatoonPlayer;
  combinedWOBA: number;
  platoonAdvantage: number;   // wOBA gain over best individual
  position: string;
  bestVsR: string;            // name of player who starts vs RHP
  bestVsL: string;            // name of player who starts vs LHP
}

export interface PlatoonOptResult {
  teamName: string;
  pairings: PlatoonPairing[];
  totalAdvantage: number;
  bestPairing: PlatoonPairing;
  avgCombinedWOBA: number;
  avgIndividualWOBA: number;
}

// ── Logic ──────────────────────────────────────────────────────────────────

export function computeCombinedWOBA(a: PlatoonPlayer, b: PlatoonPlayer): number {
  // Assume ~60% of PA vs opposite hand; pick better player for each split
  const vsR = Math.max(a.wOBAvsR, b.wOBAvsR);
  const vsL = Math.max(a.wOBAvsL, b.wOBAvsL);
  return Math.round(((vsR * 0.6 + vsL * 0.4)) * 1000) / 1000;
}

export function computePlatoonAdvantage(combined: number, a: PlatoonPlayer, b: PlatoonPlayer): number {
  const bestIndividual = Math.max(a.overallWOBA, b.overallWOBA);
  return Math.round((combined - bestIndividual) * 1000) / 1000;
}

// ── Demo Data ──────────────────────────────────────────────────────────────

interface PairingSeed {
  pos: string;
  a: { name: string; hand: Hand; vsR: number; vsL: number; overall: number; pa: number };
  b: { name: string; hand: Hand; vsR: number; vsL: number; overall: number; pa: number };
}

const PAIRING_SEEDS: PairingSeed[] = [
  {
    pos: 'LF',
    a: { name: 'Marcus Jennings', hand: 'R', vsR: 0.308, vsL: 0.365, overall: 0.330, pa: 420 },
    b: { name: 'David Morales',   hand: 'L', vsR: 0.372, vsL: 0.290, overall: 0.338, pa: 380 },
  },
  {
    pos: '1B',
    a: { name: 'Jake Callahan',   hand: 'L', vsR: 0.378, vsL: 0.285, overall: 0.340, pa: 450 },
    b: { name: 'Omar Petrov',     hand: 'R', vsR: 0.295, vsL: 0.382, overall: 0.332, pa: 340 },
  },
  {
    pos: 'RF',
    a: { name: 'Trent Adler',     hand: 'R', vsR: 0.312, vsL: 0.358, overall: 0.330, pa: 410 },
    b: { name: 'Carlos Medina',   hand: 'L', vsR: 0.362, vsL: 0.278, overall: 0.328, pa: 360 },
  },
  {
    pos: 'DH',
    a: { name: 'William Choi',    hand: 'S', vsR: 0.345, vsL: 0.320, overall: 0.335, pa: 480 },
    b: { name: 'Bryce Holloway',  hand: 'R', vsR: 0.288, vsL: 0.392, overall: 0.332, pa: 310 },
  },
  {
    pos: '2B',
    a: { name: 'Luis Guerrero',   hand: 'L', vsR: 0.355, vsL: 0.272, overall: 0.322, pa: 390 },
    b: { name: 'Danny Simmons',   hand: 'R', vsR: 0.282, vsL: 0.348, overall: 0.310, pa: 350 },
  },
  {
    pos: 'C',
    a: { name: 'Ryan Kowalski',   hand: 'R', vsR: 0.298, vsL: 0.340, overall: 0.315, pa: 320 },
    b: { name: 'Hector Ramos',    hand: 'L', vsR: 0.338, vsL: 0.268, overall: 0.310, pa: 280 },
  },
];

export function generateDemoPlatoonOpt(): PlatoonOptResult {
  const pairings: PlatoonPairing[] = PAIRING_SEEDS.map((seed, i) => {
    const playerA: PlatoonPlayer = {
      name: seed.a.name,
      hand: seed.a.hand,
      wOBAvsR: seed.a.vsR,
      wOBAvsL: seed.a.vsL,
      overallWOBA: seed.a.overall,
      pa: seed.a.pa,
    };
    const playerB: PlatoonPlayer = {
      name: seed.b.name,
      hand: seed.b.hand,
      wOBAvsR: seed.b.vsR,
      wOBAvsL: seed.b.vsL,
      overallWOBA: seed.b.overall,
      pa: seed.b.pa,
    };

    const combined = computeCombinedWOBA(playerA, playerB);
    const advantage = computePlatoonAdvantage(combined, playerA, playerB);
    const bestVsR = playerA.wOBAvsR >= playerB.wOBAvsR ? playerA.name : playerB.name;
    const bestVsL = playerA.wOBAvsL >= playerB.wOBAvsL ? playerA.name : playerB.name;

    return {
      id: `plt-${i}`,
      playerA,
      playerB,
      combinedWOBA: combined,
      platoonAdvantage: advantage,
      position: seed.pos,
      bestVsR,
      bestVsL,
    };
  });

  const totalAdv = Math.round(pairings.reduce((s, p) => s + p.platoonAdvantage, 0) * 1000) / 1000;
  const best = pairings.reduce((a, b) => a.platoonAdvantage > b.platoonAdvantage ? a : b);
  const avgCombined = Math.round((pairings.reduce((s, p) => s + p.combinedWOBA, 0) / pairings.length) * 1000) / 1000;
  const avgIndividual = Math.round((pairings.reduce((s, p) => s + Math.max(p.playerA.overallWOBA, p.playerB.overallWOBA), 0) / pairings.length) * 1000) / 1000;

  return {
    teamName: 'Cleveland Guardians',
    pairings,
    totalAdvantage: totalAdv,
    bestPairing: best,
    avgCombinedWOBA: avgCombined,
    avgIndividualWOBA: avgIndividual,
  };
}
