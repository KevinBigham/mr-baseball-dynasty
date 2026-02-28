import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import type { AwardHistoryEntry, ChampionHistoryEntry, TransactionLog } from '../../engine/history/awardsHistory';

function StatCard({ label, value, color = 'text-orange-400' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bloomberg-border px-3 py-2 text-center">
      <div className="text-gray-500 text-[10px] font-bold">{label}</div>
      <div className={`font-bold text-lg tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

export default function SeasonRecap() {
  const { gameStarted, season, userTeamId } = useGameStore();
  const { franchiseHistory } = useLeagueStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [awards, setAwards] = useState<AwardHistoryEntry[]>([]);
  const [champions, setChampions] = useState<ChampionHistoryEntry[]>([]);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewSeason, setViewSeason] = useState(season - 1);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    Promise.all([
      getEngine().getAwardHistory(),
      getEngine().getChampionHistory(),
      getEngine().getTransactionLog(),
    ]).then(([a, c, t]) => {
      setAwards(a);
      setChampions(c);
      setTransactions(t);
    }).finally(() => setLoading(false));
  }, [gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading season recap...</div>;

  const seasonData = franchiseHistory.find(h => h.season === viewSeason);
  const seasonAwards = awards.filter(a => a.season === viewSeason);
  const champion = champions.find(c => c.season === viewSeason);
  const seasonTxns = transactions.filter(t => t.season === viewSeason);
  const availableSeasons = franchiseHistory.map(h => h.season).sort((a, b) => b - a);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SEASON RECAP</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">SEASON:</span>
          <select value={viewSeason}
            onChange={e => setViewSeason(Number(e.target.value))}
            className="bg-gray-800 text-orange-400 text-xs px-2 py-0.5 rounded border border-gray-700">
            {availableSeasons.length > 0 ? availableSeasons.map(s => (
              <option key={s} value={s}>{s}</option>
            )) : <option value={viewSeason}>{viewSeason}</option>}
          </select>
        </div>
      </div>

      {!seasonData && (
        <div className="text-gray-600 text-xs text-center py-8">
          No data for season {viewSeason}. Simulate a season first.
        </div>
      )}

      {seasonData && (
        <>
          {/* Your record */}
          <div className="grid grid-cols-6 gap-3">
            <StatCard label="RECORD" value={`${seasonData.wins}-${seasonData.losses}`}
              color={seasonData.wins >= 90 ? 'text-green-400' : seasonData.wins >= 81 ? 'text-orange-400' : 'text-red-400'} />
            <StatCard label="WIN PCT" value={seasonData.pct.toFixed(3)} />
            <StatCard label="POSTSEASON"
              value={seasonData.playoffResult ?? 'MISSED'}
              color={seasonData.playoffResult === 'Champion' ? 'text-yellow-400' : seasonData.playoffResult ? 'text-blue-400' : 'text-gray-500'} />
            <StatCard label="LG ERA" value={seasonData.leagueERA.toFixed(2)} color="text-gray-400" />
            <StatCard label="LG BA" value={`.${seasonData.leagueBA.toFixed(3).slice(2)}`} color="text-gray-400" />
            <StatCard label="BREAKOUTS" value={String(seasonData.breakoutHits)} color="text-green-400" />
          </div>

          {/* Key moment */}
          {seasonData.keyMoment && (
            <div className="bloomberg-border px-4 py-3">
              <div className="text-gray-500 text-[10px] font-bold mb-1">KEY MOMENT</div>
              <div className="text-orange-300 text-sm italic">{seasonData.keyMoment}</div>
            </div>
          )}

          {/* Champion */}
          {champion && (
            <div className={`bloomberg-border px-4 py-3 ${champion.teamId === userTeamId ? 'border-yellow-800' : ''}`}>
              <div className="text-gray-500 text-[10px] font-bold mb-1">WORLD SERIES CHAMPION</div>
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 font-bold text-lg">{champion.teamName}</span>
                <span className="text-gray-400 tabular-nums text-xs">{champion.record}</span>
                {champion.mvpName && (
                  <span className="text-gray-500 text-xs">WS MVP: <span className="text-orange-300 font-bold">{champion.mvpName}</span></span>
                )}
              </div>
            </div>
          )}

          {/* Awards */}
          {seasonAwards.length > 0 && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">AWARD WINNERS</div>
              <div className="grid grid-cols-3 gap-0 divide-x divide-gray-800">
                {seasonAwards.map((a, i) => (
                  <div key={i} className="px-3 py-2">
                    <div className="text-yellow-500 text-[10px] font-bold">{a.award}</div>
                    <div className="text-orange-300 font-bold text-sm">{a.name}</div>
                    <div className="text-gray-500 text-xs">{a.teamName}</div>
                    <div className="text-gray-400 font-mono text-[10px] mt-0.5">{a.statLine}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Season transactions */}
          {seasonTxns.length > 0 && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">SEASON TRANSACTIONS ({seasonTxns.length})</div>
              <div className="max-h-[16rem] overflow-y-auto">
                {seasonTxns.slice(0, 20).map((t, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 text-xs border-b border-gray-800/50 last:border-b-0">
                    <span className={`px-1 py-0.5 text-[10px] font-bold rounded ${
                      t.type === 'Trade' ? 'bg-blue-900/30 text-blue-400' :
                      t.type === 'Signing' ? 'bg-green-900/30 text-green-400' :
                      t.type === 'Draft' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>{t.type.toUpperCase()}</span>
                    <span className="text-gray-400 flex-1 truncate">{t.description}</span>
                    <span className="text-gray-600 text-[10px]">{t.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organizational health at season end */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bloomberg-border px-3 py-2">
              <div className="text-gray-500 text-[10px] font-bold">OWNER PATIENCE (END OF SEASON)</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    seasonData.ownerPatienceEnd >= 60 ? 'bg-green-500' : seasonData.ownerPatienceEnd >= 30 ? 'bg-orange-500' : 'bg-red-500'
                  }`} style={{ width: `${seasonData.ownerPatienceEnd}%` }} />
                </div>
                <span className="tabular-nums text-gray-400 text-xs font-bold">{seasonData.ownerPatienceEnd}</span>
              </div>
            </div>
            <div className="bloomberg-border px-3 py-2">
              <div className="text-gray-500 text-[10px] font-bold">TEAM MORALE (END OF SEASON)</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    seasonData.teamMoraleEnd >= 60 ? 'bg-green-500' : seasonData.teamMoraleEnd >= 30 ? 'bg-orange-500' : 'bg-red-500'
                  }`} style={{ width: `${seasonData.teamMoraleEnd}%` }} />
                </div>
                <span className="tabular-nums text-gray-400 text-xs font-bold">{seasonData.teamMoraleEnd}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
