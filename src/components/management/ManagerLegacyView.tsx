import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  TIER_DISPLAY,
  generateDemoLegacy,
  type ManagerLegacyState,
  type SeasonRecord,
} from '../../engine/management/managerLegacy';

function SeasonRow({ season }: { season: SeasonRecord }) {
  const wpctColor = season.wpct >= 0.600 ? '#22c55e' : season.wpct >= 0.500 ? '#eab308' : '#ef4444';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800/30 text-[10px] border-b border-gray-800/50">
      <span className="text-gray-400 w-10 tabular-nums">{season.year}</span>
      <span className="text-orange-300 font-bold w-10">{season.team}</span>
      <span className="tabular-nums w-14" style={{ color: wpctColor }}>{season.wins}-{season.losses}</span>
      <span className="tabular-nums w-10" style={{ color: wpctColor }}>.{String(Math.round(season.wpct * 1000)).padStart(3, '0')}</span>
      <div className="flex items-center gap-1 flex-1">
        {season.madePlayoffs && <span className="px-1 py-0.5 bg-blue-900/30 text-blue-400 rounded font-bold">PLAYOFFS</span>}
        {season.wonPennant && <span className="px-1 py-0.5 bg-orange-900/30 text-orange-400 rounded font-bold">PENNANT</span>}
        {season.wonWS && <span className="px-1 py-0.5 bg-yellow-900/30 text-yellow-400 rounded font-bold">WS CHAMP</span>}
        {season.managerOfYear && <span className="px-1 py-0.5 bg-green-900/30 text-green-400 rounded font-bold">MGR OF YR</span>}
      </div>
      <span className="text-gray-600 w-12 text-right">{season.ejections} EJ</span>
    </div>
  );
}

export default function ManagerLegacyView() {
  const { gameStarted } = useGameStore();
  const [legacy] = useState<ManagerLegacyState>(() => generateDemoLegacy());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const tierInfo = TIER_DISPLAY[legacy.tier];

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>MANAGER LEGACY</span>
        <span className="text-[10px] font-bold" style={{ color: tierInfo.color }}>
          {tierInfo.emoji} {tierInfo.label.toUpperCase()}
        </span>
      </div>

      {/* Manager card */}
      <div className="bloomberg-border px-4 py-3" style={{ borderColor: tierInfo.color + '44' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-orange-300 font-bold text-lg">{legacy.name}</div>
            <div className="text-gray-500 text-[10px]">{legacy.seasonsManaged} seasons | {legacy.teamsManaged.join(', ')}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-2xl tabular-nums" style={{ color: tierInfo.color }}>
              {legacy.totalWins}-{legacy.totalLosses}
            </div>
            <div className="text-gray-400 text-[10px] tabular-nums">.{String(Math.round(legacy.wpct * 1000)).padStart(3, '0')} W%</div>
          </div>
        </div>
      </div>

      {/* Career stats */}
      <div className="grid grid-cols-6 gap-2">
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RINGS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{legacy.rings}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PENNANTS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{legacy.pennants}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PLAYOFFS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{legacy.playoffApps}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MGR AWARDS</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{legacy.managerOfYearAwards}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">EJECTIONS</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{legacy.ejections}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">STREAK</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: legacy.currentStreak.type === 'W' ? '#22c55e' : '#ef4444' }}>
            {legacy.currentStreak.type}{legacy.currentStreak.count}
          </div>
        </div>
      </div>

      {/* Best season */}
      {legacy.bestSeason && (
        <div className="bloomberg-border px-4 py-2">
          <div className="text-gray-600 text-[10px] font-bold mb-1">BEST SEASON</div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-orange-300 font-bold">{legacy.bestSeason.year} {legacy.bestSeason.team}</span>
            <span className="text-green-400 tabular-nums">{legacy.bestSeason.wins}-{legacy.bestSeason.losses}</span>
            <span className="text-gray-400">.{String(Math.round(legacy.bestSeason.wpct * 1000)).padStart(3, '0')}</span>
            {legacy.bestSeason.wonWS && <span className="text-yellow-400 font-bold">WORLD SERIES CHAMPION</span>}
          </div>
        </div>
      )}

      {/* Season history */}
      <div className="bloomberg-border">
        <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-gray-600 font-bold border-b border-gray-700">
          <span className="w-10">YEAR</span>
          <span className="w-10">TEAM</span>
          <span className="w-14">RECORD</span>
          <span className="w-10">W%</span>
          <span className="flex-1">ACHIEVEMENTS</span>
          <span className="w-12 text-right">EJECT</span>
        </div>
        {legacy.seasonHistory.map(s => (
          <SeasonRow key={s.year} season={s} />
        ))}
      </div>
    </div>
  );
}
