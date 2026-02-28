// ─── Arbitration System ───────────────────────────────────────────────────
// Salary arbitration for pre-free-agency eligible players (3-6 years service).

export type ArbitrationYear = 'arb1' | 'arb2' | 'arb3' | 'arb4';

export interface ArbitrationCase {
  id: number;
  playerName: string;
  pos: string;
  age: number;
  serviceYears: number;
  arbYear: ArbitrationYear;
  currentSalary: number;   // $M
  playerAsk: number;       // $M
  teamOffer: number;       // $M
  projectedValue: number;  // $M (market value)
  recentStats: Record<string, number | string>;
  comparables: Comparable[];
  status: 'pending' | 'settled' | 'hearing' | 'team_wins' | 'player_wins';
}

export interface Comparable {
  name: string;
  salary: number;
  stats: string;
}

export const ARB_YEAR_DISPLAY: Record<ArbitrationYear, { label: string; color: string; typicalPct: string }> = {
  arb1: { label: 'Arb 1', color: '#22c55e', typicalPct: '25-40% of market' },
  arb2: { label: 'Arb 2', color: '#eab308', typicalPct: '40-60% of market' },
  arb3: { label: 'Arb 3', color: '#f97316', typicalPct: '60-80% of market' },
  arb4: { label: 'Arb 4', color: '#ef4444', typicalPct: '80-100% of market' },
};

export function getSettlementRange(arbCase: ArbitrationCase): { low: number; high: number; midpoint: number } {
  const low = Math.min(arbCase.teamOffer, arbCase.playerAsk);
  const high = Math.max(arbCase.teamOffer, arbCase.playerAsk);
  const midpoint = Math.round(((low + high) / 2) * 10) / 10;
  return { low, high, midpoint };
}

export function getGapPct(arbCase: ArbitrationCase): number {
  const avg = (arbCase.teamOffer + arbCase.playerAsk) / 2;
  if (avg === 0) return 0;
  return Math.round(((arbCase.playerAsk - arbCase.teamOffer) / avg) * 100);
}

export function getLikelyOutcome(arbCase: ArbitrationCase): { winner: 'team' | 'player'; confidence: number } {
  const diff = arbCase.playerAsk - arbCase.teamOffer;
  const projDiff = arbCase.projectedValue - (arbCase.teamOffer + arbCase.playerAsk) / 2;
  if (projDiff > 0.5) return { winner: 'player', confidence: Math.min(85, 50 + Math.round(projDiff * 10)) };
  if (projDiff < -0.5) return { winner: 'team', confidence: Math.min(85, 50 + Math.round(-projDiff * 10)) };
  return { winner: diff > 0 ? 'team' : 'player', confidence: 50 };
}

export function settleCase(arbCase: ArbitrationCase): ArbitrationCase {
  const range = getSettlementRange(arbCase);
  return { ...arbCase, status: 'settled', currentSalary: range.midpoint };
}

export function hearingResult(arbCase: ArbitrationCase, teamWins: boolean): ArbitrationCase {
  return {
    ...arbCase,
    status: teamWins ? 'team_wins' : 'player_wins',
    currentSalary: teamWins ? arbCase.teamOffer : arbCase.playerAsk,
  };
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoArbitrationCases(): ArbitrationCase[] {
  return [
    {
      id: 1, playerName: 'Tyler Davis', pos: 'SS', age: 25, serviceYears: 3, arbYear: 'arb1',
      currentSalary: 0.72, playerAsk: 5.5, teamOffer: 4.2, projectedValue: 5.0,
      recentStats: { AVG: '.298', HR: 18, RBI: 65, WAR: '3.8' },
      comparables: [
        { name: 'Bo Bichette (2022)', salary: 5.3, stats: '.290/24/93' },
        { name: 'Dansby Swanson (2021)', salary: 4.5, stats: '.277/18/65' },
      ],
      status: 'pending',
    },
    {
      id: 2, playerName: 'Leo Castillo', pos: 'CF', age: 24, serviceYears: 3, arbYear: 'arb1',
      currentSalary: 0.72, playerAsk: 4.8, teamOffer: 3.5, projectedValue: 4.0,
      recentStats: { AVG: '.275', HR: 22, SB: 32, WAR: '3.2' },
      comparables: [
        { name: 'Cedric Mullins (2022)', salary: 4.1, stats: '.270/16/30SB' },
        { name: 'Adolis Garcia (2023)', salary: 3.8, stats: '.280/25/15SB' },
      ],
      status: 'pending',
    },
    {
      id: 3, playerName: 'Jake Rodriguez', pos: 'SP', age: 26, serviceYears: 4, arbYear: 'arb2',
      currentSalary: 4.5, playerAsk: 8.2, teamOffer: 6.5, projectedValue: 7.5,
      recentStats: { W: 12, ERA: '3.42', SO: 185, IP: '195.0', WAR: '3.5' },
      comparables: [
        { name: 'Logan Webb (2023)', salary: 7.0, stats: '11W/3.25/180K' },
        { name: 'Pablo Lopez (2023)', salary: 6.8, stats: '10W/3.55/175K' },
      ],
      status: 'hearing',
    },
    {
      id: 4, playerName: 'Dmitri Volkov', pos: 'RP', age: 27, serviceYears: 5, arbYear: 'arb3',
      currentSalary: 5.0, playerAsk: 9.0, teamOffer: 7.2, projectedValue: 8.0,
      recentStats: { SV: 28, ERA: '2.88', SO: 85, WHIP: '1.05', WAR: '2.5' },
      comparables: [
        { name: 'Ryan Pressly (2022)', salary: 8.5, stats: '26SV/2.98/80K' },
        { name: 'David Robertson (2023)', salary: 7.0, stats: '22SV/3.15/72K' },
      ],
      status: 'pending',
    },
  ];
}
