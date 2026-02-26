/**
 * storyboard.ts — Dynamic Season Narrative Storyboarding
 *
 * Every season gets a narrative arc label that frames what's at stake.
 * Two modes:
 *   PRE-SIM  — "What's your story going in?"
 *   POST-SIM — "How the chapter ended"
 *
 * Arc types are determined by franchise history + current season context.
 */

import type { SeasonSummary } from '../store/leagueStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArcPhase = 'pre' | 'post';

export interface SeasonArc {
  title:        string;       // e.g. "DYNASTY RISING"
  subtitle:     string;       // e.g. "Year 3 of building something special"
  icon:         string;       // emoji
  color:        string;       // hex accent
  chapterLabel: string;       // "CHAPTER 1", "CHAPTER 4", etc.
  chapterDesc:  string;       // one-liner for this season's chapter
  resolution:   string | null; // Post-sim narrative resolution (null if pre-sim)
  arcType:      ArcType;
}

export type ArcType =
  | 'year_one'
  | 'dynasty_rising'
  | 'dynasty_peak'
  | 'dynasty_defense'
  | 'contender'
  | 'window_closing'
  | 'last_stand'
  | 'rebuild_begins'
  | 'rebuild_progress'
  | 'dark_horse'
  | 'underdog'
  | 'bounce_back'
  | 'transition';

// ─── Arc definitions ──────────────────────────────────────────────────────────

interface ArcDef {
  title:    string;
  icon:     string;
  color:    string;
  subtitles: string[];
  chapters:  string[];
  resolutions: { win: string; playoff: string; miss: string };
}

const ARC_DEFS: Record<ArcType, ArcDef> = {
  year_one: {
    title: 'YEAR ONE',
    icon: '🌱', color: '#4ade80',
    subtitles: [
      'The first chapter of something new.',
      'Every dynasty starts somewhere.',
      'Building the foundation from day one.',
    ],
    chapters: [
      'Opening chapter — the franchise takes its first breath.',
      'A blank slate. Anything is possible.',
      'New era, new identity, new mission.',
    ],
    resolutions: {
      win:     'A historic debut. The foundation was poured and it set perfectly.',
      playoff: 'Exceeded expectations in Year One. The future is already bright.',
      miss:    'A learning season. Every great franchise has a first year.',
    },
  },

  dynasty_rising: {
    title: 'DYNASTY RISING',
    icon: '🔺', color: '#f97316',
    subtitles: [
      'The empire is being built, brick by brick.',
      'Consecutive winning seasons are becoming the standard.',
      'Something special is taking shape.',
    ],
    chapters: [
      'The ascent continues. Rivals are starting to take notice.',
      'Back-to-back winning seasons. This is becoming a habit.',
      'The pipeline is feeding the machine. It\'s working.',
    ],
    resolutions: {
      win:     'Another dominant season. The dynasty trajectory is undeniable.',
      playoff: 'Another October appearance. The standard is being set.',
      miss:    'A minor detour on the dynasty path. The core remains intact.',
    },
  },

  dynasty_peak: {
    title: 'DYNASTY PEAK',
    icon: '👑', color: '#fbbf24',
    subtitles: [
      'The machine is operating at full capacity.',
      'Multiple championships. The conversation has changed.',
      'This is what dynasty looks like.',
    ],
    chapters: [
      'Defending champions. The target is on your back.',
      'The franchise is at its zenith. Can they sustain it?',
      'Every team is building around beating you.',
    ],
    resolutions: {
      win:     'DYNASTY CONFIRMED. This franchise will be remembered.',
      playoff: 'Another deep run from the top of the mountain.',
      miss:    'Even dynasties have down years. The core is still elite.',
    },
  },

  dynasty_defense: {
    title: 'DYNASTY DEFENSE',
    icon: '🏆', color: '#fbbf24',
    subtitles: [
      'Champions defending the throne.',
      'Can they do it again? Everyone says no.',
      'The hardest thing in baseball: winning back-to-back.',
    ],
    chapters: [
      'Last year\'s champions look to validate their legacy.',
      'The clubhouse championship hangover is real. Rise above it.',
      'A title defense is its own kind of pressure.',
    ],
    resolutions: {
      win:     'BACK-TO-BACK. An all-time franchise moment.',
      playoff: 'Fell short of repeating, but reached October again.',
      miss:    'The hangover hit. A champion\'s reset is underway.',
    },
  },

  contender: {
    title: 'THE CONTENDER',
    icon: '🔥', color: '#fb923c',
    subtitles: [
      'This team is built to make a deep run.',
      'The window is open. Time to climb through.',
      'Talent is there. Execution is everything.',
    ],
    chapters: [
      'A legitimate contender enters the season with intent.',
      'The front office went all-in. The roster is ready.',
      'Now or never for this core group.',
    ],
    resolutions: {
      win:     'Delivered. A World Series-caliber season executed to perfection.',
      playoff: 'Competed deep into October. The contention window holds.',
      miss:    'The window didn\'t open as wide as hoped. Reassessment time.',
    },
  },

  window_closing: {
    title: 'WINDOW CLOSING',
    icon: '⏳', color: '#a78bfa',
    subtitles: [
      'The core is aging. This is the final opportunity.',
      'Peak years are behind a few key pieces. Do or die.',
      'A championship now, or rebuild in the winter.',
    ],
    chapters: [
      'An aging core gives everything for one more shot.',
      'The window is closing. Everyone in the building knows it.',
      'The deadline is the offseason. Win now.',
    ],
    resolutions: {
      win:     'They delivered when it mattered most. Legacy secured.',
      playoff: 'A valiant final push from an aging core. Respect.',
      miss:    'The window closed without a ring. Rebuild is imminent.',
    },
  },

  last_stand: {
    title: 'THE LAST STAND',
    icon: '⚔️', color: '#ef4444',
    subtitles: [
      'Owner patience is nearly gone. Produce or be replaced.',
      'This roster is on notice. Win or face the consequences.',
      'The franchise is at a crossroads. One direction or the other.',
    ],
    chapters: [
      'Everything is on the line. Careers, mandates, legacies.',
      'Hot seat season. The front office is watching every game.',
      'A make-or-break year for this management group.',
    ],
    resolutions: {
      win:     'Saved. A dominant season buys the front office more time.',
      playoff: 'Postseason appearance keeps the wolves at bay. For now.',
      miss:    'The pressure became too much. Changes are coming.',
    },
  },

  rebuild_begins: {
    title: 'REBUILD BEGINS',
    icon: '🏗️', color: '#60a5fa',
    subtitles: [
      'Trading veterans for futures. The long play starts now.',
      'Draft capital over wins. A new front office philosophy.',
      'The pipeline is more important than the standings this year.',
    ],
    chapters: [
      'Year One of the rebuild. Pain now, glory later.',
      'The front office is reshaping the entire franchise.',
      'Prospect development is the entire mission this season.',
    ],
    resolutions: {
      win:     'Surprising! The rebuild is ahead of schedule.',
      playoff: 'Unexpected playoff berth during the rebuild. Momentum.',
      miss:    'As expected. The pipeline grows. The standings don\'t matter.',
    },
  },

  rebuild_progress: {
    title: 'REBUILD IN PROGRESS',
    icon: '📈', color: '#34d399',
    subtitles: [
      'The pieces are emerging. Light at the end of the tunnel.',
      'The farm is producing. The big-league team is improving.',
      'Each season is measurably better than the last.',
    ],
    chapters: [
      'Year two or three of a methodical rebuild. Progress is visible.',
      'Prospects are arriving. The rebuild is on track.',
      'Can this team surprise? The pieces are coming together.',
    ],
    resolutions: {
      win:     'Rebuild ahead of schedule. The front office looks prescient.',
      playoff: 'A playoff berth during the rebuild! The timeline accelerated.',
      miss:    'Steady progress. The foundation is stronger than the record shows.',
    },
  },

  dark_horse: {
    title: 'DARK HORSE',
    icon: '🐎', color: '#a78bfa',
    subtitles: [
      'Nobody is picking them. That\'s exactly how they like it.',
      'MFSN gave them 68 wins. The locker room is motivated.',
      'Flying under the radar by design.',
    ],
    chapters: [
      'The analysts counted them out. Time to prove everyone wrong.',
      'A sleeper pick with genuine upside nobody is talking about.',
      'Low expectations, high ceiling. The best combination.',
    ],
    resolutions: {
      win:     'CALLED IT. The dark horse shocked the entire league.',
      playoff: 'The dark horse made October. Nobody saw it coming.',
      miss:    'Couldn\'t quite pull off the upset. Still a story worth telling.',
    },
  },

  underdog: {
    title: 'THE UNDERDOG',
    icon: '🦴', color: '#6b7280',
    subtitles: [
      'The odds are long. The mission is clear.',
      'Payroll is low. Heart is unlimited.',
      'Small market. Big ambitions.',
    ],
    chapters: [
      'Against the grain every year. This is the franchise identity now.',
      'Scrapping for every win in a league of giants.',
      'Moneyball or bust. Efficiency is the only path.',
    ],
    resolutions: {
      win:     'THE UPSET. One of the great stories in franchise history.',
      playoff: 'Small market, October baseball. The formula is working.',
      miss:    'Fought hard. The budget made the margin razor-thin.',
    },
  },

  bounce_back: {
    title: 'THE BOUNCE BACK',
    icon: '↩️', color: '#fbbf24',
    subtitles: [
      'A disappointing season demands a response.',
      'The front office addressed the holes. Time to deliver.',
      'Last year hurt. This year is the answer.',
    ],
    chapters: [
      'A team responding to last season\'s disappointment.',
      'The clubhouse is hungry after a rough campaign.',
      'Motivated by failure. The best kind of motivation.',
    ],
    resolutions: {
      win:     'The bounce back was REAL. Message sent to the entire league.',
      playoff: 'Returned to October as promised. The response was delivered.',
      miss:    'The slump continues. Deeper questions need answering.',
    },
  },

  transition: {
    title: 'TRANSITION YEAR',
    icon: '🔄', color: '#9ca3af',
    subtitles: [
      'Between eras. The next chapter isn\'t written yet.',
      'Vets fading, prospects arriving. Managed uncertainty.',
      'An in-between year — neither rebuilding nor contending.',
    ],
    chapters: [
      'Neither rebuild nor contention. The awkward middle.',
      'Roster construction is evolving. The direction will clarify.',
      'Bridging the gap between what was and what will be.',
    ],
    resolutions: {
      win:     'The transition resolved faster than anyone expected.',
      playoff: 'Surprised in a transition year. The new direction is set.',
      miss:    'A year of uncertainty yielded an uncertain result. Reset.',
    },
  },
};

// ─── Arc detection logic ──────────────────────────────────────────────────────

export function detectArcType(
  history:     SeasonSummary[],
  ownerPatience: number,
  seasonsManaged: number,
): ArcType {
  if (seasonsManaged === 0) return 'year_one';

  const titles   = history.filter(s => s.playoffResult === 'Champion').length;
  const playoffs = history.filter(s => s.playoffResult !== null).length;
  const totalWins = history.reduce((s, x) => s + x.wins, 0);
  const avgWins   = history.length > 0 ? totalWins / history.length : 81;

  const lastSeason  = history[0];  // history is newest-first
  const last2       = history.slice(0, 2);
  const recentAvgWins = last2.length > 0 ? last2.reduce((s, x) => s + x.wins, 0) / last2.length : 81;

  const lastWasChamp = lastSeason?.playoffResult === 'Champion';
  const lastWasPlayoff = !!lastSeason?.playoffResult;

  // Danger zone
  if (ownerPatience <= 25) return 'last_stand';

  // Dynasty
  if (titles >= 3)   return 'dynasty_peak';
  if (lastWasChamp)  return 'dynasty_defense';
  if (titles >= 1 && avgWins >= 88) return 'dynasty_rising';

  // Contending
  if (recentAvgWins >= 90) return 'contender';
  if (avgWins >= 85 && lastWasPlayoff) return 'contender';

  // Window closing (older star core, but good team)
  if (avgWins >= 85 && seasonsManaged >= 5 && !lastWasPlayoff) return 'window_closing';

  // Rebuild states
  if (avgWins < 72 && seasonsManaged <= 2) return 'rebuild_begins';
  if (avgWins < 76 && recentAvgWins > avgWins * 1.05) return 'rebuild_progress';

  // Bounce back (bad last year, decent history)
  if (lastSeason && lastSeason.wins < 72 && avgWins >= 78) return 'bounce_back';

  // Dark horse (low MFSN expectations but decent recent form)
  if (recentAvgWins >= 82 && avgWins < 78) return 'dark_horse';

  // Underdog / small payroll proxy (low wins but surviving)
  if (avgWins < 78 && playoffs >= 1) return 'underdog';

  // Transition
  if (Math.abs(recentAvgWins - avgWins) > 8) return 'transition';

  // Default contender or rebuild
  return avgWins >= 81 ? 'contender' : 'rebuild_begins';
}

// ─── Arc generation ───────────────────────────────────────────────────────────

export function generateSeasonArc(
  history:        SeasonSummary[],
  ownerPatience:  number,
  seasonsManaged: number,
  season:         number,
  phase:          ArcPhase,
  lastWins?:      number,
  lastPlayoff?:   boolean,
  lastChampion?:  boolean,
): SeasonArc {
  const arcType = detectArcType(history, ownerPatience, seasonsManaged);
  const def     = ARC_DEFS[arcType];

  const subtitleIdx = (season * 13 + seasonsManaged) % def.subtitles.length;
  const chapterIdx  = (season * 7  + seasonsManaged) % def.chapters.length;

  const chapterNum   = `CHAPTER ${seasonsManaged + 1}`;
  const chapterDesc  = def.chapters[chapterIdx];
  const subtitle     = def.subtitles[subtitleIdx];

  let resolution: string | null = null;
  if (phase === 'post' && lastWins !== undefined) {
    if (lastChampion) {
      resolution = def.resolutions.win;
    } else if (lastPlayoff) {
      resolution = def.resolutions.playoff;
    } else {
      resolution = def.resolutions.miss;
    }
  }

  return {
    title: def.title,
    subtitle,
    icon: def.icon,
    color: def.color,
    chapterLabel: chapterNum,
    chapterDesc,
    resolution,
    arcType,
  };
}
