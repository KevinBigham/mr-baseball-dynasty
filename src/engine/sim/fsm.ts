// ─── Custom typed FSM for game state ─────────────────────────────────────────
// Pragmatic choice over XState: same guarantees, zero bundle cost.
// Impossible states are impossible through the type system.

export type GamePhase =
  | 'PRE_GAME'
  | 'TOP_INNING'
  | 'BOTTOM_INNING'
  | 'MID_INNING'      // between half-innings
  | 'POST_GAME';

export interface GameFSMContext {
  inning: number;          // 1-based
  isTop: boolean;          // top = away team batting
  outs: number;            // 0–3
  runners: number;         // bitmask
  awayScore: number;
  homeScore: number;
  awayLineupPos: number;   // 0–8 cycling
  homeLineupPos: number;
  phase: GamePhase;
  totalInnings: number;    // usually 9
}

export function createInitialFSMContext(): GameFSMContext {
  return {
    inning: 1,
    isTop: true,
    outs: 0,
    runners: 0,
    awayScore: 0,
    homeScore: 0,
    awayLineupPos: 0,
    homeLineupPos: 0,
    phase: 'PRE_GAME',
    totalInnings: 9,
  };
}

export function startGame(ctx: GameFSMContext): GameFSMContext {
  return { ...ctx, phase: 'TOP_INNING' };
}

export function recordOut(ctx: GameFSMContext, runners: number): GameFSMContext {
  const newOuts = ctx.outs + 1;
  if (newOuts >= 3) {
    return {
      ...ctx,
      outs: 3,
      runners: 0,
      phase: 'MID_INNING',
    };
  }
  return { ...ctx, outs: newOuts, runners };
}

export function recordDoublePlay(ctx: GameFSMContext, runners: number): GameFSMContext {
  const newOuts = ctx.outs + 2;
  if (newOuts >= 3) {
    return {
      ...ctx,
      outs: 3,
      runners: 0,
      phase: 'MID_INNING',
    };
  }
  return { ...ctx, outs: newOuts, runners };
}

export function advanceBatterLineup(ctx: GameFSMContext): GameFSMContext {
  if (ctx.isTop) {
    return { ...ctx, awayLineupPos: (ctx.awayLineupPos + 1) % 9 };
  }
  return { ...ctx, homeLineupPos: (ctx.homeLineupPos + 1) % 9 };
}

export function scoreRuns(ctx: GameFSMContext, runs: number): GameFSMContext {
  if (ctx.isTop) {
    return { ...ctx, awayScore: ctx.awayScore + runs };
  }
  return { ...ctx, homeScore: ctx.homeScore + runs };
}

export function switchSides(ctx: GameFSMContext): GameFSMContext {
  const newIsTop = !ctx.isTop;
  const newInning = newIsTop ? ctx.inning : ctx.inning + 1;
  return {
    ...ctx,
    isTop: newIsTop,
    inning: newInning,
    outs: 0,
    runners: 0,
    phase: newIsTop ? 'TOP_INNING' : 'BOTTOM_INNING',
  };
}

export function endGame(ctx: GameFSMContext): GameFSMContext {
  return { ...ctx, phase: 'POST_GAME' };
}

// ─── Game-end conditions ──────────────────────────────────────────────────────
export function isGameOver(ctx: GameFSMContext): boolean {
  if (ctx.phase === 'POST_GAME') return true;
  if (ctx.phase !== 'MID_INNING') return false;

  // After bottom of 9th (or extra innings), check if game is over
  if (!ctx.isTop && ctx.inning >= ctx.totalInnings) {
    // Home team leads or game is tied (no walk-off needed yet)
    if (ctx.homeScore !== ctx.awayScore) return true;
  }

  // Walk-off: home team takes the lead in bottom of inning >= 9
  if (!ctx.isTop && ctx.inning >= ctx.totalInnings && ctx.homeScore > ctx.awayScore) {
    return true;
  }

  // Extra innings cap at 25 (with Manfred runner from inning 10+)
  if (ctx.inning > 25) return true;

  return false;
}

export function shouldUseMannedRunner(ctx: GameFSMContext): boolean {
  return ctx.inning >= 10;
}

// ─── Update state after PA ────────────────────────────────────────────────────
export function updateRunners(ctx: GameFSMContext, runners: number): GameFSMContext {
  return { ...ctx, runners };
}
