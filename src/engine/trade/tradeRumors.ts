// ─── Trade Rumors & Deadline Buzz ─────────────────────────────────────────
// Real-time trade chatter, deadline countdown, and rumor tracking.

export type RumorType = 'trade_talk' | 'asking_price' | 'bidding_war' | 'deal_close' | 'deal_dead' | 'surprise_name';

export interface TradeRumor {
  id: number;
  type: RumorType;
  playerName: string;
  playerPos: string;
  currentTeam: string;
  interestedTeams: string[];
  source: string;
  credibility: number; // 0-100
  headline: string;
  details: string;
  hoursAgo: number;
  hot: boolean;
}

export const RUMOR_TYPE_DISPLAY: Record<RumorType, { label: string; color: string; emoji: string }> = {
  trade_talk:    { label: 'Trade Talk', color: '#3b82f6', emoji: '💬' },
  asking_price:  { label: 'Price Set', color: '#eab308', emoji: '💰' },
  bidding_war:   { label: 'Bidding War', color: '#f97316', emoji: '🔥' },
  deal_close:    { label: 'Deal Close', color: '#22c55e', emoji: '🤝' },
  deal_dead:     { label: 'Deal Dead', color: '#ef4444', emoji: '💀' },
  surprise_name: { label: 'Surprise', color: '#a855f7', emoji: '😮' },
};

export function getCredibilityLabel(c: number): { label: string; color: string } {
  if (c >= 80) return { label: 'Highly Reliable', color: '#22c55e' };
  if (c >= 60) return { label: 'Credible', color: '#a3e635' };
  if (c >= 40) return { label: 'Mixed', color: '#eab308' };
  return { label: 'Rumor Mill', color: '#f97316' };
}

export interface DeadlineStatus {
  daysUntil: number;
  hoursUntil: number;
  phase: 'quiet' | 'heating_up' | 'frenzy' | 'final_hours' | 'passed';
  activeRumors: number;
  dealsCompleted: number;
}

export function getDeadlinePhase(daysUntil: number): DeadlineStatus['phase'] {
  if (daysUntil <= 0) return 'passed';
  if (daysUntil <= 1) return 'final_hours';
  if (daysUntil <= 3) return 'frenzy';
  if (daysUntil <= 7) return 'heating_up';
  return 'quiet';
}

export const PHASE_DISPLAY: Record<DeadlineStatus['phase'], { label: string; color: string; emoji: string }> = {
  quiet:       { label: 'Quiet Period', color: '#94a3b8', emoji: '🤫' },
  heating_up:  { label: 'Heating Up', color: '#eab308', emoji: '🌡️' },
  frenzy:      { label: 'Trade Frenzy', color: '#f97316', emoji: '🌪️' },
  final_hours: { label: 'Final Hours', color: '#ef4444', emoji: '⏰' },
  passed:      { label: 'Deadline Passed', color: '#6b7280', emoji: '🔒' },
};

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoRumors(): TradeRumor[] {
  return [
    { id: 1, type: 'bidding_war', playerName: 'Jake Rodriguez', playerPos: 'SP', currentTeam: 'MIL', interestedTeams: ['NYY', 'LAD', 'HOU'], source: 'ESPN Insider', credibility: 85, headline: 'Rodriguez drawing "significant interest" from 3+ contenders', details: 'Multiple teams have offered top-100 prospects. Brewers want a haul.', hoursAgo: 2, hot: true },
    { id: 2, type: 'deal_close', playerName: 'Marcus Bell', playerPos: '1B', currentTeam: 'PIT', interestedTeams: ['ATL'], source: 'MLB Network', credibility: 92, headline: 'Bell to Braves deal "90% done" — medical review pending', details: 'Pirates receiving two mid-tier prospects. Bell owed $8M this season.', hoursAgo: 1, hot: true },
    { id: 3, type: 'asking_price', playerName: 'Derek Tanaka', playerPos: 'RP', currentTeam: 'CIN', interestedTeams: ['NYM', 'PHI'], source: 'Athletic', credibility: 78, headline: 'Reds set "high bar" for closer Tanaka', details: 'Cincinnati wants a top-5 organizational prospect plus a MLB-ready pitcher.', hoursAgo: 5, hot: false },
    { id: 4, type: 'surprise_name', playerName: 'Carlos Reyes', playerPos: 'SS', currentTeam: 'SEA', interestedTeams: ['CHC', 'SFG'], source: 'Twitter Insider', credibility: 55, headline: 'Reyes "quietly available" despite .312 batting average', details: 'Mariners may be sellers. Reyes on an expiring deal worth $18M.', hoursAgo: 8, hot: false },
    { id: 5, type: 'trade_talk', playerName: 'Ryan Mitchell', playerPos: 'CF', currentTeam: 'OAK', interestedTeams: ['BOS', 'TOR', 'CLE'], source: 'Beat Reporter', credibility: 65, headline: 'Multiple AL teams checking in on Mitchell', details: 'Mitchell batting .270 with 22 HR. Oakland open to moving him.', hoursAgo: 12, hot: false },
    { id: 6, type: 'deal_dead', playerName: 'James O\'Brien', playerPos: 'SP', currentTeam: 'TEX', interestedTeams: ['LAD'], source: 'ESPN Insider', credibility: 88, headline: "O'Brien to Dodgers falls apart over prospect demands", details: 'Texas wanted Dodgers #1 prospect. LA walked away.', hoursAgo: 4, hot: false },
  ];
}

export function generateDemoDeadlineStatus(): DeadlineStatus {
  return {
    daysUntil: 2,
    hoursUntil: 52,
    phase: 'frenzy',
    activeRumors: 6,
    dealsCompleted: 3,
  };
}
