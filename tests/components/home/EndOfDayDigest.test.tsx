import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EndOfDayDigest from '../../../src/components/home/EndOfDayDigest';

// ─── Mutable store state ────────────────────────────────────────────────────

let gameStoreState = {
  userTeamId: 1, ownerPatience: 70, teamMorale: 60, gamePhase: 'preseason' as string,
};

let leagueStoreState = {
  standings: null as any,
  roster: null as any,
  newsItems: [] as any[],
  teamChemistry: null as any,
  clubhouseEvents: [] as any[],
};

vi.mock('../../../src/store/gameStore', () => ({
  useGameStore: () => gameStoreState,
}));

vi.mock('../../../src/store/leagueStore', () => ({
  useLeagueStore: () => leagueStoreState,
}));

vi.mock('../../../src/components/home/DigestSection', () => ({
  default: ({ block }: any) => (
    <div data-testid={`digest-${block.section.toLowerCase().replace(/ /g, '-')}`}>
      {block.section}
    </div>
  ),
}));

describe('EndOfDayDigest', () => {
  beforeEach(() => {
    gameStoreState = { userTeamId: 1, ownerPatience: 70, teamMorale: 60, gamePhase: 'preseason' };
    leagueStoreState = { standings: null, roster: null, newsItems: [], teamChemistry: null, clubhouseEvents: [] };
  });

  it('renders front office pulse even with no standings or roster', () => {
    // buildDigest always produces FRONT OFFICE PULSE (owner patience + morale)
    render(<EndOfDayDigest />);
    expect(screen.getByText('FRONT OFFICE PULSE')).toBeTruthy();
  });

  it('always shows recommended next action', () => {
    render(<EndOfDayDigest />);
    expect(screen.getByText('RECOMMENDED NEXT')).toBeTruthy();
  });

  it('shows preseason recommended action', () => {
    render(<EndOfDayDigest />);
    expect(screen.getByText(/Review your roster/)).toBeTruthy();
  });

  it('shows in-season recommended action', () => {
    gameStoreState.gamePhase = 'in_season';
    render(<EndOfDayDigest />);
    expect(screen.getByText(/Simulate the next series/)).toBeTruthy();
  });

  it('shows offseason recommended action', () => {
    gameStoreState.gamePhase = 'offseason';
    render(<EndOfDayDigest />);
    expect(screen.getByText(/free agency/i)).toBeTruthy();
  });

  it('shows fired recommended action', () => {
    gameStoreState.gamePhase = 'fired';
    render(<EndOfDayDigest />);
    expect(screen.getByText(/tenure has ended/)).toBeTruthy();
  });

  it('renders front office pulse block even with minimal data', () => {
    leagueStoreState.roster = {
      teamId: 1, season: 2026,
      active: Array.from({ length: 26 }, (_, i) => ({
        playerId: i, name: `P${i}`, position: 'SS', age: 25,
        bats: 'R', throws: 'R', isPitcher: false, overall: 70, potential: 75,
        rosterStatus: 'active', isOn40Man: true, optionYearsRemaining: 2,
        serviceTimeDays: 100, salary: 500000, contractYearsRemaining: 3,
      })),
      il: [], minors: [], dfa: [],
    };
    render(<EndOfDayDigest />);
    // Should render at least roster depth + front office pulse
    expect(screen.getByText('ROSTER DEPTH')).toBeTruthy();
    expect(screen.getByText('FRONT OFFICE PULSE')).toBeTruthy();
  });

  it('renders standings block when standings exist', () => {
    leagueStoreState.standings = {
      season: 2026,
      standings: [{
        teamId: 1, name: 'Test', abbreviation: 'TST',
        league: 'AL', division: 'East',
        wins: 50, losses: 40, pct: 0.556, gb: 0,
        runsScored: 400, runsAllowed: 350, pythagWins: 52,
      }],
    };
    render(<EndOfDayDigest />);
    expect(screen.getByText('STANDINGS')).toBeTruthy();
  });

  it('renders headlines when news items exist', () => {
    leagueStoreState.newsItems = [
      { headline: 'Big Trade', icon: '📰', type: 'trade' },
    ];
    render(<EndOfDayDigest />);
    expect(screen.getByText('HEADLINES')).toBeTruthy();
  });

  it('renders clubhouse notes when events exist', () => {
    leagueStoreState.teamChemistry = { teamId: 1, cohesion: 80, morale: 68, lastUpdatedSeason: 2026 };
    leagueStoreState.clubhouseEvents = [{
      eventId: 1,
      teamId: 1,
      season: 2026,
      kind: 'leadership_emergence',
      description: 'Veteran leaders have rallied the clubhouse. Team cohesion is rising.',
    }];
    render(<EndOfDayDigest />);
    expect(screen.getByText('CLUBHOUSE NOTES')).toBeTruthy();
  });
});
