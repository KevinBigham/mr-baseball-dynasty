import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore, type SeasonSummary } from '../../store/leagueStore';
import type { ChampionHistoryEntry, AwardHistoryEntry } from '../../engine/history/awardsHistory';

function WinBar({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses || 1;
  const pct = wins / total;
  const color = pct >= 0.580 ? 'bg-green-500' : pct >= 0.500 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden w-20">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

function PlayoffBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-gray-700 text-xs">—</span>;
  const colors: Record<string, string> = {
    'Champion': 'bg-yellow-900/40 text-yellow-400',
    'WS': 'bg-orange-900/30 text-orange-400',
    'CS': 'bg-blue-900/30 text-blue-400',
    'DS': 'bg-purple-900/30 text-purple-400',
    'WC': 'bg-gray-800 text-gray-400',
  };
  const labels: Record<string, string> = {
    'Champion': 'CHAMP',
    'WS': 'WORLD SERIES',
    'CS': 'CHAMPIONSHIP',
    'DS': 'DIVISION SERIES',
    'WC': 'WILD CARD',
  };
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${colors[result] ?? 'bg-gray-800 text-gray-500'}`}>
      {labels[result] ?? result}
    </span>
  );
}

export default function FranchiseOverview() {
  const { gameStarted, season, userTeamId } = useGameStore();
  const { franchiseHistory } = useLeagueStore();
  const [champions, setChampions] = useState<ChampionHistoryEntry[]>([]);
  const [awards, setAwards] = useState<AwardHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    Promise.all([
      getEngine().getChampionHistory(),
      getEngine().getAwardHistory(),
    ]).then(([c, a]) => {
      setChampions(c);
      setAwards(a);
    }).finally(() => setLoading(false));
  }, [gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading franchise data...</div>;

  // Aggregate stats
  const totalWins = franchiseHistory.reduce((s, h) => s + h.wins, 0);
  const totalLosses = franchiseHistory.reduce((s, h) => s + h.losses, 0);
  const totalPct = (totalWins + totalLosses) > 0 ? totalWins / (totalWins + totalLosses) : 0;
  const championships = franchiseHistory.filter(h => h.playoffResult === 'Champion').length;
  const playoffAppearances = franchiseHistory.filter(h => h.playoffResult != null).length;
  const bestRecord = franchiseHistory.reduce((best, h) => h.wins > (best?.wins ?? 0) ? h : best, null as SeasonSummary | null);
  const worstRecord = franchiseHistory.reduce((worst, h) => h.wins < (worst?.wins ?? 999) ? h : worst, null as SeasonSummary | null);

  // Awards won by user team
  const userTeamAwards = awards.filter(a => {
    // We don't have team ID in award history easily, but we can check against the summaries
    return true; // Show all for now
  });

  // Sorted by season descending
  const history = [...franchiseHistory].sort((a, b) => b.season - a.season);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">FRANCHISE OVERVIEW</div>

      {/* Summary cards */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SEASONS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{franchiseHistory.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RECORD</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{totalWins}-{totalLosses}</div>
          <div className="text-gray-600 text-[10px] tabular-nums">{totalPct.toFixed(3)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TITLES</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{championships}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PLAYOFFS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{playoffAppearances}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">BEST SEASON</div>
          <div className="text-green-400 font-bold text-lg tabular-nums">
            {bestRecord ? `${bestRecord.wins}-${bestRecord.losses}` : '—'}
          </div>
          <div className="text-gray-600 text-[10px]">{bestRecord?.season ?? ''}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">WORST SEASON</div>
          <div className="text-red-400 font-bold text-lg tabular-nums">
            {worstRecord ? `${worstRecord.wins}-${worstRecord.losses}` : '—'}
          </div>
          <div className="text-gray-600 text-[10px]">{worstRecord?.season ?? ''}</div>
        </div>
      </div>

      {/* Win chart - visual history */}
      {history.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">WIN HISTORY</div>
          <div className="p-3 flex items-end gap-1 h-24 overflow-x-auto">
            {[...history].reverse().map(h => {
              const pct = (h.wins + h.losses) > 0 ? h.wins / (h.wins + h.losses) : 0;
              const height = Math.max(4, pct * 100);
              const color = h.playoffResult === 'Champion'
                ? 'bg-yellow-500'
                : h.playoffResult
                  ? 'bg-orange-500'
                  : pct >= 0.5
                    ? 'bg-green-600'
                    : 'bg-red-600';
              return (
                <div key={h.season} className="flex flex-col items-center gap-0.5" title={`${h.season}: ${h.wins}-${h.losses}`}>
                  <div className={`w-4 ${color} rounded-t`} style={{ height: `${height}%` }} />
                  <span className="text-[8px] text-gray-700 tabular-nums">{h.season.toString().slice(-2)}</span>
                </div>
              );
            })}
          </div>
          <div className="px-3 pb-2 flex gap-4 text-[10px] text-gray-600">
            <span><span className="inline-block w-2 h-2 bg-yellow-500 rounded mr-1" />Champion</span>
            <span><span className="inline-block w-2 h-2 bg-orange-500 rounded mr-1" />Playoffs</span>
            <span><span className="inline-block w-2 h-2 bg-green-600 rounded mr-1" />Winning</span>
            <span><span className="inline-block w-2 h-2 bg-red-600 rounded mr-1" />Losing</span>
          </div>
        </div>
      )}

      {/* Season-by-season table */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">SEASON BY SEASON</div>
        <div className="max-h-[28rem] overflow-y-auto">
          {history.length === 0 ? (
            <div className="px-4 py-8 text-gray-600 text-xs text-center">
              No seasons played yet. Simulate your first season!
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-right">YEAR</th>
                  <th className="px-2 py-1 text-right">W</th>
                  <th className="px-2 py-1 text-right">L</th>
                  <th className="px-2 py-1 text-right">PCT</th>
                  <th className="px-2 py-1 text-center">WIN BAR</th>
                  <th className="px-2 py-1 text-center">POSTSEASON</th>
                  <th className="px-2 py-1 text-right">LG ERA</th>
                  <th className="px-2 py-1 text-right">LG BA</th>
                  <th className="px-2 py-1 text-left">KEY MOMENT</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.season} className={`text-xs hover:bg-gray-800/50 ${
                    h.playoffResult === 'Champion' ? 'bg-yellow-900/10' : ''
                  }`}>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-500 font-bold">{h.season}</td>
                    <td className="px-2 py-1 text-right tabular-nums font-bold text-green-400">{h.wins}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-red-400">{h.losses}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-orange-400">{h.pct.toFixed(3)}</td>
                    <td className="px-2 py-1 text-center"><WinBar wins={h.wins} losses={h.losses} /></td>
                    <td className="px-2 py-1 text-center"><PlayoffBadge result={h.playoffResult} /></td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-400">{h.leagueERA.toFixed(2)}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-400">.{h.leagueBA.toFixed(3).slice(2)}</td>
                    <td className="px-2 py-1 text-gray-500 truncate max-w-[16rem]">{h.keyMoment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* League champions */}
      {champions.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">LEAGUE CHAMPIONS</div>
          <div className="max-h-[16rem] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-right">YEAR</th>
                  <th className="px-2 py-1 text-left">CHAMPION</th>
                  <th className="px-2 py-1 text-center">RECORD</th>
                  <th className="px-2 py-1 text-left">WS MVP</th>
                </tr>
              </thead>
              <tbody>
                {champions.map((c, i) => (
                  <tr key={i} className={`text-xs hover:bg-gray-800/50 ${
                    c.teamId === userTeamId ? 'bg-orange-900/20' : ''
                  }`}>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-500">{c.season}</td>
                    <td className="px-2 py-1 font-bold text-yellow-400">{c.teamName}</td>
                    <td className="px-2 py-1 text-center tabular-nums text-gray-400">{c.record}</td>
                    <td className="px-2 py-1 text-orange-300">{c.mvpName ?? '—'}</td>
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
