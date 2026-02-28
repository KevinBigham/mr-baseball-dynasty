/**
 * Manager Media Persona System
 *
 * Tracks how the manager handles press conferences and builds a
 * public persona over time. Tags accumulate from press interactions
 * and determine credibility, fan trust, and locker room morale effects.
 */

// ─── Media Tags ─────────────────────────────────────────────────────────────

export type MediaTag = 'accountability' | 'tough_love' | 'players_coach' | 'swagger' | 'deflector' | 'stoic';

export const MEDIA_TAG_DISPLAY: Record<MediaTag, { label: string; emoji: string; desc: string; color: string }> = {
  accountability: { label: 'Accountability',  emoji: '🤝', desc: 'Takes blame, builds trust with media and fans',      color: '#22c55e' },
  tough_love:     { label: 'Taskmaster',      emoji: '🔥', desc: 'Demands excellence, pushes players publicly',        color: '#ef4444' },
  players_coach:  { label: "Players' Coach",  emoji: '💪', desc: 'Defends the clubhouse, earns player loyalty',        color: '#3b82f6' },
  swagger:        { label: 'Showman',         emoji: '😎', desc: 'Confident soundbites, builds hype but risky',        color: '#f97316' },
  deflector:      { label: 'Deflector',       emoji: '😤', desc: 'Blames umps, opponents — risky in losses',           color: '#a855f7' },
  stoic:          { label: 'The Stoic',       emoji: '🎯', desc: 'Business-only, no emotion — steady but boring',      color: '#6b7280' },
};

// ─── Press Conference Responses → Tags ──────────────────────────────────────

export type PressResponse = 'own_it' | 'blame_umps' | 'praise_team' | 'call_out' | 'deflect' | 'confident' | 'humble' | 'next_game' | 'fire_up';

export const PRESS_RESPONSE_DISPLAY: Record<PressResponse, { label: string; desc: string }> = {
  own_it:     { label: 'Own It',         desc: '"That loss is on me. I made bad decisions."' },
  blame_umps: { label: 'Blame Umps',     desc: '"The strike zone was atrocious tonight."' },
  praise_team:{ label: 'Praise Team',    desc: '"These guys competed their tails off."' },
  call_out:   { label: 'Call Out',       desc: '"We need more from certain guys, period."' },
  deflect:    { label: 'Deflect',        desc: '"I\'m not going to get into that right now."' },
  confident:  { label: 'Confident',      desc: '"We\'re the best team in baseball, simple as that."' },
  humble:     { label: 'Humble',         desc: '"We got lucky tonight. Still lots to work on."' },
  next_game:  { label: 'Next Game',      desc: '"We\'ll show up tomorrow and grind."' },
  fire_up:    { label: 'Fire Up',        desc: '"This team has something special. Watch us."' },
};

export const PRESS_TAG_MAP: Record<PressResponse, MediaTag> = {
  own_it:      'accountability',
  blame_umps:  'deflector',
  praise_team: 'players_coach',
  call_out:    'tough_love',
  deflect:     'deflector',
  confident:   'swagger',
  humble:      'accountability',
  next_game:   'stoic',
  fire_up:     'swagger',
};

// ─── Credibility / Trust math ───────────────────────────────────────────────

export function calcCredibilityDelta(tag: MediaTag, isWin: boolean, isBlowout: boolean): number {
  if (tag === 'accountability') return isWin ? 1 : 4;          // Taking blame after loss = massive trust
  if (tag === 'stoic') return 2;                                // Steady hand always good
  if (tag === 'deflector') return isWin ? -1 : (isBlowout ? -4 : -1); // Blaming after blowout loss = terrible
  if (tag === 'swagger') return isWin ? 2 : -5;                // Bragging after loss = clown
  if (tag === 'tough_love') return isBlowout ? -2 : 2;         // Risky after blowout loss
  if (tag === 'players_coach') return 1;                        // Always safe, low reward
  return 0;
}

// ─── Persona detection ──────────────────────────────────────────────────────

export interface PersonaResult {
  dominantTag: MediaTag | null;
  tagCounts: Record<MediaTag, number>;
  credibility: number;
  fanTrust: number;
  lockerRoomMorale: number;
}

export function detectPersona(tagHistory: MediaTag[]): PersonaResult {
  const counts: Record<MediaTag, number> = {
    accountability: 0, tough_love: 0, players_coach: 0,
    swagger: 0, deflector: 0, stoic: 0,
  };

  const recent = tagHistory.slice(-10);
  recent.forEach(t => { counts[t]++; });

  let topTag: MediaTag | null = null;
  let topCount = 0;
  (Object.keys(counts) as MediaTag[]).forEach(t => {
    if (counts[t] > topCount) { topCount = counts[t]; topTag = t; }
  });

  if (topCount < 3) topTag = null;

  // Credibility: accountability/stoic boost, deflector/swagger hurt
  const credibility = Math.min(100, Math.max(0,
    50 + counts.accountability * 5 + counts.stoic * 3 + counts.players_coach * 2
    - counts.deflector * 6 - counts.swagger * 2 - counts.tough_love * 1
  ));

  // Fan trust: swagger/fire_up helps, deflector hurts
  const fanTrust = Math.min(100, Math.max(0,
    50 + counts.swagger * 4 + counts.players_coach * 3 + counts.accountability * 2
    - counts.deflector * 5 - counts.stoic * 1
  ));

  // Locker room: players_coach helps, tough_love and call_out hurt
  const lockerRoomMorale = Math.min(100, Math.max(0,
    50 + counts.players_coach * 5 + counts.accountability * 3
    - counts.tough_love * 3 - counts.deflector * 2 + counts.stoic * 1
  ));

  return { dominantTag: topTag, tagCounts: counts, credibility, fanTrust, lockerRoomMorale };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export interface PressConferenceEvent {
  id: number;
  date: string;
  opponent: string;
  result: 'W' | 'L';
  score: string;
  response: PressResponse;
  tag: MediaTag;
  credDelta: number;
}

export function generateDemoHistory(): PressConferenceEvent[] {
  const opponents = ['NYY', 'BOS', 'LAD', 'CHC', 'ATL', 'HOU', 'SF', 'SD', 'PHI', 'TB', 'MIN', 'CLE'];
  const responses: PressResponse[] = ['own_it', 'praise_team', 'confident', 'next_game', 'call_out', 'blame_umps',
    'humble', 'fire_up', 'praise_team', 'own_it', 'deflect', 'next_game', 'confident', 'praise_team', 'own_it'];

  return responses.map((resp, i) => {
    const isWin = i % 3 !== 2;
    const tag = PRESS_TAG_MAP[resp];
    const homeScore = 3 + (i % 5);
    const awayScore = isWin ? homeScore - 1 - (i % 3) : homeScore + 1 + (i % 2);
    const isBlowout = Math.abs(homeScore - awayScore) >= 5;

    return {
      id: i,
      date: `2024-${String(4 + Math.floor(i / 4)).padStart(2, '0')}-${String(5 + (i * 3) % 25).padStart(2, '0')}`,
      opponent: opponents[i % opponents.length],
      result: isWin ? 'W' : 'L',
      score: isWin ? `${homeScore}-${awayScore}` : `${awayScore}-${homeScore}`,
      response: resp,
      tag,
      credDelta: calcCredibilityDelta(tag, isWin, isBlowout),
    };
  });
}

export function generateDemoPersona(): PersonaResult {
  const history = generateDemoHistory();
  return detectPersona(history.map(h => h.tag));
}
