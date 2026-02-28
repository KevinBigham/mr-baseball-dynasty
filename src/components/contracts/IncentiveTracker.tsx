import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoIncentivePlayers,
  formatValue,
  formatThreshold,
  type DemoIncentivePlayer,
  type PlayerIncentive,
} from '../../engine/contracts/incentives';

function IncentiveRow({ pi }: { pi: PlayerIncentive }) {
  const color = pi.hit ? '#22c55e' : pi.pctComplete >= 80 ? '#eab308' : '#94a3b8';
  return (
    <div className="flex items-center gap-2 text-[10px] py-1">
      <span>{pi.type.emoji}</span>
      <span className="text-gray-400 w-28">{pi.type.label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pi.pctComplete}%`, backgroundColor: color }} />
      </div>
      <span className="tabular-nums w-14 text-right" style={{ color }}>
        {formatValue(pi.type, pi.current)}
      </span>
      <span className="text-gray-600 tabular-nums w-12 text-right">
        {formatThreshold(pi.type)}
      </span>
      <span className="tabular-nums w-10 text-right text-green-400">${pi.type.bonus}M</span>
      <span className={`w-8 text-right font-bold ${pi.hit ? 'text-green-400' : 'text-gray-600'}`}>
        {pi.hit ? '✓' : '—'}
      </span>
    </div>
  );
}

function PlayerCard({ player }: { player: DemoIncentivePlayer }) {
  const earnedPct = player.result.totalPotential > 0
    ? Math.round((player.result.totalBonus / player.result.totalPotential) * 100)
    : 0;

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-orange-300 font-bold text-sm">{player.name}</div>
            <div className="text-gray-600 text-[10px]">{player.pos} | ${player.salary}M base</div>
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold text-sm">${player.result.totalBonus}M</div>
            <div className="text-gray-600 text-[10px]">of ${player.result.totalPotential}M ({earnedPct}%)</div>
          </div>
        </div>

        {/* Hit incentives */}
        {player.result.hit.length > 0 && (
          <div className="mb-1">
            {player.result.hit.map(pi => <IncentiveRow key={pi.type.id} pi={pi} />)}
          </div>
        )}

        {/* Miss incentives */}
        {player.result.miss.length > 0 && (
          <div>
            {player.result.miss.map(pi => <IncentiveRow key={pi.type.id} pi={pi} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IncentiveTracker() {
  const { gameStarted } = useGameStore();
  const [players] = useState<DemoIncentivePlayer[]>(() => generateDemoIncentivePlayers());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const totalEarned = players.reduce((s, p) => s + p.result.totalBonus, 0);
  const totalPotential = players.reduce((s, p) => s + p.result.totalPotential, 0);
  const hitCount = players.reduce((s, p) => s + p.result.hit.length, 0);
  const totalIncentives = players.reduce((s, p) => s + p.result.hit.length + p.result.miss.length, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>CONTRACT INCENTIVES</span>
        <span className="text-gray-600 text-[10px]">{players.length} PLAYERS WITH INCENTIVES</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">EARNED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">${totalEarned}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">POTENTIAL</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">${totalPotential}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HIT RATE</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{hitCount}/{totalIncentives}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COVERAGE</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">
            {totalPotential > 0 ? Math.round((totalEarned / totalPotential) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Player cards */}
      <div className="grid grid-cols-2 gap-3">
        {players.map(p => <PlayerCard key={p.id} player={p} />)}
      </div>
    </div>
  );
}
