/**
 * Trade Deadline Strategy Board Engine — Mr. Baseball Dynasty (Wave 78)
 *
 * Strategic trade deadline decision-making engine:
 *   - Buy/sell/hold recommendation based on playoff odds and farm value
 *   - Target acquisition list with cost estimates
 *   - Sell-high candidates on the current roster
 *   - Timeline and urgency indicators
 *   - Trade chip inventory and value assessment
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type StrategyPosture = 'ALL_IN' | 'AGGRESSIVE_BUY' | 'SELECTIVE_BUY' | 'HOLD' | 'SELECTIVE_SELL' | 'FULL_SELL';

export const POSTURE_DISPLAY: Record<StrategyPosture, { label: string; color: string; desc: string }> = {
  ALL_IN:         { label: 'All In',         color: '#22c55e', desc: 'Championship window is NOW. Mortgage the future.' },
  AGGRESSIVE_BUY: { label: 'Aggressive Buy', color: '#34d399', desc: 'Strong contender. Pursue impact additions.' },
  SELECTIVE_BUY:  { label: 'Selective Buy',  color: '#3b82f6', desc: 'In the mix. Target specific upgrades only.' },
  HOLD:           { label: 'Hold',           color: '#f59e0b', desc: 'On the bubble. Do not overpay; wait for value.' },
  SELECTIVE_SELL: { label: 'Selective Sell',  color: '#f97316', desc: 'Falling back. Sell expiring contracts for future value.' },
  FULL_SELL:      { label: 'Full Sell',       color: '#ef4444', desc: 'Rebuild mode. Maximize prospect return from all assets.' },
};

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export const URGENCY_DISPLAY: Record<UrgencyLevel, { label: string; color: string }> = {
  CRITICAL: { label: 'Critical',  color: '#ef4444' },
  HIGH:     { label: 'High',      color: '#f97316' },
  MODERATE: { label: 'Moderate',  color: '#f59e0b' },
  LOW:      { label: 'Low',       color: '#6b7280' },
};

export interface TargetAcquisition {
  id: number;
  name: string;
  position: string;
  team: string;
  age: number;
  overall: number;
  salary: number;
  yearsLeft: number;
  isRental: boolean;
  estimatedCost: string;
  fitScore: number;             // 0-100
  impactProjection: number;     // projected WAR boost
  urgency: UrgencyLevel;
  need: string;                 // what need this fills
  notes: string;
}

export interface SellHighCandidate {
  id: number;
  name: string;
  position: string;
  age: number;
  overall: number;
  salary: number;
  yearsLeft: number;
  currentWAR: number;
  projectedDecline: number;     // WAR drop expected
  tradeValue: string;           // estimated return
  sellReason: string;
  marketDemand: 'HOT' | 'WARM' | 'TEPID';
  buyerFit: string[];           // teams that would want this player
}

export interface TradeChip {
  name: string;
  position: string;
  type: 'PROSPECT' | 'MLB_PLAYER' | 'DRAFT_PICK';
  value: string;                // high/medium/low
  notes: string;
}

export interface TeamSnapshot {
  record: string;
  winPct: number;
  gamesBack: number;
  playoffOdds: number;
  divisionRank: number;
  runDifferential: number;
  strengthOfSchedule: string;
  remainingGames: number;
}

export interface WindowAnalysis {
  currentYear: number;
  windowOpen: boolean;
  yearsRemaining: number;
  corePlayersUnderControl: number;
  farmSystemRank: number;
  payrollFlexibility: string;
  keyFreeAgents: string[];
}

export interface DeadlineStrategyData {
  teamName: string;
  teamAbbr: string;
  recommendation: StrategyPosture;
  snapshot: TeamSnapshot;
  window: WindowAnalysis;
  daysUntilDeadline: number;
  deadlineDate: string;
  targets: TargetAcquisition[];
  sellCandidates: SellHighCandidate[];
  tradeChips: TradeChip[];
  keyFactors: string[];
  riskAssessment: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function derivePosture(playoffOdds: number, farmRank: number, windowYears: number): StrategyPosture {
  if (playoffOdds >= 85 && windowYears <= 2) return 'ALL_IN';
  if (playoffOdds >= 70) return 'AGGRESSIVE_BUY';
  if (playoffOdds >= 50) return 'SELECTIVE_BUY';
  if (playoffOdds >= 30) return 'HOLD';
  if (playoffOdds >= 15) return 'SELECTIVE_SELL';
  return 'FULL_SELL';
}

export function calcFitScore(need: string, playerPos: string, overall: number): number {
  const base = Math.min(100, overall * 1.1);
  return Math.round(base);
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

export function generateDemoDeadlineStrategy(): DeadlineStrategyData {
  return {
    teamName: 'San Francisco Giants',
    teamAbbr: 'SF',
    recommendation: 'AGGRESSIVE_BUY',
    daysUntilDeadline: 9,
    deadlineDate: 'July 31',
    snapshot: {
      record: '57-40',
      winPct: 0.588,
      gamesBack: 2.0,
      playoffOdds: 78,
      divisionRank: 2,
      runDifferential: 68,
      strengthOfSchedule: 'Favorable (6th easiest remaining)',
      remainingGames: 65,
    },
    window: {
      currentYear: 2026,
      windowOpen: true,
      yearsRemaining: 3,
      corePlayersUnderControl: 7,
      farmSystemRank: 11,
      payrollFlexibility: '$18.2M under luxury tax threshold',
      keyFreeAgents: ['Greg Thornton (SP)', 'Hector Macias (RP)', 'Derek Hartley (SS)'],
    },
    targets: [
      {
        id: 1,
        name: 'Corbin Burnes',
        position: 'SP',
        team: 'BAL',
        age: 29,
        overall: 88,
        salary: 15.6,
        yearsLeft: 0,
        isRental: true,
        estimatedCost: '2 top-10 org prospects + lottery ticket',
        fitScore: 95,
        impactProjection: 2.8,
        urgency: 'CRITICAL',
        need: 'Frontline SP',
        notes: 'Ace-caliber arm. Baltimore may move him if they fall out of contention. Transforms rotation.',
      },
      {
        id: 2,
        name: 'Ryan Helsley',
        position: 'RP',
        team: 'STL',
        age: 30,
        overall: 82,
        salary: 8.5,
        yearsLeft: 1,
        isRental: false,
        estimatedCost: '1 top-15 prospect + depth arm',
        fitScore: 90,
        impactProjection: 1.4,
        urgency: 'HIGH',
        need: 'Shutdown Closer',
        notes: 'Elite reliever with closer experience. Extra year of control adds value but also cost.',
      },
      {
        id: 3,
        name: 'Yandy Diaz',
        position: '1B/DH',
        team: 'TB',
        age: 33,
        overall: 76,
        salary: 8.0,
        yearsLeft: 0,
        isRental: true,
        estimatedCost: 'Mid-level prospect',
        fitScore: 78,
        impactProjection: 0.8,
        urgency: 'MODERATE',
        need: 'Right-handed DH bat',
        notes: 'Professional hitter with elite contact skills. Low cost, fills platoon gap at DH.',
      },
      {
        id: 4,
        name: 'Carlos Estevez',
        position: 'RP',
        team: 'LAA',
        age: 33,
        overall: 73,
        salary: 6.8,
        yearsLeft: 0,
        isRental: true,
        estimatedCost: 'Low-level prospect or PTBNL',
        fitScore: 72,
        impactProjection: 0.6,
        urgency: 'MODERATE',
        need: 'Setup man / Late-inning arm',
        notes: 'Veteran arm with postseason experience. Cheap buy with bullpen stabilizing upside.',
      },
      {
        id: 5,
        name: 'Luis Arraez',
        position: '2B/1B',
        team: 'SD',
        age: 29,
        overall: 80,
        salary: 7.5,
        yearsLeft: 2,
        isRental: false,
        estimatedCost: '2 top-15 prospects + MLB-ready utility',
        fitScore: 84,
        impactProjection: 2.2,
        urgency: 'HIGH',
        need: 'Contact bat / Lineup depth',
        notes: 'Multiple batting titles. Extra years of control make this a franchise-altering add.',
      },
      {
        id: 6,
        name: 'David Robertson',
        position: 'RP',
        team: 'TEX',
        age: 41,
        overall: 68,
        salary: 3.5,
        yearsLeft: 0,
        isRental: true,
        estimatedCost: 'Cash considerations or org filler',
        fitScore: 60,
        impactProjection: 0.3,
        urgency: 'LOW',
        need: 'Veteran bullpen depth',
        notes: 'Low risk, low cost. Postseason veteran who can eat innings in blowouts.',
      },
    ],
    sellCandidates: [
      {
        id: 10,
        name: 'Greg Thornton',
        position: 'SP',
        age: 33,
        overall: 70,
        salary: 18.0,
        yearsLeft: 0,
        currentWAR: 1.4,
        projectedDecline: 0.8,
        tradeValue: '1-2 mid-level prospects',
        sellReason: 'Expiring contract. Velocity declining. Extract value before walk.',
        marketDemand: 'WARM',
        buyerFit: ['ATL', 'NYY', 'HOU'],
      },
      {
        id: 11,
        name: 'Hector Macias',
        position: 'RP',
        age: 34,
        overall: 66,
        salary: 6.5,
        yearsLeft: 0,
        currentWAR: 0.6,
        projectedDecline: 0.5,
        tradeValue: 'Low-level prospect',
        sellReason: 'Expiring deal. Braithwaite ready to take his role. Clear path for youth.',
        marketDemand: 'TEPID',
        buyerFit: ['MIN', 'SEA'],
      },
      {
        id: 12,
        name: 'Derek Hartley',
        position: 'SS',
        age: 31,
        overall: 72,
        salary: 14.5,
        yearsLeft: 1,
        currentWAR: 1.8,
        projectedDecline: 1.0,
        tradeValue: '1 top-20 prospect + utility player',
        sellReason: 'Delgado is MLB ready at SS. Hartley still has value; sell now before decline steepens.',
        marketDemand: 'HOT',
        buyerFit: ['BOS', 'CHC', 'PHI', 'NYM'],
      },
    ],
    tradeChips: [
      { name: '#5 Org Prospect (RHP)',     position: 'SP', type: 'PROSPECT',    value: 'HIGH',   notes: 'Near MLB-ready arm. Premium trade bait.' },
      { name: '#8 Org Prospect (OF)',      position: 'CF', type: 'PROSPECT',    value: 'MEDIUM', notes: 'Toolsy but raw. Projects as everyday player.' },
      { name: '#12 Org Prospect (SS)',     position: 'SS', type: 'PROSPECT',    value: 'MEDIUM', notes: 'Blocked by Delgado. Good glove, average bat.' },
      { name: 'Depth SP (age 28, arb-2)',  position: 'SP', type: 'MLB_PLAYER',  value: 'LOW',    notes: 'Back-end starter. Controllable and cheap.' },
      { name: '2027 Comp Rd B pick',       position: '-',  type: 'DRAFT_PICK',  value: 'LOW',    notes: 'Sweetener to close a deal.' },
    ],
    keyFactors: [
      'Rotation depth is the biggest concern — one injury away from a thin playoff staff',
      'Bullpen needs a reliable closer after blown saves in 4 of last 12 one-run games',
      'Lineup is top 5 in MLB in runs scored; offense is not the issue',
      'Farm system ranked #11 gives flexibility to trade prospects without gutting future',
      'Division rival LAD added two arms at deadline; must keep pace',
      'Remaining schedule favors SF with 18 games vs sub-.500 teams in August',
    ],
    riskAssessment: 'Window is open for 2-3 more years. Going aggressive now is justified given core age, controllable talent, and playoff odds. The farm system can absorb a top-3 prospect leaving. Primary risk: overpaying for a rental SP when the market is inflated.',
  };
}
