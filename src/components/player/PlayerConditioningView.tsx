import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  FATIGUE_DISPLAY,
  generateDemoConditioning,
  getConditioningSummary,
  type ConditioningPlayer,
} from '../../engine/player/playerConditioning';

function ConditioningCard({ player }: { player: ConditioningPlayer }) {
  const fatigueInfo = FATIGUE_DISPLAY[player.fatigueLevel];
  const ovrColor = player.adjustedOvr >= 85 ? '#22c55e' : player.adjustedOvr >= 75 ? '#eab308' : '#94a3b8';
  const energyColor = player.energy >= 75 ? '#22c55e' : player.energy >= 50 ? '#eab308' : player.energy >= 25 ? '#f97316' : '#ef4444';
  const riskColor = player.injuryRisk >= 60 ? '#ef4444' : player.injuryRisk >= 35 ? '#f97316' : player.injuryRisk >= 15 ? '#eab308' : '#22c55e';

  const restColors: Record<string, string> = {
    none: '#22c55e',
    optional: '#3b82f6',
    recommended: '#f97316',
    mandatory: '#ef4444',
  };

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
                {player.adjustedOvr !== player.overall && (
                  <span className="text-[9px]" style={{ color: fatigueInfo.ovrMod > 0 ? '#22c55e' : '#ef4444' }}>
                    ({fatigueInfo.ovrMod > 0 ? '+' : ''}{fatigueInfo.ovrMod})
                  </span>
                )}
              </div>
              <div className="text-gray-600 text-[10px]">{player.pos} | Age {player.age} | {player.gamesPlayed} GP</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: fatigueInfo.color + '22', color: fatigueInfo.color }}>
            {fatigueInfo.emoji} {fatigueInfo.label}
          </span>
        </div>

        {/* Energy bar */}
        <div className="flex items-center gap-2 text-[10px] mb-2">
          <span className="text-gray-600 w-14">ENERGY</span>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${player.energy}%`, backgroundColor: energyColor }} />
          </div>
          <span className="font-bold tabular-nums w-8 text-right" style={{ color: energyColor }}>{player.energy}</span>
        </div>

        {/* Injury risk bar */}
        <div className="flex items-center gap-2 text-[10px] mb-2">
          <span className="text-gray-600 w-14">INJ RISK</span>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${player.injuryRisk}%`, backgroundColor: riskColor }} />
          </div>
          <span className="font-bold tabular-nums w-8 text-right" style={{ color: riskColor }}>{player.injuryRisk}%</span>
        </div>

        {/* Attributes */}
        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">STAMINA</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.stamina}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">DURABILITY</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.durability}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">CONSEC</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.consecutiveStarts}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">WORKLOAD</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.seasonWorkload}</div>
          </div>
        </div>

        {/* Rest recommendation */}
        {player.restRecommendation !== 'none' && (
          <div className="text-[10px] font-bold" style={{ color: restColors[player.restRecommendation] }}>
            REST {player.restRecommendation.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayerConditioningView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<ConditioningPlayer[]>(() => generateDemoConditioning());
  const [filter, setFilter] = useState<'all' | 'hitters' | 'pitchers'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getConditioningSummary(players);
  const filtered = filter === 'all' ? players : filter === 'hitters' ? players.filter(p => !p.isPitcher) : players.filter(p => p.isPitcher);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PLAYER CONDITIONING & FATIGUE</span>
        <span className="text-gray-600 text-[10px]">{players.length} PLAYERS TRACKED</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG ENERGY</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.avgEnergy >= 60 ? '#22c55e' : summary.avgEnergy >= 40 ? '#eab308' : '#ef4444' }}>
            {summary.avgEnergy}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">FRESH</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.freshCount + summary.restedCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TIRED</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.tiredCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">EXHAUSTED</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.exhaustedCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">REST NEEDED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.restDaysNeeded}</div>
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
        {filtered.sort((a, b) => a.energy - b.energy).map(p => (
          <ConditioningCard key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
