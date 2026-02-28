import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoGrudges,
  generateDemoRevengeGames,
  getReasonLabel,
  getReasonEmoji,
  type Grudge,
  type RevengeGame,
} from '../../engine/narrative/grudgeRevenge';

function GrudgeCard({ grudge }: { grudge: Grudge }) {
  const boostColor = grudge.boostOVR >= 8 ? '#ef4444' : '#f59e0b';
  return (
    <div className={`bloomberg-border ${grudge.torched ? 'opacity-50' : 'hover:bg-gray-800/20'} transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-orange-300 font-bold text-sm">{grudge.playerName}</div>
            <div className="text-gray-600 text-[10px]">vs {grudge.formerTeam}</div>
          </div>
          {grudge.torched ? (
            <span className="text-red-400 text-[10px] font-bold">🔥 TORCHED</span>
          ) : (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
              style={{ backgroundColor: boostColor + '22', color: boostColor }}>
              +{grudge.boostOVR} OVR
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] mb-2">
          <span>{getReasonEmoji(grudge.reason)}</span>
          <span className="text-gray-400">{getReasonLabel(grudge.reason)}</span>
          <span className="text-gray-700 ml-auto">Series {grudge.seriesActive}/4</span>
        </div>

        {/* Intensity bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full transition-all"
            style={{ width: `${grudge.torched ? 100 : Math.min(100, grudge.boostOVR * 12)}%` }} />
        </div>
      </div>
    </div>
  );
}

function RevengeCard({ game }: { game: RevengeGame }) {
  const heatColor = game.rivalryHeat >= 70 ? '#ef4444' : game.rivalryHeat >= 50 ? '#f97316' : '#eab308';
  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-orange-300 font-bold text-sm">{game.teamA} vs {game.teamB}</span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: heatColor + '22', color: heatColor }}>
            🔥 HEAT {game.rivalryHeat}
          </span>
        </div>

        <div className="text-gray-500 text-[10px] mb-2">{game.label}</div>

        <div className="flex items-center justify-between text-[10px]">
          {game.revengeTeam && (
            <span className="text-red-400 font-bold">
              {game.revengeTeam} REVENGE ({game.losingStreak}-game streak)
            </span>
          )}
          <span className="text-green-400 font-bold ml-auto">+{game.bonus} OVR BOOST</span>
        </div>

        {/* Heat bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${game.rivalryHeat}%`, backgroundColor: heatColor }} />
        </div>
      </div>
    </div>
  );
}

export default function GrudgeRevengeView() {
  const { gameStarted } = useGameStore();
  const [grudges] = useState<Grudge[]>(() => generateDemoGrudges());
  const [revengeGames] = useState<RevengeGame[]>(() => generateDemoRevengeGames());
  const [tab, setTab] = useState<'grudges' | 'revenge'>('grudges');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const activeGrudges = grudges.filter(g => !g.torched);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>GRUDGE & REVENGE</span>
        <span className="text-red-400 text-[10px] font-bold">{activeGrudges.length} ACTIVE GRUDGES</span>
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1">
        <button onClick={() => setTab('grudges')}
          className={`px-3 py-1 text-xs font-bold rounded ${
            tab === 'grudges' ? 'bg-red-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}>PLAYER GRUDGES ({grudges.length})</button>
        <button onClick={() => setTab('revenge')}
          className={`px-3 py-1 text-xs font-bold rounded ${
            tab === 'revenge' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}>REVENGE GAMES ({revengeGames.length})</button>
      </div>

      {tab === 'grudges' ? (
        <div className="grid grid-cols-3 gap-3">
          {grudges.map(g => <GrudgeCard key={g.playerId} grudge={g} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {revengeGames.map(g => <RevengeCard key={`${g.teamA}-${g.teamB}`} game={g} />)}
          {revengeGames.length === 0 && (
            <div className="col-span-2 text-gray-600 text-xs text-center py-8">No active revenge scenarios.</div>
          )}
        </div>
      )}
    </div>
  );
}
