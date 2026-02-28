import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { Rule5Eligible, Rule5Selection } from '../../engine/offseason/rule5Draft';

function OvrBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 75 ? 'text-green-400' : ovr >= 60 ? 'text-orange-400' : ovr >= 45 ? 'text-gray-400' : 'text-red-400';
  return <span className={`tabular-nums font-bold ${color}`}>{ovr}</span>;
}

function GradeBadge({ grade }: { grade: number }) {
  const color = grade >= 60 ? 'text-green-400' : grade >= 50 ? 'text-orange-400' : grade >= 40 ? 'text-gray-300' : 'text-red-400';
  return <span className={`font-bold tabular-nums ${color}`}>{grade}</span>;
}

export default function Rule5Protection() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [eligible, setEligible] = useState<Rule5Eligible[]>([]);
  const [history, setHistory] = useState<Rule5Selection[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const [elig, hist] = await Promise.all([
      getEngine().getRule5Eligible(),
      getEngine().getRule5History(),
    ]);
    setEligible(elig);
    setHistory(hist);
    setLoading(false);
  }, [gameStarted]);

  useEffect(() => { loadData(); }, [loadData]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  const handleProtect = async (playerId: number) => {
    const result = await getEngine().protectFromRule5(playerId);
    if (result.ok) {
      setMsg('Player added to 40-man roster!');
      await loadData();
    } else {
      setMsg(result.error ?? 'Protection failed.');
    }
    setTimeout(() => setMsg(null), 3000);
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading Rule 5 data...</div>;

  const myEligible = eligible.filter(p => p.teamId === userTeamId);
  const otherEligible = eligible.filter(p => p.teamId !== userTeamId);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>RULE 5 DRAFT PROTECTION</span>
        <span className="text-gray-500 text-xs">{eligible.length} eligible players</span>
      </div>

      {msg && (
        <div className="bg-orange-900/30 border border-orange-700 text-orange-300 text-xs px-3 py-2 rounded">
          {msg}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">YOUR EXPOSED</div>
          <div className={`font-bold text-xl tabular-nums ${myEligible.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {myEligible.length}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LEAGUE ELIGIBLE</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{eligible.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PAST SELECTIONS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{history.length}</div>
        </div>
      </div>

      {/* Your exposed players */}
      {myEligible.length > 0 && (
        <div className="bloomberg-border border-red-900/30">
          <div className="bloomberg-header text-red-400">YOUR EXPOSED PLAYERS ({myEligible.length})</div>
          <div className="max-h-[20rem] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-left">PLAYER</th>
                  <th className="px-2 py-1">POS</th>
                  <th className="px-2 py-1">AGE</th>
                  <th className="px-2 py-1">OVR</th>
                  <th className="px-2 py-1">POT</th>
                  <th className="px-2 py-1">GRADE</th>
                  <th className="px-2 py-1">YEARS IN ORG</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {myEligible.map(p => (
                  <tr key={p.playerId} className="text-xs hover:bg-gray-800/50">
                    <td className="px-2 py-1 font-bold text-orange-300 cursor-pointer hover:underline"
                      onClick={() => goToPlayer(p.playerId)}>{p.name}</td>
                    <td className="px-2 py-1 text-gray-500 text-center">{p.position}</td>
                    <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.age}</td>
                    <td className="px-2 py-1 text-center"><OvrBadge ovr={p.overall} /></td>
                    <td className="px-2 py-1 tabular-nums text-gray-600 text-center">{p.potential}</td>
                    <td className="px-2 py-1 text-center"><GradeBadge grade={p.scoutGrade} /></td>
                    <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.seasonsInOrg}</td>
                    <td className="px-2 py-1 text-center">
                      <button onClick={() => handleProtect(p.playerId)}
                        className="px-2 py-0.5 bg-blue-900/40 text-blue-400 text-[10px] font-bold rounded hover:bg-blue-900/60 transition-colors">
                        PROTECT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* League-wide eligible */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">LEAGUE-WIDE ELIGIBLE ({otherEligible.length})</div>
        <div className="max-h-[20rem] overflow-y-auto">
          {otherEligible.length === 0 ? (
            <div className="px-4 py-8 text-gray-600 text-xs text-center">No exposed players in other organizations.</div>
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
                  <th className="px-2 py-1 text-left">TEAM</th>
                </tr>
              </thead>
              <tbody>
                {otherEligible.sort((a, b) => b.scoutGrade - a.scoutGrade).map(p => (
                  <tr key={p.playerId} className="text-xs hover:bg-gray-800/50">
                    <td className="px-2 py-1 font-bold text-orange-300 cursor-pointer hover:underline"
                      onClick={() => goToPlayer(p.playerId)}>{p.name}</td>
                    <td className="px-2 py-1 text-gray-500 text-center">{p.position}</td>
                    <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.age}</td>
                    <td className="px-2 py-1 text-center"><OvrBadge ovr={p.overall} /></td>
                    <td className="px-2 py-1 tabular-nums text-gray-600 text-center">{p.potential}</td>
                    <td className="px-2 py-1 text-center"><GradeBadge grade={p.scoutGrade} /></td>
                    <td className="px-2 py-1 text-gray-400">{p.teamName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rule 5 history */}
      {history.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">RULE 5 DRAFT HISTORY ({history.length} selections)</div>
          <div className="max-h-[16rem] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-left">PLAYER</th>
                  <th className="px-2 py-1">POS</th>
                  <th className="px-2 py-1">OVR</th>
                  <th className="px-2 py-1 text-left">FROM</th>
                  <th className="px-2 py-1 text-left">TO</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={i} className="text-xs hover:bg-gray-800/50">
                    <td className="px-2 py-1 font-bold text-orange-300">{r.playerName}</td>
                    <td className="px-2 py-1 text-gray-500 text-center">{r.position}</td>
                    <td className="px-2 py-1 text-center"><OvrBadge ovr={r.overall} /></td>
                    <td className="px-2 py-1 text-red-400">{r.fromTeamName}</td>
                    <td className="px-2 py-1 text-green-400">{r.toTeamName}</td>
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
