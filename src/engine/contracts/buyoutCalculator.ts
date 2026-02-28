/**
 * buyoutCalculator.ts – Contract buyout analysis
 *
 * Evaluates option buyout decisions, calculates NPV of exercising vs
 * declining, and recommends the optimal financial path.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type OptionType = 'club' | 'player' | 'mutual' | 'vesting';
export type Recommendation = 'exercise' | 'decline' | 'negotiate' | 'vest_likely' | 'vest_unlikely';

export interface BuyoutScenario {
  id: string;
  name: string;
  team: string;
  pos: string;
  age: number;
  optionType: OptionType;
  optionYear: number;          // salary if exercised ($M)
  buyout: number;              // buyout cost ($M)
  currentWAR: number;
  projectedWAR: number;
  marketValue: number;         // what this player would get on open market ($M AAV)
  costSavings: number;         // savings from declining ($M)
  vestingCondition?: string;   // e.g. "500 PA" or "150 IP"
  vestingProgress?: number;    // % toward vesting, 0-100
  recommendation: Recommendation;
  npvExercise: number;         // net present value of exercising
  npvDecline: number;          // net present value of declining + replacement
  notes: string;
}

export const REC_DISPLAY: Record<Recommendation, { label: string; color: string }> = {
  exercise: { label: 'EXERCISE', color: '#22c55e' },
  decline: { label: 'DECLINE', color: '#ef4444' },
  negotiate: { label: 'NEGOTIATE', color: '#facc15' },
  vest_likely: { label: 'VEST LIKELY', color: '#4ade80' },
  vest_unlikely: { label: 'VEST UNLIKELY', color: '#f97316' },
};

export const OPTION_DISPLAY: Record<OptionType, { label: string; color: string }> = {
  club: { label: 'CLUB', color: '#22c55e' },
  player: { label: 'PLAYER', color: '#f59e0b' },
  mutual: { label: 'MUTUAL', color: '#facc15' },
  vesting: { label: 'VESTING', color: '#a855f7' },
};

// ─── Summary ────────────────────────────────────────────────────────────────

export interface BuyoutSummary {
  totalOptions: number;
  exerciseCount: number;
  declineCount: number;
  totalBuyoutCost: number;
  totalOptionSalary: number;
  biggestDecision: string;
}

export function getBuyoutSummary(scenarios: BuyoutScenario[]): BuyoutSummary {
  const exercises = scenarios.filter(s => s.recommendation === 'exercise' || s.recommendation === 'vest_likely');
  const declines = scenarios.filter(s => s.recommendation === 'decline' || s.recommendation === 'vest_unlikely');
  const totalBuyout = declines.reduce((s, d) => s + d.buyout, 0);
  const totalOption = exercises.reduce((s, e) => s + e.optionYear, 0);
  const biggest = scenarios.reduce((a, b) => Math.abs(a.npvExercise - a.npvDecline) > Math.abs(b.npvExercise - b.npvDecline) ? a : b);

  return {
    totalOptions: scenarios.length,
    exerciseCount: exercises.length,
    declineCount: declines.length,
    totalBuyoutCost: Math.round(totalBuyout * 10) / 10,
    totalOptionSalary: Math.round(totalOption),
    biggestDecision: biggest.name,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoBuyouts(): BuyoutScenario[] {
  const data: Omit<BuyoutScenario, 'id'>[] = [
    {
      name: 'Miguel Santos', team: 'NYM', pos: 'SP', age: 33,
      optionType: 'club', optionYear: 18, buyout: 2,
      currentWAR: 3.2, projectedWAR: 2.8, marketValue: 20,
      costSavings: 16, recommendation: 'exercise',
      npvExercise: 12.5, npvDecline: 8.2,
      notes: 'Easy exercise. $18M for a projected 2.8 WAR pitcher is below market value. Still a productive starter.',
    },
    {
      name: 'Jason Carter', team: 'NYM', pos: 'OF', age: 35,
      optionType: 'club', optionYear: 15, buyout: 3,
      currentWAR: 0.8, projectedWAR: 0.5, marketValue: 5,
      costSavings: 12, recommendation: 'decline',
      npvExercise: -6.5, npvDecline: 2.8,
      notes: 'Clear decline. $15M for 0.5 WAR is terrible value. Pay the $3M buyout and upgrade in free agency.',
    },
    {
      name: 'Tyler Mendez', team: 'NYM', pos: 'RP', age: 30,
      optionType: 'mutual', optionYear: 10, buyout: 1.5,
      currentWAR: 1.5, projectedWAR: 1.2, marketValue: 8,
      costSavings: 8.5, recommendation: 'negotiate',
      npvExercise: 2.8, npvDecline: 3.5,
      notes: 'Borderline case. Mutual option means both sides have leverage. Try to negotiate a reduced salary to keep him.',
    },
    {
      name: 'Derek Williams', team: 'NYM', pos: '1B', age: 31,
      optionType: 'vesting', optionYear: 16, buyout: 2.5,
      currentWAR: 2.8, projectedWAR: 2.5, marketValue: 14,
      costSavings: 13.5, vestingCondition: '550 PA', vestingProgress: 78,
      recommendation: 'vest_likely', npvExercise: 6.2, npvDecline: 4.8,
      notes: 'On pace to vest with 78% of PA threshold reached. Good value even at $16M. Hope it vests — saves negotiation.',
    },
    {
      name: 'Carlos Rivera', team: 'NYM', pos: 'SS', age: 28,
      optionType: 'player', optionYear: 22, buyout: 0,
      currentWAR: 5.2, projectedWAR: 4.8, marketValue: 30,
      costSavings: 0, recommendation: 'exercise',
      npvExercise: 25.5, npvDecline: 0,
      notes: 'Player option — he will decline and go to free agency where he can get $30M+. Prepare for his departure.',
    },
    {
      name: 'Roberto Flores', team: 'NYM', pos: 'SP', age: 34,
      optionType: 'vesting', optionYear: 14, buyout: 2,
      currentWAR: 1.0, projectedWAR: 0.8, marketValue: 6,
      costSavings: 12, vestingCondition: '160 IP', vestingProgress: 42,
      recommendation: 'vest_unlikely', npvExercise: -4.2, npvDecline: 3.8,
      notes: 'Unlikely to vest — only 42% of IP threshold. Will decline if it doesnt vest. Too many innings needed with 6 weeks left.',
    },
    {
      name: 'James Cooper', team: 'NYM', pos: '3B', age: 32,
      optionType: 'club', optionYear: 12, buyout: 1,
      currentWAR: 2.2, projectedWAR: 1.8, marketValue: 10,
      costSavings: 11, recommendation: 'exercise',
      npvExercise: 4.5, npvDecline: 2.2,
      notes: '$12M for ~1.8 WAR is fair market value. Exercising provides stability at 3B without having to go to FA market.',
    },
  ];

  return data.map((d, i) => ({ ...d, id: `bo-${i}` }));
}
