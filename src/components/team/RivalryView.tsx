import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  TIER_DISPLAY,
  generateDemoRivalries,
  getHeatLabel,
  getWinPct,
  type Rivalry,
  type RivalryTier,
} from '../../engine/team/teamRivalries';

function RivalryCard({ rivalry }: { rivalry: Rivalry }) {
  const tierInfo = TIER_DISPLAY[rivalry.tier];
  const heatInfo = getHeatLabel(rivalry.heat);
  const totalGames = rivalry.recordA + rivalry.recordB;

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{tierInfo.emoji}</span>
            <div>
              <div className="text-orange-300 font-bold text-sm">{rivalry.teamAAbbr} vs {rivalry.teamBAbbr}</div>
              <div className="text-gray-600 text-[10px]">{rivalry.teamA} vs {rivalry.teamB}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: tierInfo.color + '22', color: tierInfo.color }}>
            {tierInfo.label}
          </span>
        </div>

        {/* Heat meter */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-gray-600">RIVALRY HEAT</span>
            <span className="font-bold" style={{ color: heatInfo.color }}>{rivalry.heat} — {heatInfo.label}</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${rivalry.heat}%`, backgroundColor: heatInfo.color }} />
          </div>
        </div>

        {/* Records */}
        <div className="grid grid-cols-2 gap-3 text-[10px] mb-2">
          <div className="text-center">
            <div className="text-gray-600">{rivalry.teamAAbbr}</div>
            <div className="text-orange-300 font-bold tabular-nums text-lg">{rivalry.recordA}</div>
            <div className="text-gray-500">{getWinPct(rivalry.recordA, totalGames)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">{rivalry.teamBAbbr}</div>
            <div className="text-orange-300 font-bold tabular-nums text-lg">{rivalry.recordB}</div>
            <div className="text-gray-500">{getWinPct(rivalry.recordB, totalGames)}</div>
          </div>
        </div>

        {/* Streak */}
        <div className="text-[10px] mb-1">
          <span className="text-gray-600">Current streak: </span>
          <span className="text-yellow-400 font-bold">{rivalry.currentStreakTeam} W{rivalry.currentStreak}</span>
        </div>

        {/* Last memorable */}
        <div className="text-[10px] text-gray-500 italic">{rivalry.lastMemorable}</div>

        {/* Boost */}
        <div className="mt-2 text-center">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-600/20 text-orange-400">
            +{rivalry.boost} OVR BOOST IN RIVALRY GAMES
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RivalryView() {
  const { gameStarted } = useGameStore();
  const [rivalries] = useState(() => generateDemoRivalries());
  const [filter, setFilter] = useState<'all' | RivalryTier>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filtered = filter === 'all' ? rivalries : rivalries.filter(r => r.tier === filter);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TEAM RIVALRIES</span>
        <span className="text-gray-600 text-[10px]">{rivalries.length} RIVALRIES</span>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        <button onClick={() => setFilter('all')}
          className={`px-2 py-0.5 text-xs font-bold rounded ${filter === 'all' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>ALL</button>
        {(['legendary', 'heated', 'budding', 'geographic'] as RivalryTier[]).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === t ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{TIER_DISPLAY[t].emoji} {TIER_DISPLAY[t].label.toUpperCase()}</button>
        ))}
      </div>

      {/* Rivalry cards */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(r => <RivalryCard key={r.id} rivalry={r} />)}
        {filtered.length === 0 && (
          <div className="col-span-2 text-gray-600 text-xs text-center py-8">No rivalries in this tier.</div>
        )}
      </div>
    </div>
  );
}
