/**
 * Chemistry Dynamics
 *
 * Event-driven team chemistry system tracking morale changes,
 * clubhouse incidents, bonding events, and chemistry factor
 * impacts on team performance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type MoraleLevel = 'electric' | 'high' | 'neutral' | 'low' | 'toxic';
export type EventType = 'bonding' | 'conflict' | 'milestone' | 'trade_impact' | 'streak' | 'coaching';

export const MORALE_DISPLAY: Record<MoraleLevel, { label: string; color: string; emoji: string }> = {
  electric: { label: 'Electric',  color: '#22c55e', emoji: '⚡' },
  high:     { label: 'High',      color: '#3b82f6', emoji: '😊' },
  neutral:  { label: 'Neutral',   color: '#eab308', emoji: '😐' },
  low:      { label: 'Low',       color: '#f97316', emoji: '😞' },
  toxic:    { label: 'Toxic',     color: '#ef4444', emoji: '☠️' },
};

export const EVENT_DISPLAY: Record<EventType, { label: string; color: string; emoji: string }> = {
  bonding:       { label: 'Team Bonding',    color: '#22c55e', emoji: '🤝' },
  conflict:      { label: 'Clubhouse Issue', color: '#ef4444', emoji: '💢' },
  milestone:     { label: 'Milestone',       color: '#f59e0b', emoji: '🏆' },
  trade_impact:  { label: 'Trade Impact',    color: '#3b82f6', emoji: '🔄' },
  streak:        { label: 'Streak Effect',   color: '#a855f7', emoji: '🔥' },
  coaching:      { label: 'Coaching',        color: '#06b6d4', emoji: '📋' },
};

export interface ChemistryEvent {
  id: number;
  type: EventType;
  date: string;
  description: string;
  chemistryImpact: number;    // -20 to +20
  affectedPlayers: string[];
  duration: string;            // how long effect lasts
}

export interface PlayerMorale {
  name: string;
  pos: string;
  morale: MoraleLevel;
  chemScore: number;           // 0-100
  recentChange: number;        // positive/negative shift
  keyFactor: string;           // what's driving current morale
}

export interface ChemistryDynamicsData {
  teamMorale: MoraleLevel;
  teamChemScore: number;       // 0-100
  performanceModifier: number; // -5% to +5% team performance
  recentEvents: ChemistryEvent[];
  playerMorale: PlayerMorale[];
  streakEffect: string;
  leadershipScore: number;     // 0-100
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getMoraleLevel(chemScore: number): MoraleLevel {
  if (chemScore >= 85) return 'electric';
  if (chemScore >= 65) return 'high';
  if (chemScore >= 45) return 'neutral';
  if (chemScore >= 25) return 'low';
  return 'toxic';
}

export function getPerformanceModifier(chemScore: number): number {
  return Math.round(((chemScore - 50) / 10) * 10) / 10;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoChemistry(): ChemistryDynamicsData {
  const events: ChemistryEvent[] = [
    {
      id: 0, type: 'streak', date: 'Aug 25',
      description: 'Team on 7-game winning streak — clubhouse energy is through the roof',
      chemistryImpact: 12, affectedPlayers: ['Entire Team'], duration: 'Until streak ends',
    },
    {
      id: 1, type: 'bonding', date: 'Aug 22',
      description: 'Team dinner organized by veteran leader after road series win',
      chemistryImpact: 8, affectedPlayers: ['Full roster'], duration: '2 weeks',
    },
    {
      id: 2, type: 'milestone', date: 'Aug 20',
      description: 'Freddie Freeman hits 300th career home run — team celebrates',
      chemistryImpact: 5, affectedPlayers: ['Freddie Freeman', 'Infield group'], duration: '1 week',
    },
    {
      id: 3, type: 'trade_impact', date: 'Aug 1',
      description: 'Fan favorite traded to rival — some players unhappy with front office',
      chemistryImpact: -8, affectedPlayers: ['3 close teammates'], duration: '3 weeks (fading)',
    },
    {
      id: 4, type: 'conflict', date: 'Jul 28',
      description: 'Starter and pitching coach clash over pitch usage approach',
      chemistryImpact: -5, affectedPlayers: ['Starting pitcher', 'Pitching staff'], duration: '2 weeks (resolved)',
    },
    {
      id: 5, type: 'coaching', date: 'Jul 25',
      description: 'New hitting coach implements approach that clicks with lineup',
      chemistryImpact: 6, affectedPlayers: ['Position players'], duration: 'Ongoing',
    },
  ];

  const players: PlayerMorale[] = [
    { name: 'Freddie Freeman', pos: '1B', morale: 'electric', chemScore: 92, recentChange: 8, keyFactor: '300th HR + winning streak' },
    { name: 'Mookie Betts', pos: '2B', morale: 'high', chemScore: 78, recentChange: 5, keyFactor: 'Team leader — winning cures all' },
    { name: 'Juan Soto', pos: 'RF', morale: 'high', chemScore: 75, recentChange: 3, keyFactor: 'Settled into new team well' },
    { name: 'Shohei Ohtani', pos: 'DH', morale: 'high', chemScore: 80, recentChange: 2, keyFactor: 'MVP-caliber season — focused' },
    { name: 'Kyle Schwarber', pos: 'LF', morale: 'neutral', chemScore: 55, recentChange: -5, keyFactor: 'Close friend traded — adjusting' },
    { name: 'Gerrit Cole', pos: 'SP', morale: 'neutral', chemScore: 50, recentChange: -3, keyFactor: 'Pitch usage disagreement (resolved)' },
    { name: 'Trea Turner', pos: 'SS', morale: 'high', chemScore: 72, recentChange: 6, keyFactor: 'Hot streak at plate boosts mood' },
    { name: 'J.T. Realmuto', pos: 'C', morale: 'high', chemScore: 70, recentChange: 0, keyFactor: 'Veteran presence — steady' },
  ];

  return {
    teamMorale: 'high',
    teamChemScore: 74,
    performanceModifier: 2.4,
    recentEvents: events,
    playerMorale: players,
    streakEffect: '7-game win streak (+12 chemistry)',
    leadershipScore: 82,
  };
}
