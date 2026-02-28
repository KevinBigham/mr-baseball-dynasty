/**
 * Cap Space Calculator — payroll flexibility and upcoming obligations
 *
 * Calculates available cap space relative to the luxury threshold,
 * itemises guaranteed vs flexible obligations, and projects future
 * committed / projected / available payroll by season.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ObligationType = 'guaranteed' | 'option' | 'buyout' | 'arbitration' | 'pre_arb';

export interface PayrollObligation {
  playerId: number;
  name: string;
  season: number;
  amount: number;          // $M
  type: ObligationType;
  isFlexible: boolean;
}

export interface CapSpaceData {
  teamId: number;
  teamName: string;
  currentPayroll: number;   // $M
  luxuryThreshold: number;  // $M
  capSpace: number;         // $M (threshold - payroll)
  obligations: PayrollObligation[];
  futureSummary: {
    season: number;
    committed: number;       // $M guaranteed
    projected: number;       // $M options + arb estimates
    available: number;       // $M remaining under threshold
  }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const rng = (min: number, max: number) => +(min + Math.random() * (max - min)).toFixed(2);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const OBLIGATION_COLORS: Record<ObligationType, string> = {
  guaranteed:  '#ef4444',
  option:      '#f59e0b',
  buyout:      '#a855f7',
  arbitration: '#3b82f6',
  pre_arb:     '#22c55e',
};

export { OBLIGATION_COLORS };

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoCapSpace(): CapSpaceData[] {
  const teams = [
    { id: 1, name: 'New York Titans' },
    { id: 2, name: 'Los Angeles Stars' },
    { id: 3, name: 'Chicago Wolves' },
    { id: 4, name: 'Houston Mustangs' },
  ];

  const players = [
    'Marcus Rivera', 'Jake Morrison', 'Carlos Delgado', 'Tyler Blackburn',
    'Sam Whitfield', 'Daisuke Ito', 'Ryan Chen', 'Derek Thompson',
    'Andre Baptiste', 'Kris Nakamura', 'Bobby Hernandez', 'Jason Lee',
    'Will Crawford', 'Manny Ortega', 'Danny Kim', 'Luke Patterson',
    'Oscar Ramirez', 'Tony Vladic', 'Chris Barlow', 'Nate Freeman',
  ];

  const luxuryThreshold = 237;
  const currentSeason = 2026;
  const types: ObligationType[] = ['guaranteed', 'option', 'buyout', 'arbitration', 'pre_arb'];

  return teams.map(team => {
    // Generate 8-12 obligations per team spanning 3 future seasons
    const numObligations = 8 + Math.floor(Math.random() * 5);
    const usedPlayers = new Set<string>();
    const obligations: PayrollObligation[] = [];

    for (let o = 0; o < numObligations; o++) {
      let pName = pick(players);
      while (usedPlayers.has(pName)) pName = pick(players);
      usedPlayers.add(pName);

      const type = pick(types);
      const season = currentSeason + Math.floor(Math.random() * 3);
      const amount = type === 'guaranteed' ? rng(5, 35) :
                     type === 'option'     ? rng(8, 28) :
                     type === 'buyout'     ? rng(1, 5)  :
                     type === 'arbitration' ? rng(2, 18) :
                                              rng(0.7, 2.5);
      obligations.push({
        playerId: 100 + o + team.id * 20,
        name: pName,
        season,
        amount,
        type,
        isFlexible: type !== 'guaranteed',
      });
    }

    const currentPayroll = rng(165, 255);
    const capSpace = +(luxuryThreshold - currentPayroll).toFixed(2);

    // Build future summaries
    const futureSummary = [0, 1, 2].map(offset => {
      const s = currentSeason + offset;
      const seasonObs = obligations.filter(ob => ob.season === s);
      const committed = +seasonObs.filter(ob => ob.type === 'guaranteed').reduce((a, b) => a + b.amount, 0).toFixed(2);
      const projected = +seasonObs.filter(ob => ob.type !== 'guaranteed').reduce((a, b) => a + b.amount, 0).toFixed(2);
      return {
        season: s,
        committed,
        projected,
        available: +(luxuryThreshold - committed - projected * 0.75).toFixed(2),
      };
    });

    return {
      teamId: team.id,
      teamName: team.name,
      currentPayroll,
      luxuryThreshold,
      capSpace,
      obligations: obligations.sort((a, b) => a.season - b.season || b.amount - a.amount),
      futureSummary,
    };
  });
}
