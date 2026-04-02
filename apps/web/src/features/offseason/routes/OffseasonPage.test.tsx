import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import OffseasonPage from './OffseasonPage';
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

describe('OffseasonPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    mockedUseGameStore.mockReturnValue({
      season: 4,
      day: 1,
      phase: 'offseason',
      isInitialized: true,
      userTeamId: 'nyy',
      teamName: 'Yankees',
      playerCount: 780,
      gamesPlayed: 162,
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
      getOffseasonState: vi.fn().mockResolvedValue({
        currentPhase: 'free_agency',
        phaseDay: 8,
        totalDay: 18,
        completed: false,
        phaseResults: {
          arbitrationResolved: [{ id: 'arb-1' }],
          tenderedPlayers: ['player-2'],
          nonTenderedPlayers: ['player-3'],
          freeAgentSignings: [{ id: 'fa-1' }],
          draftPicks: [{ id: 'pick-1' }],
          retiredPlayers: [{ id: 'retire-1' }],
        },
        transactionGroups: [
          {
            phase: 'arbitration',
            label: 'Arbitration',
            rows: [
              {
                id: 'arb-1',
                tone: 'user',
                summary: 'Juan Soto signed for $12.4M/yr (1 year)',
              },
            ],
          },
          {
            phase: 'free_agency',
            label: 'Free Agency',
            rows: [
              {
                id: 'fa-1',
                tone: 'division_rival',
                summary: 'Corbin Burnes signed with Boston Red Sox for $28.5M/yr (5 years)',
              },
            ],
          },
        ],
      }),
      advanceOffseason: vi.fn(),
      skipOffseasonPhase: vi.fn(),
    } as unknown as ReturnType<typeof useWorker>);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it('renders completed transaction groups with detailed offseason rows', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <OffseasonPage />
        </MemoryRouter>,
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Arbitration');
    expect(container.textContent).toContain('Free Agency');
    expect(container.textContent).toContain('Juan Soto signed for $12.4M/yr (1 year)');
    expect(container.textContent).toContain('Corbin Burnes signed with Boston Red Sox for $28.5M/yr (5 years)');
    expect(container.innerHTML).toContain('accent-success');
    expect(container.innerHTML).toContain('accent-warning');
  });
});
