import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FrontOfficeBriefing from '../../../src/components/home/FrontOfficeBriefing';

// ─── Store mocks ────────────────────────────────────────────────────────────

const mockGameStore = {
  season: 2026, userTeamId: 1, ownerPatience: 70, ownerArchetype: 'win_now',
  teamMorale: 60, gamePhase: 'preseason', seasonPhase: 'early', seasonsManaged: 0,
};

const mockLeagueStore = {
  standings: null,
  roster: {
    teamId: 1, season: 2026,
    active: Array.from({ length: 26 }, (_, i) => ({
      playerId: i, name: `P${i}`, position: 'SS', age: 25,
      bats: 'R', throws: 'R', isPitcher: false, overall: 70, potential: 75,
      rosterStatus: 'active', isOn40Man: true, optionYearsRemaining: 2,
      serviceTimeDays: 100, salary: 500000, contractYearsRemaining: 3,
    })),
    il: [], minors: [], dfa: [],
  },
  franchiseHistory: [],
};

vi.mock('../../../src/store/gameStore', () => ({
  useGameStore: () => mockGameStore,
}));

vi.mock('../../../src/store/leagueStore', () => ({
  useLeagueStore: () => mockLeagueStore,
}));

vi.mock('../../../src/store/uiStore', () => ({
  useUIStore: () => ({ setActiveTab: vi.fn() }),
}));

// Mock child components to isolate FrontOfficeBriefing logic
vi.mock('../../../src/components/home/BriefingHeader', () => ({
  default: ({ dials, season, teamName }: any) => (
    <div data-testid="briefing-header">
      <span data-testid="dial-count">{dials.length}</span>
      <span data-testid="season">{season}</span>
      <span data-testid="team-name">{teamName}</span>
    </div>
  ),
}));

vi.mock('../../../src/components/home/UrgentProblemCard', () => ({
  default: ({ thread }: any) => (
    <div data-testid="urgent-card">{thread.title}</div>
  ),
}));

vi.mock('../../../src/components/home/OpenMysteryCard', () => ({
  default: ({ thread }: any) => (
    <div data-testid="mystery-card">{thread.title}</div>
  ),
}));

vi.mock('../../../src/components/home/LongArcCard', () => ({
  default: ({ thread }: any) => (
    <div data-testid="long-arc-card">{thread.title}</div>
  ),
}));

vi.mock('../../../src/components/home/LeaguePressureStrip', () => ({
  default: () => <div data-testid="league-pressure" />,
}));

vi.mock('../../../src/components/home/ActionQueuePanel', () => ({
  default: ({ tasks }: any) => (
    <div data-testid="action-queue">
      <span data-testid="task-count">{tasks.length}</span>
    </div>
  ),
}));

describe('FrontOfficeBriefing — rendering', () => {
  it('renders briefing header with dials', () => {
    render(<FrontOfficeBriefing />);
    expect(screen.getByTestId('briefing-header')).toBeTruthy();
    expect(screen.getByTestId('dial-count').textContent).toBe('5');
  });

  it('renders ALL CLEAR when no urgent problems', () => {
    render(<FrontOfficeBriefing />);
    expect(screen.getByText('ALL CLEAR')).toBeTruthy();
  });

  it('renders mystery card', () => {
    render(<FrontOfficeBriefing />);
    expect(screen.getByTestId('mystery-card')).toBeTruthy();
  });

  it('renders long arc card', () => {
    render(<FrontOfficeBriefing />);
    expect(screen.getByTestId('long-arc-card')).toBeTruthy();
  });

  it('renders league pressure strip', () => {
    render(<FrontOfficeBriefing />);
    expect(screen.getByTestId('league-pressure')).toBeTruthy();
  });

  it('renders action queue', () => {
    render(<FrontOfficeBriefing />);
    expect(screen.getByTestId('action-queue')).toBeTruthy();
  });

  it('passes correct season and team name to header', () => {
    render(<FrontOfficeBriefing />);
    expect(screen.getByTestId('season').textContent).toBe('2026');
  });
});

describe('FrontOfficeBriefing — zero-urgent state', () => {
  it('shows green ALL CLEAR indicator when no issues', () => {
    render(<FrontOfficeBriefing />);
    const allClear = screen.getByText('ALL CLEAR');
    expect(allClear).toBeTruthy();
    // Check the helpful subtitle
    expect(screen.getByText(/long-term strategy/)).toBeTruthy();
  });
});
