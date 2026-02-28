/**
 * Media Persona & Press Conference System
 *
 * Manager media tags that shape public perception. Press conference
 * responses build a persona over time, affecting credibility,
 * player morale, and fan sentiment.
 *
 * Ported from football dynasty media-persona.js, adapted for baseball
 * (manager instead of head coach, run margins instead of point margins).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type MediaTag = 'accountability' | 'tough_love' | 'players_coach' | 'swagger' | 'deflector' | 'stoic';

export interface MediaTagInfo {
  label: string;
  icon: string;
  desc: string;
  color: string;
}

export interface PressResponse {
  id: string;
  label: string;
  tag: MediaTag;
  desc: string;
}

export interface PressConference {
  id: string;
  situation: string;
  headline: string;
  responses: PressResponse[];
}

export interface MediaProfile {
  tagHistory: MediaTag[];
  credibility: number;        // 0-100
  persona: MediaTagInfo | null;
  fanSentiment: number;       // 0-100
}

// ── Tag config ──────────────────────────────────────────────────────────────

export const MEDIA_TAGS: Record<MediaTag, MediaTagInfo> = {
  accountability:  { label: 'Accountability Coach', icon: '🤝', desc: 'Takes blame, builds trust',         color: '#22c55e' },
  tough_love:      { label: 'Taskmaster',           icon: '🔥', desc: 'Demands excellence, pushes hard',   color: '#f97316' },
  players_coach:   { label: "Players' Coach",       icon: '💪', desc: 'Supports the locker room',          color: '#3b82f6' },
  swagger:         { label: 'Showman',              icon: '😎', desc: 'Confident, media-friendly',         color: '#eab308' },
  deflector:       { label: 'Deflector',            icon: '😤', desc: 'Blames umps, dodges questions',     color: '#ef4444' },
  stoic:           { label: 'The Stoic',            icon: '🎯', desc: 'Business-only, no emotion',         color: '#94a3b8' },
};

// ── Press conference templates ──────────────────────────────────────────────

export const PRESS_CONFERENCES: PressConference[] = [
  {
    id: 'postgame_win',
    situation: 'Post-Game Win',
    headline: 'Your team just won. The media is asking for your reaction.',
    responses: [
      { id: 'humble_win', label: 'Credit the Team', tag: 'accountability', desc: '"The guys played great. Credit goes to them."' },
      { id: 'swagger_win', label: 'Take a Victory Lap', tag: 'swagger', desc: '"We knew we were the better team. We proved it."' },
      { id: 'focused_win', label: 'Stay Focused', tag: 'stoic', desc: '"One game. Back to work tomorrow."' },
    ],
  },
  {
    id: 'postgame_loss',
    situation: 'Post-Game Loss',
    headline: 'Tough loss tonight. Reporters want answers.',
    responses: [
      { id: 'own_it', label: 'Take Responsibility', tag: 'accountability', desc: '"That\'s on me. I need to put our guys in better positions."' },
      { id: 'blame_umps', label: 'Blame the Umpires', tag: 'deflector', desc: '"Some of those calls were unacceptable. You saw it."' },
      { id: 'tough_love_loss', label: 'Call Out Effort', tag: 'tough_love', desc: '"We didn\'t compete tonight. That\'s not acceptable."' },
      { id: 'rally_loss', label: 'Rally the Troops', tag: 'players_coach', desc: '"I believe in this group. We\'ll bounce back."' },
    ],
  },
  {
    id: 'blowout_loss',
    situation: 'Blowout Loss',
    headline: 'An embarrassing loss. The media smells blood.',
    responses: [
      { id: 'face_it', label: 'Face the Music', tag: 'accountability', desc: '"No excuses. We got outplayed in every phase."' },
      { id: 'deflect_blowout', label: 'Deflect', tag: 'deflector', desc: '"You\'re going to make this about one game? Come on."' },
      { id: 'fire_blowout', label: 'Light a Fire', tag: 'tough_love', desc: '"Anyone not willing to work harder can find the door."' },
    ],
  },
  {
    id: 'winning_streak',
    situation: 'Winning Streak',
    headline: 'The team is rolling. What\'s your secret?',
    responses: [
      { id: 'swagger_streak', label: 'Show Confidence', tag: 'swagger', desc: '"We\'re playing at an elite level right now. Teams should be worried."' },
      { id: 'humble_streak', label: 'Stay Humble', tag: 'accountability', desc: '"We\'re playing good baseball but there\'s still a long way to go."' },
      { id: 'business_streak', label: 'Next Game Focus', tag: 'stoic', desc: '"Streaks don\'t matter. We focus on the next game."' },
    ],
  },
  {
    id: 'losing_streak',
    situation: 'Losing Streak',
    headline: 'The team can\'t stop losing. Fans are getting restless.',
    responses: [
      { id: 'back_players', label: 'Back Your Players', tag: 'players_coach', desc: '"I\'m not going to throw my guys under the bus. We\'re all in this together."' },
      { id: 'demand_more', label: 'Demand More', tag: 'tough_love', desc: '"Effort is not optional. Period."' },
      { id: 'no_comment', label: 'No Comment', tag: 'stoic', desc: '"We\'ll handle it internally."' },
    ],
  },
  {
    id: 'trade_question',
    situation: 'Trade Rumors',
    headline: 'Reporters are asking about trade deadline plans.',
    responses: [
      { id: 'aggressive_trade', label: 'Send a Message', tag: 'swagger', desc: '"We\'re going to be aggressive. This team is built to win now."' },
      { id: 'measured_trade', label: 'Measured Response', tag: 'stoic', desc: '"We always evaluate options. Nothing specific to report."' },
      { id: 'honest_trade', label: 'Be Honest', tag: 'accountability', desc: '"We need to get better. I\'m not going to pretend otherwise."' },
    ],
  },
];

// ── Persona detection ───────────────────────────────────────────────────────

export function getMediaPersona(tagHistory: MediaTag[]): MediaTagInfo | null {
  if (!tagHistory || tagHistory.length < 3) return null;
  const recent = tagHistory.slice(-6);
  const counts: Partial<Record<MediaTag, number>> = {};
  recent.forEach(t => { counts[t] = (counts[t] || 0) + 1; });

  let topTag: MediaTag | null = null;
  let topCount = 0;
  (Object.entries(counts) as [MediaTag, number][]).forEach(([tag, count]) => {
    if (count > topCount) { topCount = count; topTag = tag; }
  });

  if (topCount >= 2 && topTag && MEDIA_TAGS[topTag]) return MEDIA_TAGS[topTag];
  return null;
}

// ── Credibility math ────────────────────────────────────────────────────────

export function calcCredibilityDelta(tag: MediaTag, runMargin: number): number {
  const isWin = runMargin > 0;
  const isBlowoutLoss = runMargin <= -7; // 7+ run loss in baseball

  switch (tag) {
    case 'accountability': return isWin ? 1 : 4;    // Taking blame after loss = massive trust
    case 'stoic':          return 2;                  // Steady hand always good
    case 'deflector':      return isWin ? -1 : (isBlowoutLoss ? -4 : -1);
    case 'swagger':        return isWin ? 2 : -5;    // Bragging after loss = fool
    case 'tough_love':     return isBlowoutLoss ? -2 : 2;
    case 'players_coach':  return 1;                  // Always safe, low reward
    default:               return 0;
  }
}

// ── Fan sentiment ───────────────────────────────────────────────────────────

export function calcFanSentimentDelta(tag: MediaTag, isWin: boolean): number {
  if (tag === 'swagger' && isWin) return 4;
  if (tag === 'swagger' && !isWin) return -3;
  if (tag === 'players_coach') return 2;
  if (tag === 'accountability') return isWin ? 1 : 2;
  if (tag === 'deflector') return -2;
  if (tag === 'stoic') return 0;
  if (tag === 'tough_love') return isWin ? 2 : -1;
  return 0;
}

// ── Profile management ──────────────────────────────────────────────────────

export function initMediaProfile(): MediaProfile {
  return { tagHistory: [], credibility: 50, persona: null, fanSentiment: 50 };
}

export function addPressResponse(
  profile: MediaProfile,
  tag: MediaTag,
  runMargin: number,
): MediaProfile {
  const newHistory = [...profile.tagHistory, tag];
  const credDelta = calcCredibilityDelta(tag, runMargin);
  const fanDelta = calcFanSentimentDelta(tag, runMargin > 0);

  return {
    tagHistory: newHistory,
    credibility: Math.max(0, Math.min(100, profile.credibility + credDelta)),
    persona: getMediaPersona(newHistory),
    fanSentiment: Math.max(0, Math.min(100, profile.fanSentiment + fanDelta)),
  };
}
