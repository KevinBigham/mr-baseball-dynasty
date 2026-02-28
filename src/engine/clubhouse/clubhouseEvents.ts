/**
 * Clubhouse Events Engine
 *
 * Dynamic locker-room and clubhouse events that fire based on
 * team performance, morale, and season context. Some events are
 * automatic (triggered by conditions), others present the GM
 * with a choice that affects morale, chemistry, and reputation.
 *
 * Ported from football dynasty locker-events.js, adapted for baseball.
 */

// ── Event types ──────────────────────────────────────────────────────────────

export type EventSeverity = 'positive' | 'neutral' | 'negative' | 'crisis';

export interface ClubhouseEvent {
  id: string;
  label: string;
  icon: string;
  severity: EventSeverity;
  desc: string;
  trigger: string;
  effect: string;
}

export interface ClubhouseChoice {
  id: string;
  label: string;
  desc: string;
  moraleEffect: number;
  chemistryEffect: number;
  reputationEffect: number;
}

export interface ActiveClubhouseEvent {
  event: ClubhouseEvent;
  season: number;
  gameDay: number;
  playerName?: string;
  choices?: ClubhouseChoice[];
  resolved: boolean;
  chosenId?: string;
}

// ── Severity display config ─────────────────────────────────────────────────

export const SEVERITY_DISPLAY: Record<EventSeverity, { color: string; label: string }> = {
  positive: { color: '#22c55e', label: 'POSITIVE' },
  neutral:  { color: '#94a3b8', label: 'NEUTRAL' },
  negative: { color: '#f97316', label: 'WARNING' },
  crisis:   { color: '#ef4444', label: 'CRISIS' },
};

// ── Automatic events (triggered by conditions) ──────────────────────────────

export const AUTO_EVENTS: ClubhouseEvent[] = [
  {
    id: 'players_meeting',
    label: 'Players-Only Meeting',
    icon: '🤝',
    severity: 'positive',
    desc: 'Veterans called a players-only meeting to refocus the team after a tough stretch.',
    trigger: '3+ game losing streak',
    effect: '+3 morale, +1 chemistry',
  },
  {
    id: 'captains_rally',
    label: "Captain's Rally",
    icon: '🎖️',
    severity: 'positive',
    desc: 'Team captain delivered a fiery speech before a crucial series.',
    trigger: 'Playoff race, within 3 games of lead',
    effect: '+2 morale, +2 clutch bonus for 5 games',
  },
  {
    id: 'rookie_hazing',
    label: 'Rookie Dress-Up Day',
    icon: '🎭',
    severity: 'neutral',
    desc: 'Veterans made the rookies wear costumes on a road trip — harmless fun that bonded the team.',
    trigger: 'Random (15% per month with rookies on roster)',
    effect: '+1 chemistry, rookies +1 morale',
  },
  {
    id: 'winning_culture',
    label: 'Winning Culture',
    icon: '🏆',
    severity: 'positive',
    desc: 'The clubhouse is buzzing — this team believes they can win it all.',
    trigger: '10+ games over .500',
    effect: '+3 morale, +2 chemistry',
  },
  {
    id: 'star_demands',
    label: 'Star Demands Trade',
    icon: '💢',
    severity: 'crisis',
    desc: 'A star player has demanded a trade, citing lack of commitment to winning.',
    trigger: '10+ games under .500, star player morale < 30',
    effect: '-4 morale, -3 chemistry. Must address or trade.',
  },
  {
    id: 'cancer_spreads',
    label: 'Clubhouse Cancer',
    icon: '☣️',
    severity: 'crisis',
    desc: 'Negativity is spreading through the clubhouse. Multiple players are unhappy.',
    trigger: 'Team morale < 25, 3+ players with low morale',
    effect: '-5 chemistry, -2 morale/week until resolved',
  },
  {
    id: 'trade_rumors',
    label: 'Trade Rumors Swirl',
    icon: '📰',
    severity: 'negative',
    desc: 'Trade deadline rumors have unsettled the clubhouse.',
    trigger: 'Within 2 weeks of trade deadline',
    effect: '-2 morale for rumored players, -1 chemistry',
  },
  {
    id: 'contract_dispute',
    label: 'Contract Dispute',
    icon: '💰',
    severity: 'negative',
    desc: 'A key player is unhappy with his contract and is making noise in the media.',
    trigger: 'Player OVR 70+ and significantly underpaid',
    effect: '-2 morale for player, -1 team chemistry',
  },
  {
    id: 'captain_injured',
    label: 'Captain Goes Down',
    icon: '🏥',
    severity: 'negative',
    desc: 'The team captain suffered a significant injury, leaving a leadership void.',
    trigger: 'Captain placed on IL',
    effect: '-3 morale, -2 chemistry for 10 games',
  },
  {
    id: 'blowout_meeting',
    label: 'Post-Blowout Meeting',
    icon: '😤',
    severity: 'negative',
    desc: 'Manager called a closed-door meeting after an embarrassing blowout loss.',
    trigger: 'Lost by 10+ runs',
    effect: 'Morale check: rally (+2) or crumble (-3)',
  },
  {
    id: 'media_leak',
    label: 'Clubhouse Leak',
    icon: '🗞️',
    severity: 'negative',
    desc: 'Someone leaked private clubhouse conversations to the media.',
    trigger: 'Random (8% chance when morale < 40)',
    effect: '-3 chemistry, -2 trust',
  },
];

// ── Choice-based events ─────────────────────────────────────────────────────

export const CHOICE_EVENTS: Array<ClubhouseEvent & { choices: ClubhouseChoice[] }> = [
  {
    id: 'team_meeting',
    label: 'Call Team Meeting',
    icon: '📋',
    severity: 'neutral',
    desc: 'The team is struggling. How do you address it?',
    trigger: '5-game losing streak',
    effect: 'Depends on choice',
    choices: [
      { id: 'motivate', label: 'Motivational Speech', desc: 'Rally the troops with positivity', moraleEffect: 4, chemistryEffect: 1, reputationEffect: 1 },
      { id: 'accountability', label: 'Hold Accountable', desc: 'Call out poor effort directly', moraleEffect: -1, chemistryEffect: 2, reputationEffect: 2 },
      { id: 'quiet', label: 'Keep Quiet', desc: 'Let the players figure it out', moraleEffect: 0, chemistryEffect: -1, reputationEffect: -1 },
    ],
  },
  {
    id: 'back_the_star',
    label: 'Star Player in Slump',
    icon: '⭐',
    severity: 'neutral',
    desc: 'Your best player is in a terrible slump. Media is calling for a benching.',
    trigger: 'Star player 0-for-20',
    effect: 'Depends on choice',
    choices: [
      { id: 'support', label: 'Public Support', desc: 'Tell the media he\'s your guy', moraleEffect: 3, chemistryEffect: 1, reputationEffect: 2 },
      { id: 'bench', label: 'Strategic Rest', desc: 'Give him a day off to reset', moraleEffect: 0, chemistryEffect: 0, reputationEffect: 0 },
      { id: 'criticize', label: 'Public Criticism', desc: 'Challenge him through the media', moraleEffect: -4, chemistryEffect: -2, reputationEffect: -3 },
    ],
  },
  {
    id: 'fine_for_conduct',
    label: 'Player Misconduct',
    icon: '⚠️',
    severity: 'negative',
    desc: 'A player showed up late to the ballpark and was unprofessional.',
    trigger: 'Random (5% per month, low work ethic players)',
    effect: 'Depends on choice',
    choices: [
      { id: 'fine', label: 'Fine & Suspend', desc: 'Send a message about standards', moraleEffect: -2, chemistryEffect: 2, reputationEffect: 3 },
      { id: 'talk', label: 'Private Talk', desc: 'Handle it behind closed doors', moraleEffect: 1, chemistryEffect: 0, reputationEffect: 1 },
      { id: 'ignore', label: 'Look Away', desc: 'Let it slide this time', moraleEffect: 0, chemistryEffect: -2, reputationEffect: -2 },
    ],
  },
  {
    id: 'trade_demand',
    label: 'Trade Demand',
    icon: '📦',
    severity: 'crisis',
    desc: 'A disgruntled player has demanded a trade through his agent.',
    trigger: 'Player morale < 20 for 15+ games',
    effect: 'Depends on choice',
    choices: [
      { id: 'trade', label: 'Honor Request', desc: 'Trade him and move on', moraleEffect: 0, chemistryEffect: 1, reputationEffect: 2 },
      { id: 'negotiate', label: 'Renegotiate', desc: 'Offer extension/role change', moraleEffect: 2, chemistryEffect: 0, reputationEffect: 0 },
      { id: 'hardball', label: 'Play Hardball', desc: 'Refuse and remind him of his contract', moraleEffect: -5, chemistryEffect: -3, reputationEffect: -2 },
    ],
  },
  {
    id: 'faction_war',
    label: 'Clubhouse Divide',
    icon: '⚔️',
    severity: 'crisis',
    desc: 'Two groups of players are feuding, splitting the clubhouse.',
    trigger: 'Chemistry < 20, multiple low-morale players',
    effect: 'Depends on choice',
    choices: [
      { id: 'mediate', label: 'Mediate', desc: 'Bring both sides together', moraleEffect: 2, chemistryEffect: 3, reputationEffect: 2 },
      { id: 'pick_side', label: 'Pick a Side', desc: 'Back the group you believe in', moraleEffect: -2, chemistryEffect: -1, reputationEffect: 1 },
      { id: 'shake_up', label: 'Roster Shake-Up', desc: 'Trade the instigators', moraleEffect: 1, chemistryEffect: 2, reputationEffect: 0 },
    ],
  },
  {
    id: 'redemption_arc',
    label: 'Redemption Opportunity',
    icon: '🌟',
    severity: 'positive',
    desc: 'A struggling veteran has been working extra hours. Give him a shot?',
    trigger: 'Veteran (30+) with OVR decline, high work ethic',
    effect: 'Depends on choice',
    choices: [
      { id: 'start', label: 'Give Him the Start', desc: 'Put him in the lineup / rotation', moraleEffect: 4, chemistryEffect: 2, reputationEffect: 3 },
      { id: 'pinch', label: 'Situational Role', desc: 'Use him as a pinch hitter / long reliever', moraleEffect: 2, chemistryEffect: 1, reputationEffect: 1 },
      { id: 'pass', label: 'Stay the Course', desc: 'Keep the current lineup', moraleEffect: -2, chemistryEffect: -1, reputationEffect: -1 },
    ],
  },
];

// ── Event generation logic ──────────────────────────────────────────────────

export interface TeamContext {
  winPct: number;
  streak: number;          // negative = losing streak
  morale: number;          // 0-100
  chemistry: number;       // 0-100
  gamesOverUnder500: number;
  isPlayoffRace: boolean;
  gameDay: number;
  hasRookies: boolean;
  starMorale: number;      // lowest star morale
}

export function checkAutoEvents(ctx: TeamContext): ClubhouseEvent[] {
  const fired: ClubhouseEvent[] = [];

  if (ctx.streak <= -3) {
    fired.push(AUTO_EVENTS.find(e => e.id === 'players_meeting')!);
  }
  if (ctx.isPlayoffRace && ctx.gamesOverUnder500 >= 0) {
    fired.push(AUTO_EVENTS.find(e => e.id === 'captains_rally')!);
  }
  if (ctx.gamesOverUnder500 >= 10) {
    fired.push(AUTO_EVENTS.find(e => e.id === 'winning_culture')!);
  }
  if (ctx.gamesOverUnder500 <= -10 && ctx.starMorale < 30) {
    fired.push(AUTO_EVENTS.find(e => e.id === 'star_demands')!);
  }
  if (ctx.morale < 25) {
    fired.push(AUTO_EVENTS.find(e => e.id === 'cancer_spreads')!);
  }
  if (ctx.morale < 40 && Math.random() < 0.08) {
    fired.push(AUTO_EVENTS.find(e => e.id === 'media_leak')!);
  }

  return fired;
}

export function checkChoiceEvents(ctx: TeamContext): typeof CHOICE_EVENTS[number] | null {
  if (ctx.streak <= -5) return CHOICE_EVENTS.find(e => e.id === 'team_meeting')!;
  if (ctx.chemistry < 20 && ctx.morale < 35) return CHOICE_EVENTS.find(e => e.id === 'faction_war')!;
  if (ctx.starMorale < 20) return CHOICE_EVENTS.find(e => e.id === 'trade_demand')!;
  return null;
}

export function resolveChoice(choice: ClubhouseChoice) {
  return {
    moraleDelta: choice.moraleEffect,
    chemistryDelta: choice.chemistryEffect,
    reputationDelta: choice.reputationEffect,
  };
}

// ── Event history ───────────────────────────────────────────────────────────

export function getEventSummary(events: ActiveClubhouseEvent[]) {
  const positive = events.filter(e => e.event.severity === 'positive').length;
  const negative = events.filter(e => e.event.severity === 'negative').length;
  const crises = events.filter(e => e.event.severity === 'crisis').length;
  const resolved = events.filter(e => e.resolved).length;

  return { total: events.length, positive, negative, crises, resolved, unresolved: events.length - resolved };
}
