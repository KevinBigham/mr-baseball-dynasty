import { Outlet } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SimControls } from './SimControls';
import { CommandPalette } from './CommandPalette';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

export function AppLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const worker = useWorker();
  const { setSimulating, updateFromSim } = useGameStore();
  const initialized = useRef(false);

  // Auto-initialize a new game when the worker is ready
  useEffect(() => {
    if (worker.isReady && !initialized.current) {
      initialized.current = true;
      worker.newGame(Date.now()).then((result) => {
        updateFromSim({ season: result.season, day: result.day, phase: 'preseason' });
      }).catch((err: unknown) => {
        console.error('Failed to initialize game:', err);
      });
    }
  }, [worker.isReady, worker, updateFromSim]);

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
    async (simFn: () => Promise<{ day: number; season: number; phase: string }>) => {
      if (!worker.isReady) return;
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
    [worker.isReady, setSimulating, updateFromSim]
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
          <Outlet />
        </main>
      </div>

      {/* Bottom sim controls */}
      <SimControls
        onSimDay={() => handleSim(() => worker.simDay())}
        onSimWeek={() => handleSim(() => worker.simWeek())}
        onSimMonth={() => handleSim(() => worker.simMonth())}
        onSimInstant={() =>
          handleSim(async () => {
            let result = { day: 1, season: 1, phase: 'preseason' };
            for (let i = 0; i < 23; i++) {
              result = await worker.simWeek();
              if (result.phase === 'playoffs') break;
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
