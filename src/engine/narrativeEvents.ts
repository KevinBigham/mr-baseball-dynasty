/**
 * narrativeEvents.ts — Off-field narrative events that affect players.
 *
 * Procedurally generates human-element events from player traits and team context.
 * 15+ event templates. Pure functions, deterministic via seed.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type NarrativeEventType =
  | 'extension_demand' | 'trade_request' | 'clubhouse_conflict'
  | 'personal_issue' | 'mentor' | 'fan_favorite' | 'hometown_hero'
  | 'contract_holdout' | 'charity_work' | 'media_controversy'
  | 'team_bonding' | 'slump_frustration' | 'milestone_chase'
  | 'comeback_story' | 'prospect_hype' | 'veteran_farewell';

export interface NarrativeEvent {
  id: string;
  type: NarrativeEventType;
  icon: string;
  headline: string;
  detail: string;
  options: Array<{
    label: string;
    effect: string;
  }>;
  playerName: string;
  season: number;
}

// ─── Templates ──────────────────────────────────────────────────────────

interface EventTemplate {
  type: NarrativeEventType;
  icon: string;
  headline: (name: string) => string;
  detail: (name: string) => string;
  options: Array<{ label: string; effect: string }>;
}

const TEMPLATES: EventTemplate[] = [
  {
    type: 'extension_demand',
    icon: '📝',
    headline: n => `${n} Wants a Contract Extension`,
    detail: n => `${n}'s agent has reached out about a long-term deal. If you don't negotiate, he may demand a trade next season.`,
    options: [
      { label: 'Open negotiations', effect: '+Loyalty, -Budget flexibility' },
      { label: 'Table it for now', effect: 'Risk: trade demand next year' },
    ],
  },
  {
    type: 'trade_request',
    icon: '📞',
    headline: n => `${n} Requests a Trade`,
    detail: n => `${n} feels underutilized and wants a fresh start. His frustration is affecting the clubhouse.`,
    options: [
      { label: 'Shop him around', effect: 'Clubhouse relief, lose talent' },
      { label: 'Convince him to stay', effect: 'Risk: morale drop if it fails' },
      { label: 'Increase his role', effect: '+Morale, lineup shuffle' },
    ],
  },
  {
    type: 'clubhouse_conflict',
    icon: '⚡',
    headline: n => `Clubhouse Tension Involving ${n}`,
    detail: n => `${n} and a teammate had a heated exchange in the dugout. The media noticed. How do you handle it?`,
    options: [
      { label: 'Address it privately', effect: 'Quiet resolution, +Respect' },
      { label: 'Let them work it out', effect: 'Risk: escalation' },
    ],
  },
  {
    type: 'personal_issue',
    icon: '🏠',
    headline: n => `${n} Dealing with Personal Matter`,
    detail: n => `${n} has requested a few days off for a family situation. He's been distracted recently.`,
    options: [
      { label: 'Grant the time off', effect: '+Loyalty, miss games' },
      { label: 'Ask him to stay focused', effect: 'Risk: resentment' },
    ],
  },
  {
    type: 'mentor',
    icon: '🎓',
    headline: n => `${n} Taking Prospect Under His Wing`,
    detail: n => `${n} has been spending extra time with a young player, sharing experience and technique. The kid is soaking it up.`,
    options: [
      { label: 'Encourage the mentorship', effect: '+Prospect development' },
      { label: 'Let it happen naturally', effect: 'Neutral' },
    ],
  },
  {
    type: 'fan_favorite',
    icon: '❤️',
    headline: n => `${n} Becomes a Fan Favorite`,
    detail: n => `${n}'s hustle and personality have made him beloved by fans. Jersey sales are up 40%. He's 34 and declining — do you keep him?`,
    options: [
      { label: 'Keep him for the fans', effect: '+Attendance, -Roster efficiency' },
      { label: 'Make the tough call', effect: 'Fan backlash, +Roster spot' },
    ],
  },
  {
    type: 'charity_work',
    icon: '🤝',
    headline: n => `${n} Launches Community Program`,
    detail: n => `${n} started a youth baseball program in the community. Local media coverage has been glowing.`,
    options: [
      { label: 'Support the initiative', effect: '+Team reputation' },
      { label: 'Appreciate from afar', effect: 'Neutral' },
    ],
  },
  {
    type: 'media_controversy',
    icon: '📰',
    headline: n => `${n} Makes Headlines Off the Field`,
    detail: n => `${n}'s social media post went viral for the wrong reasons. The front office is fielding calls from reporters.`,
    options: [
      { label: 'Issue a statement', effect: 'Damage control' },
      { label: 'Stay silent', effect: 'Risk: story grows' },
    ],
  },
  {
    type: 'team_bonding',
    icon: '🎉',
    headline: n => `${n} Organizes Team Outing`,
    detail: n => `${n} rallied the team for a day off together. Players are reporting higher morale and chemistry.`,
    options: [
      { label: 'Approve and fund it', effect: '+Chemistry, +Morale' },
      { label: 'Focus on baseball', effect: '-Morale risk' },
    ],
  },
  {
    type: 'slump_frustration',
    icon: '😤',
    headline: n => `${n} Frustrated with Cold Streak`,
    detail: n => `${n} broke a bat in the dugout after another hitless game. He's pressing and it's getting worse.`,
    options: [
      { label: 'Day off to reset', effect: 'Miss a game, break the slump' },
      { label: 'Send to video room', effect: 'Analytics-driven adjustment' },
      { label: 'Play through it', effect: 'Risk: extended slump' },
    ],
  },
  {
    type: 'milestone_chase',
    icon: '🎯',
    headline: n => `${n} Chasing a Historic Milestone`,
    detail: n => `${n} is closing in on a career milestone. The whole organization is watching. Extra media pressure, but extra motivation too.`,
    options: [
      { label: 'Protect his rest', effect: 'Slower pace, stay healthy' },
      { label: 'Let him chase it', effect: 'Motivation boost, fatigue risk' },
    ],
  },
  {
    type: 'comeback_story',
    icon: '💪',
    headline: n => `${n}'s Comeback Journey`,
    detail: n => `After a devastating injury last season, ${n} is showing flashes of his old self. The comeback narrative is building.`,
    options: [
      { label: 'Give him full reps', effect: 'Accelerate return, injury risk' },
      { label: 'Ease him back in', effect: 'Slow but safe' },
    ],
  },
  {
    type: 'prospect_hype',
    icon: '🌟',
    headline: n => `${n} Generating Buzz in the Minors`,
    detail: n => `${n} is tearing up AAA and the fan base is clamoring for a call-up. The team could use his bat, but is he ready?`,
    options: [
      { label: 'Call him up now', effect: 'Excitement, development risk' },
      { label: 'Let him marinate', effect: 'Better prep, fan frustration' },
    ],
  },
  {
    type: 'veteran_farewell',
    icon: '👋',
    headline: n => `${n} Hints at Retirement`,
    detail: n => `${n} quietly told teammates this might be his last season. The clubhouse is emotional. Do you give him a proper sendoff?`,
    options: [
      { label: 'Tribute game + ceremony', effect: '+Morale, +Fan goodwill' },
      { label: 'Let him play quietly', effect: 'Respect his wishes' },
    ],
  },
  {
    type: 'contract_holdout',
    icon: '💰',
    headline: n => `${n}'s Agent Playing Hardball`,
    detail: n => `${n}'s agent is demanding top-of-market money. Other teams are circling. The clock is ticking.`,
    options: [
      { label: 'Meet the ask', effect: 'Keep the player, big contract' },
      { label: 'Hold firm', effect: 'Risk: he walks in free agency' },
      { label: 'Counter-offer', effect: 'Negotiate — uncertain outcome' },
    ],
  },
  {
    type: 'hometown_hero',
    icon: '🏠',
    headline: n => `${n} Wants to Stay Home`,
    detail: n => `${n} grew up a fan of this team. He's willing to take a hometown discount to stay. A rarity in modern baseball.`,
    options: [
      { label: 'Lock him up long-term', effect: '+Loyalty, team-friendly deal' },
      { label: 'Test the market first', effect: 'Risk: he feels disrespected' },
    ],
  },
];

// ─── Generator ──────────────────────────────────────────────────────────

function hashNarr(a: number, b: number): number {
  let h = (a * 2654435761 + b) | 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return ((h >> 16) ^ h) & 0x7fffffff;
}

/**
 * Generate 1-2 narrative events for a season segment.
 * Deterministic based on season + segment.
 */
export function generateNarrativeEvents(
  playerNames: string[],
  season: number,
  segment: number,
): NarrativeEvent[] {
  if (playerNames.length === 0) return [];

  const events: NarrativeEvent[] = [];
  const count = 1 + (hashNarr(season, segment) % 2); // 1 or 2

  for (let i = 0; i < count; i++) {
    const seed = hashNarr(season * 100 + segment, i);
    const templateIdx = seed % TEMPLATES.length;
    const nameIdx = (seed + 7) % playerNames.length;

    const template = TEMPLATES[templateIdx];
    const name = playerNames[nameIdx];

    events.push({
      id: `narr-${season}-${segment}-${i}`,
      type: template.type,
      icon: template.icon,
      headline: template.headline(name),
      detail: template.detail(name),
      options: template.options,
      playerName: name,
      season,
    });
  }

  return events;
}
