/**
 * Series Challenges — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's weekly-challenges system.
 * Pool of game/series challenges with check functions,
 * XP rewards, and difficulty tiers.
 *
 * Challenges rotate every series (3-4 games) and provide
 * narrative stakes and manager XP progression.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Challenge {
  id:          string;
  label:       string;
  icon:        string;
  difficulty:  'easy' | 'medium' | 'hard' | 'elite' | 'legendary';
  xp:          number;
  completed:   boolean;
  seriesNum?:  number;
}

export interface ChallengeResult {
  completed:   Challenge[];
  xpEarned:    number;
}

export interface GameStats {
  userScore:     number;
  oppScore:      number;
  won:           boolean;
  hits:          number;
  hr:            number;
  sb:            number;
  errors:        number;
  strikeouts:    number;   // Pitching K
  walks:         number;   // BB allowed
  shutout:       boolean;
  extraInnings:  boolean;
  walkOff:       boolean;
  noHitter:      boolean;
  completeGame:  boolean;
}

// ─── Challenge Pool ───────────────────────────────────────────────────────────

export const CHALLENGE_POOL: Omit<Challenge, 'completed' | 'seriesNum'>[] = [
  { id: 'score10', label: 'Score 10+ runs', icon: '🎯', difficulty: 'medium', xp: 15 },
  { id: 'hold0', label: 'Pitch a shutout', icon: '🚫', difficulty: 'legendary', xp: 50 },
  { id: 'hr3', label: 'Hit 3+ home runs in a game', icon: '💣', difficulty: 'medium', xp: 15 },
  { id: 'sb3', label: 'Steal 3+ bases in a game', icon: '💨', difficulty: 'medium', xp: 12 },
  { id: 'win7plus', label: 'Win by 7+ runs', icon: '💪', difficulty: 'hard', xp: 25 },
  { id: 'no_errors', label: 'Play an error-free game', icon: '🧤', difficulty: 'medium', xp: 12 },
  { id: 'k10', label: 'Strike out 10+ batters', icon: '🔥', difficulty: 'hard', xp: 20 },
  { id: 'comeback', label: 'Win after trailing by 4+', icon: '🔄', difficulty: 'elite', xp: 30 },
  { id: 'walkoff', label: 'Win with a walk-off', icon: '🎬', difficulty: 'elite', xp: 35 },
  { id: 'hits15', label: 'Get 15+ hits in a game', icon: '🏏', difficulty: 'medium', xp: 12 },
  { id: 'cg', label: 'Throw a complete game', icon: '⚾', difficulty: 'hard', xp: 25 },
  { id: 'nohitter', label: 'Throw a no-hitter', icon: '🌟', difficulty: 'legendary', xp: 100 },
  { id: 'sweep', label: 'Sweep a 3-game series', icon: '🧹', difficulty: 'hard', xp: 20 },
  { id: 'extrawin', label: 'Win an extra-innings game', icon: '⏰', difficulty: 'medium', xp: 15 },
  { id: 'low_bb', label: 'Issue 0 walks in a game', icon: '🎯', difficulty: 'hard', xp: 20 },
];

// ─── Difficulty display ───────────────────────────────────────────────────────

export const DIFFICULTY_DISPLAY: Record<Challenge['difficulty'], { label: string; color: string }> = {
  easy:      { label: 'EASY',      color: '#22c55e' },
  medium:    { label: 'MEDIUM',    color: '#3b82f6' },
  hard:      { label: 'HARD',      color: '#f59e0b' },
  elite:     { label: 'ELITE',     color: '#ef4444' },
  legendary: { label: 'LEGENDARY', color: '#a855f7' },
};

// ─── Generate challenges for a series ─────────────────────────────────────────

export function generateSeriesChallenges(
  seriesNum: number,
  rand: () => number,
): Challenge[] {
  // Shuffle pool deterministically
  const shuffled = [...CHALLENGE_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  return shuffled.slice(0, 3).map(c => ({
    ...c,
    completed: false,
    seriesNum,
  }));
}

// ─── Check challenge completion ───────────────────────────────────────────────

export function checkChallenges(
  challenges: Challenge[],
  stats: GameStats,
): ChallengeResult {
  const completed: Challenge[] = [];
  let xpEarned = 0;

  for (const c of challenges) {
    if (c.completed) continue;

    let passed = false;
    switch (c.id) {
      case 'score10': passed = stats.userScore >= 10; break;
      case 'hold0': passed = stats.shutout; break;
      case 'hr3': passed = stats.hr >= 3; break;
      case 'sb3': passed = stats.sb >= 3; break;
      case 'win7plus': passed = stats.won && (stats.userScore - stats.oppScore) >= 7; break;
      case 'no_errors': passed = stats.errors === 0 && stats.won; break;
      case 'k10': passed = stats.strikeouts >= 10; break;
      case 'comeback': passed = stats.won && stats.oppScore >= stats.userScore + 4; break;
      case 'walkoff': passed = stats.walkOff; break;
      case 'hits15': passed = stats.hits >= 15; break;
      case 'cg': passed = stats.completeGame; break;
      case 'nohitter': passed = stats.noHitter; break;
      case 'extrawin': passed = stats.extraInnings && stats.won; break;
      case 'low_bb': passed = stats.walks === 0; break;
      default: break;
    }

    if (passed) {
      c.completed = true;
      completed.push(c);
      xpEarned += c.xp;
    }
  }

  return { completed, xpEarned };
}

// ─── Season-level tracking ────────────────────────────────────────────────────

export interface SeasonChallengeStats {
  totalCompleted:   number;
  totalXP:          number;
  legendaryCount:   number;
  eliteCount:       number;
}

export function getSeasonChallengeStats(
  allChallenges: Challenge[],
): SeasonChallengeStats {
  const completed = allChallenges.filter(c => c.completed);
  return {
    totalCompleted: completed.length,
    totalXP: completed.reduce((s, c) => s + c.xp, 0),
    legendaryCount: completed.filter(c => c.difficulty === 'legendary').length,
    eliteCount: completed.filter(c => c.difficulty === 'elite').length,
  };
}
