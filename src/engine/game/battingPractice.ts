/**
 * Batting Practice & Pre-Game Focus
 *
 * Pre-game preparation options that affect game performance.
 * Includes batting cage drills, bullpen sessions, defensive
 * alignment review, and team captain rally moments.
 */

// ─── Focus Options ──────────────────────────────────────────────────────────

export type FocusId = 'cages' | 'bullpen_work' | 'defense' | 'review' | 'rest' | 'rally';

export interface FocusOption {
  id: FocusId;
  label: string;
  emoji: string;
  desc: string;
  effects: { hitting: number; pitching: number; fielding: number; energy: number; morale: number };
  color: string;
}

export const FOCUS_OPTIONS: FocusOption[] = [
  {
    id: 'cages', label: 'Batting Cage Work', emoji: '🏏',
    desc: '+Hitting boost for today\'s lineup. Extra swings build timing.',
    effects: { hitting: 0.08, pitching: 0, fielding: 0, energy: -0.02, morale: 0.01 },
    color: '#f97316',
  },
  {
    id: 'bullpen_work', label: 'Bullpen Session', emoji: '⚾',
    desc: '+Pitching sharpness. Extra warm-up throws for starters and relievers.',
    effects: { hitting: 0, pitching: 0.08, fielding: 0, energy: -0.03, morale: 0 },
    color: '#3b82f6',
  },
  {
    id: 'defense', label: 'Defensive Drills', emoji: '🧤',
    desc: '+Fielding accuracy. Practice cutoffs, double plays, and positioning.',
    effects: { hitting: 0, pitching: 0, fielding: 0.10, energy: -0.02, morale: 0 },
    color: '#22c55e',
  },
  {
    id: 'review', label: 'Film & Scouting Review', emoji: '📋',
    desc: 'Study opponent tendencies. Balanced small boost across all areas.',
    effects: { hitting: 0.03, pitching: 0.03, fielding: 0.03, energy: 0, morale: 0.01 },
    color: '#8b5cf6',
  },
  {
    id: 'rest', label: 'Light Day / Recovery', emoji: '🧊',
    desc: 'Rest legs and arms. No performance boost but restores energy.',
    effects: { hitting: 0, pitching: 0, fielding: 0, energy: 0.08, morale: 0.03 },
    color: '#06b6d4',
  },
  {
    id: 'rally', label: 'Captain Rally', emoji: '🔥',
    desc: 'Team captain fires up the clubhouse. Big morale, small boost.',
    effects: { hitting: 0.02, pitching: 0.02, fielding: 0.02, energy: -0.01, morale: 0.08 },
    color: '#ef4444',
  },
];

// ─── Captain Moments ────────────────────────────────────────────────────────

export type CaptainMomentType = 'clutch_speech' | 'rally_cap' | 'defensive_fire' | 'mound_visit';

export interface CaptainMoment {
  type: CaptainMomentType;
  label: string;
  emoji: string;
  desc: string;
  effect: string;
  color: string;
}

export const CAPTAIN_MOMENTS: CaptainMoment[] = [
  { type: 'clutch_speech', label: 'Clutch Speech', emoji: '🎤', desc: 'Captain rallied the dugout between innings', effect: '+5% clutch hitting', color: '#f97316' },
  { type: 'rally_cap', label: 'Rally Cap', emoji: '🧢', desc: 'Captain turned his cap — the dugout followed', effect: '+3% all offense', color: '#eab308' },
  { type: 'defensive_fire', label: 'Defensive Fire', emoji: '🔥', desc: 'Captain fired up the infield after an error', effect: '+8% fielding next 2 innings', color: '#22c55e' },
  { type: 'mound_visit', label: 'Mound Visit', emoji: '⚾', desc: 'Captain calmed down the pitcher on the mound', effect: '-10% walk rate next 3 batters', color: '#3b82f6' },
];

// ─── Game Day State ─────────────────────────────────────────────────────────

export interface GameDayState {
  opponent: string;
  focusSelected: FocusId | null;
  captainMoments: CaptainMoment[];
  teamEnergy: number;     // 0-100
  teamMorale: number;     // 0-100
  hitBoost: number;
  pitchBoost: number;
  fieldBoost: number;
  gamesThisWeek: number;
  seriesRecord: { wins: number; losses: number };
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function selectFocus(state: GameDayState, focusId: FocusId): GameDayState {
  const focus = FOCUS_OPTIONS.find(f => f.id === focusId);
  if (!focus) return state;

  return {
    ...state,
    focusSelected: focusId,
    hitBoost: Math.round(focus.effects.hitting * 100),
    pitchBoost: Math.round(focus.effects.pitching * 100),
    fieldBoost: Math.round(focus.effects.fielding * 100),
    teamEnergy: Math.min(100, Math.max(0, state.teamEnergy + Math.round(focus.effects.energy * 100))),
    teamMorale: Math.min(100, Math.max(0, state.teamMorale + Math.round(focus.effects.morale * 100))),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoGameDay(): GameDayState {
  return {
    opponent: 'NYY',
    focusSelected: null,
    captainMoments: [CAPTAIN_MOMENTS[0], CAPTAIN_MOMENTS[2]],
    teamEnergy: 72,
    teamMorale: 68,
    hitBoost: 0,
    pitchBoost: 0,
    fieldBoost: 0,
    gamesThisWeek: 4,
    seriesRecord: { wins: 1, losses: 1 },
  };
}
