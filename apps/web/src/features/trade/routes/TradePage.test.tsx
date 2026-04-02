import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import TradePage from './TradePage';
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

function createWorkerMock() {
  return {
    isReady: true,
    getTeamRoster: vi.fn().mockResolvedValue([
      {
        id: 'nyy-1',
        firstName: 'Anthony',
        lastName: 'Volpe',
        age: 24,
        position: 'SS',
        overallRating: 72,
        displayRating: 72,
        letterGrade: 'B',
        rosterStatus: 'MLB',
        teamId: 'nyy',
        stats: null,
      },
    ]),
    getTradeOffers: vi.fn().mockResolvedValue([
      {
        id: 'offer-1',
        fromTeamId: 'bos',
        fromTeamName: 'Boston Red Sox',
        fromTeamAbbreviation: 'BOS',
        toTeamId: 'nyy',
        toTeamName: 'New York Yankees',
        toTeamAbbreviation: 'NYY',
        fairnessScore: -6,
        message: 'The Boston Red Sox want to discuss a trade.',
        createdAt: 'S4D95',
        offeringPlayers: [
          { playerId: 'bos-1', playerName: 'Roman Anthony', position: 'CF' },
        ],
        requestingPlayers: [
          { playerId: 'nyy-1', playerName: 'Anthony Volpe', position: 'SS' },
        ],
      },
    ]),
    getTradeHistory: vi.fn().mockResolvedValue([
      {
        id: 'history-1',
        fromTeamId: 'tb',
        fromTeamName: 'Tampa Bay Rays',
        fromTeamAbbreviation: 'TBR',
        toTeamId: 'tor',
        toTeamName: 'Toronto Blue Jays',
        toTeamAbbreviation: 'TOR',
        fairnessScore: 9,
        summary: 'Tampa Bay Rays sent Drew Example to Toronto Blue Jays for Chris Sample.',
        timestamp: 'S4D90',
        offeringPlayers: [
          { playerId: 'tb-1', playerName: 'Drew Example', position: 'SP' },
        ],
        requestingPlayers: [
          { playerId: 'tor-1', playerName: 'Chris Sample', position: 'C' },
        ],
      },
    ]),
    proposeTrade: vi.fn(),
    respondToTradeOffer: vi.fn(),
  };
}

describe('TradePage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it('renders the active deadline countdown, inbox, and trade history', async () => {
    mockedUseGameStore.mockReturnValue({
      season: 4,
      day: 95,
      phase: 'regular',
      isInitialized: true,
      userTeamId: 'nyy',
      teamName: 'Yankees',
      playerCount: 780,
      gamesPlayed: 95,
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

    mockedUseWorker.mockReturnValue(createWorkerMock() as unknown as ReturnType<typeof useWorker>);

    await act(async () => {
      root.render(
        <MemoryRouter>
          <TradePage />
        </MemoryRouter>,
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('25 days until trade deadline');
    expect(container.textContent).toContain('Trade Inbox');
    expect(container.textContent).toContain('Boston Red Sox');
    expect(container.textContent).toContain('Roman Anthony');
    expect(container.textContent).toContain('Trade History');
    expect(container.textContent).toContain('Tampa Bay Rays sent Drew Example to Toronto Blue Jays for Chris Sample.');
  });

  it('renders the closed-state banner after the trade deadline', async () => {
    mockedUseGameStore.mockReturnValue({
      season: 4,
      day: 121,
      phase: 'regular',
      isInitialized: true,
      userTeamId: 'nyy',
      teamName: 'Yankees',
      playerCount: 780,
      gamesPlayed: 121,
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

    const worker = createWorkerMock();
    worker.getTradeOffers.mockResolvedValue([]);
    worker.getTradeHistory.mockResolvedValue([]);
    mockedUseWorker.mockReturnValue(worker as unknown as ReturnType<typeof useWorker>);

    await act(async () => {
      root.render(
        <MemoryRouter>
          <TradePage />
        </MemoryRouter>,
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Trade market closed — reopens in offseason');
    expect(container.textContent).toContain('No active trade offers.');
    expect(container.textContent).toContain('No trades completed yet this season.');
  });
});
