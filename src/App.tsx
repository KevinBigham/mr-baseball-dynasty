import React, { useEffect, useState } from 'react';
import Shell from './components/layout/Shell';
import { acquireTabLock } from './db/tabGuard';
import { listSaves, loadGame } from './db/schema';
import { getEngine } from './engine/engineClient';
import { useGameStore } from './store/gameStore';

export default function App() {
  const { setGameStarted, setSeason } = useGameStore();
  const [tabBlocked, setTabBlocked] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      // Multi-tab guard
      const acquired = await acquireTabLock();
      if (!acquired) {
        setTabBlocked(true);
        setInitializing(false);
        return;
      }

      // Try to load the most recent save
      try {
        const saves = await listSaves();
        if (saves.length > 0) {
          const mostRecent = saves[0]; // listSaves returns desc order
          const state = await loadGame(mostRecent.id!);
          if (state) {
            const engine = getEngine();
            await engine.loadState(state);
            setGameStarted(true);
            setSeason(state.season ?? 1);
          }
        }
      } catch (e) {
        // No save or corrupted — start fresh (user will click New Game)
        console.warn('No save loaded:', e);
      }

      setInitializing(false);
    }

    init();
  }, [setGameStarted, setSeason]);

  if (tabBlocked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bloomberg-border p-8 max-w-md text-center">
          <div className="bloomberg-header mb-4">DUPLICATE TAB DETECTED</div>
          <p className="text-gray-400 text-sm mb-4">
            Mr. Baseball Dynasty is already running in another tab. Close the other tab
            to continue here.
          </p>
          <button
            className="bloomberg-btn"
            onClick={() => window.location.reload()}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-orange-400 font-mono text-sm animate-pulse">
          INITIALIZING MR. BASEBALL DYNASTY…
        </div>
      </div>
    );
  }

  return <Shell />;
}
