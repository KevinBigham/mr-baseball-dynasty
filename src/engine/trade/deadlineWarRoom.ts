/**
 * deadlineWarRoom.ts – Trade Deadline War Room Engine
 *
 * Bloomberg-terminal-style trade deadline command center tracking
 * deadline countdown, targets by position of need, available assets,
 * competing bidders, and deal probability. All demo data.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type DealProbability = 'very_likely' | 'likely' | 'possible' | 'unlikely' | 'dead';
export type NeedLevel = 'critical' | 'high' | 'moderate' | 'low';

export interface TradeTarget {
  id: string;
  name: string;
  team: string;
  position: string;
  age: number;
  war: number;
  salary: number;        // $M
  controlYears: number;
  costRank: number;      // 1 = cheapest acquisition
  dealProb: DealProbability;
  competingBidders: string[];
  estimatedCost: string; // e.g. "Top-100 prospect + lottery arm"
  notes: string;
}

export interface TeamNeed {
  position: string;
  needLevel: NeedLevel;
  currentStarter: string;
  currentWAR: number;
  upgradeTarget: number;  // WAR target
  topTargets: string[];   // top 3 target names
}

export interface TradableAsset {
  name: string;
  type: 'player' | 'prospect' | 'pick';
  value: number;          // trade value 0-100
  mlbReady: boolean;
  notes: string;
}

export interface WarRoomData {
  teamName: string;
  daysToDeadline: number;
  buyerOrSeller: 'buyer' | 'seller' | 'neutral';
  currentRecord: string;
  playoffOdds: number;
  needs: TeamNeed[];
  targets: TradeTarget[];
  assets: TradableAsset[];
  budget: number;         // $M available
  notes: string;
}

// ── Display Maps ───────────────────────────────────────────────────────────

export const DEAL_PROB_DISPLAY: Record<DealProbability, { label: string; color: string }> = {
  very_likely: { label: 'Very Likely', color: '#22c55e' },
  likely:      { label: 'Likely',      color: '#4ade80' },
  possible:    { label: 'Possible',    color: '#f59e0b' },
  unlikely:    { label: 'Unlikely',    color: '#f97316' },
  dead:        { label: 'Dead',        color: '#ef4444' },
};

export const NEED_LEVEL_DISPLAY: Record<NeedLevel, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#ef4444' },
  high:     { label: 'High',     color: '#f97316' },
  moderate: { label: 'Moderate', color: '#f59e0b' },
  low:      { label: 'Low',      color: '#22c55e' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface WarRoomSummary {
  daysLeft: number;
  stance: string;
  playoffOdds: string;
  criticalNeeds: number;
  topTarget: string;
  budget: string;
}

export function getWarRoomSummary(data: WarRoomData): WarRoomSummary {
  const critNeeds = data.needs.filter(n => n.needLevel === 'critical').length;
  const topTarget = data.targets.length > 0
    ? data.targets.sort((a, b) => a.costRank - b.costRank)[0].name
    : 'None';

  return {
    daysLeft: data.daysToDeadline,
    stance: data.buyerOrSeller.toUpperCase(),
    playoffOdds: `${data.playoffOdds}%`,
    criticalNeeds: critNeeds,
    topTarget,
    budget: `$${data.budget}M`,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoWarRoom(): WarRoomData {
  const needs: TeamNeed[] = [
    {
      position: 'SP',
      needLevel: 'critical',
      currentStarter: 'Jake Rogers',
      currentWAR: 0.8,
      upgradeTarget: 3.0,
      topTargets: ['Garrett Crochet', 'Luis Castillo', 'Tarik Skubal'],
    },
    {
      position: 'RP',
      needLevel: 'high',
      currentStarter: 'Mike Rivera',
      currentWAR: 0.4,
      upgradeTarget: 1.5,
      topTargets: ['Devin Williams', 'Ryan Helsley', 'Andres Munoz'],
    },
    {
      position: '3B',
      needLevel: 'moderate',
      currentStarter: 'Tyler Nevin',
      currentWAR: 0.6,
      upgradeTarget: 2.0,
      topTargets: ['Isaac Paredes', 'Yandy Diaz', 'Brian Anderson'],
    },
    {
      position: 'CF',
      needLevel: 'low',
      currentStarter: 'Harrison Bader',
      currentWAR: 1.8,
      upgradeTarget: 2.5,
      topTargets: ['Kevin Kiermaier', 'Manuel Margot'],
    },
  ];

  const targets: TradeTarget[] = [
    {
      id: 'tgt-1',
      name: 'Garrett Crochet',
      team: 'CWS',
      position: 'SP',
      age: 25,
      war: 3.8,
      salary: 2.4,
      controlYears: 3,
      costRank: 1,
      dealProb: 'likely',
      competingBidders: ['NYY', 'BAL', 'PHI'],
      estimatedCost: 'Top-50 prospect + 2 lottery arms',
      notes: 'Elite stuff with control. High asking price from CWS but motivated to sell.',
    },
    {
      id: 'tgt-2',
      name: 'Luis Castillo',
      team: 'SEA',
      position: 'SP',
      age: 31,
      war: 2.8,
      salary: 22.0,
      controlYears: 3,
      costRank: 3,
      dealProb: 'possible',
      competingBidders: ['HOU', 'ATL'],
      estimatedCost: 'MLB-ready prospect + mid-level arm',
      notes: 'Workhorse innings eater. Seattle may not be selling yet.',
    },
    {
      id: 'tgt-3',
      name: 'Devin Williams',
      team: 'MIL',
      position: 'RP',
      age: 29,
      war: 2.2,
      salary: 5.8,
      controlYears: 1,
      costRank: 2,
      dealProb: 'very_likely',
      competingBidders: ['NYY', 'LAD', 'TEX'],
      estimatedCost: 'Top-100 prospect',
      notes: 'Elite changeup. Rental but huge playoff impact. MIL selling hard.',
    },
    {
      id: 'tgt-4',
      name: 'Isaac Paredes',
      team: 'TB',
      position: '3B',
      age: 25,
      war: 2.4,
      salary: 3.2,
      controlYears: 4,
      costRank: 4,
      dealProb: 'possible',
      competingBidders: ['CLE', 'MIN'],
      estimatedCost: '2 mid-level prospects',
      notes: 'Elite plate discipline. Tampa may hold unless blown away.',
    },
    {
      id: 'tgt-5',
      name: 'Ryan Helsley',
      team: 'STL',
      position: 'RP',
      age: 29,
      war: 1.8,
      salary: 7.2,
      controlYears: 1,
      costRank: 5,
      dealProb: 'likely',
      competingBidders: ['HOU', 'BAL'],
      estimatedCost: 'Mid-level prospect',
      notes: 'Elite closer. Rental. STL in full sell mode.',
    },
    {
      id: 'tgt-6',
      name: 'Tarik Skubal',
      team: 'DET',
      position: 'SP',
      age: 27,
      war: 4.6,
      salary: 4.8,
      controlYears: 2,
      costRank: 6,
      dealProb: 'unlikely',
      competingBidders: ['NYY', 'LAD', 'PHI', 'ATL'],
      estimatedCost: 'Franchise-altering package — multiple top prospects',
      notes: 'Cy Young caliber but Detroit asking for the moon. Would need to overpay.',
    },
  ];

  const assets: TradableAsset[] = [
    { name: 'Dylan Carter',     type: 'prospect', value: 82, mlbReady: false, notes: 'Top-30 overall prospect. SS with plus hit tool.' },
    { name: 'Mason Webb',       type: 'prospect', value: 68, mlbReady: true,  notes: 'MLB-ready RHP with plus slider.' },
    { name: 'Jaylen Torres',    type: 'prospect', value: 55, mlbReady: false, notes: 'Athletic CF. Raw but huge upside.' },
    { name: 'Andre Mitchell',   type: 'prospect', value: 45, mlbReady: false, notes: 'Lottery ticket arm. 98 mph heat but wild.' },
    { name: '2025 Comp Rd B',  type: 'pick',     value: 38, mlbReady: false, notes: 'Competitive Balance Rd B pick.' },
    { name: 'Brian Foster',     type: 'player',   value: 30, mlbReady: true,  notes: 'Solid utility IF. 1yr/$3M. Good bench piece for contender.' },
  ];

  return {
    teamName: 'San Francisco Giants',
    daysToDeadline: 12,
    buyerOrSeller: 'buyer',
    currentRecord: '54-42',
    playoffOdds: 72.4,
    needs,
    targets,
    assets,
    budget: 18.5,
    notes: 'Team is in strong position to buy. SP is the #1 priority — Crochet or bust. Secondary focus on bullpen arm. Budget allows for one big salary pickup.',
  };
}
