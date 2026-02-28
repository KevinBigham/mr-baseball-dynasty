/**
 * Season Goals System
 *
 * Three-layer goal system:
 * - Owner goals: franchise-level objectives (win title, make playoffs, etc.)
 * - Manager goals: performance targets (top-10 ERA, develop rookie, etc.)
 * - Player goals: individual stat milestones (30 HR, 200 K, etc.)
 *
 * Ported from football dynasty season-goals.js, adapted for baseball
 * stats and positions.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type GoalStatus = 'active' | 'completed' | 'failed';
export type GoalLayer = 'owner' | 'manager' | 'player';

export interface GoalReward {
  ownerMood?: number;
  cash?: number;
  morale?: number;
  devBoost?: number;
}

export interface GoalTemplate {
  id: string;
  label: string;
  layer: GoalLayer;
  positions?: string[];
  stat?: string;
  target?: number;
  compare?: 'gte' | 'lte';
  reward: GoalReward;
  penalty: GoalReward;
}

export interface ActiveGoal {
  id: string;
  label: string;
  layer: GoalLayer;
  status: GoalStatus;
  current: number;
  target?: number;
  compare?: 'gte' | 'lte';
  reward: GoalReward;
  penalty: GoalReward;
  playerName?: string;
  playerId?: number;
}

// ── Owner goal templates ────────────────────────────────────────────────────

export const OWNER_GOALS: GoalTemplate[] = [
  { id: 'win_ws',       label: 'Win the World Series',      layer: 'owner', reward: { ownerMood: 15, cash: 10 }, penalty: { ownerMood: -15 } },
  { id: 'win_pennant',  label: 'Win the Pennant',           layer: 'owner', reward: { ownerMood: 10, cash: 5 },  penalty: { ownerMood: -10 } },
  { id: 'make_playoffs', label: 'Make the Playoffs',        layer: 'owner', reward: { ownerMood: 8, cash: 4 },   penalty: { ownerMood: -12 } },
  { id: 'win_division', label: 'Win the Division',          layer: 'owner', reward: { ownerMood: 8, cash: 3 },   penalty: { ownerMood: -8 } },
  { id: 'sell_tickets', label: '90+ Wins',                  layer: 'owner', reward: { ownerMood: 7, cash: 6 },   penalty: { ownerMood: -6 } },
  { id: 'develop_youth', label: 'Start 3+ Under-25 Players', layer: 'owner', reward: { ownerMood: 6 },           penalty: { ownerMood: -8 } },
  { id: 'stay_solvent', label: 'Finish Cash-Positive',      layer: 'owner', reward: { ownerMood: 5, cash: 5 },   penalty: { ownerMood: -10 } },
];

// ── Manager goal templates ──────────────────────────────────────────────────

export const MANAGER_GOALS: GoalTemplate[] = [
  { id: 'top10_offense', label: 'Top-10 in Runs Scored',    layer: 'manager', reward: { morale: 4, devBoost: 2 }, penalty: { morale: -2 } },
  { id: 'top10_pitching', label: 'Top-10 in Team ERA',      layer: 'manager', reward: { morale: 4, devBoost: 2 }, penalty: { morale: -2 } },
  { id: 'develop_rookie', label: 'Rookie Reaches 70+ OVR',  layer: 'manager', reward: { morale: 3, devBoost: 2 }, penalty: { devBoost: -1 } },
  { id: 'win_streak_7',  label: 'Win 7 Games in a Row',     layer: 'manager', reward: { morale: 6 },              penalty: { morale: -2 } },
  { id: 'no_shutouts',   label: 'Never Get Shut Out',       layer: 'manager', reward: { morale: 3 },              penalty: { morale: -3 } },
  { id: 'no_sweeps',     label: 'Never Get Swept in a Series', layer: 'manager', reward: { morale: 4 },           penalty: { morale: -2 } },
];

// ── Player goal templates ───────────────────────────────────────────────────

export const PLAYER_GOALS: GoalTemplate[] = [
  // Hitter goals
  { id: '30hr',       label: '30 Home Runs',          layer: 'player', positions: ['1B', '3B', 'LF', 'RF', 'DH', 'SS', 'CF'], stat: 'hr',    target: 30, compare: 'gte', reward: { morale: 8, devBoost: 1 }, penalty: { morale: -3 } },
  { id: '100rbi',     label: '100 RBI',               layer: 'player', positions: ['1B', '3B', 'LF', 'RF', 'DH', 'SS', 'CF'], stat: 'rbi',   target: 100, compare: 'gte', reward: { morale: 8, devBoost: 1 }, penalty: { morale: -3 } },
  { id: '30sb',       label: '30 Stolen Bases',       layer: 'player', positions: ['CF', 'SS', '2B', 'LF', 'RF'],              stat: 'sb',    target: 30, compare: 'gte', reward: { morale: 7 },              penalty: { morale: -2 } },
  { id: '180hits',    label: '180 Hits',              layer: 'player', positions: ['SS', '2B', 'CF', '1B', '3B', 'RF', 'LF'],  stat: 'hits',  target: 180, compare: 'gte', reward: { morale: 7, devBoost: 1 }, penalty: { morale: -2 } },
  { id: '90runs',     label: '90 Runs Scored',        layer: 'player', positions: ['SS', 'CF', '2B', 'LF', 'RF'],              stat: 'runs',  target: 90, compare: 'gte', reward: { morale: 6 },              penalty: { morale: -2 } },
  // Pitcher goals
  { id: '15wins',     label: '15 Wins',               layer: 'player', positions: ['SP'],                                       stat: 'wins',  target: 15, compare: 'gte', reward: { morale: 8, devBoost: 1 }, penalty: { morale: -3 } },
  { id: '200k',       label: '200 Strikeouts',        layer: 'player', positions: ['SP'],                                       stat: 'so',    target: 200, compare: 'gte', reward: { morale: 8, devBoost: 1 }, penalty: { morale: -3 } },
  { id: 'sub3era',    label: 'Sub-3.00 ERA',          layer: 'player', positions: ['SP'],                                       stat: 'era',   target: 3.0, compare: 'lte', reward: { morale: 9, devBoost: 2 }, penalty: { morale: -3 } },
  { id: '30saves',    label: '30 Saves',              layer: 'player', positions: ['RP', 'CL'],                                 stat: 'saves', target: 30, compare: 'gte', reward: { morale: 7, devBoost: 1 }, penalty: { morale: -3 } },
  // Catcher goal
  { id: 'gold_glove', label: 'Less Than 5 Errors',    layer: 'player', positions: ['C', 'SS', '2B'],                            stat: 'errors', target: 5, compare: 'lte', reward: { morale: 6 },              penalty: { morale: -2 } },
];

// ── Goal generation ─────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateOwnerGoals(ownerType: 'title' | 'playoff' | 'rebuild' = 'playoff'): ActiveGoal[] {
  const pool = OWNER_GOALS.filter(g => {
    if (ownerType === 'title') return ['win_ws', 'win_pennant', 'win_division'].includes(g.id);
    if (ownerType === 'rebuild') return ['develop_youth', 'stay_solvent', 'make_playoffs'].includes(g.id);
    return true;
  });
  return pickRandom(pool, 2).map(g => ({
    ...g, status: 'active' as GoalStatus, current: 0,
  }));
}

export function generateManagerGoals(): ActiveGoal[] {
  return pickRandom(MANAGER_GOALS, 2).map(g => ({
    ...g, status: 'active' as GoalStatus, current: 0,
  }));
}

export function generatePlayerGoals(roster: Array<{ id: number; name: string; position: string; overall: number }>): ActiveGoal[] {
  const eligible = roster.filter(p => p.overall >= 70).sort((a, b) => b.overall - a.overall).slice(0, 6);
  const goals: ActiveGoal[] = [];

  for (const player of eligible) {
    const pool = PLAYER_GOALS.filter(g => g.positions?.includes(player.position));
    if (pool.length === 0) continue;
    const goal = pool[Math.floor(Math.random() * pool.length)];
    goals.push({
      ...goal,
      status: 'active',
      current: 0,
      playerName: player.name,
      playerId: player.id,
    });
  }

  return goals;
}

// ── Summary ─────────────────────────────────────────────────────────────────

export function getGoalsSummary(goals: ActiveGoal[]) {
  return {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    failed: goals.filter(g => g.status === 'failed').length,
    ownerGoals: goals.filter(g => g.layer === 'owner').length,
    managerGoals: goals.filter(g => g.layer === 'manager').length,
    playerGoals: goals.filter(g => g.layer === 'player').length,
  };
}

export const LAYER_DISPLAY: Record<GoalLayer, { label: string; color: string; icon: string }> = {
  owner:   { label: 'OWNER',   color: '#eab308', icon: '👔' },
  manager: { label: 'MANAGER', color: '#3b82f6', icon: '📋' },
  player:  { label: 'PLAYER',  color: '#22c55e', icon: '⚾' },
};
