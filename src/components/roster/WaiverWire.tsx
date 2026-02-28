import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { WaiverPlayer, WaiverClaim } from '../../engine/waivers/waiverWire';

function OvrBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 75 ? 'text-green-400' : ovr >= 60 ? 'text-orange-400' : ovr >= 45 ? 'text-gray-400' : 'text-red-400';
  return <span className={`tabular-nums font-bold ${color}`}>{ovr}</span>;
}

function GradeBadge({ grade }: { grade: number }) {
  const label = grade >= 70 ? 'A' : grade >= 60 ? 'B+' : grade >= 55 ? 'B' : grade >= 50 ? 'C+' : grade >= 45 ? 'C' : grade >= 40 ? 'D' : 'F';
  const color = grade >= 60 ? 'text-green-400' : grade >= 50 ? 'text-orange-400' : grade >= 40 ? 'text-gray-400' : 'text-red-400';
  return <span className={`font-bold ${color}`}>{label}</span>;
}

export default function WaiverWire() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [available, setAvailable] = useState<WaiverPlayer[]>([]);
  const [claims, setClaims] = useState<WaiverClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const [wp, wh] = await Promise.all([
      getEngine().getWaiverPlayers(),
      getEngine().getWaiverHistory(),
    ]);
    setAvailable(wp);
    setClaims(wh);
    setLoading(false);
  }, [gameStarted]);

  useEffect(() => { loadData(); }, [loadData]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  const handleClaim = async (playerId: number) => {
    const result = await getEngine().claimWaiverPlayer(playerId);
    if (result.ok) {
      setClaimMsg('Player claimed successfully!');
      await loadData();
    } else {
      setClaimMsg(result.error ?? 'Claim failed.');
    }
    setTimeout(() => setClaimMsg(null), 3000);
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading waiver wire...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>WAIVER WIRE</span>
        <span className="text-gray-500 text-xs">
          {available.length} players available
        </span>
      </div>

      {claimMsg && (
        <div className="bg-orange-900/30 border border-orange-700 text-orange-300 text-xs px-3 py-2 rounded">
          {claimMsg}
        </div>
      )}

      {/* Available players */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">PLAYERS ON WAIVERS ({available.length})</div>
        <div className="max-h-[28rem] overflow-y-auto">
          {available.length === 0 ? (
            <div className="px-4 py-8 text-gray-600 text-xs text-center">No players currently on waivers.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-left">PLAYER</th>
                  <th className="px-2 py-1">POS</th>
                  <th className="px-2 py-1">AGE</th>
                  <th className="px-2 py-1">OVR</th>
                  <th className="px-2 py-1">POT</th>
                  <th className="px-2 py-1">GRADE</th>
                  <th className="px-2 py-1 text-left">FROM</th>
                  <th className="px-2 py-1 text-right">SALARY</th>
                  <th className="px-2 py-1">YRS</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {available.map(p => (
                  <tr key={p.playerId} className="text-xs hover:bg-gray-800/50">
                    <td className="px-2 py-1 font-bold text-orange-300 cursor-pointer hover:underline"
                      onClick={() => goToPlayer(p.playerId)}>{p.name}</td>
                    <td className="px-2 py-1 text-gray-500 text-center">{p.position}</td>
                    <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.age}</td>
                    <td className="px-2 py-1 text-center"><OvrBadge ovr={p.overall} /></td>
                    <td className="px-2 py-1 tabular-nums text-gray-600 text-center">{p.potential}</td>
                    <td className="px-2 py-1 text-center"><GradeBadge grade={p.scoutGrade} /></td>
                    <td className="px-2 py-1 text-gray-400">{p.formerTeamName}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-400">
                      ${(p.salary / 1_000_000).toFixed(1)}M
                    </td>
                    <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.contractYears}</td>
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => handleClaim(p.playerId)}
                        className="px-2 py-0.5 bg-green-900/40 text-green-400 text-[10px] font-bold rounded hover:bg-green-900/60 transition-colors">
                        CLAIM
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Past claims */}
      {claims.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">RECENT WAIVER CLAIMS ({claims.length})</div>
          <div className="max-h-[20rem] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-left">PLAYER</th>
                  <th className="px-2 py-1">POS</th>
                  <th className="px-2 py-1 text-left">CLAIMED BY</th>
                  <th className="px-2 py-1 text-left">FROM</th>
                  <th className="px-2 py-1 text-right">SALARY</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c, i) => (
                  <tr key={i} className="text-xs hover:bg-gray-800/50">
                    <td className="px-2 py-1 font-bold text-orange-300">{c.playerName}</td>
                    <td className="px-2 py-1 text-gray-500 text-center">{c.position}</td>
                    <td className="px-2 py-1 text-green-400">{c.claimTeamName}</td>
                    <td className="px-2 py-1 text-red-400">{c.formerTeamName}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-400">
                      ${(c.salary / 1_000_000).toFixed(1)}M
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
