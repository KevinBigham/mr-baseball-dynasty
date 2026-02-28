import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { IntlProspect } from '../../engine/offseason/intlSigning';

function GradeBadge({ grade }: { grade: number }) {
  const color = grade >= 60 ? 'text-green-400' : grade >= 50 ? 'text-orange-400' : grade >= 40 ? 'text-gray-300' : 'text-red-400';
  return <span className={`font-bold tabular-nums ${color}`}>{grade}</span>;
}

function NatFlag({ nat }: { nat: 'latin' | 'asian' }) {
  return (
    <span className={`px-1 py-0.5 text-[10px] font-bold rounded ${
      nat === 'latin' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
    }`}>
      {nat === 'latin' ? 'LAT' : 'ASIA'}
    </span>
  );
}

export default function IntlProspects() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [prospects, setProspects] = useState<IntlProspect[]>([]);
  const [loading, setLoading] = useState(false);
  const [signMsg, setSignMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'hitter' | 'pitcher'>('all');
  const [natFilter, setNatFilter] = useState<'all' | 'latin' | 'asian'>('all');

  const loadData = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const p = await getEngine().getIntlProspects();
    setProspects(p);
    setLoading(false);
  }, [gameStarted]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSign = async (prospectId: number) => {
    const result = await getEngine().signIntlProspect(prospectId);
    if (result.ok) {
      setSignMsg('Prospect signed!');
      await loadData();
    } else {
      setSignMsg(result.error ?? 'Signing failed.');
    }
    setTimeout(() => setSignMsg(null), 3000);
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading international prospects...</div>;

  let filtered = prospects;
  if (filter === 'hitter') filtered = filtered.filter(p => !p.isPitcher);
  if (filter === 'pitcher') filtered = filtered.filter(p => p.isPitcher);
  if (natFilter !== 'all') filtered = filtered.filter(p => p.nationality === natFilter);

  const totalBonus = prospects.reduce((s, p) => s + p.signingBonus, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>INTERNATIONAL SIGNING PERIOD</span>
        <span className="text-gray-500 text-xs">{prospects.length} prospects available</span>
      </div>

      {signMsg && (
        <div className="bg-green-900/30 border border-green-700 text-green-300 text-xs px-3 py-2 rounded">
          {signMsg}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVAILABLE</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{prospects.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HITTERS</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">
            {prospects.filter(p => !p.isPitcher).length}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PITCHERS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">
            {prospects.filter(p => p.isPitcher).length}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL BONUS POOL</div>
          <div className="text-orange-400 font-bold text-lg tabular-nums">
            ${(totalBonus / 1_000_000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600 text-xs">FILTER:</span>
        {(['all', 'hitter', 'pitcher'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {f.toUpperCase()}
          </button>
        ))}
        <span className="text-gray-700 mx-1">|</span>
        {(['all', 'latin', 'asian'] as const).map(f => (
          <button key={f} onClick={() => setNatFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
              natFilter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {f === 'all' ? 'ALL' : f === 'latin' ? 'LATIN' : 'ASIAN'}
          </button>
        ))}
      </div>

      {/* Prospect list */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">INTERNATIONAL PROSPECTS ({filtered.length})</div>
        <div className="max-h-[36rem] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-gray-600 text-xs text-center">No international prospects available.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-right">#</th>
                  <th className="px-2 py-1 text-left">NAME</th>
                  <th className="px-2 py-1">POS</th>
                  <th className="px-2 py-1">AGE</th>
                  <th className="px-2 py-1">NAT</th>
                  <th className="px-2 py-1">B/T</th>
                  <th className="px-2 py-1">GRADE</th>
                  <th className="px-2 py-1">POT</th>
                  <th className="px-2 py-1 text-right">BONUS</th>
                  <th className="px-2 py-1 text-left">SCOUT REPORT</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.prospectId} className="text-xs hover:bg-gray-800/50">
                    <td className="px-2 py-1 text-right tabular-nums text-gray-600">{i + 1}</td>
                    <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
                    <td className="px-2 py-1 text-gray-500 text-center">{p.position}</td>
                    <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.age}</td>
                    <td className="px-2 py-1 text-center"><NatFlag nat={p.nationality} /></td>
                    <td className="px-2 py-1 text-gray-500 text-center">{p.bats}/{p.throws}</td>
                    <td className="px-2 py-1 text-center"><GradeBadge grade={p.scoutGrade} /></td>
                    <td className="px-2 py-1 text-center">
                      <GradeBadge grade={Math.round((p.scoutedPotential / 550) * 80)} />
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums text-green-400">
                      ${(p.signingBonus / 1_000_000).toFixed(2)}M
                    </td>
                    <td className="px-2 py-1 text-gray-500 truncate max-w-[16rem] italic">
                      {p.reportBlurb}
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button onClick={() => handleSign(p.prospectId)}
                        className="px-2 py-0.5 bg-green-900/40 text-green-400 text-[10px] font-bold rounded hover:bg-green-900/60 transition-colors">
                        SIGN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
