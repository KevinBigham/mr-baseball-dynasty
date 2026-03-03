/**
 * MidSeasonFAPanel — Compact free agent signing panel for in-season use.
 * Shows available FAs with quick sign action. Reuses engine's existing FA APIs.
 */

import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer } from '../../types/league';
import { formatSalary } from '../../utils/format';
import { toScoutingScale } from '../../engine/player/attributes';

interface FAPlayer extends RosterPlayer {
  projectedSalary: number;
  projectedYears: number;
}

interface Props {
  onClose: () => void;
}

export default function MidSeasonFAPanel({ onClose }: Props) {
  const [fas, setFas] = useState<FAPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<number | null>(null); // playerId being signed
  const [offerYears, setOfferYears] = useState(1);
  const [offerSalary, setOfferSalary] = useState(1);
  const [filterPos, setFilterPos] = useState<string>('ALL');

  const loadFAs = useCallback(async () => {
    setLoading(true);
    try {
      const engine = getEngine();
      const result = await engine.getFreeAgents(100);
      setFas(result as FAPlayer[]);
    } catch (err) {
      console.warn('[MidSeasonFA] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFAs(); }, [loadFAs]);

  const handleSign = useCallback(async (playerId: number) => {
    try {
      const engine = getEngine();
      const result = await engine.signFreeAgent(playerId, offerYears, offerSalary);
      if (result.ok) {
        useUIStore.getState().addToast('Player signed!', 'success');
        setSigning(null);
        loadFAs(); // refresh list
      } else {
        useUIStore.getState().addToast(result.error || 'Signing failed', 'error');
      }
    } catch {
      useUIStore.getState().addToast('Signing failed', 'error');
    }
  }, [offerYears, offerSalary, loadFAs]);

  const positions = ['ALL', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];
  const filtered = filterPos === 'ALL' ? fas : fas.filter(p => p.position === filterPos);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true">
      <div className="bloomberg-border bg-gray-900 max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="text-orange-500 font-bold text-xs tracking-widest">FREE AGENTS</div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xs font-bold tracking-wider"
          >
            CLOSE
          </button>
        </div>

        {/* Filter */}
        <div className="px-4 py-2 border-b border-gray-800 flex gap-1 flex-wrap shrink-0">
          {positions.map(pos => (
            <button
              key={pos}
              onClick={() => setFilterPos(pos)}
              className={`text-xs px-2 py-1 transition-colors ${
                filterPos === pos
                  ? 'text-orange-400 bg-orange-900/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-gray-500 text-xs text-center py-8 animate-pulse">LOADING FREE AGENTS...</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500 text-xs text-center py-8">NO FREE AGENTS AVAILABLE</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filtered.map(p => (
                <div key={p.playerId} className="px-4 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-orange-400 text-xs font-bold w-6">{p.position}</span>
                      <div className="min-w-0">
                        <div className="text-gray-200 text-sm font-bold truncate">{p.name}</div>
                        <div className="text-gray-500 text-xs">
                          AGE {p.age} | OVR {toScoutingScale(p.overall)} | POT {toScoutingScale(p.potential)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-green-400 text-xs">{formatSalary(p.projectedSalary)}</div>
                        <div className="text-gray-500 text-xs">{p.projectedYears}yr</div>
                      </div>
                      {signing === p.playerId ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={offerYears}
                            onChange={e => setOfferYears(Math.max(1, Math.min(10, +e.target.value)))}
                            className="w-10 bg-gray-800 border border-gray-700 text-gray-200 text-xs px-1 py-1 text-center"
                            title="Years"
                          />
                          <span className="text-gray-500 text-xs">yr</span>
                          <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={offerSalary}
                            onChange={e => setOfferSalary(Math.max(0.5, +e.target.value))}
                            className="w-14 bg-gray-800 border border-gray-700 text-gray-200 text-xs px-1 py-1 text-center"
                            title="Salary (M)"
                          />
                          <span className="text-gray-500 text-xs">M</span>
                          <button
                            onClick={() => handleSign(p.playerId)}
                            className="bg-green-700 hover:bg-green-600 text-white font-bold text-xs px-2 py-1 uppercase tracking-wider"
                          >
                            SIGN
                          </button>
                          <button
                            onClick={() => setSigning(null)}
                            className="text-gray-500 hover:text-gray-300 text-xs px-1"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSigning(p.playerId);
                            setOfferYears(p.projectedYears);
                            setOfferSalary(Math.round(p.projectedSalary / 1_000_000 * 10) / 10);
                          }}
                          className="border border-green-700 hover:border-green-500 text-green-600 hover:text-green-400 text-xs px-3 py-1 uppercase tracking-wider transition-colors"
                        >
                          OFFER
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-800 shrink-0">
          <div className="text-gray-500 text-xs">
            {filtered.length} AVAILABLE | Offer salary in $M/year
          </div>
        </div>
      </div>
    </div>
  );
}
