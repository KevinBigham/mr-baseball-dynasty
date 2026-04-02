import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';
import { loadMostRecentSnapshot } from '@/shared/lib/saveSystem';

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

vi.mock('./CommandPalette', () => ({
  CommandPalette: () => null,
}));

vi.mock('@/shared/hooks/useWorker', () => ({
  useWorker: vi.fn(),
}));

vi.mock('@/shared/hooks/useGameStore', () => ({
  useGameStore: vi.fn(),
}));

vi.mock('@/shared/lib/saveSystem', () => ({
  loadMostRecentSnapshot: vi.fn(),
}));

const mockedUseWorker = vi.mocked(useWorker);
const mockedUseGameStore = vi.mocked(useGameStore);
const mockedLoadMostRecentSnapshot = vi.mocked(loadMostRecentSnapshot);
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function createWorkerMock(flow: Record<string, unknown>) {
  return {
    isReady: true,
    getSeasonFlowState: vi.fn().mockResolvedValue(flow),
    subscribeToFlowUpdates: vi.fn(() => () => {}),
    newGame: vi.fn().mockResolvedValue({
      season: 3,
      day: 87,
      phase: 'regular',
      playerCount: 780,
      userTeamId: 'nyy',
    }),
    importSnapshot: vi.fn(),
    simDay: vi.fn().mockResolvedValue({ season: 3, day: 88, phase: 'regular', gamesPlayed: 1 }),
    simWeek: vi.fn().mockResolvedValue({ season: 3, day: 94, phase: 'regular', gamesPlayed: 7 }),
    simMonth: vi.fn().mockResolvedValue({ season: 3, day: 117, phase: 'regular', gamesPlayed: 30 }),
    simToPlayoffs: vi.fn().mockResolvedValue({ season: 3, day: 1, phase: 'playoffs', gamesPlayed: 75 }),
    simRemainingPlayoffs: vi.fn().mockResolvedValue({ season: 3, day: 1, phase: 'playoffs', gamesPlayed: 11 }),
    proceedToOffseason: vi.fn().mockResolvedValue({ season: 3, day: 1, phase: 'offseason', gamesPlayed: 0 }),
    startNextSeason: vi.fn().mockResolvedValue({ season: 4, day: 1, phase: 'preseason', gamesPlayed: 0 }),
  };
}

describe('AppLayout', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockedLoadMostRecentSnapshot.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    vi.useRealTimers();
    container.remove();
    vi.clearAllMocks();
  });

  it('renders sim-to-playoffs controls and handles keyboard shortcuts', async () => {
    mockedUseGameStore.mockReturnValue({
      season: 3,
      day: 87,
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

    const flow = {
      status: 'regular',
      season: 3,
      phaseLabel: 'Season 3 — Day 87/162',
      detailLabel: 'Regular Season',
      progress: 87 / 162,
      canUseRegularSimControls: true,
      action: null,
      actionLabel: null,
      secondaryAction: null,
      secondaryActionLabel: null,
      daysUntilTradeDeadline: 33,
      standingsSnapshot: [],
      playoffPreview: [],
      seasonSummary: null,
      championSummary: null,
      offseasonSummary: null,
    };
    const worker = createWorkerMock(flow);
    mockedUseWorker.mockReturnValue(worker as unknown as ReturnType<typeof useWorker>);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Sim to Playoffs');

    const simToPlayoffsButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Sim to Playoffs'),
    );

    expect(simToPlayoffsButton).toBeTruthy();

    await act(async () => {
      simToPlayoffsButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(worker.simToPlayoffs).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
      await Promise.resolve();
    });
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, shiftKey: true }));
      await Promise.resolve();
    });
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, ctrlKey: true }));
      await Promise.resolve();
    });

    expect(worker.simDay).toHaveBeenCalledTimes(1);
    expect(worker.simWeek).toHaveBeenCalledTimes(1);
    expect(worker.simMonth).toHaveBeenCalledTimes(1);
  });

  it('renders the season transition ceremony card and uses its CTA', async () => {
    mockedUseGameStore.mockReturnValue({
      season: 3,
      day: 1,
      phase: 'playoffs',
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

    const flow = {
      status: 'playoffs_complete',
      season: 3,
      phaseLabel: 'Season 3 — World Series Final',
      detailLabel: 'New York Yankees defeated Los Angeles Dodgers 4-2',
      progress: 1,
      canUseRegularSimControls: false,
      action: 'proceed_to_offseason',
      actionLabel: 'Proceed to Offseason',
      secondaryAction: null,
      secondaryActionLabel: null,
      daysUntilTradeDeadline: null,
      standingsSnapshot: [],
      playoffPreview: [],
      seasonSummary: null,
      championSummary: {
        championTeamId: 'nyy',
        championTeamName: 'New York Yankees',
        runnerUpTeamName: 'Los Angeles Dodgers',
        seriesRecord: '4-2',
      },
      offseasonSummary: null,
    };
    const worker = createWorkerMock(flow);
    mockedUseWorker.mockReturnValue(worker as unknown as ReturnType<typeof useWorker>);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('World Series Champions');
    expect(container.textContent).toContain('Proceed to Offseason');

    const proceedButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Proceed to Offseason'),
    );

    await act(async () => {
      proceedButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(worker.proceedToOffseason).toHaveBeenCalledTimes(1);
  });

  it('subscribes to flow updates instead of polling the worker every second', async () => {
    mockedUseGameStore.mockReturnValue({
      season: 3,
      day: 87,
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

    const flow = {
      status: 'regular',
      season: 3,
      phaseLabel: 'Season 3 — Day 87/162',
      detailLabel: 'Regular Season',
      progress: 87 / 162,
      canUseRegularSimControls: true,
      action: null,
      actionLabel: null,
      secondaryAction: null,
      secondaryActionLabel: null,
      daysUntilTradeDeadline: 33,
      standingsSnapshot: [],
      playoffPreview: [],
      seasonSummary: null,
      championSummary: null,
      offseasonSummary: null,
    };
    const worker = createWorkerMock(flow);
    mockedUseWorker.mockReturnValue(worker as unknown as ReturnType<typeof useWorker>);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(worker.subscribeToFlowUpdates).toHaveBeenCalledTimes(1);
    expect(worker.getSeasonFlowState).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(worker.getSeasonFlowState).toHaveBeenCalledTimes(2);
  });
});
