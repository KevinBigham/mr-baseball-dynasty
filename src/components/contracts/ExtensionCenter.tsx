import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { ExtensionCandidate, ExtensionResult } from '../../engine/contracts/extensions';

function OvrBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 75 ? 'text-green-400' : ovr >= 60 ? 'text-orange-400' : ovr >= 45 ? 'text-gray-400' : 'text-red-400';
  return <span className={`tabular-nums font-bold ${color}`}>{ovr}</span>;
}

function WillingnessBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-orange-500' : value >= 30 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-gray-500 text-[10px] tabular-nums">{value}%</span>
    </div>
  );
}

function DiscountBadge({ discount }: { discount: number }) {
  if (discount > 0) return <span className="text-green-400 text-[10px]">-{discount}%</span>;
  if (discount < 0) return <span className="text-red-400 text-[10px]">+{Math.abs(discount)}%</span>;
  return <span className="text-gray-600 text-[10px]">—</span>;
}

export default function ExtensionCenter() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [candidates, setCandidates] = useState<ExtensionCandidate[]>([]);
  const [history, setHistory] = useState<ExtensionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ExtensionCandidate | null>(null);
  const [offerYears, setOfferYears] = useState(3);
  const [offerAAV, setOfferAAV] = useState(10);
  const [ntc, setNtc] = useState(false);
  const [result, setResult] = useState<ExtensionResult | null>(null);

  const loadData = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const [cands, hist] = await Promise.all([
      getEngine().getExtensionCandidates(),
      getEngine().getExtensionHistory(),
    ]);
    setCandidates(cands);
    setHistory(hist);
    setLoading(false);
  }, [gameStarted]);

  useEffect(() => { loadData(); }, [loadData]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  const selectCandidate = (c: ExtensionCandidate) => {
    setSelectedCandidate(c);
    setOfferYears(c.projectedYears);
    setOfferAAV(Math.round(c.projectedAAV * (1 - c.discount / 100) / 1_000_000 * 10) / 10);
    setNtc(c.serviceYears >= 5);
    setResult(null);
  };

  const submitOffer = async () => {
    if (!selectedCandidate) return;
    const aav = offerAAV * 1_000_000;
    const res = await getEngine().offerExtension({
      playerId: selectedCandidate.playerId,
      teamId: 0, // Will be set by engine
      years: offerYears,
      aav,
      totalValue: aav * offerYears,
      noTradeClause: ntc,
    });
    setResult(res);
    if (res.accepted) {
      await loadData();
    }
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading extension candidates...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>CONTRACT EXTENSIONS</span>
        <span className="text-gray-500 text-xs">{candidates.length} eligible players</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Candidate list */}
        <div className="col-span-2 bloomberg-border">
          <div className="bloomberg-header">EXTENSION CANDIDATES</div>
          <div className="max-h-[32rem] overflow-y-auto">
            {candidates.length === 0 ? (
              <div className="px-4 py-8 text-gray-600 text-xs text-center">No extension candidates available.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                    <th className="px-2 py-1 text-left">PLAYER</th>
                    <th className="px-2 py-1">POS</th>
                    <th className="px-2 py-1">AGE</th>
                    <th className="px-2 py-1">OVR</th>
                    <th className="px-2 py-1">POT</th>
                    <th className="px-2 py-1 text-right">CURRENT</th>
                    <th className="px-2 py-1">YRS LEFT</th>
                    <th className="px-2 py-1 text-right">PROJ AAV</th>
                    <th className="px-2 py-1">WILLING</th>
                    <th className="px-2 py-1">DISC</th>
                    <th className="px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.playerId}
                      className={`text-xs hover:bg-gray-800/50 cursor-pointer ${
                        selectedCandidate?.playerId === c.playerId ? 'bg-orange-900/20' : ''
                      }`}
                      onClick={() => selectCandidate(c)}>
                      <td className="px-2 py-1 font-bold text-orange-300">{c.name}</td>
                      <td className="px-2 py-1 text-gray-500 text-center">{c.position}</td>
                      <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{c.age}</td>
                      <td className="px-2 py-1 text-center"><OvrBadge ovr={c.overall} /></td>
                      <td className="px-2 py-1 tabular-nums text-gray-600 text-center">{c.potential}</td>
                      <td className="px-2 py-1 text-right tabular-nums text-gray-400">
                        ${(c.currentSalary / 1_000_000).toFixed(1)}M
                      </td>
                      <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{c.contractYears}</td>
                      <td className="px-2 py-1 text-right tabular-nums text-orange-400">
                        ${(c.projectedAAV / 1_000_000).toFixed(1)}M
                      </td>
                      <td className="px-2 py-1"><WillingnessBar value={c.willingness} /></td>
                      <td className="px-2 py-1 text-center"><DiscountBadge discount={c.discount} /></td>
                      <td className="px-2 py-1 text-center">
                        <button className="text-orange-400 text-[10px] font-bold hover:underline"
                          onClick={(e) => { e.stopPropagation(); goToPlayer(c.playerId); }}>
                          VIEW
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Offer panel */}
        <div className="bloomberg-border">
          <div className="bloomberg-header">OFFER EXTENSION</div>
          {selectedCandidate ? (
            <div className="p-3 space-y-3">
              <div className="text-center">
                <div className="text-orange-300 font-bold">{selectedCandidate.name}</div>
                <div className="text-gray-500 text-xs">{selectedCandidate.position} / Age {selectedCandidate.age}</div>
                <div className="flex justify-center gap-3 mt-1">
                  <span className="text-xs">OVR: <OvrBadge ovr={selectedCandidate.overall} /></span>
                  <span className="text-xs text-gray-500">POT: {selectedCandidate.potential}</span>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Market AAV:</span>
                  <span className="text-orange-400 text-xs tabular-nums">
                    ${(selectedCandidate.projectedAAV / 1_000_000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Willingness:</span>
                  <WillingnessBar value={selectedCandidate.willingness} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Extension Discount:</span>
                  <DiscountBadge discount={selectedCandidate.discount} />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-2 space-y-2">
                <div>
                  <label className="text-gray-500 text-[10px] font-bold">YEARS</label>
                  <input type="range" min={1} max={10} value={offerYears}
                    onChange={e => setOfferYears(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                  <div className="text-orange-400 text-xs font-bold text-center tabular-nums">{offerYears} years</div>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-bold">AAV ($M)</label>
                  <input type="range" min={0.5} max={50} step={0.5} value={offerAAV}
                    onChange={e => setOfferAAV(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                  <div className="text-orange-400 text-xs font-bold text-center tabular-nums">${offerAAV.toFixed(1)}M / yr</div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-gray-500 text-[10px] font-bold">NO-TRADE CLAUSE</label>
                  <button onClick={() => setNtc(!ntc)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      ntc ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'
                    }`}>
                    {ntc ? 'YES' : 'NO'}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-xs">Total Value:</span>
                  <span className="text-orange-400 font-bold tabular-nums">
                    ${(offerAAV * offerYears).toFixed(1)}M
                  </span>
                </div>
                <button onClick={submitOffer}
                  className="w-full py-1.5 bg-orange-600 text-black text-xs font-bold rounded hover:bg-orange-500 transition-colors">
                  OFFER EXTENSION
                </button>
              </div>

              {result && (
                <div className={`mt-2 p-2 rounded text-xs font-bold text-center ${
                  result.accepted
                    ? 'bg-green-900/30 border border-green-700 text-green-400'
                    : 'bg-red-900/30 border border-red-700 text-red-400'
                }`}>
                  {result.accepted
                    ? `${result.playerName} ACCEPTS! ${result.years}yr / $${(result.totalValue / 1_000_000).toFixed(1)}M`
                    : `${result.playerName} DECLINES: ${result.reason}`
                  }
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-gray-600 text-xs text-center">
              Select a player from the list to offer an extension.
            </div>
          )}
        </div>
      </div>

      {/* Extension History */}
      {history.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">EXTENSION HISTORY ({history.length})</div>
          <div className="max-h-[16rem] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-left">PLAYER</th>
                  <th className="px-2 py-1">YEARS</th>
                  <th className="px-2 py-1 text-right">AAV</th>
                  <th className="px-2 py-1 text-right">TOTAL</th>
                  <th className="px-2 py-1">RESULT</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="text-xs hover:bg-gray-800/50">
                    <td className="px-2 py-1 font-bold text-orange-300">{h.playerName}</td>
                    <td className="px-2 py-1 tabular-nums text-gray-400 text-center">{h.years}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-400">${(h.aav / 1_000_000).toFixed(1)}M</td>
                    <td className="px-2 py-1 text-right tabular-nums text-orange-400">${(h.totalValue / 1_000_000).toFixed(1)}M</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        h.accepted ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                      }`}>
                        {h.accepted ? 'SIGNED' : 'REJECTED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
