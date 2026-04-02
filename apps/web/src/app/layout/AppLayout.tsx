import { Outlet, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SimControls } from './SimControls';
import { CommandPalette } from './CommandPalette';
import { SeasonFlowCard } from './SeasonFlowCard';
import type { SeasonFlowState } from './seasonFlow';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';
import { loadMostRecentSnapshot } from '@/shared/lib/saveSystem';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable
    || target.tagName === 'INPUT'
    || target.tagName === 'TEXTAREA'
    || target.tagName === 'SELECT'
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [seasonFlow, setSeasonFlow] = useState<SeasonFlowState | null>(null);
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { setSimulating, updateFromSim, initializeGame, isInitialized, isSimulating } = useGameStore();
  const initialized = useRef(false);

  const refreshSeasonFlow = useCallback(async () => {
    if (!workerReady) return;
    const next = await worker.getSeasonFlowState();
    setSeasonFlow(next as SeasonFlowState);
  }, [worker, workerReady]);

  // Auto-initialize a new game when the worker is ready
  useEffect(() => {
    if (!workerReady || initialized.current) return;

    initialized.current = true;

    (async () => {
      try {
        const latestSave = await loadMostRecentSnapshot();
        if (latestSave?.snapshot) {
          const result = await worker.importSnapshot(latestSave.snapshot);
          initializeGame({
            season: result.season,
            day: result.day,
            phase: result.phase,
            playerCount: result.playerCount,
            userTeamId: result.userTeamId,
          });
          await refreshSeasonFlow();
          return;
        }

        const result = await worker.newGame(Date.now(), 'nyy');
        initializeGame({
          season: result.season,
          day: result.day,
          phase: result.phase,
          playerCount: result.playerCount,
          userTeamId: 'nyy',
        });
        await refreshSeasonFlow();
      } catch (err: unknown) {
        console.error('Failed to initialize game:', err);
      }
    })();
  }, [workerReady, initializeGame, refreshSeasonFlow, worker]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!workerReady || !isInitialized) return;

    void refreshSeasonFlow();
    return worker.subscribeToFlowUpdates(() => {
      void refreshSeasonFlow();
    });
  }, [isInitialized, refreshSeasonFlow, worker, workerReady]);

  const handleSim = useCallback(
    async (simFn: () => Promise<{ day: number; season: number; phase: string; gamesPlayed: number }>) => {
      if (!workerReady || !isInitialized) return;
      setSimulating(true);
      try {
        const result = await simFn();
        updateFromSim(result);
        await refreshSeasonFlow();
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setSimulating(false);
      }
    },
    [workerReady, isInitialized, refreshSeasonFlow, setSimulating, updateFromSim]
  );

  const handleFlowAction = useCallback(async (actionOverride?: SeasonFlowState['action']) => {
    const nextAction = actionOverride ?? seasonFlow?.action;
    if (!nextAction) return;

    if (nextAction === 'watch_playoffs') {
      if (seasonFlow?.status === 'regular_season_complete') {
        await handleSim(() => worker.simDay());
      }
      navigate('/playoffs');
      return;
    }

    if (nextAction === 'skip_to_offseason') {
      await handleSim(() => worker.simRemainingPlayoffs());
      await handleSim(() => worker.proceedToOffseason());
      navigate('/offseason');
      return;
    }

    if (nextAction === 'proceed_to_playoffs' || nextAction === 'sim_playoffs') {
      await handleSim(() => worker.simDay());
      return;
    }

    if (nextAction === 'proceed_to_offseason') {
      await handleSim(() => worker.proceedToOffseason());
      return;
    }

    if (nextAction === 'start_next_season') {
      await handleSim(() => worker.startNextSeason());
    }
  }, [handleSim, navigate, seasonFlow?.action, seasonFlow?.status, worker]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (commandPaletteOpen || isEditableTarget(event.target) || !seasonFlow?.canUseRegularSimControls) {
        return;
      }

      if (event.code !== 'Space') {
        return;
      }

      event.preventDefault();
      if (event.shiftKey) {
        void handleSim(() => worker.simWeek());
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        void handleSim(() => worker.simMonth());
        return;
      }

      void handleSim(() => worker.simDay());
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [commandPaletteOpen, handleSim, seasonFlow?.canUseRegularSimControls, worker]);

  return (
    <div className="flex h-screen flex-col bg-dynasty-base">
      {/* Top bar */}
      <TopBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} flow={seasonFlow} />

      {/* Main area: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {!isInitialized ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="font-brand text-4xl text-accent-primary">MBD</div>
                <div className="mt-2 font-heading text-dynasty-muted">
                  Generating league...
                </div>
              </div>
            </div>
          ) : (
            <>
              {seasonFlow && (
                <SeasonFlowCard
                  flow={seasonFlow}
                  actionBusy={isSimulating}
                  onAction={() => void handleFlowAction()}
                  onSecondaryAction={() => void handleFlowAction(seasonFlow.secondaryAction)}
                />
              )}
              <Outlet />
            </>
          )}
        </main>
      </div>

      {/* Bottom sim controls */}
      <SimControls
        onSimDay={() => handleSim(() => worker.simDay())}
        onSimWeek={() => handleSim(() => worker.simWeek())}
        onSimMonth={() => handleSim(() => worker.simMonth())}
        onSimToPlayoffs={() => handleSim(() => worker.simToPlayoffs())}
        onFlowAction={() => void handleFlowAction()}
        flow={seasonFlow}
      />

      {/* Command palette overlay */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
