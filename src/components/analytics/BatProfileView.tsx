import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  PROFILE_DISPLAY,
  generateDemoBatProfiles,
  getBatProfileSummary,
  type BattedBallProfile,
} from '../../engine/analytics/batProfile';

function ProfileCard({ player }: { player: BattedBallProfile }) {
  const profileInfo = PROFILE_DISPLAY[player.profile];
  const ovrColor = player.overall >= 85 ? '#22c55e' : player.overall >= 75 ? '#eab308' : '#94a3b8';
  const evColor = player.avgExitVelo >= 92 ? '#22c55e' : player.avgExitVelo >= 88 ? '#eab308' : '#94a3b8';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {player.overall}
            </div>
            <div>
              <span className="text-orange-300 font-bold text-sm">{player.name}</span>
              <span className="text-gray-600 text-[10px] ml-1">{player.pos}</span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: profileInfo.color + '22', color: profileInfo.color }}>
            {profileInfo.label}
          </span>
        </div>

        {/* Batted ball rates with visual bars */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-600 w-8">GB</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${player.gbRate}%` }} />
            </div>
            <span className="text-gray-300 font-bold tabular-nums w-12 text-right">{player.gbRate}%</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-600 w-8">LD</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${player.ldRate}%` }} />
            </div>
            <span className="text-gray-300 font-bold tabular-nums w-12 text-right">{player.ldRate}%</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-600 w-8">FB</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-red-500" style={{ width: `${player.fbRate}%` }} />
            </div>
            <span className="text-gray-300 font-bold tabular-nums w-12 text-right">{player.fbRate}%</span>
          </div>
        </div>

        {/* Spray direction */}
        <div className="grid grid-cols-3 gap-1 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">PULL</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.pullRate}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">CENTER</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.centerRate}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">OPPO</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.oppoRate}%</div>
          </div>
        </div>

        {/* Quality metrics */}
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          <div className="text-center">
            <div className="text-gray-600">LA</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.avgLaunchAngle}&deg;</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">EV</div>
            <div className="font-bold tabular-nums" style={{ color: evColor }}>{player.avgExitVelo}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">HH%</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.hardHitRate}%</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">BBL%</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.barrelRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BatProfileView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<BattedBallProfile[]>(() => generateDemoBatProfiles());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getBatProfileSummary(players);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>BATTED BALL PROFILES</span>
        <span className="text-gray-600 text-[10px]">STATCAST DATA</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG GB%</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.avgGBRate}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG FB%</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.avgFBRate}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG LA</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgLaunchAngle}&deg;</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG EV</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgExitVelo}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG HH%</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.avgHardHitRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {players.sort((a, b) => b.hardHitRate - a.hardHitRate).map(p => (
          <ProfileCard key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
