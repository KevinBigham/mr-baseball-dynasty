import { Outlet } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SimControls } from './SimControls';
import { CommandPalette } from './CommandPalette';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';
import { loadMostRecentSnapshot } from '@/shared/lib/saveSystem';

export function AppLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { setSimulating, updateFromSim, initializeGame, isInitialized } = useGameStore();
  const initialized = useRef(false);

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
      } catch (err: unknown) {
        console.error('Failed to initialize game:', err);
      }
    })();
  }, [workerReady, initializeGame]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcut for Cmd+K / Ctrl+K
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    },
    []
  );

  const handleSim = useCallback(
    async (simFn: () => Promise<{ day: number; season: number; phase: string; gamesPlayed: number }>) => {
      if (!workerReady || !isInitialized) return;
      setSimulating(true);
      try {
        const result = await simFn();
        updateFromSim(result);
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setSimulating(false);
      }
    },
    [workerReady, isInitialized, setSimulating, updateFromSim]
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="flex h-screen flex-col bg-dynasty-base" onKeyDown={handleKeyDown}>
      {/* Top bar */}
      <TopBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

      {/* Main area: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {isInitialized ? <Outlet /> : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="font-brand text-4xl text-accent-primary">MBD</div>
                <div className="mt-2 font-heading text-dynasty-muted">
                  Generating league...
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom sim controls */}
      <SimControls
        onSimDay={() => handleSim(() => worker.simDay())}
        onSimWeek={() => handleSim(() => worker.simWeek())}
        onSimMonth={() => handleSim(() => worker.simMonth())}
        onSimInstant={() =>
          handleSim(async () => {
            let result = { day: 1, season: 1, phase: 'preseason', gamesPlayed: 0, seasonComplete: false };
            for (let i = 0; i < 30; i++) {
              result = await worker.simWeek();
              if (result.seasonComplete || result.phase !== 'regular') break;
            }
            return result;
          })
        }
      />

      {/* Command palette overlay */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
