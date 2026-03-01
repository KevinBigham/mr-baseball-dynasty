import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { RosterPlayer } from '../../types/league';

interface FAPlayer extends RosterPlayer {
  projectedSalary: number;
  projectedYears: number;
}

function formatSalary(s: number): string {
  if (s >= 1_000_000) return `$${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `$${(s / 1000).toFixed(0)}K`;
  return `$${s}`;
}

type SortKey = 'overall' | 'age' | 'position' | 'salary';

// ─── Offer modal ─────────────────────────────────────────────────────────────
function OfferModal({
  player, onSign, onCancel,
}: {
  player: FAPlayer;
  onSign: (years: number, salary: number) => void;
  onCancel: () => void;
}) {
  const [years, setYears] = useState(player.projectedYears);
  const [salary, setSalary] = useState(player.projectedSalary);

  const salaryStep = 500_000;
  const minSalary = Math.max(500_000, Math.round(player.projectedSalary * 0.5));
  const maxSalary = Math.round(player.projectedSalary * 2);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bloomberg-border bg-gray-900 p-6 max-w-md w-full">
        <div className="text-orange-500 font-bold text-xs tracking-widest mb-4">CONTRACT OFFER</div>

        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-800">
          <div>
            <div className="text-gray-200 font-bold text-sm">{player.name}</div>
            <div className="text-gray-500 text-xs">{player.position} · Age {player.age} · OVR {player.overall}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-gray-500 text-xs">MARKET VALUE</div>
            <div className="text-orange-400 font-bold text-sm">{formatSalary(player.projectedSalary)}/yr</div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-xs">CONTRACT LENGTH</span>
              <span className="text-orange-400 font-bold text-sm">{years} {years === 1 ? 'year' : 'years'}</span>
            </div>
            <input
              type="range" min={1} max={Math.min(8, player.projectedYears + 2)} step={1}
              value={years} onChange={e => setYears(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-xs">ANNUAL SALARY</span>
              <span className="text-orange-400 font-bold text-sm">{formatSalary(salary)}/yr</span>
            </div>
            <input
              type="range" min={minSalary} max={maxSalary} step={salaryStep}
              value={salary} onChange={e => setSalary(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-gray-600 text-xs mt-0.5">
              <span>{formatSalary(minSalary)}</span>
              <span>{formatSalary(maxSalary)}</span>
            </div>
          </div>

          <div className="bloomberg-border bg-gray-950 p-3">
            <div className="text-gray-500 text-xs mb-1">TOTAL VALUE</div>
            <div className="text-orange-400 font-bold text-lg tabular-nums">
              {formatSalary(salary * years)}
            </div>
            <div className="text-gray-600 text-xs">{years}yr / {formatSalary(salary)} per year</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSign(years, salary)}
            className="flex-1 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs py-3 uppercase tracking-widest"
          >
            SIGN PLAYER
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-400 font-bold text-xs py-3 uppercase tracking-widest"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Free Agency Panel ──────────────────────────────────────────────────
export default function FreeAgencyPanel({ onDone }: { onDone: () => void }) {
  const { season } = useGameStore();
  const [freeAgents, setFreeAgents] = useState<FAPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [offerPlayer, setOfferPlayer] = useState<FAPlayer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [signings, setSignings] = useState(0);

  const loadFAs = useCallback(async () => {
    setLoading(true);
    const engine = getEngine();
    const fas = await engine.getFreeAgents(100);
    setFreeAgents(fas);
    setLoading(false);
  }, []);

  useEffect(() => { loadFAs(); }, [loadFAs]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSign = useCallback(async (years: number, salary: number) => {
    if (!offerPlayer) return;
    const engine = getEngine();
    const result = await engine.signFreeAgent(offerPlayer.playerId, years, salary);
    if (result.ok) {
      setToast(`Signed ${offerPlayer.name}!`);
      setSignings(s => s + 1);
      setOfferPlayer(null);
      await loadFAs();
    } else {
      setToast(result.error ?? 'Signing failed.');
    }
  }, [offerPlayer, loadFAs]);

  const handleFinishOffseason = useCallback(async () => {
    const engine = getEngine();
    await engine.finishOffseason();
    onDone();
  }, [onDone]);

  // Sorting
  const sorted = [...freeAgents].sort((a, b) => {
    switch (sortKey) {
      case 'overall': return b.overall - a.overall;
      case 'age': return a.age - b.age;
      case 'salary': return b.projectedSalary - a.projectedSalary;
      case 'position': return a.position.localeCompare(b.position);
      default: return 0;
    }
  });

  // Position filter
  const positions = ['ALL', ...new Set(freeAgents.map(p => p.position))];
  const filtered = posFilter === 'ALL' ? sorted : sorted.filter(p => p.position === posFilter);

  if (loading) {
    return <div className="text-orange-400 text-xs animate-pulse p-4">Loading free agents...</div>;
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 text-xs font-bold tracking-wider uppercase bg-green-900 text-green-300 border border-green-700">
          {toast}
        </div>
      )}

      {offerPlayer && (
        <OfferModal player={offerPlayer} onSign={handleSign} onCancel={() => setOfferPlayer(null)} />
      )}

      <div className="bloomberg-border bg-gray-900">
        <div className="bloomberg-header px-4 flex items-center justify-between">
          <span>FREE AGENCY — {season - 1} OFFSEASON</span>
          <span className="text-green-400 font-normal">{signings} signed</span>
        </div>

        {/* Controls */}
        <div className="px-4 py-2 flex items-center gap-4 border-b border-gray-800 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">SORT:</span>
            {(['overall', 'age', 'salary', 'position'] as SortKey[]).map(key => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`text-xs px-2 py-1 transition-colors ${
                  sortKey === key ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">POS:</span>
            <select
              value={posFilter}
              onChange={e => setPosFilter(e.target.value)}
              className="bg-gray-800 text-gray-300 text-xs border border-gray-700 px-2 py-1"
            >
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="ml-auto text-gray-500 text-xs">{filtered.length} available</div>
        </div>

        {/* FA Table */}
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-gray-600 text-xs border-b border-gray-800">
                <th className="text-left px-3 py-1.5">NAME</th>
                <th className="text-left px-2 py-1.5">POS</th>
                <th className="text-right px-2 py-1.5">AGE</th>
                <th className="text-right px-2 py-1.5">OVR</th>
                <th className="text-right px-2 py-1.5">POT</th>
                <th className="text-right px-2 py-1.5">PROJ $</th>
                <th className="text-right px-2 py-1.5">YRS</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(p => (
                <tr key={p.playerId} className="bloomberg-row text-xs">
                  <td className="px-3 py-1.5 font-bold text-orange-300">{p.name}</td>
                  <td className="px-2 py-1.5 text-gray-500">{p.position}</td>
                  <td className="px-2 py-1.5 tabular-nums text-right">{p.age}</td>
                  <td className="px-2 py-1.5 tabular-nums text-right text-orange-400 font-bold">{p.overall}</td>
                  <td className="px-2 py-1.5 tabular-nums text-right text-gray-500">{p.potential}</td>
                  <td className="px-2 py-1.5 tabular-nums text-right text-green-400">{formatSalary(p.projectedSalary)}</td>
                  <td className="px-2 py-1.5 tabular-nums text-right text-gray-500">{p.projectedYears}</td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => setOfferPlayer(p)}
                      className="text-orange-600 hover:text-orange-400 text-xs font-bold transition-colors"
                    >
                      SIGN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-3">
        <button
          onClick={handleFinishOffseason}
          className="flex-1 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs py-3 uppercase tracking-widest"
        >
          ADVANCE TO NEXT SEASON →
        </button>
      </div>
    </div>
  );
}
