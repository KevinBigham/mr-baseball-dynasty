/**
 * Coach Tips — Golden first-visit contextual tips for each major section.
 * Ported from MFD's COACH_TIPS concept.
 * Dismissals stored in localStorage.
 */

export interface CoachTipData {
  section: string;
  tip: string;
  icon: string;
}

export const COACH_TIPS: Record<string, CoachTipData> = {
  roster: {
    section: 'roster',
    tip: "Your 26-man roster is the backbone of your season. Keep an eye on position battles — when two players are close in OVR, the competition makes both better.",
    icon: '📋',
  },
  depth: {
    section: 'depth',
    tip: "The depth chart controls who starts. Injuries happen fast — make sure every position has a capable backup ready to step in.",
    icon: '📊',
  },
  pipeline: {
    section: 'pipeline',
    tip: "Your farm system is your future. Young prospects develop faster with playing time at the right level — don't rush them to the majors.",
    icon: '🌱',
  },
  devlab: {
    section: 'devlab',
    tip: "Development programs let you focus a player's growth. Young prospects benefit most — veterans have less ceiling to unlock.",
    icon: '🔬',
  },
  scouting: {
    section: 'scouting',
    tip: "Scouting reveals hidden attributes. The more you scout a player, the more accurate your evaluation becomes. Spend points wisely.",
    icon: '🔍',
  },
  ratings: {
    section: 'ratings',
    tip: "The ratings grid shows every attribute on the 20-80 scouting scale. Green is elite, red needs work. Use this to spot strengths and weaknesses at a glance.",
    icon: '🎯',
  },
  finances: {
    section: 'finances',
    tip: "Watch the luxury tax threshold — exceeding it triggers penalties that compound year over year. Plan your payroll 2-3 seasons ahead.",
    icon: '💰',
  },
  trades: {
    section: 'trades',
    tip: "Good trades balance present and future. Don't give up young talent for a rental unless you're truly contending this year.",
    icon: '🤝',
  },
  freeagency: {
    section: 'freeagency',
    tip: "Free agency is where contenders fill gaps. But beware of overpaying for aging players on long deals — those contracts get ugly fast.",
    icon: '📝',
  },
  draft: {
    section: 'draft',
    tip: "Best Player Available usually beats drafting for need. The draft is about acquiring talent — worry about positional fit later.",
    icon: '🎓',
  },
  leaderboards: {
    section: 'leaderboards',
    tip: "Leaderboards show who's dominating. Elite stats are highlighted in gold — look for breakout performers on your own roster.",
    icon: '🏆',
  },
  standings: {
    section: 'standings',
    tip: "Watch the run differential column — it's the best predictor of true team quality. A team outscoring opponents will eventually win more games.",
    icon: '📈',
  },
  playoffs: {
    section: 'playoffs',
    tip: "Anything can happen in a short series. The best regular-season team doesn't always win — that's the magic of October baseball.",
    icon: '⚾',
  },
  history: {
    section: 'history',
    tip: "Your franchise legacy is built one season at a time. Championships, award winners, and Hall of Famers all add to your story.",
    icon: '📚',
  },
  arbitration: {
    section: 'arbitration',
    tip: "Arbitration-eligible players (3-6 years of service time) get salary bumps based on performance. Plan ahead — costs rise quickly for star players.",
    icon: '⚖️',
  },
  extensions: {
    section: 'extensions',
    tip: "Lock up your core early. Extensions before free agency save money long-term, but be careful about committing to aging players.",
    icon: '✍️',
  },
  waivers: {
    section: 'waivers',
    tip: "The waiver wire is where you find hidden gems. Other teams' DFA'd players can sometimes be exactly what you need.",
    icon: '📡',
  },
  pennant: {
    section: 'pennant',
    tip: "The pennant race heats up in September. Keep an eye on your magic number — that's how many combined wins and rival losses clinch your spot.",
    icon: '🏁',
  },
};

const STORAGE_KEY = 'mrbd-dismissed-tips';

export function getDismissedTips(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

export function dismissTip(section: string): void {
  const dismissed = getDismissedTips();
  dismissed.add(section);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]));
  } catch { /* ignore */ }
}

export function isTipDismissed(section: string): boolean {
  return getDismissedTips().has(section);
}
