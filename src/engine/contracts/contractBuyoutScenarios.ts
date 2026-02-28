// Contract Buyout Scenarios — model buyout options and financial impact

export interface BuyoutCandidate {
  name: string;
  position: string;
  age: number;
  salary: number;
  yearsLeft: number;
  buyoutAmount: number;
  remainingGuaranteed: number;
  war: number;
  projectedWAR: number;
  recommendation: 'exercise' | 'buyout' | 'hold';
  savings: number;
  rationale: string;
}

export interface BuyoutScenarioData {
  teamName: string;
  totalBuyoutCost: number;
  totalSavings: number;
  candidates: BuyoutCandidate[];
}

export function getRecColor(rec: string): string {
  if (rec === 'buyout') return '#ef4444';
  if (rec === 'exercise') return '#22c55e';
  return '#f59e0b';
}

export function generateDemoBuyoutScenarios(): BuyoutScenarioData {
  const candidates: BuyoutCandidate[] = [
    { name: 'Greg Thornton', position: 'SP', age: 33, salary: 18.0, yearsLeft: 1, buyoutAmount: 2.0, remainingGuaranteed: 18.0, war: 1.4, projectedWAR: 1.0, recommendation: 'buyout', savings: 16.0, rationale: 'Velocity declining, Castillo ready to replace. Save $16M for FA market.' },
    { name: 'Hector Macias', position: 'RP', age: 34, salary: 6.5, yearsLeft: 1, buyoutAmount: 0.5, remainingGuaranteed: 6.5, war: 0.6, projectedWAR: 0.3, recommendation: 'buyout', savings: 6.0, rationale: 'Braithwaite has surpassed him. Non-tender and save the money.' },
    { name: 'Derek Hartley', position: 'SS', age: 31, salary: 14.5, yearsLeft: 1, buyoutAmount: 1.0, remainingGuaranteed: 14.5, war: 1.8, projectedWAR: 1.5, recommendation: 'buyout', savings: 13.5, rationale: 'Marcus Delgado is the future at SS. Trade or buy out Hartley.' },
    { name: 'Brandon Oakes', position: 'CF', age: 29, salary: 11.2, yearsLeft: 2, buyoutAmount: 3.0, remainingGuaranteed: 22.4, war: 3.2, projectedWAR: 2.8, recommendation: 'exercise', savings: 0, rationale: 'Still in prime, positive surplus value. Keep on roster.' },
    { name: 'Travis Keller', position: 'C', age: 30, salary: 8.0, yearsLeft: 1, buyoutAmount: 1.5, remainingGuaranteed: 8.0, war: 1.2, projectedWAR: 1.0, recommendation: 'hold', savings: 0, rationale: 'Montero not quite ready. Keep Keller for one more year as bridge.' },
  ];

  return {
    teamName: 'San Francisco Giants',
    totalBuyoutCost: candidates.filter(c => c.recommendation === 'buyout').reduce((s, c) => s + c.buyoutAmount, 0),
    totalSavings: candidates.filter(c => c.recommendation === 'buyout').reduce((s, c) => s + c.savings, 0),
    candidates,
  };
}
