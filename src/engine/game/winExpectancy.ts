/**
 * Win Expectancy Engine
 *
 * Baseball win expectancy based on inning, score differential,
 * outs, base-runner state, and home/away advantage.
 * Uses a logistic model calibrated to historical MLB data.
 */

// ─── Base-runner state codes ────────────────────────────────────────────────
export type BaseState = 'empty' | 'first' | 'second' | 'third' | 'first_second' | 'first_third' | 'second_third' | 'loaded';

export const BASE_STATE_DISPLAY: Record<BaseState, { label: string; emoji: string; runExpectancy: number }> = {
  empty:        { label: 'Bases Empty',    emoji: '⬜', runExpectancy: 0.48 },
  first:        { label: 'Runner on 1st',  emoji: '🟡', runExpectancy: 0.85 },
  second:       { label: 'Runner on 2nd',  emoji: '🟠', runExpectancy: 1.07 },
  third:        { label: 'Runner on 3rd',  emoji: '🔴', runExpectancy: 1.35 },
  first_second: { label: '1st & 2nd',     emoji: '🟡🟠', runExpectancy: 1.41 },
  first_third:  { label: '1st & 3rd',     emoji: '🟡🔴', runExpectancy: 1.78 },
  second_third: { label: '2nd & 3rd',     emoji: '🟠🔴', runExpectancy: 1.94 },
  loaded:       { label: 'Bases Loaded',  emoji: '🔴🔴🔴', runExpectancy: 2.29 },
};

// ─── Run expectancy matrix (by outs and base state) ─────────────────────────
const RE_MATRIX: Record<number, Record<BaseState, number>> = {
  0: { empty: 0.48, first: 0.85, second: 1.07, third: 1.35, first_second: 1.41, first_third: 1.78, second_third: 1.94, loaded: 2.29 },
  1: { empty: 0.26, first: 0.51, second: 0.66, third: 0.93, first_second: 0.89, first_third: 1.17, second_third: 1.36, loaded: 1.54 },
  2: { empty: 0.10, first: 0.22, second: 0.32, third: 0.37, first_second: 0.43, first_third: 0.49, second_third: 0.56, loaded: 0.75 },
};

// ─── Leverage Index by inning and score closeness ───────────────────────────
export type LeverageBucket = 'blowout' | 'comfortable' | 'close' | 'tied';

const LEVERAGE_TABLE: Record<string, Record<LeverageBucket, number>> = {
  early:  { blowout: 0.3, comfortable: 0.5, close: 0.8, tied: 1.0 },   // innings 1-3
  middle: { blowout: 0.4, comfortable: 0.7, close: 1.2, tied: 1.5 },   // innings 4-6
  late:   { blowout: 0.5, comfortable: 1.0, close: 1.8, tied: 2.2 },   // innings 7-8
  final:  { blowout: 0.6, comfortable: 1.5, close: 2.8, tied: 3.5 },   // inning 9+
};

// ─── Types ──────────────────────────────────────────────────────────────────
export interface GameSituation {
  inning: number;        // 1-9+
  isTopHalf: boolean;    // true = top (away batting)
  outs: number;          // 0-2
  baseState: BaseState;
  scoreDiff: number;     // home - away (positive = home leads)
  isHome: boolean;       // is user the home team?
}

export interface WinExpectancyResult {
  winProbability: number;        // 0-100
  leverageIndex: number;         // 0-5ish
  runExpectancy: number;         // expected runs remainder of inning
  situation: string;             // human-readable description
  excitement: 'low' | 'medium' | 'high' | 'extreme';
}

export interface WETimelinePoint {
  id: number;
  inning: number;
  half: 'top' | 'bottom';
  event: string;
  homeWP: number;
  awayWP: number;
  leverageIndex: number;
}

// ─── Core calculations ──────────────────────────────────────────────────────

function getInningPhase(inning: number): string {
  if (inning <= 3) return 'early';
  if (inning <= 6) return 'middle';
  if (inning <= 8) return 'late';
  return 'final';
}

function getLeverageBucket(scoreDiff: number): LeverageBucket {
  const abs = Math.abs(scoreDiff);
  if (abs >= 7) return 'blowout';
  if (abs >= 4) return 'comfortable';
  if (abs >= 1) return 'close';
  return 'tied';
}

export function getLeverageIndex(inning: number, scoreDiff: number): number {
  const phase = getInningPhase(inning);
  const bucket = getLeverageBucket(scoreDiff);
  return LEVERAGE_TABLE[phase][bucket];
}

export function getRunExpectancy(outs: number, baseState: BaseState): number {
  return RE_MATRIX[Math.min(2, Math.max(0, outs))][baseState];
}

export function calcWinExpectancy(situation: GameSituation): WinExpectancyResult {
  const { inning, outs, baseState, scoreDiff, isHome } = situation;

  const re = getRunExpectancy(outs, baseState);
  const li = getLeverageIndex(inning, scoreDiff);

  // Logistic model: win probability based on score differential, inning, and run expectancy
  const inningsLeft = Math.max(0, 9 - inning);
  const urgency = inning >= 9 ? 1.5 : 1.0;
  const logit = (scoreDiff * 0.15 + re * 0.08 + inningsLeft * 0.02) * urgency;
  const homeBonus = isHome ? 0.12 : -0.12;

  let wp = 1 / (1 + Math.exp(-(logit + homeBonus)));
  wp = Math.max(0.01, Math.min(0.99, wp));
  const pct = Math.round(wp * 100);

  const excitement: WinExpectancyResult['excitement'] =
    li >= 2.5 ? 'extreme' : li >= 1.5 ? 'high' : li >= 0.8 ? 'medium' : 'low';

  const halfLabel = situation.isTopHalf ? 'Top' : 'Bot';
  const situationStr = `${halfLabel} ${inning}, ${outs} out, ${BASE_STATE_DISPLAY[baseState].label}`;

  return {
    winProbability: pct,
    leverageIndex: Math.round(li * 100) / 100,
    runExpectancy: Math.round(re * 100) / 100,
    situation: situationStr,
    excitement,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_EVENTS = [
  'Leadoff single', 'Strikeout', 'Groundout to SS', 'Double to RF gap',
  'Sacrifice bunt', 'Walk', 'RBI single', '2-run homer', 'Pop fly to 2B',
  'Line drive out', 'Stolen base', 'Wild pitch', 'Fly out to CF',
  'Strikeout looking', 'HBP', 'Double play', 'Infield single',
  'Triple to RC', 'Sac fly, run scores', 'Groundout to 1B',
];

export function generateDemoTimeline(): WETimelinePoint[] {
  const points: WETimelinePoint[] = [];
  let homeScore = 0;
  let awayScore = 0;
  let id = 0;

  for (let inning = 1; inning <= 9; inning++) {
    for (const half of ['top', 'bottom'] as const) {
      const eventCount = 2 + (id % 3);
      for (let e = 0; e < eventCount; e++) {
        const eventIdx = (inning * 7 + e * 13 + (half === 'top' ? 0 : 5)) % DEMO_EVENTS.length;
        const event = DEMO_EVENTS[eventIdx];

        // Simulate score changes
        if (event.includes('homer')) {
          if (half === 'top') awayScore += 2; else homeScore += 2;
        } else if (event.includes('RBI') || event.includes('run scores')) {
          if (half === 'top') awayScore += 1; else homeScore += 1;
        }

        const diff = homeScore - awayScore;
        const situation: GameSituation = {
          inning,
          isTopHalf: half === 'top',
          outs: e % 3,
          baseState: (['empty', 'first', 'second', 'first_second'] as BaseState[])[e % 4],
          scoreDiff: diff,
          isHome: true,
        };

        const we = calcWinExpectancy(situation);
        points.push({
          id: id++,
          inning,
          half,
          event,
          homeWP: we.winProbability,
          awayWP: 100 - we.winProbability,
          leverageIndex: we.leverageIndex,
        });
      }
    }
  }

  return points;
}

export function generateDemoSituation(): GameSituation {
  return {
    inning: 7,
    isTopHalf: false,
    outs: 1,
    baseState: 'first_second',
    scoreDiff: -1,
    isHome: true,
  };
}
