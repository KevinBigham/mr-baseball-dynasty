import { describe, it, expect } from 'vitest';
import { buildDials, buildStoryThreads, buildActionQueue, buildDigest, buildCoachSteps, GLOSSARY } from '../../src/utils/briefingAdapter';
import type { RosterData, StandingsRow, RosterPlayer } from '../../src/types/league';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<RosterPlayer> = {}): RosterPlayer {
  return {
    playerId: 1, name: 'Test Player', position: 'SS', age: 25,
    bats: 'R', throws: 'R', isPitcher: false, overall: 70, potential: 75,
    rosterStatus: 'active', isOn40Man: true, optionYearsRemaining: 2,
    serviceTimeDays: 100, salary: 500000, contractYearsRemaining: 3,
    stats: {},
    ...overrides,
  };
}

function makeRoster(overrides: Partial<RosterData> = {}): RosterData {
  const active = overrides.active ?? Array.from({ length: 26 }, (_, i) =>
    makePlayer({ playerId: i + 1, name: `Player ${i + 1}` })
  );
  return {
    teamId: 1, season: 2026,
    active,
    il: overrides.il ?? [],
    minors: overrides.minors ?? [],
    dfa: overrides.dfa ?? [],
  };
}

function makeStandingsRow(overrides: Partial<StandingsRow> = {}): StandingsRow {
  return {
    teamId: 1, name: 'Test Team', abbreviation: 'TST',
    league: 'AL', division: 'East',
    wins: 50, losses: 40, pct: 0.556, gb: 0,
    runsScored: 400, runsAllowed: 350, pythagWins: 52,
    ...overrides,
  };
}

// ─── buildDials ─────────────────────────────────────────────────────────────

describe('buildDials', () => {
  it('returns exactly 5 dials', () => {
    const dials = buildDials({
      ownerPatience: 70, teamMorale: 60, scoutingQuality: 0.6,
      roster: null, standings: null, userTeamId: 1, gamePhase: 'preseason',
    });
    expect(dials).toHaveLength(5);
  });

  it('tags contention as unavailable when no standings', () => {
    const dials = buildDials({
      ownerPatience: 70, teamMorale: 60, scoutingQuality: 0.6,
      roster: null, standings: null, userTeamId: 1, gamePhase: 'preseason',
    });
    const contention = dials.find(d => d.id === 'contention')!;
    expect(contention.source).toBe('unavailable');
    expect(contention.status).toBe('NO DATA YET');
  });

  it('tags contention as real when standings exist', () => {
    const standings = [makeStandingsRow({ teamId: 1, pct: 0.600, gb: 0, wins: 60, losses: 40 })];
    const dials = buildDials({
      ownerPatience: 70, teamMorale: 60, scoutingQuality: 0.6,
      roster: null, standings, userTeamId: 1, gamePhase: 'in_season',
    });
    const contention = dials.find(d => d.id === 'contention')!;
    expect(contention.source).toBe('real');
    expect(contention.status).not.toBe('NO DATA YET');
  });

  it('tags owner patience as real', () => {
    const dials = buildDials({
      ownerPatience: 50, teamMorale: 60, scoutingQuality: 0.6,
      roster: null, standings: null, userTeamId: 1, gamePhase: 'preseason',
    });
    const owner = dials.find(d => d.id === 'owner')!;
    expect(owner.source).toBe('real');
    expect(owner.value).toBe(50);
  });

  it('tags market heat as heuristic', () => {
    const dials = buildDials({
      ownerPatience: 70, teamMorale: 60, scoutingQuality: 0.6,
      roster: null, standings: null, userTeamId: 1, gamePhase: 'offseason',
    });
    const market = dials.find(d => d.id === 'market')!;
    expect(market.source).toBe('heuristic');
  });

  it('tags scouting as heuristic when using default 0.6', () => {
    const dials = buildDials({
      ownerPatience: 70, teamMorale: 60, scoutingQuality: 0.6,
      roster: null, standings: null, userTeamId: 1, gamePhase: 'preseason',
    });
    const scouting = dials.find(d => d.id === 'scouting')!;
    expect(scouting.source).toBe('heuristic');
    expect(scouting.status).toBe('LIMITED');
  });

  it('tags clubhouse temperature as real', () => {
    const dials = buildDials({
      ownerPatience: 70, teamMorale: 80, scoutingQuality: 0.6,
      roster: null, standings: null, userTeamId: 1, gamePhase: 'preseason',
    });
    const clubhouse = dials.find(d => d.id === 'clubhouse')!;
    expect(clubhouse.source).toBe('real');
    expect(clubhouse.value).toBe(80);
  });

  it('all dials have sourceNote', () => {
    const dials = buildDials({
      ownerPatience: 70, teamMorale: 60, scoutingQuality: 0.6,
      roster: null, standings: null, userTeamId: 1, gamePhase: 'preseason',
    });
    for (const dial of dials) {
      expect(dial.sourceNote).toBeTruthy();
    }
  });
});

// ─── buildStoryThreads ─────────────────────────────────────────────────────

describe('buildStoryThreads', () => {
  const baseOpts = {
    ownerPatience: 70, teamMorale: 60, ownerArchetype: 'win_now' as const,
    roster: makeRoster(), standings: null, userTeamId: 1,
    gamePhase: 'preseason' as const, seasonPhase: 'early' as const,
    seasonsManaged: 0, franchiseHistory: [],
  };

  it('returns null urgent when no problems exist', () => {
    const threads = buildStoryThreads(baseOpts);
    expect(threads.urgent).toBeNull();
  });

  it('fires urgent on low owner patience', () => {
    const threads = buildStoryThreads({ ...baseOpts, ownerPatience: 20 });
    expect(threads.urgent).not.toBeNull();
    expect(threads.urgent!.title).toContain('Owner Patience');
    expect(threads.urgent!.actionTab).toBe('roster');
  });

  it('fires urgent on roster over limit', () => {
    const overRoster = makeRoster({
      active: Array.from({ length: 28 }, (_, i) =>
        makePlayer({ playerId: i + 1, name: `Player ${i + 1}` })
      ),
    });
    const threads = buildStoryThreads({ ...baseOpts, roster: overRoster });
    expect(threads.urgent!.title).toContain('Over Limit');
  });

  it('fires urgent on roster below minimum', () => {
    const shortRoster = makeRoster({
      active: Array.from({ length: 23 }, (_, i) =>
        makePlayer({ playerId: i + 1, name: `Player ${i + 1}` })
      ),
    });
    const threads = buildStoryThreads({ ...baseOpts, roster: shortRoster });
    expect(threads.urgent!.title).toContain('Short');
  });

  it('fires urgent on DFA pending', () => {
    const dfaRoster = makeRoster({
      dfa: [makePlayer({ playerId: 99, name: 'DFA Guy' })],
    });
    const threads = buildStoryThreads({ ...baseOpts, roster: dfaRoster });
    expect(threads.urgent!.title).toContain('DFA');
  });

  it('fires urgent on low morale', () => {
    const threads = buildStoryThreads({ ...baseOpts, teamMorale: 25 });
    expect(threads.urgent!.title).toContain('Morale');
  });

  it('provides mystery for prospect breakout', () => {
    const prospectRoster = makeRoster({
      minors: [makePlayer({ name: 'Hot Prospect', overall: 50, potential: 80 })],
    });
    const threads = buildStoryThreads({ ...baseOpts, roster: prospectRoster });
    expect(threads.mystery!.title).toContain('Hot Prospect');
  });

  it('provides mystery for tight division race (chasing)', () => {
    const standings = [
      makeStandingsRow({ teamId: 1, gb: 2, wins: 48, losses: 42 }),
      makeStandingsRow({ teamId: 2, gb: 0, wins: 50, losses: 40 }),
    ];
    const threads = buildStoryThreads({ ...baseOpts, standings, roster: makeRoster({ minors: [] }) });
    expect(threads.mystery!.title).toContain('Catch');
  });

  it('provides fallback mystery with honest routing', () => {
    const threads = buildStoryThreads({ ...baseOpts, roster: makeRoster({ minors: [] }) });
    expect(threads.mystery).not.toBeNull();
    // First season routes to roster, not finance
    expect(threads.mystery!.actionTab).toBe('roster');
  });

  it('provides long arc from franchise history (champion)', () => {
    const threads = buildStoryThreads({
      ...baseOpts,
      franchiseHistory: [{ playoffResult: 'Champion', wins: 95, losses: 67, season: 2025 } as any],
    });
    expect(threads.longArc!.title).toContain('Defending');
  });

  it('provides fallback long arc when no history', () => {
    const threads = buildStoryThreads(baseOpts);
    expect(threads.longArc).not.toBeNull();
    expect(threads.longArc!.title).toContain('Write the Next Chapter');
  });

  it('always returns mystery and longArc (never null)', () => {
    const threads = buildStoryThreads(baseOpts);
    expect(threads.mystery).not.toBeNull();
    expect(threads.longArc).not.toBeNull();
  });

  it('urgent actions never route to unreliable surfaces', () => {
    // Test all urgent scenarios route to 'roster' or 'standings', not 'finance' or 'analytics'
    const scenarios = [
      { ...baseOpts, ownerPatience: 20 },
      { ...baseOpts, teamMorale: 25 },
      { ...baseOpts, roster: makeRoster({ active: Array.from({ length: 28 }, (_, i) => makePlayer({ playerId: i })) }) },
      { ...baseOpts, roster: makeRoster({ dfa: [makePlayer()] }) },
    ];
    for (const scenario of scenarios) {
      const threads = buildStoryThreads(scenario);
      if (threads.urgent) {
        expect(['roster', 'standings']).toContain(threads.urgent.actionTab);
      }
    }
  });
});

// ─── buildActionQueue ───────────────────────────────────────────────────────

describe('buildActionQueue', () => {
  const baseOpts = {
    roster: makeRoster(), ownerPatience: 70,
    gamePhase: 'in_season' as const, seasonPhase: 'early' as const, teamMorale: 60,
  };

  it('returns empty array when everything is fine', () => {
    const tasks = buildActionQueue(baseOpts);
    expect(tasks).toHaveLength(0);
  });

  it('detects roster over limit', () => {
    const tasks = buildActionQueue({
      ...baseOpts,
      roster: makeRoster({
        active: Array.from({ length: 28 }, (_, i) => makePlayer({ playerId: i })),
      }),
    });
    expect(tasks.some(t => t.title === 'ROSTER OVER LIMIT')).toBe(true);
    expect(tasks[0].priority).toBe('critical');
    expect(tasks[0].deadline).toBe('Before next sim');
  });

  it('detects roster below minimum', () => {
    const tasks = buildActionQueue({
      ...baseOpts,
      roster: makeRoster({
        active: Array.from({ length: 23 }, (_, i) => makePlayer({ playerId: i })),
      }),
    });
    expect(tasks.some(t => t.title === 'ROSTER BELOW MINIMUM')).toBe(true);
  });

  it('detects IL returns', () => {
    const tasks = buildActionQueue({
      ...baseOpts,
      roster: makeRoster({
        il: [makePlayer({ name: 'Hurt Guy', injuryInfo: { type: 'Hamstring', severity: 'minor', daysRemaining: 2, description: 'Hamstring strain' } })],
      }),
    });
    expect(tasks.some(t => t.title.includes('Hurt Guy'))).toBe(true);
  });

  it('detects prospect pressure', () => {
    const tasks = buildActionQueue({
      ...baseOpts,
      roster: makeRoster({
        minors: [makePlayer({ name: 'Young Star', overall: 60, age: 22 })],
      }),
    });
    expect(tasks.some(t => t.title.includes('Young Star'))).toBe(true);
  });

  it('detects DFA pending', () => {
    const tasks = buildActionQueue({
      ...baseOpts,
      roster: makeRoster({
        dfa: [makePlayer({ name: 'DFA Man' })],
      }),
    });
    expect(tasks.some(t => t.title.includes('DFA'))).toBe(true);
  });

  it('detects low owner patience', () => {
    const tasks = buildActionQueue({ ...baseOpts, ownerPatience: 10 });
    expect(tasks.some(t => t.title === 'OWNER PATIENCE WARNING')).toBe(true);
    expect(tasks.find(t => t.title === 'OWNER PATIENCE WARNING')!.priority).toBe('critical');
  });

  it('detects low morale', () => {
    const tasks = buildActionQueue({ ...baseOpts, teamMorale: 30 });
    expect(tasks.some(t => t.title === 'LOW CLUBHOUSE MORALE')).toBe(true);
  });

  it('shows offseason tasks in offseason', () => {
    const tasks = buildActionQueue({ ...baseOpts, gamePhase: 'offseason' });
    expect(tasks.some(t => t.title === 'OFFSEASON MOVES AVAILABLE')).toBe(true);
  });

  it('sorts by priority (critical first)', () => {
    const tasks = buildActionQueue({
      ...baseOpts,
      ownerPatience: 10,
      teamMorale: 30,
      roster: makeRoster({
        active: Array.from({ length: 28 }, (_, i) => makePlayer({ playerId: i })),
      }),
    });
    expect(tasks.length).toBeGreaterThanOrEqual(2);
    expect(tasks[0].priority).toBe('critical');
  });

  it('returns no tasks for null roster', () => {
    const tasks = buildActionQueue({ ...baseOpts, roster: null });
    // Only non-roster tasks (owner, morale, offseason) possible
    expect(tasks.every(t => t.category !== 'roster_illegality')).toBe(true);
  });
});

// ─── buildDigest ────────────────────────────────────────────────────────────

describe('buildDigest', () => {
  const baseOpts = {
    standings: null, userTeamId: 1, roster: null,
    ownerPatience: 70, teamMorale: 60, gamePhase: 'preseason' as const,
    newsItems: [],
  };

  it('returns front office pulse even with no data', () => {
    const blocks = buildDigest(baseOpts);
    expect(blocks.some(b => b.section === 'FRONT OFFICE PULSE')).toBe(true);
  });

  it('omits standings when no standings data', () => {
    const blocks = buildDigest(baseOpts);
    expect(blocks.some(b => b.section === 'STANDINGS')).toBe(false);
  });

  it('includes standings when data exists', () => {
    const standings = [makeStandingsRow({ teamId: 1 })];
    const blocks = buildDigest({ ...baseOpts, standings });
    expect(blocks.some(b => b.section === 'STANDINGS')).toBe(true);
  });

  it('includes injury report when IL has players', () => {
    const roster = makeRoster({
      il: [makePlayer({ name: 'Hurt', injuryInfo: { type: 'Knee', severity: 'major', daysRemaining: 14, description: 'Knee sprain' } })],
    });
    const blocks = buildDigest({ ...baseOpts, roster });
    expect(blocks.some(b => b.section === 'INJURY REPORT')).toBe(true);
  });

  it('omits injury report when no IL players', () => {
    const roster = makeRoster({ il: [] });
    const blocks = buildDigest({ ...baseOpts, roster });
    expect(blocks.some(b => b.section === 'INJURY REPORT')).toBe(false);
  });

  it('includes roster depth when roster exists', () => {
    const roster = makeRoster();
    const blocks = buildDigest({ ...baseOpts, roster });
    expect(blocks.some(b => b.section === 'ROSTER DEPTH')).toBe(true);
  });

  it('includes headlines when news items exist', () => {
    const blocks = buildDigest({
      ...baseOpts,
      newsItems: [{ headline: 'Big Trade!', icon: '📰', type: 'trade' }],
    });
    expect(blocks.some(b => b.section === 'HEADLINES')).toBe(true);
  });

  it('omits headlines when no news', () => {
    const blocks = buildDigest(baseOpts);
    expect(blocks.some(b => b.section === 'HEADLINES')).toBe(false);
  });

  it('roster depth shows DFA count when DFA players exist', () => {
    const roster = makeRoster({ dfa: [makePlayer()] });
    const blocks = buildDigest({ ...baseOpts, roster });
    const depth = blocks.find(b => b.section === 'ROSTER DEPTH')!;
    expect(depth.entries.some(e => e.label === 'DFA Pending')).toBe(true);
  });
});

// ─── buildCoachSteps ────────────────────────────────────────────────────────

describe('buildCoachSteps', () => {
  it('returns 4 steps for first-season player', () => {
    const steps = buildCoachSteps({
      gamePhase: 'preseason', seasonsManaged: 0,
      roster: null, standings: null,
    });
    expect(steps).toHaveLength(4);
  });

  it('returns empty for experienced player', () => {
    const steps = buildCoachSteps({
      gamePhase: 'preseason', seasonsManaged: 1,
      roster: null, standings: null,
    });
    expect(steps).toHaveLength(0);
  });

  it('marks roster step complete when roster data exists', () => {
    const steps = buildCoachSteps({
      gamePhase: 'preseason', seasonsManaged: 0,
      roster: makeRoster(), standings: null,
    });
    const rosterStep = steps.find(s => s.id === 'review-roster')!;
    expect(rosterStep.completed).toBe(true);
  });

  it('marks standings step complete when standings data exists', () => {
    const steps = buildCoachSteps({
      gamePhase: 'preseason', seasonsManaged: 0,
      roster: null, standings: [makeStandingsRow()],
    });
    const standingsStep = steps.find(s => s.id === 'check-standings')!;
    expect(standingsStep.completed).toBe(true);
  });

  it('marks season start step complete when in season', () => {
    const steps = buildCoachSteps({
      gamePhase: 'in_season', seasonsManaged: 0,
      roster: null, standings: null,
    });
    const simStep = steps.find(s => s.id === 'first-sim')!;
    expect(simStep.completed).toBe(true);
  });

  it('roster move step is always incomplete (no tracking)', () => {
    const steps = buildCoachSteps({
      gamePhase: 'in_season', seasonsManaged: 0,
      roster: makeRoster(), standings: [makeStandingsRow()],
    });
    const moveStep = steps.find(s => s.id === 'make-a-move')!;
    expect(moveStep.completed).toBe(false);
  });

  it('all steps have actionTab set', () => {
    const steps = buildCoachSteps({
      gamePhase: 'preseason', seasonsManaged: 0,
      roster: null, standings: null,
    });
    for (const step of steps) {
      expect(step.actionTab).toBeTruthy();
    }
  });

  it('no step routes to finance tab', () => {
    const steps = buildCoachSteps({
      gamePhase: 'preseason', seasonsManaged: 0,
      roster: null, standings: null,
    });
    for (const step of steps) {
      expect(step.actionTab).not.toBe('finance');
    }
  });
});

// ─── GLOSSARY ───────────────────────────────────────────────────────────────

describe('GLOSSARY', () => {
  it('contains expected core terms', () => {
    const expectedTerms = ['40-man', 'dfa', 'option', 'owner patience', 'contention confidence', 'market heat'];
    for (const term of expectedTerms) {
      expect(GLOSSARY[term]).toBeTruthy();
    }
  });

  it('all values are non-empty strings', () => {
    for (const [, value] of Object.entries(GLOSSARY)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
