import { useState, useEffect, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { AwardHistoryEntry, ChampionHistoryEntry } from '../../engine/history/awardsHistory';

type AwardType = 'all' | 'mvp' | 'cyyoung' | 'roy';

function AwardTypeBadge({ award }: { award: string }) {
  const color = award.includes('MVP') ? 'bg-yellow-900/40 text-yellow-400' :
    award.includes('Cy Young') ? 'bg-blue-900/40 text-blue-400' :
    award.includes('ROY') ? 'bg-green-900/40 text-green-400' :
    'bg-gray-800 text-gray-400';
  return <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${color}`}>{award}</span>;
}

function AwardCard({ entry, onClick }: { entry: AwardHistoryEntry; onClick: () => void }) {
  return (
    <div className="bloomberg-border hover:bg-gray-800/30 cursor-pointer transition-colors" onClick={onClick}>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <AwardTypeBadge award={entry.award} />
          <span className="text-gray-600 text-[10px] tabular-nums">{entry.season}</span>
        </div>
        <div className="text-orange-300 font-bold text-sm">{entry.name}</div>
        <div className="text-gray-500 text-xs">{entry.teamName} · {entry.position}</div>
        <div className="text-gray-400 font-mono text-[10px] mt-1">{entry.statLine}</div>
      </div>
    </div>
  );
}

export default function AwardsGallery() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [awards, setAwards] = useState<AwardHistoryEntry[]>([]);
  const [champions, setChampions] = useState<ChampionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<AwardType>('all');
  const [leagueFilter, setLeagueFilter] = useState<'all' | 'AL' | 'NL'>('all');

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    Promise.all([
      getEngine().getAwardHistory(),
      getEngine().getChampionHistory(),
    ]).then(([a, c]) => {
      setAwards(a);
      setChampions(c);
    }).finally(() => setLoading(false));
  }, [gameStarted]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading awards...</div>;

  // Filter awards
  let filtered = [...awards];
  if (typeFilter !== 'all') {
    const typeMap: Record<string, string> = { mvp: 'MVP', cyyoung: 'Cy Young', roy: 'ROY' };
    filtered = filtered.filter(a => a.award.includes(typeMap[typeFilter]));
  }
  if (leagueFilter !== 'all') {
    filtered = filtered.filter(a => a.award.includes(leagueFilter));
  }
  filtered.sort((a, b) => b.season - a.season);

  // Multi-time winners
  const winnerCounts = new Map<string, number>();
  awards.forEach(a => {
    const key = `${a.name}-${a.award.replace(/ \((AL|NL)\)/, '')}`;
    winnerCounts.set(key, (winnerCounts.get(key) ?? 0) + 1);
  });
  const multiWinners = [...winnerCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a);

  // Most decorated players
  const playerAwardCounts = new Map<string, { name: string; playerId: number; count: number; awards: string[] }>();
  awards.forEach(a => {
    const entry = playerAwardCounts.get(a.name) ?? { name: a.name, playerId: a.playerId, count: 0, awards: [] };
    entry.count++;
    entry.awards.push(`${a.award} (${a.season})`);
    playerAwardCounts.set(a.name, entry);
  });
  const mostDecorated = [...playerAwardCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const mvpCount = awards.filter(a => a.award.includes('MVP')).length;
  const cyCount = awards.filter(a => a.award.includes('Cy Young')).length;
  const royCount = awards.filter(a => a.award.includes('ROY')).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">AWARDS GALLERY</div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL AWARDS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{awards.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MVPs</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{mvpCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CY YOUNGS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{cyCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ROOKIES OF YEAR</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{royCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CHAMPIONS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{champions.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-gray-600 text-xs">AWARD:</span>
          {(['all', 'mvp', 'cyyoung', 'roy'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                typeFilter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>{f === 'cyyoung' ? 'CY YOUNG' : f.toUpperCase()}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600 text-xs">LEAGUE:</span>
          {(['all', 'AL', 'NL'] as const).map(f => (
            <button key={f} onClick={() => setLeagueFilter(f)}
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                leagueFilter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>{f}</button>
          ))}
        </div>
        <span className="text-gray-600 text-xs ml-auto">{filtered.length} awards</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Award cards */}
        <div className="col-span-2 bloomberg-border">
          <div className="bloomberg-header">AWARD WINNERS ({filtered.length})</div>
          <div className="max-h-[28rem] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-gray-600 text-xs text-center">No awards yet.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((a, i) => (
                  <AwardCard key={i} entry={a} onClick={() => goToPlayer(a.playerId)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Most decorated sidebar */}
        <div className="space-y-4">
          <div className="bloomberg-border">
            <div className="bloomberg-header text-yellow-400">MOST DECORATED</div>
            <div className="max-h-[14rem] overflow-y-auto">
              {mostDecorated.length === 0 ? (
                <div className="px-4 py-4 text-gray-600 text-xs text-center">No data yet.</div>
              ) : (
                mostDecorated.map((p, i) => (
                  <div key={i}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-800/30 cursor-pointer border-b border-gray-800/30"
                    onClick={() => goToPlayer(p.playerId)}>
                    <span className="text-gray-600 tabular-nums w-4 text-right">{i + 1}</span>
                    <span className="text-orange-300 font-bold flex-1 truncate">{p.name}</span>
                    <span className="text-yellow-400 font-bold tabular-nums">{p.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {multiWinners.length > 0 && (
            <div className="bloomberg-border">
              <div className="bloomberg-header text-orange-400">MULTI-TIME WINNERS</div>
              <div className="max-h-[14rem] overflow-y-auto">
                {multiWinners.map(([key, count], i) => {
                  const [name] = key.split('-');
                  const awardType = key.split('-').slice(1).join('-');
                  return (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 text-xs border-b border-gray-800/30">
                      <span className="text-orange-300 font-bold flex-1 truncate">{name}</span>
                      <span className="text-gray-500 text-[10px]">{awardType}</span>
                      <span className="text-yellow-400 font-bold">{count}x</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
