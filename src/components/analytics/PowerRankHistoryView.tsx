import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  getRankingsHistorySummary,
  generateDemoPowerRankingsHistory,
} from '../../engine/analytics/powerRankingsHistory';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bloomberg-border px-3 py-2 text-center">
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className="text-orange-400 font-bold text-lg tabular-nums">{value}</div>
      {sub && <div className="text-gray-600 text-[10px]">{sub}</div>}
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'rising' | 'falling' | 'stable' }) {
  const config = {
    rising:  { label: 'RISING',  color: '#22c55e', arrow: '\u25B2' },
    falling: { label: 'FALLING', color: '#ef4444', arrow: '\u25BC' },
    stable:  { label: 'STABLE',  color: '#f59e0b', arrow: '\u25C6' },
  };
  const info = config[trend];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded inline-flex items-center gap-0.5"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      <span>{info.arrow}</span>
      <span>{info.label}</span>
    </span>
  );
}

function RankChange({ current, previous }: { current: number; previous: number }) {
  const change = previous - current;
  if (change > 0) {
    return <span className="text-green-400 font-bold tabular-nums">+{change}</span>;
  }
  if (change < 0) {
    return <span className="text-red-400 font-bold tabular-nums">{change}</span>;
  }
  return <span className="text-gray-600 tabular-nums">--</span>;
}

export default function PowerRankHistoryView() {
  const { gameStarted } = useGameStore();

  const teams = useMemo(() => generateDemoPowerRankingsHistory(), []);
  const summary = useMemo(() => getRankingsHistorySummary(teams), [teams]);
  const [selectedId, setSelectedId] = useState<string | null>(teams[0]?.id ?? null);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const selected = teams.find(t => t.id === selectedId) ?? null;

  // Sort table by current rank
  const sortedTeams = useMemo(() => [...teams].sort((a, b) => a.currentRank - b.currentRank), [teams]);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>POWER RANKINGS HISTORY</span>
        <span className="text-gray-600 text-[10px]">{summary.totalTeams} TEAMS</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-2">
        <StatCard label="TEAMS" value={summary.totalTeams} />
        <StatCard label="#1 TEAM" value={summary.topTeam} />
        <StatCard label="BIGGEST RISER" value={summary.biggestRiser} />
        <StatCard label="BIGGEST FALLER" value={summary.biggestFaller} />
        <StatCard label="MOST VOLATILE" value={summary.mostVolatile} />
      </div>

      {/* Two-column layout: table + detail */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left: rankings table */}
        <div className="col-span-2 bloomberg-border">
          <div className="bloomberg-header text-gray-500">CURRENT RANKINGS</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 text-[10px]">
                <th className="px-3 py-1.5 text-left">TEAM</th>
                <th className="px-3 py-1.5 text-center">RANK</th>
                <th className="px-3 py-1.5 text-center">PREV</th>
                <th className="px-3 py-1.5 text-center">CHG</th>
                <th className="px-3 py-1.5 text-center">TREND</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map(t => {
                const isSelected = t.id === selectedId;
                return (
                  <tr key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`cursor-pointer border-b border-gray-800/30 transition-colors ${
                      isSelected ? 'bg-orange-900/20' : 'hover:bg-gray-800/20'
                    }`}>
                    <td className="px-3 py-2">
                      <div className="text-orange-300 font-bold">{t.abbr}</div>
                      <div className="text-gray-600 text-[10px]">{t.teamName}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-bold tabular-nums text-sm ${
                        t.currentRank <= 3 ? 'text-green-400' : t.currentRank <= 5 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        #{t.currentRank}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums text-gray-500">
                      #{t.previousRank}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <RankChange current={t.currentRank} previous={t.previousRank} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <TrendIndicator trend={t.trend} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right: detail panel */}
        <div className="space-y-3">
          {selected ? (
            <>
              {/* Team header */}
              <div className="bloomberg-border px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-orange-300 font-bold text-sm">{selected.abbr}</div>
                  <TrendIndicator trend={selected.trend} />
                </div>
                <div className="text-gray-600 text-[10px]">{selected.teamName}</div>
                <div className="flex items-center gap-4 mt-2 text-[10px]">
                  <div>
                    <span className="text-gray-600">RANK: </span>
                    <span className="text-orange-400 font-bold tabular-nums">#{selected.currentRank}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">AVG: </span>
                    <span className="text-gray-300 tabular-nums">{selected.avgRank.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">VOL: </span>
                    <span className="text-gray-300 tabular-nums">{selected.volatility.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* High / Low */}
              <div className="bloomberg-border px-4 py-3">
                <div className="bloomberg-header text-gray-500 -mx-4 -mt-3 px-4 py-1 mb-2">RANK RANGE</div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">HIGHEST RANK</span>
                    <span className="text-green-400 font-bold tabular-nums">#{selected.highestRank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">LOWEST RANK</span>
                    <span className="text-red-400 font-bold tabular-nums">#{selected.lowestRank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AVG RANK</span>
                    <span className="text-gray-300 tabular-nums">{selected.avgRank.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VOLATILITY</span>
                    <span className={`font-bold tabular-nums ${
                      selected.volatility >= 2.0 ? 'text-red-400'
                      : selected.volatility >= 1.0 ? 'text-yellow-400'
                      : 'text-green-400'
                    }`}>
                      {selected.volatility.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weekly history table */}
              <div className="bloomberg-border">
                <div className="bloomberg-header text-gray-500">WEEKLY HISTORY</div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-gray-900">
                      <tr className="text-gray-500 border-b border-gray-800">
                        <th className="px-2 py-1 text-left">WK</th>
                        <th className="px-2 py-1 text-center">RK</th>
                        <th className="px-2 py-1 text-right">REC</th>
                        <th className="px-2 py-1 text-right">RD</th>
                        <th className="px-2 py-1 text-right">STK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.weeklyHistory.map(w => {
                        const rdColor = w.runDiff > 0 ? '#22c55e' : w.runDiff < 0 ? '#ef4444' : '#94a3b8';
                        const streakColor = w.streak.startsWith('W') ? '#22c55e' : '#ef4444';
                        return (
                          <tr key={w.week} className="border-b border-gray-800/30">
                            <td className="px-2 py-1 tabular-nums text-gray-500">{w.week}</td>
                            <td className="px-2 py-1 text-center tabular-nums font-bold text-gray-300">
                              #{w.rank}
                            </td>
                            <td className="px-2 py-1 text-right tabular-nums text-gray-400">{w.record}</td>
                            <td className="px-2 py-1 text-right tabular-nums font-bold"
                              style={{ color: rdColor }}>
                              {w.runDiff > 0 ? '+' : ''}{w.runDiff}
                            </td>
                            <td className="px-2 py-1 text-right tabular-nums font-bold"
                              style={{ color: streakColor }}>
                              {w.streak}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div className="bloomberg-border px-4 py-3">
                <div className="bloomberg-header text-gray-500 -mx-4 -mt-3 px-4 py-1 mb-2">NOTES</div>
                <div className="text-[10px] text-gray-400 leading-relaxed">{selected.notes}</div>
              </div>
            </>
          ) : (
            <div className="bloomberg-border px-4 py-8 text-center text-gray-600 text-xs">
              Select a team to view ranking history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
