import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

vi.mock('@/shared/hooks/useWorker', () => ({
  useWorker: vi.fn(),
}));

vi.mock('@/shared/hooks/useGameStore', () => ({
  useGameStore: vi.fn(),
}));

const mockedUseWorker = vi.mocked(useWorker);
const mockedUseGameStore = vi.mocked(useGameStore);
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('DashboardPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    mockedUseGameStore.mockReturnValue({
      season: 4,
      day: 88,
      phase: 'regular',
      isInitialized: true,
      userTeamId: 'nyy',
      teamName: 'Yankees',
      playerCount: 780,
      gamesPlayed: 87,
      isSimulating: false,
      setSeason: vi.fn(),
      setDay: vi.fn(),
      setPhase: vi.fn(),
      setSimulating: vi.fn(),
      setInitialized: vi.fn(),
      setUserTeamId: vi.fn(),
      updateFromSim: vi.fn(),
      initializeGame: vi.fn(),
    });

    mockedUseWorker.mockReturnValue({
      isReady: true,
      getStandings: vi.fn().mockResolvedValue({
        divisions: {
          AL_EAST: [
            {
              teamId: 'nyy',
              teamName: 'Yankees',
              abbreviation: 'NYY',
              wins: 50,
              losses: 38,
              pct: '.568',
              gamesBack: 0,
              streak: 'W3',
              runDifferential: 21,
            },
          ],
        },
      }),
      getTeamRoster: vi.fn().mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]),
      getLeagueLeaders: vi.fn().mockResolvedValue([]),
      getPressRoomFeed: vi.fn().mockResolvedValue([
        {
          id: 'brief-owner-heat',
          source: 'briefing',
          category: 'owner',
          priority: 1,
          headline: 'Owner pressure is rising.',
          body: 'Ownership wants a stronger response this month.',
          timestamp: 'S4D88',
          relatedTeamIds: ['nyy'],
          relatedPlayerIds: [],
        },
      ]),
      getTeamChemistry: vi.fn().mockResolvedValue({
        score: 62,
        tier: 'connected',
        trend: 'rising',
        summary: 'Leadership is pulling the room together.',
        reasons: ['Veteran leadership'],
      }),
      getOwnerState: vi.fn().mockResolvedValue({
        hotSeat: true,
        patience: 42,
        confidence: 45,
        summary: 'Ownership expected a stronger playoff pace.',
      }),
    } as unknown as ReturnType<typeof useWorker>);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it('replaces detailed event lists with press room summaries and navigation', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Press Room');
    expect(container.textContent).not.toContain('Front Office Briefing');
    expect(container.textContent).not.toContain('Unread Inbox');
    const pressRoomLink = container.querySelector('a[href="/press-room"]');
    expect(pressRoomLink).toBeTruthy();
  });
});
