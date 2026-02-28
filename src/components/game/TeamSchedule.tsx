import { useState, useEffect, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { StandingsData } from '../../types/league';

interface ScheduleGame {
  gameId: number;
  date: string;
  opponentId: number;
  opponentAbbr: string;
  isHome: boolean;
  isDivisional: boolean;
  isInterleague: boolean;
  played: boolean;
  result?: { won: boolean; teamScore: number; oppScore: number; innings: number; walkOff?: boolean };
}

type ViewMode = 'list' | 'calendar';

function ResultBadge({ won }: { won: boolean }) {
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
      won ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
    }`}>
      {won ? 'W' : 'L'}
    </span>
  );
}

function StreakIndicator({ games }: { games: ScheduleGame[] }) {
  const played = games.filter(g => g.played && g.result);
  if (played.length === 0) return null;

  // Calculate current streak from most recent
  let streak = 0;
  let streakType: 'W' | 'L' | null = null;
  for (let i = played.length - 1; i >= 0; i--) {
    const won = played[i].result!.won;
    if (streakType === null) {
      streakType = won ? 'W' : 'L';
      streak = 1;
    } else if ((won && streakType === 'W') || (!won && streakType === 'L')) {
      streak++;
    } else break;
  }

  // Last 10 games
  const last10 = played.slice(-10);
  const last10W = last10.filter(g => g.result!.won).length;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <span className="text-gray-600 text-[10px]">STREAK:</span>
        <span className={`font-bold text-xs ${streakType === 'W' ? 'text-green-400' : 'text-red-400'}`}>
          {streakType}{streak}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-600 text-[10px]">L10:</span>
        <span className="text-gray-300 font-bold text-xs">{last10W}-{last10.length - last10W}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {last10.map((g, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${g.result!.won ? 'bg-green-500' : 'bg-red-500'}`} />
        ))}
      </div>
    </div>
  );
}

function CalendarCell({ game }: { game?: ScheduleGame }) {
  if (!game) return <div className="h-10 bg-gray-900/30" />;

  return (
    <div className={`h-10 px-1 py-0.5 text-[10px] border border-gray-800/30 ${
      game.played
        ? game.result?.won ? 'bg-green-900/10' : 'bg-red-900/10'
        : 'bg-gray-900/20'
    }`}>
      <div className="flex items-center justify-between">
        <span className={`font-bold ${game.isHome ? 'text-gray-400' : 'text-gray-500'}`}>
          {game.isHome ? 'vs' : '@'} {game.opponentAbbr}
        </span>
        {game.played && game.result && (
          <span className={`font-bold ${game.result.won ? 'text-green-400' : 'text-red-400'}`}>
            {game.result.won ? 'W' : 'L'}
          </span>
        )}
      </div>
      {game.played && game.result && (
        <div className="text-gray-500 tabular-nums">
          {game.result.teamScore}-{game.result.oppScore}
        </div>
      )}
    </div>
  );
}

export default function TeamSchedule() {
  const { gameStarted, userTeamId } = useGameStore();
  const [schedule, setSchedule] = useState<ScheduleGame[]>([]);
  const [standings, setStandings] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [teamId, setTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (userTeamId != null) setTeamId(userTeamId);
  }, [userTeamId]);

  useEffect(() => {
    if (!gameStarted || teamId == null) return;
    setLoading(true);
    Promise.all([
      getEngine().getTeamSchedule(teamId),
      getEngine().getStandings(),
    ]).then(([s, st]) => {
      setSchedule(s);
      setStandings(st);
    }).finally(() => setLoading(false));
  }, [gameStarted, teamId]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading schedule...</div>;

  const teams = standings ? [...standings.standings].sort((a, b) => a.name.localeCompare(b.name)) : [];
  const teamRow = standings?.standings.find(t => t.teamId === teamId);

  const played = schedule.filter(g => g.played);
  const wins = played.filter(g => g.result?.won).length;
  const losses = played.filter(g => g.result && !g.result.won).length;
  const homeGames = played.filter(g => g.isHome);
  const homeW = homeGames.filter(g => g.result?.won).length;
  const awayGames = played.filter(g => !g.isHome);
  const awayW = awayGames.filter(g => g.result?.won).length;
  const divGames = played.filter(g => g.isDivisional);
  const divW = divGames.filter(g => g.result?.won).length;

  // Group by month for calendar view
  const monthGroups = useMemo(() => {
    const groups = new Map<string, ScheduleGame[]>();
    for (const g of schedule) {
      const month = g.date.slice(0, 7); // YYYY-MM
      const arr = groups.get(month) ?? [];
      arr.push(g);
      groups.set(month, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [schedule]);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TEAM SCHEDULE</span>
        <div className="flex items-center gap-2">
          <select value={teamId ?? ''}
            onChange={e => setTeamId(Number(e.target.value))}
            className="bg-gray-800 text-orange-400 text-xs px-2 py-0.5 rounded border border-gray-700">
            {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.abbreviation}</option>)}
          </select>
          <div className="flex rounded overflow-hidden border border-gray-700">
            <button onClick={() => setViewMode('list')}
              className={`px-2 py-0.5 text-[10px] font-bold ${viewMode === 'list' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400'}`}>
              LIST
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`px-2 py-0.5 text-[10px] font-bold ${viewMode === 'calendar' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400'}`}>
              CAL
            </button>
          </div>
        </div>
      </div>

      {/* Record summary */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RECORD</div>
          <div className="text-orange-400 font-bold text-lg tabular-nums">{wins}-{losses}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HOME</div>
          <div className="text-gray-300 font-bold text-sm tabular-nums">{homeW}-{homeGames.length - homeW}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AWAY</div>
          <div className="text-gray-300 font-bold text-sm tabular-nums">{awayW}-{awayGames.length - awayW}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DIVISION</div>
          <div className="text-gray-300 font-bold text-sm tabular-nums">{divW}-{divGames.length - divW}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GAMES LEFT</div>
          <div className="text-gray-300 font-bold text-lg tabular-nums">{schedule.length - played.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GB</div>
          <div className="text-gray-300 font-bold text-lg tabular-nums">{teamRow?.gb ?? '—'}</div>
        </div>
      </div>

      <StreakIndicator games={schedule} />

      {viewMode === 'list' ? (
        /* List view */
        <div className="bloomberg-border">
          <div className="bloomberg-header">GAME-BY-GAME ({schedule.length} games)</div>
          <div className="max-h-[36rem] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-right">#</th>
                  <th className="px-2 py-1 text-left">DATE</th>
                  <th className="px-2 py-1 text-center">H/A</th>
                  <th className="px-2 py-1 text-left">OPP</th>
                  <th className="px-2 py-1 text-center">RESULT</th>
                  <th className="px-2 py-1 text-center">SCORE</th>
                  <th className="px-2 py-1 text-center">INN</th>
                  <th className="px-2 py-1">NOTE</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((g, i) => (
                  <tr key={g.gameId} className={`text-xs hover:bg-gray-800/50 ${
                    !g.played ? 'opacity-40' : ''
                  }`}>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-600">{i + 1}</td>
                    <td className="px-2 py-1 text-gray-500">{g.date}</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`text-[10px] font-bold ${g.isHome ? 'text-gray-300' : 'text-gray-500'}`}>
                        {g.isHome ? 'HOME' : 'AWAY'}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-orange-300 font-bold">{g.isHome ? 'vs' : '@'} {g.opponentAbbr}</span>
                      {g.isDivisional && <span className="text-yellow-600 text-[10px] ml-1">DIV</span>}
                      {g.isInterleague && <span className="text-blue-600 text-[10px] ml-1">IL</span>}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {g.played && g.result && <ResultBadge won={g.result.won} />}
                      {!g.played && <span className="text-gray-700 text-[10px]">—</span>}
                    </td>
                    <td className="px-2 py-1 text-center tabular-nums text-gray-400">
                      {g.played && g.result ? `${g.result.teamScore}-${g.result.oppScore}` : '—'}
                    </td>
                    <td className="px-2 py-1 text-center tabular-nums text-gray-500">
                      {g.played && g.result ? (g.result.innings !== 9 ? `F/${g.result.innings}` : '9') : '—'}
                    </td>
                    <td className="px-2 py-1">
                      {g.result?.walkOff && (
                        <span className="px-1 py-0.5 text-[10px] font-bold rounded bg-orange-900/40 text-orange-400">WALK-OFF</span>
                      )}
                      {g.played && g.result && g.result.innings > 9 && (
                        <span className="px-1 py-0.5 text-[10px] font-bold rounded bg-blue-900/40 text-blue-400">EXTRAS</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Calendar view */
        <div className="space-y-4">
          {monthGroups.map(([month, games]) => (
            <div key={month} className="bloomberg-border">
              <div className="bloomberg-header">{month}</div>
              <div className="grid grid-cols-7 gap-0">
                {games.map(g => <CalendarCell key={g.gameId} game={g} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
