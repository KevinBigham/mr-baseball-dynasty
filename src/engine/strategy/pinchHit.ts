/**
 * Pinch Hit / Pinch Run Strategy
 *
 * Manages bench utilization for in-game substitutions.
 * Tracks matchup advantages, platoon splits, and
 * optimal substitution timing.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type SubType = 'pinch_hit' | 'pinch_run' | 'defensive_replacement' | 'double_switch';

export const SUB_TYPE_DISPLAY: Record<SubType, { label: string; emoji: string; color: string; desc: string }> = {
  pinch_hit:              { label: 'Pinch Hit',     emoji: '🏏', color: '#f97316', desc: 'Better hitter vs current pitcher matchup' },
  pinch_run:              { label: 'Pinch Run',     emoji: '🏃', color: '#22c55e', desc: 'Speed on the bases in a close game' },
  defensive_replacement:  { label: 'Def Replace',   emoji: '🧤', color: '#3b82f6', desc: 'Better glove to protect a lead' },
  double_switch:          { label: 'Double Switch',  emoji: '🔄', color: '#8b5cf6', desc: 'Pitcher spot moved to avoid early removal' },
};

export interface BenchPlayer {
  id: number;
  name: string;
  pos: string;
  overall: number;
  vsRHP: number;       // OVR vs right-handed pitchers
  vsLHP: number;       // OVR vs left-handed pitchers
  speed: number;       // 20-80 scale
  defense: number;     // 20-80 scale
  available: boolean;
  usedToday: boolean;
  bestUse: SubType;
  matchupAdvantage: number;  // -10 to +10 OVR improvement over starter
}

export interface SubstitutionOpportunity {
  id: number;
  inning: number;
  situation: string;
  currentBatter: string;
  currentBatterOvr: number;
  suggestedSub: BenchPlayer;
  subType: SubType;
  advantage: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoBench(): BenchPlayer[] {
  return [
    { id: 0, name: 'Daniel Vogelbach', pos: 'DH', overall: 68, vsRHP: 72, vsLHP: 60, speed: 25, defense: 30, available: true, usedToday: false, bestUse: 'pinch_hit', matchupAdvantage: 8 },
    { id: 1, name: 'Tyler Wade', pos: 'SS/2B', overall: 58, vsRHP: 55, vsLHP: 62, speed: 75, defense: 70, available: true, usedToday: false, bestUse: 'pinch_run', matchupAdvantage: -2 },
    { id: 2, name: 'Harrison Bader', pos: 'CF', overall: 62, vsRHP: 60, vsLHP: 65, speed: 72, defense: 78, available: true, usedToday: false, bestUse: 'defensive_replacement', matchupAdvantage: 5 },
    { id: 3, name: 'Matt Carpenter', pos: '1B/3B', overall: 64, vsRHP: 58, vsLHP: 72, speed: 35, defense: 45, available: true, usedToday: false, bestUse: 'pinch_hit', matchupAdvantage: 10 },
    { id: 4, name: 'Jake Bauers', pos: 'LF/1B', overall: 60, vsRHP: 63, vsLHP: 55, speed: 50, defense: 55, available: false, usedToday: true, bestUse: 'pinch_hit', matchupAdvantage: 3 },
  ];
}

export function generateDemoOpportunities(): SubstitutionOpportunity[] {
  const bench = generateDemoBench();
  return [
    {
      id: 0, inning: 7, situation: 'Runner on 2nd, 1 out, trailing by 1',
      currentBatter: 'Jose Iglesias', currentBatterOvr: 58,
      suggestedSub: bench[3], subType: 'pinch_hit', advantage: 10, urgency: 'critical',
    },
    {
      id: 1, inning: 8, situation: 'Leading by 2, runner on 1st, 0 outs',
      currentBatter: 'Yordan Alvarez', currentBatterOvr: 87,
      suggestedSub: bench[1], subType: 'pinch_run', advantage: 5, urgency: 'high',
    },
    {
      id: 2, inning: 9, situation: 'Leading by 1, no runners',
      currentBatter: 'Kyle Schwarber', currentBatterOvr: 78,
      suggestedSub: bench[2], subType: 'defensive_replacement', advantage: 8, urgency: 'medium',
    },
  ];
}
