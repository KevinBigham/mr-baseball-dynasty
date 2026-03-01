import { describe, it, expect, beforeEach } from 'vitest';
import { useLeagueStore, generateKeyMoment, type SeasonSummary } from '../../src/store/leagueStore';

function makeSummary(overrides: Partial<SeasonSummary> = {}): SeasonSummary {
  return {
    season: 2026,
    wins: 85,
    losses: 77,
    pct: 0.525,
    playoffResult: null,
    awardsWon: [],
    breakoutHits: 0,
    ownerPatienceEnd: 70,
    teamMoraleEnd: 65,
    leagueERA: 4.00,
    leagueBA: 0.250,
    keyMoment: 'A season to remember.',
    ...overrides,
  };
}

// ─── generateKeyMoment ───────────────────────────────────────────────────────

describe('generateKeyMoment — narrative generation', () => {
  it('returns champion text for Champion result', () => {
    const moment = generateKeyMoment(makeSummary({ playoffResult: 'Champion' }));
    expect(moment).toContain('World Series Champions');
  });

  it('returns WS text for WS result', () => {
    const moment = generateKeyMoment(makeSummary({ playoffResult: 'WS' }));
    expect(moment).toContain('World Series appearance');
  });

  it('returns CS text for CS result', () => {
    const moment = generateKeyMoment(makeSummary({ playoffResult: 'CS' }));
    expect(moment).toContain('Championship Series');
  });

  it('returns DS text for DS result', () => {
    const moment = generateKeyMoment(makeSummary({ playoffResult: 'DS' }));
    expect(moment).toContain('Division Series');
  });

  it('returns WC text for WC result', () => {
    const moment = generateKeyMoment(makeSummary({ playoffResult: 'WC' }));
    expect(moment).toContain('Wild Card');
  });

  it('returns dominant season text for 95+ wins no playoffs', () => {
    const moment = generateKeyMoment(makeSummary({ wins: 98, losses: 64, playoffResult: null }));
    expect(moment).toContain('98 wins');
    expect(moment).toContain('dominant');
  });

  it('returns winning season text for 85–94 wins', () => {
    const moment = generateKeyMoment(makeSummary({ wins: 88, losses: 74, playoffResult: null }));
    expect(moment).toContain('88-74');
  });

  it('returns middling text for 75–84 wins', () => {
    const moment = generateKeyMoment(makeSummary({ wins: 78, losses: 84, playoffResult: null }));
    expect(moment).toContain('middling');
  });

  it('returns rebuild text for 65–74 wins', () => {
    const moment = generateKeyMoment(makeSummary({ wins: 68, losses: 94, playoffResult: null }));
    expect(moment).toContain('rebuild');
  });

  it('returns lost season text for <65 wins', () => {
    const moment = generateKeyMoment(makeSummary({ wins: 55, losses: 107, playoffResult: null }));
    expect(moment).toContain('lost season');
  });
});

// ─── leagueStore state management ─────────────────────────────────────────────

describe('leagueStore — addSeasonSummary', () => {
  beforeEach(() => {
    useLeagueStore.getState().resetAll();
  });

  it('adds a season summary', () => {
    useLeagueStore.getState().addSeasonSummary(makeSummary({ season: 2026 }));
    expect(useLeagueStore.getState().franchiseHistory).toHaveLength(1);
    expect(useLeagueStore.getState().franchiseHistory[0].season).toBe(2026);
  });

  it('prepends new summaries (newest first)', () => {
    useLeagueStore.getState().addSeasonSummary(makeSummary({ season: 2026 }));
    useLeagueStore.getState().addSeasonSummary(makeSummary({ season: 2027 }));
    expect(useLeagueStore.getState().franchiseHistory[0].season).toBe(2027);
    expect(useLeagueStore.getState().franchiseHistory[1].season).toBe(2026);
  });

  it('caps franchise history at 30 entries', () => {
    for (let i = 0; i < 35; i++) {
      useLeagueStore.getState().addSeasonSummary(makeSummary({ season: 2026 + i }));
    }
    expect(useLeagueStore.getState().franchiseHistory).toHaveLength(30);
    // Most recent should be the latest added
    expect(useLeagueStore.getState().franchiseHistory[0].season).toBe(2060);
  });
});

describe('leagueStore — addNewsItems', () => {
  beforeEach(() => {
    useLeagueStore.getState().resetAll();
  });

  it('adds news items', () => {
    useLeagueStore.getState().addNewsItems([
      { id: '1', headline: 'Test News', body: 'Body', type: 'league', icon: '📰', priority: 3, season: 2026 },
    ]);
    expect(useLeagueStore.getState().newsItems).toHaveLength(1);
  });

  it('prepends new items (newest first)', () => {
    useLeagueStore.getState().addNewsItems([
      { id: '1', headline: 'First', body: '', type: 'league', icon: '📰', priority: 3, season: 2026 },
    ]);
    useLeagueStore.getState().addNewsItems([
      { id: '2', headline: 'Second', body: '', type: 'league', icon: '📰', priority: 3, season: 2026 },
    ]);
    expect(useLeagueStore.getState().newsItems[0].headline).toBe('Second');
  });

  it('caps news items at 50', () => {
    for (let i = 0; i < 55; i++) {
      useLeagueStore.getState().addNewsItems([
        { id: `${i}`, headline: `News ${i}`, body: '', type: 'league', icon: '📰', priority: 3, season: 2026 },
      ]);
    }
    expect(useLeagueStore.getState().newsItems).toHaveLength(50);
  });
});

describe('leagueStore — trade history', () => {
  beforeEach(() => {
    useLeagueStore.getState().resetAll();
  });

  it('adds trade records', () => {
    useLeagueStore.getState().addTradeRecord({
      season: 2026,
      partnerTeamAbbr: 'NYY',
      sent: ['Player A'],
      received: ['Player B'],
      type: 'incoming',
    });
    expect(useLeagueStore.getState().tradeHistory).toHaveLength(1);
  });

  it('caps trade history at 50', () => {
    for (let i = 0; i < 55; i++) {
      useLeagueStore.getState().addTradeRecord({
        season: 2026,
        partnerTeamAbbr: 'NYY',
        sent: [`Player ${i}`],
        received: ['Player B'],
        type: 'incoming',
      });
    }
    expect(useLeagueStore.getState().tradeHistory).toHaveLength(50);
  });
});

describe('leagueStore — resetAll', () => {
  it('resets all state to defaults', () => {
    useLeagueStore.getState().addSeasonSummary(makeSummary());
    useLeagueStore.getState().addNewsItems([
      { id: '1', headline: 'Test', body: '', type: 'league', icon: '📰', priority: 3, season: 2026 },
    ]);
    useLeagueStore.getState().setPresserAvailable(true);
    useLeagueStore.getState().setLastSeasonStats(3.5, 0.260, 4.5);

    useLeagueStore.getState().resetAll();

    const state = useLeagueStore.getState();
    expect(state.franchiseHistory).toHaveLength(0);
    expect(state.newsItems).toHaveLength(0);
    expect(state.presserAvailable).toBe(false);
    expect(state.lastSeasonERA).toBe(0);
    expect(state.standings).toBeNull();
    expect(state.roster).toBeNull();
  });
});

describe('leagueStore — poach event resolution', () => {
  beforeEach(() => {
    useLeagueStore.getState().resetAll();
  });

  it('resolves poach event with let_go decision', () => {
    const event = {
      id: 'poach-1',
      staffMember: {
        id: 'scout-1', roleId: 'scout_dir' as const, name: 'Test Scout',
        ovr: 70, salary: 2, yearsLeft: 3, traitId: 'analytical' as const,
        backstory: 'Test', icon: '🔍', title: 'Scout Director', color: 'blue', tier: 'core' as const,
      },
      suitingTeam: 'NYY',
      offerTitle: 'GM',
      offerYears: 3,
      resolved: false,
      decision: null as 'let_go' | 'block' | null,
    };
    useLeagueStore.getState().setPoachEvent(event);
    useLeagueStore.getState().resolvePoachEvent('let_go');

    const resolved = useLeagueStore.getState().poachEvent;
    expect(resolved?.resolved).toBe(true);
    expect(resolved?.decision).toBe('let_go');
  });
});
