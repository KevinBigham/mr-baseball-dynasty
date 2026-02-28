// Contract Negotiation Engine — simulate negotiation dynamics for extensions

export interface NegotiationOffer {
  round: number;
  offeredBy: 'team' | 'player';
  years: number;
  totalValue: number;      // millions
  aav: number;             // avg annual value
  optOut: boolean;
  noTrade: boolean;
  status: 'rejected' | 'countered' | 'pending' | 'accepted';
}

export interface NegotiationPlayer {
  name: string;
  position: string;
  age: number;
  currentSalary: number;
  marketValue: number;     // estimated fair market value
  agentDemand: number;     // what agent initially wants
  teamBudget: number;      // max team can offer
  relationship: 'excellent' | 'good' | 'neutral' | 'strained';
  urgency: 'high' | 'medium' | 'low';
  offers: NegotiationOffer[];
  likelihood: number;      // 0-100 chance of signing
}

export interface ContractNegData {
  teamName: string;
  negotiations: NegotiationPlayer[];
  totalCommitted: number;
  budgetRemaining: number;
}

export function getRelationshipColor(rel: string): string {
  if (rel === 'excellent') return '#22c55e';
  if (rel === 'good') return '#3b82f6';
  if (rel === 'neutral') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoContractNeg(): ContractNegData {
  return {
    teamName: 'San Francisco Giants',
    totalCommitted: 185.5,
    budgetRemaining: 42.0,
    negotiations: [
      {
        name: 'Jaylen Torres', position: 'SS', age: 25, currentSalary: 5.2, marketValue: 28.0,
        agentDemand: 32.0, teamBudget: 26.0, relationship: 'good', urgency: 'high', likelihood: 55,
        offers: [
          { round: 1, offeredBy: 'team', years: 7, totalValue: 168.0, aav: 24.0, optOut: false, noTrade: false, status: 'rejected' },
          { round: 2, offeredBy: 'player', years: 8, totalValue: 256.0, aav: 32.0, optOut: true, noTrade: true, status: 'countered' },
          { round: 3, offeredBy: 'team', years: 8, totalValue: 208.0, aav: 26.0, optOut: false, noTrade: false, status: 'countered' },
          { round: 4, offeredBy: 'player', years: 8, totalValue: 232.0, aav: 29.0, optOut: true, noTrade: false, status: 'pending' },
        ],
      },
      {
        name: 'Colton Braithwaite', position: 'CL', age: 28, currentSalary: 8.5, marketValue: 18.0,
        agentDemand: 22.0, teamBudget: 18.0, relationship: 'excellent', urgency: 'medium', likelihood: 72,
        offers: [
          { round: 1, offeredBy: 'team', years: 4, totalValue: 64.0, aav: 16.0, optOut: false, noTrade: false, status: 'rejected' },
          { round: 2, offeredBy: 'player', years: 5, totalValue: 110.0, aav: 22.0, optOut: true, noTrade: false, status: 'countered' },
          { round: 3, offeredBy: 'team', years: 4, totalValue: 72.0, aav: 18.0, optOut: false, noTrade: false, status: 'pending' },
        ],
      },
    ],
  };
}
