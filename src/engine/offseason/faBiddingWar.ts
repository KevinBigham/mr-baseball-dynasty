// Free Agent Bidding War — simulate competitive bidding for top FAs

export interface BidOffer {
  teamId: string;
  teamName: string;
  years: number;
  totalValue: number;      // millions
  aav: number;             // average annual value
  optOut: boolean;
  noTrade: boolean;
  signingBonus: number;    // millions
  isYourTeam: boolean;
}

export interface FreeAgentTarget {
  playerId: string;
  name: string;
  position: string;
  age: number;
  war: number;
  projectedWAR: number;
  marketTier: 'elite' | 'premium' | 'mid-tier' | 'value';
  askingPrice: { years: number; aav: number };
  currentBids: BidOffer[];
  leadingBid: BidOffer | null;
  daysOnMarket: number;
  interest: number;        // teams interested count
  signedWith: string | null;
}

export interface FABiddingData {
  yourBudget: number;       // millions remaining
  luxuryTaxSpace: number;   // millions until tax threshold
  freeAgents: FreeAgentTarget[];
}

export function getTierColor(tier: FreeAgentTarget['marketTier']): string {
  switch (tier) {
    case 'elite': return '#f59e0b';
    case 'premium': return '#3b82f6';
    case 'mid-tier': return '#22c55e';
    case 'value': return '#9ca3af';
  }
}

export function getBidStatusColor(bid: BidOffer, leadingBid: BidOffer | null): string {
  if (!leadingBid) return '#6b7280';
  if (bid.totalValue === leadingBid.totalValue && bid.teamId === leadingBid.teamId) return '#22c55e';
  if (bid.totalValue >= leadingBid.totalValue * 0.95) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoFABidding(): FABiddingData {
  const freeAgents: FreeAgentTarget[] = [
    {
      playerId: 'FA1', name: 'Juan Soto', position: 'RF', age: 26, war: 7.2, projectedWAR: 6.5,
      marketTier: 'elite', askingPrice: { years: 15, aav: 44 }, daysOnMarket: 35, interest: 8, signedWith: null,
      currentBids: [
        { teamId: 'T1', teamName: 'New York Mets', years: 15, totalValue: 765, aav: 51.0, optOut: true, noTrade: true, signingBonus: 75, isYourTeam: false },
        { teamId: 'T2', teamName: 'Your Team', years: 13, totalValue: 585, aav: 45.0, optOut: false, noTrade: false, signingBonus: 50, isYourTeam: true },
        { teamId: 'T3', teamName: 'Toronto Blue Jays', years: 14, totalValue: 672, aav: 48.0, optOut: true, noTrade: false, signingBonus: 60, isYourTeam: false },
        { teamId: 'T4', teamName: 'Boston Red Sox', years: 12, totalValue: 540, aav: 45.0, optOut: false, noTrade: true, signingBonus: 40, isYourTeam: false },
      ],
      leadingBid: null,
    },
    {
      playerId: 'FA2', name: 'Corbin Burnes', position: 'SP', age: 30, war: 5.8, projectedWAR: 4.2,
      marketTier: 'premium', askingPrice: { years: 7, aav: 33 }, daysOnMarket: 28, interest: 6, signedWith: null,
      currentBids: [
        { teamId: 'T5', teamName: 'San Francisco Giants', years: 6, totalValue: 192, aav: 32.0, optOut: false, noTrade: false, signingBonus: 20, isYourTeam: false },
        { teamId: 'T2', teamName: 'Your Team', years: 6, totalValue: 198, aav: 33.0, optOut: false, noTrade: false, signingBonus: 25, isYourTeam: true },
        { teamId: 'T6', teamName: 'Arizona Diamondbacks', years: 7, totalValue: 210, aav: 30.0, optOut: true, noTrade: false, signingBonus: 15, isYourTeam: false },
      ],
      leadingBid: null,
    },
    {
      playerId: 'FA3', name: 'Pete Alonso', position: '1B', age: 30, war: 3.2, projectedWAR: 2.8,
      marketTier: 'mid-tier', askingPrice: { years: 6, aav: 28 }, daysOnMarket: 52, interest: 4, signedWith: null,
      currentBids: [
        { teamId: 'T7', teamName: 'Houston Astros', years: 3, totalValue: 68, aav: 22.7, optOut: false, noTrade: false, signingBonus: 10, isYourTeam: false },
        { teamId: 'T8', teamName: 'Chicago Cubs', years: 4, totalValue: 92, aav: 23.0, optOut: false, noTrade: false, signingBonus: 12, isYourTeam: false },
      ],
      leadingBid: null,
    },
    {
      playerId: 'FA4', name: 'Jack Flaherty', position: 'SP', age: 29, war: 2.5, projectedWAR: 2.0,
      marketTier: 'value', askingPrice: { years: 4, aav: 18 }, daysOnMarket: 15, interest: 5, signedWith: null,
      currentBids: [
        { teamId: 'T9', teamName: 'Detroit Tigers', years: 3, totalValue: 45, aav: 15.0, optOut: false, noTrade: false, signingBonus: 5, isYourTeam: false },
      ],
      leadingBid: null,
    },
  ];

  // Set leading bids
  for (const fa of freeAgents) {
    if (fa.currentBids.length > 0) {
      fa.leadingBid = fa.currentBids.reduce((best, bid) => bid.totalValue > best.totalValue ? bid : best);
    }
  }

  return { yourBudget: 85, luxuryTaxSpace: 32, freeAgents };
}
