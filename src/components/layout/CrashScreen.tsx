/**
 * CrashScreen.tsx — Bloomberg-styled crash recovery screen
 *
 * Shown when an unrecoverable React error is caught by an ErrorBoundary.
 * Offers three recovery paths: reload, load last save, or start fresh.
 */

import { useState, useEffect } from 'react';
import { listSaves, loadGame, type SaveSlot } from '../../db/schema';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';

interface CrashScreenProps {
  error: Error;
  errorInfo?: React.ErrorInfo | null;
  onReset: () => void;
  /** If true, this is a tab-level crash (only the content area failed) */
  isPartial?: boolean;
}

export default function CrashScreen({ error, errorInfo, onReset, isPartial }: CrashScreenProps) {
  const [showStack, setShowStack] = useState(false);
  const [latestSave, setLatestSave] = useState<Omit<SaveSlot, 'stateBlob'> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { setGameStarted, setSeason } = useGameStore();

  useEffect(() => {
    listSaves().then(saves => {
      if (saves.length > 0) setLatestSave(saves[0]);
    }).catch(() => {});
  }, []);

  const handleReload = () => window.location.reload();

  const handleLoadSave = async () => {
    if (!latestSave?.id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const state = await loadGame(latestSave.id);
      if (state) {
        const engine = getEngine();
        await engine.loadState(state);
        setGameStarted(true);
        setSeason(state.season ?? 1);
        onReset();
      } else {
        setLoadError('Save file is corrupted.');
      }
    } catch {
      setLoadError('Failed to load save.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewGame = () => {
    useGameStore.getState().resetAll();
    onReset();
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className={isPartial
      ? 'p-6 flex items-center justify-center'
      : 'min-h-screen bg-gray-950 flex items-center justify-center p-4'
    }>
      <div className="bloomberg-border bg-gray-900 p-6 max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-500 font-bold text-xs tracking-widest">
            {isPartial ? 'COMPONENT ERROR' : 'SYSTEM ERROR'}
          </span>
        </div>

        {/* Error message */}
        <div className="bg-gray-950 border border-gray-800 rounded p-3 mb-4">
          <p className="text-red-400 text-sm font-mono break-all">
            {error.message || 'An unexpected error occurred.'}
          </p>
        </div>

        {/* Stack trace (collapsible) */}
        {(error.stack || errorInfo?.componentStack) && (
          <div className="mb-4">
            <button
              onClick={() => setShowStack(!showStack)}
              className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              {showStack ? '▼' : '▶'} STACK TRACE
            </button>
            {showStack && (
              <pre className="mt-2 bg-gray-950 border border-gray-800 rounded p-3 text-gray-600 text-xs overflow-auto max-h-48 font-mono">
                {error.stack}
                {errorInfo?.componentStack && (
                  <>
                    {'\n\n--- Component Stack ---\n'}
                    {errorInfo.componentStack}
                  </>
                )}
              </pre>
            )}
          </div>
        )}

        {/* Recovery options */}
        <div className="space-y-2">
          <button
            onClick={handleReload}
            className="w-full bg-orange-700 hover:bg-orange-600 text-white font-bold text-xs py-3 uppercase tracking-widest transition-colors"
          >
            RELOAD APP
          </button>

          {latestSave && (
            <button
              onClick={handleLoadSave}
              disabled={loading}
              className="w-full border border-blue-700 hover:border-blue-500 text-blue-400 hover:text-blue-300 font-bold text-xs py-3 uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? 'LOADING…' : `LOAD LAST SAVE (${latestSave.name} — ${timeAgo(latestSave.timestamp)})`}
            </button>
          )}

          {loadError && (
            <p className="text-red-500 text-xs text-center">{loadError}</p>
          )}

          <button
            onClick={handleNewGame}
            className="w-full border border-gray-700 hover:border-gray-500 text-gray-500 hover:text-gray-300 font-bold text-xs py-3 uppercase tracking-widest transition-colors"
          >
            START NEW GAME
          </button>
        </div>

        {/* Subtle footer */}
        <p className="text-gray-700 text-[10px] text-center mt-4 uppercase tracking-wider">
          Your saved data is safe. This error occurred during rendering.
        </p>
      </div>
    </div>
  );
}
