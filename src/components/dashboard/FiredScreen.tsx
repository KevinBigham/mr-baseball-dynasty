import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { listSaves, loadGame } from '../../db/schema';
import { getEngine } from '../../engine/engineClient';
import { useState } from 'react';
import CareerSummary from './CareerSummary';

export default function FiredScreen() {
  const { seasonsManaged, resetAll: resetGame } = useGameStore();
  const { franchiseHistory, resetAll: resetLeague } = useLeagueStore();
  const [loading, setLoading] = useState(false);

  const handleNewGame = () => {
    resetGame();
    resetLeague();
  };

  const handleLoadSave = async () => {
    setLoading(true);
    try {
      const saves = await listSaves();
      if (saves.length > 0 && saves[0].id != null) {
        const state = await loadGame(saves[0].id);
        if (state) {
          const engine = getEngine();
          await engine.loadState(state);
          window.location.reload();
        }
      }
    } catch {
      // Fall through to new game
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 overflow-auto">
      <div className="bloomberg-border bg-gray-950 max-w-lg w-full mx-4 my-8">
        {/* Header */}
        <div className="border-b border-red-900 px-6 py-4 text-center">
          <div className="text-red-500 text-xs tracking-[0.3em] mb-2 animate-pulse">
            BREAKING NEWS
          </div>
          <div className="text-red-400 font-black text-xl tracking-wider leading-tight">
            YOU HAVE BEEN RELIEVED
            <br />
            OF YOUR DUTIES
          </div>
          <div className="text-gray-600 text-xs mt-3">
            The front office has decided to go in a different direction.
            <br />
            Your tenure as General Manager has come to an end.
          </div>
        </div>

        {/* Career Summary */}
        <div className="px-6 py-4">
          <CareerSummary
            franchiseHistory={franchiseHistory}
            seasonsManaged={seasonsManaged}
          />
        </div>

        {/* Actions */}
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3">
          <button
            onClick={handleNewGame}
            className="flex-1 bg-orange-700 hover:bg-orange-600 text-white font-bold text-xs py-3 uppercase tracking-widest transition-colors"
          >
            START NEW DYNASTY
          </button>
          <button
            onClick={handleLoadSave}
            disabled={loading}
            className="flex-1 border border-gray-600 hover:border-blue-500 text-gray-400 hover:text-blue-400 disabled:text-gray-700 font-bold text-xs py-3 uppercase tracking-widest transition-colors"
          >
            {loading ? 'LOADING…' : 'LOAD SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
}
