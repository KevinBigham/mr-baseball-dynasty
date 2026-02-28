/**
 * Story Arc Engine — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's story-arc-engine.
 * Manages player narrative arcs that evolve season-over-season:
 *
 *   - BREAKOUT: Young player emerging as a star
 *   - ELITE: Established superstar performing at peak
 *   - MENTOR: Veteran leader guiding young players
 *   - SWAN_SONG: Aging legend in their final seasons
 *   - SLUMP: Player underperforming expectations
 *   - COMEBACK: Recovering from a slump or injury
 *   - DECLINE: Natural aging/regression
 *   - HOLDOUT: Contract dispute
 *   - REDEMPTION: Proving doubters wrong
 *
 * Arcs generate headlines and can affect morale/performance.
 */

// ─── Narrative States ─────────────────────────────────────────────────────────

export const NARRATIVE_STATES = {
  BREAKOUT:   'breakout',
  ELITE:      'elite',
  MENTOR:     'mentor',
  SWAN_SONG:  'swan_song',
  SLUMP:      'slump',
  COMEBACK:   'comeback',
  DECLINE:    'decline',
  HOLDOUT:    'holdout',
  REDEMPTION: 'redemption',
} as const;

export type NarrativeState = typeof NARRATIVE_STATES[keyof typeof NARRATIVE_STATES];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerArcState {
  playerId:    number;
  name:        string;
  position:    string;
  arcState:    NarrativeState | null;
  arcTurns:    number;    // How many ticks in current state
  headlines:   string[];  // Headlines generated from arc transitions
}

export interface ArcTransitionEvent {
  playerId:  number;
  name:      string;
  fromState: NarrativeState | null;
  toState:   NarrativeState;
  headline:  string;
  color:     string;   // For UI display
}

export interface ArcContext {
  teamWins:    number;
  teamLosses:  number;
  gameNumber:  number;   // 1-162
}

// ─── State Display Info ───────────────────────────────────────────────────────

export const ARC_DISPLAY: Record<NarrativeState, { label: string; emoji: string; color: string; desc: string }> = {
  breakout:   { label: 'BREAKOUT',   emoji: '🚀', color: '#f59e0b', desc: 'Young player emerging as a force' },
  elite:      { label: 'ELITE',      emoji: '⭐', color: '#fbbf24', desc: 'Performing at the highest level' },
  mentor:     { label: 'MENTOR',     emoji: '🎓', color: '#3b82f6', desc: 'Veteran leader guiding the next generation' },
  swan_song:  { label: 'SWAN SONG',  emoji: '🌅', color: '#8b5cf6', desc: 'Final chapter of a legendary career' },
  slump:      { label: 'SLUMP',      emoji: '📉', color: '#ef4444', desc: 'Struggling to find their groove' },
  comeback:   { label: 'COMEBACK',   emoji: '💪', color: '#22c55e', desc: 'Fighting back from adversity' },
  decline:    { label: 'DECLINE',    emoji: '⬇️', color: '#6b7280', desc: 'Father Time is catching up' },
  holdout:    { label: 'HOLDOUT',    emoji: '💰', color: '#f97316', desc: 'Wants a new deal — distraction potential' },
  redemption: { label: 'REDEMPTION', emoji: '🔥', color: '#ec4899', desc: 'Proving the doubters wrong' },
};

// ─── Position-specific decline ages ───────────────────────────────────────────

const DECLINE_AGE: Record<string, number> = {
  'C':  33, 'SS': 32, 'CF': 32, '2B': 33, '3B': 34,
  'RF': 33, 'LF': 33, '1B': 35, 'DH': 36,
  'SP': 34, 'RP': 34, 'CL': 33,
};

// ─── Initialize arc state for a player ────────────────────────────────────────

export function initPlayerArc(
  playerId: number,
  name: string,
  position: string,
  age: number,
  overall: number,
): PlayerArcState {
  let arcState: NarrativeState | null = null;

  if (age <= 24 && overall >= 55) arcState = NARRATIVE_STATES.BREAKOUT;
  else if (age >= 37) arcState = NARRATIVE_STATES.SWAN_SONG;
  else if (age >= 33 && overall >= 60) arcState = NARRATIVE_STATES.MENTOR;
  else if (overall >= 70) arcState = NARRATIVE_STATES.ELITE;

  return { playerId, name, position, arcState, arcTurns: 0, headlines: [] };
}

// ─── Determine target state based on current context ──────────────────────────

export function getTargetState(
  arc: PlayerArcState,
  age: number,
  overall: number,
  potential: number,
  ctx: ArcContext,
): NarrativeState | null {
  const declineAge = DECLINE_AGE[arc.position] ?? 33;

  // Swan song: old legends still playing
  if (age >= 37 && overall >= 55) return NARRATIVE_STATES.SWAN_SONG;

  // Mentor: experienced veterans with quality
  if (age >= 33 && overall >= 60) return NARRATIVE_STATES.MENTOR;

  // Slump to comeback transition
  if (arc.arcState === NARRATIVE_STATES.SLUMP && overall >= 65) return NARRATIVE_STATES.COMEBACK;

  // Comeback to elite
  if (arc.arcState === NARRATIVE_STATES.COMEBACK && overall >= 70) return NARRATIVE_STATES.ELITE;

  // Natural decline
  if (age >= declineAge && overall < 60) return NARRATIVE_STATES.DECLINE;

  // Slump: performance drop
  if (overall < potential - 15 && ctx.gameNumber > 30) return NARRATIVE_STATES.SLUMP;

  // Breakout: young player rising
  if (age <= 24 && overall >= 58) return NARRATIVE_STATES.BREAKOUT;

  // Elite: top performers
  if (overall >= 72) return NARRATIVE_STATES.ELITE;

  // Redemption: recovering from slump/holdout
  if (arc.arcState === NARRATIVE_STATES.SLUMP || arc.arcState === NARRATIVE_STATES.HOLDOUT) {
    return NARRATIVE_STATES.REDEMPTION;
  }

  return arc.arcState;
}

// ─── Tick a player's arc (called periodically during season) ──────────────────

export function tickPlayerArc(
  arc: PlayerArcState,
  age: number,
  overall: number,
  potential: number,
  ctx: ArcContext,
  rand: () => number,
): { arc: PlayerArcState; event: ArcTransitionEvent | null } {
  arc.arcTurns++;

  // Minimum dwell time before state transition (4-8 game checks)
  const minDwell = 4 + Math.floor(rand() * 5);
  if (arc.arcTurns < minDwell) return { arc, event: null };

  const newState = getTargetState(arc, age, overall, potential, ctx);
  if (!newState || newState === arc.arcState) return { arc, event: null };

  const oldState = arc.arcState;
  arc.arcState = newState;
  arc.arcTurns = 0;

  // Generate headline
  const headline = generateArcHeadline(arc.name, arc.position, newState, oldState);
  arc.headlines.push(headline);
  if (arc.headlines.length > 5) arc.headlines = arc.headlines.slice(-5);

  const display = ARC_DISPLAY[newState];

  return {
    arc,
    event: {
      playerId: arc.playerId,
      name: arc.name,
      fromState: oldState,
      toState: newState,
      headline,
      color: display.color,
    },
  };
}

// ─── Headline generator ───────────────────────────────────────────────────────

function generateArcHeadline(
  name: string,
  position: string,
  newState: NarrativeState,
  oldState: NarrativeState | null,
): string {
  switch (newState) {
    case 'breakout':
      return `${name} is breaking out — the ${position} looks like a future star.`;
    case 'elite':
      return oldState === 'comeback'
        ? `${name} has completed the comeback — back to elite form.`
        : `${name} is playing at an elite level. MVP-caliber stuff.`;
    case 'mentor':
      return `${name} has taken on a mentor role — the veteran ${position} is guiding the young core.`;
    case 'swan_song':
      return `The sun is setting on ${name}'s career. Every at-bat could be the last.`;
    case 'slump':
      return `${name} is in a slump. The ${position} needs to find their swing.`;
    case 'comeback':
      return `${name} is mounting a comeback — fighting back after a rough stretch.`;
    case 'decline':
      return `Father Time is catching up to ${name}. The ${position}'s best days may be behind them.`;
    case 'holdout':
      return `${name} wants a new deal. Contract tension is building.`;
    case 'redemption':
      return `${name} is on a redemption arc — proving the doubters wrong.`;
    default:
      return `${name} continues to evolve as a ${position}.`;
  }
}
