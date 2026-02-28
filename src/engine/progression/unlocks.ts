/**
 * Progressive Unlock System
 *
 * Features and tabs unlock as the player reaches milestones:
 * season count, playoff appearances, championships, win totals, etc.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type UnlockId = 'analytics' | 'scouting' | 'warRoom' | 'legacy' | 'dynasty' | 'international';

export type TriggerType = 'season' | 'playoffs' | 'championship' | 'wins' | 'allstar' | 'trades';

export interface UnlockDef {
  id: UnlockId;
  label: string;
  emoji: string;
  desc: string;
  trigger: TriggerType;
  triggerValue: number;
  triggerDesc: string;
  tabs: string[];
  toast: string;
  color: string;
}

export const UNLOCK_DEFS: UnlockDef[] = [
  {
    id: 'analytics', label: 'Analytics Lab', emoji: '📊',
    desc: 'Advanced sabermetrics and predictive models',
    trigger: 'season', triggerValue: 1,
    triggerDesc: 'Complete 1 season',
    tabs: ['analytics', 'dynasty', 'platoons'],
    toast: 'Analytics Lab unlocked: Advanced stats & dynasty metrics are live.',
    color: '#3b82f6',
  },
  {
    id: 'scouting', label: 'Scouting Department', emoji: '🔍',
    desc: 'International scouting and prospect intel',
    trigger: 'season', triggerValue: 2,
    triggerDesc: 'Complete 2 seasons',
    tabs: ['scoutingboard', 'draftscout', 'scoutnetwork'],
    toast: 'Scouting Department unlocked: Full prospect intel is operational.',
    color: '#22c55e',
  },
  {
    id: 'warRoom', label: 'War Room', emoji: '🎖️',
    desc: 'Trade deadline frenzy and deadline analytics',
    trigger: 'playoffs', triggerValue: 1,
    triggerDesc: 'Make the playoffs',
    tabs: ['tradefinder', 'traderumors', 'deadline'],
    toast: 'War Room unlocked: Trade deadline tools activated.',
    color: '#f97316',
  },
  {
    id: 'international', label: 'International Operations', emoji: '🌍',
    desc: 'International free agent market and J-League scouting',
    trigger: 'wins', triggerValue: 250,
    triggerDesc: 'Win 250 total games',
    tabs: ['intl'],
    toast: 'International Ops unlocked: Global talent pipeline is open.',
    color: '#8b5cf6',
  },
  {
    id: 'legacy', label: 'Legacy Wing', emoji: '🏛️',
    desc: 'Hall of Fame, all-time records, and franchise history',
    trigger: 'season', triggerValue: 5,
    triggerDesc: 'Complete 5 seasons',
    tabs: ['records', 'ringofhonor', 'alltimerecords', 'legacy'],
    toast: 'Legacy Wing unlocked: Your franchise history is taking shape.',
    color: '#eab308',
  },
  {
    id: 'dynasty', label: 'Dynasty Status', emoji: '👑',
    desc: 'Dynasty analytics and franchise prestige tools',
    trigger: 'championship', triggerValue: 1,
    triggerDesc: 'Win a World Series',
    tabs: ['franchise'],
    toast: 'Dynasty Status unlocked: You\'ve earned your place in history.',
    color: '#ef4444',
  },
];

export interface UnlockState {
  unlocked: Record<UnlockId, boolean>;
  seasonsPlayed: number;
  playoffAppearances: number;
  championships: number;
  totalWins: number;
  allStarSelections: number;
  tradesCompleted: number;
  recentUnlock: UnlockDef | null;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function initUnlockState(): UnlockState {
  return {
    unlocked: { analytics: false, scouting: false, warRoom: false, legacy: false, dynasty: false, international: false },
    seasonsPlayed: 0, playoffAppearances: 0, championships: 0,
    totalWins: 0, allStarSelections: 0, tradesCompleted: 0,
    recentUnlock: null,
  };
}

function getTriggerProgress(state: UnlockState, def: UnlockDef): { current: number; target: number } {
  switch (def.trigger) {
    case 'season': return { current: state.seasonsPlayed, target: def.triggerValue };
    case 'playoffs': return { current: state.playoffAppearances, target: def.triggerValue };
    case 'championship': return { current: state.championships, target: def.triggerValue };
    case 'wins': return { current: state.totalWins, target: def.triggerValue };
    case 'allstar': return { current: state.allStarSelections, target: def.triggerValue };
    case 'trades': return { current: state.tradesCompleted, target: def.triggerValue };
  }
}

export function checkUnlocks(state: UnlockState): UnlockState {
  const next = { ...state, unlocked: { ...state.unlocked }, recentUnlock: null };

  for (const def of UNLOCK_DEFS) {
    if (next.unlocked[def.id]) continue;
    const prog = getTriggerProgress(next, def);
    if (prog.current >= prog.target) {
      next.unlocked[def.id] = true;
      next.recentUnlock = def;
    }
  }

  return next;
}

export function getUnlockProgress(state: UnlockState): Array<{ def: UnlockDef; unlocked: boolean; progress: number; current: number; target: number }> {
  return UNLOCK_DEFS.map(def => {
    const prog = getTriggerProgress(state, def);
    return {
      def,
      unlocked: state.unlocked[def.id],
      progress: Math.min(100, Math.round((prog.current / prog.target) * 100)),
      current: prog.current,
      target: prog.target,
    };
  });
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoUnlockState(): UnlockState {
  return {
    unlocked: { analytics: true, scouting: true, warRoom: false, legacy: false, dynasty: false, international: false },
    seasonsPlayed: 3,
    playoffAppearances: 0,
    championships: 0,
    totalWins: 198,
    allStarSelections: 4,
    tradesCompleted: 12,
    recentUnlock: UNLOCK_DEFS[1], // scouting was most recent
  };
}
