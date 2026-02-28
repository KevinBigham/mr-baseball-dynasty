// ─── Stat Headlines ───────────────────────────────────────────────────────
// Context-sensitive headlines for game recaps and series summaries.

export interface GameContext {
  won: boolean;
  runs: number;
  oppRuns: number;
  opp: string;
  hr: number;
  sb: number;
  k: number;        // strikeouts by pitching staff
  hits: number;
  oppHits: number;
  errors: number;
  margin: number;
  streak: number;    // positive = win streak, negative = loss streak
  walkoff: boolean;
  shutout: boolean;
  noHitter: boolean;
  perfectGame: boolean;
}

export interface Headline {
  emoji: string;
  text: string;
  priority: number;
}

interface HeadlineTemplate {
  cond: (g: GameContext) => boolean;
  emoji: string;
  text: string;
  priority: number;
}

const TEMPLATES: HeadlineTemplate[] = [
  { cond: g => g.perfectGame, emoji: '🌟', text: 'PERFECT GAME thrown against {opp}!', priority: 100 },
  { cond: g => g.noHitter, emoji: '🔥', text: 'NO-HITTER fired against {opp}!', priority: 95 },
  { cond: g => g.walkoff && g.won, emoji: '💥', text: 'WALK-OFF WIN against {opp}!', priority: 90 },
  { cond: g => g.shutout && g.won, emoji: '🚫', text: 'Shutout victory over {opp}, {runs}-0', priority: 85 },
  { cond: g => g.hr >= 4, emoji: '💣', text: 'Slugfest! {hr} home runs vs {opp}', priority: 80 },
  { cond: g => g.hr >= 3, emoji: '💣', text: '{hr} home runs power the offense vs {opp}', priority: 70 },
  { cond: g => g.k >= 15, emoji: '🔥', text: 'Dominant {k} strikeouts vs {opp}', priority: 75 },
  { cond: g => g.k >= 12, emoji: '⚡', text: 'Pitching staff fans {k} vs {opp}', priority: 65 },
  { cond: g => g.sb >= 4, emoji: '💨', text: '{sb} stolen bases wreak havoc vs {opp}', priority: 68 },
  { cond: g => g.margin >= 8 && g.won, emoji: '🏔️', text: 'Blowout: {margin}-run victory over {opp}', priority: 60 },
  { cond: g => g.margin >= 8 && !g.won, emoji: '😰', text: 'Blown out by {opp}, losing by {margin} runs', priority: 60 },
  { cond: g => Math.abs(g.margin) <= 1, emoji: '😤', text: 'Nail-biter {result} vs {opp}, final: {runs}-{oppRuns}', priority: 55 },
  { cond: g => g.errors >= 3, emoji: '🧱', text: '{errors} errors doom the defense vs {opp}', priority: 58 },
  { cond: g => g.streak >= 5, emoji: '🔥', text: 'Riding a {streak}-game winning streak!', priority: 72 },
  { cond: g => g.streak <= -5, emoji: '📉', text: 'Mired in a {streak}-game losing skid', priority: 72 },
  { cond: g => g.streak >= 3, emoji: '✅', text: '{streak}-game win streak continues', priority: 50 },
  { cond: g => g.streak <= -3, emoji: '❌', text: '{streak}-game losing streak grows', priority: 50 },
  { cond: g => g.won, emoji: '✅', text: 'Victory over {opp}, {runs}-{oppRuns}', priority: 10 },
  { cond: g => !g.won, emoji: '❌', text: 'Loss to {opp}, {runs}-{oppRuns}', priority: 10 },
];

function fillTemplate(text: string, g: GameContext): string {
  return text
    .replace(/\{opp\}/g, g.opp)
    .replace(/\{runs\}/g, String(g.runs))
    .replace(/\{oppRuns\}/g, String(g.oppRuns))
    .replace(/\{hr\}/g, String(g.hr))
    .replace(/\{k\}/g, String(g.k))
    .replace(/\{sb\}/g, String(g.sb))
    .replace(/\{margin\}/g, String(Math.abs(g.margin)))
    .replace(/\{errors\}/g, String(g.errors))
    .replace(/\{streak\}/g, String(Math.abs(g.streak)))
    .replace(/\{result\}/g, g.won ? 'win' : 'loss');
}

export function getHeadline(g: GameContext): Headline {
  for (const t of TEMPLATES) {
    if (t.cond(g)) {
      return { emoji: t.emoji, text: fillTemplate(t.text, g), priority: t.priority };
    }
  }
  return { emoji: '⚾', text: `Game vs ${g.opp}: ${g.runs}-${g.oppRuns}`, priority: 0 };
}

export function getTopHeadlines(g: GameContext, max = 3): Headline[] {
  const matched: Headline[] = [];
  for (const t of TEMPLATES) {
    if (t.cond(g)) {
      matched.push({ emoji: t.emoji, text: fillTemplate(t.text, g), priority: t.priority });
    }
  }
  return matched.sort((a, b) => b.priority - a.priority).slice(0, max);
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoHeadlines(): { game: GameContext; headlines: Headline[] }[] {
  const games: GameContext[] = [
    { won: true, runs: 8, oppRuns: 0, opp: 'NYY', hr: 3, sb: 1, k: 14, hits: 12, oppHits: 2, errors: 0, margin: 8, streak: 5, walkoff: false, shutout: true, noHitter: false, perfectGame: false },
    { won: true, runs: 3, oppRuns: 2, opp: 'BOS', hr: 1, sb: 2, k: 9, hits: 7, oppHits: 6, errors: 1, margin: 1, streak: 6, walkoff: true, shutout: false, noHitter: false, perfectGame: false },
    { won: false, runs: 1, oppRuns: 12, opp: 'LAD', hr: 0, sb: 0, k: 3, hits: 4, oppHits: 16, errors: 3, margin: -11, streak: -1, walkoff: false, shutout: false, noHitter: false, perfectGame: false },
    { won: true, runs: 1, oppRuns: 0, opp: 'HOU', hr: 0, sb: 0, k: 12, hits: 3, oppHits: 0, errors: 0, margin: 1, streak: 1, walkoff: false, shutout: true, noHitter: true, perfectGame: false },
    { won: true, runs: 12, oppRuns: 5, opp: 'CHC', hr: 4, sb: 3, k: 8, hits: 15, oppHits: 9, errors: 0, margin: 7, streak: 2, walkoff: false, shutout: false, noHitter: false, perfectGame: false },
    { won: false, runs: 3, oppRuns: 4, opp: 'ATL', hr: 1, sb: 0, k: 7, hits: 8, oppHits: 10, errors: 2, margin: -1, streak: -3, walkoff: false, shutout: false, noHitter: false, perfectGame: false },
  ];
  return games.map(g => ({ game: g, headlines: getTopHeadlines(g) }));
}
