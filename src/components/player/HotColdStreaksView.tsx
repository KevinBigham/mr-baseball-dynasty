import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  STREAK_DISPLAY,
  generateDemoStreaks,
  getStreakSummary,
  type StreakPlayer,
  type StreakType,
} from '../../engine/player/hotColdStreaks';

function StreakCard({ player }: { player: StreakPlayer }) {
  const streakInfo = STREAK_DISPLAY[player.streak];
  const ovrColor = player.adjustedOvr >= 85 ? '#22c55e' : player.adjustedOvr >= 75 ? '#eab308' : '#94a3b8';
  const trendEmoji = player.trending === 'up' ? '📈' : player.trending === 'down' ? '📉' : '➡️';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {player.adjustedOvr}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-bold text-sm">{player.name}</span>
                <span>{trendEmoji}</span>
              </div>
              <div className="text-gray-600 text-[10px]">{player.pos} | Base OVR {player.overall}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: streakInfo.color + '22', color: streakInfo.color }}>
            {streakInfo.emoji} {streakInfo.label}
          </span>
        </div>

        {/* Streak length and modifier */}
        <div className="flex items-center gap-3 text-[10px] mb-2">
          <span className="text-gray-600">Streak: <span className="text-gray-300 font-bold">{player.streakLength} games</span></span>
          <span className="font-bold" style={{ color: streakInfo.ovrMod > 0 ? '#22c55e' : streakInfo.ovrMod < 0 ? '#ef4444' : '#6b7280' }}>
            {streakInfo.ovrMod > 0 ? '+' : ''}{streakInfo.ovrMod} OVR
          </span>
        </div>

        {/* Last 10 stats */}
        {player.last10 && (
          <div className="text-[10px] mb-2">
            <span className="text-gray-600 font-bold">LAST 10: </span>
            <span className="text-gray-400">
              {player.last10.avg} AVG | {player.last10.hr} HR | {player.last10.rbi} RBI | {player.last10.ops} OPS
            </span>
          </div>
        )}
        {player.last10Pitching && (
          <div className="text-[10px] mb-2">
            <span className="text-gray-600 font-bold">LAST {player.last10Pitching.gp}: </span>
            <span className="text-gray-400">
              {player.last10Pitching.era} ERA | {player.last10Pitching.k} K | {player.last10Pitching.whip} WHIP
            </span>
          </div>
        )}

        {/* Recent games */}
        <div className="space-y-0.5">
          {player.recentGames.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px] text-gray-600">
              <span className="w-16">{g.date}</span>
              <span className={g.result.startsWith('W') ? 'text-green-500' : 'text-red-400'}>{g.result}</span>
              <span className="text-gray-400">{g.highlight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HotColdStreaksView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<StreakPlayer[]>(() => generateDemoStreaks());
  const [filter, setFilter] = useState<'all' | 'hitters' | 'pitchers'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getStreakSummary(players);
  const filtered = filter === 'all' ? players : filter === 'hitters' ? players.filter(p => !p.isPitcher) : players.filter(p => p.isPitcher);

  // Sort: on_fire first, then hot, then neutral, then cold, then ice_cold
  const streakOrder: Record<StreakType, number> = { on_fire: 0, hot: 1, warm: 2, neutral: 3, cold: 4, ice_cold: 5 };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>HOT & COLD STREAKS</span>
        <span className="text-gray-600 text-[10px]">{players.length} PLAYERS TRACKED</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ON FIRE</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.onFire}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HOT</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.hot}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COLD</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.cold}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ICE COLD</div>
          <div className="text-blue-600 font-bold text-xl tabular-nums">{summary.iceCold}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG ADJ</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.avgAdjustment >= 0 ? '#22c55e' : '#ef4444' }}>
            {summary.avgAdjustment > 0 ? '+' : ''}{summary.avgAdjustment}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'hitters', 'pitchers'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.sort((a, b) => streakOrder[a.streak] - streakOrder[b.streak]).map(p => (
          <StreakCard key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
