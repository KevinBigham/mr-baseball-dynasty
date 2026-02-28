import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  STATUS_DISPLAY,
  DAYS_PER_SERVICE_YEAR,
  FA_YEARS,
  generateDemoServiceTime,
  type ServiceTimePlayer,
} from '../../engine/player/serviceTime';

function PlayerRow({ player }: { player: ServiceTimePlayer }) {
  const statusInfo = STATUS_DISPLAY[player.status];
  const ovrColor = player.overall >= 85 ? '#22c55e' : player.overall >= 75 ? '#eab308' : '#94a3b8';
  const faPct = Math.min(100, Math.round((player.totalServiceDays / (FA_YEARS * DAYS_PER_SERVICE_YEAR)) * 100));

  return (
    <div className={`bloomberg-border ${player.manipulationRisk ? 'border-red-800/30' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {player.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{player.name}</div>
              <div className="text-gray-600 text-[10px]">{player.pos} | Age {player.age}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: statusInfo.color + '22', color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>

        {/* Service time display */}
        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div className="text-center">
            <div className="text-gray-600">SERVICE</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.serviceYears}.{String(player.serviceDays).padStart(3, '0')}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">TO NEXT YR</div>
            <div className="text-gray-400 tabular-nums">{player.daysToNextYear}d</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">TO FA</div>
            <div className="tabular-nums" style={{ color: player.daysToFA <= 172 ? '#ef4444' : '#94a3b8' }}>{player.daysToFA}d</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">SALARY</div>
            <div className="text-green-400 tabular-nums">${player.currentSalary}M</div>
          </div>
        </div>

        {/* FA progress bar */}
        <div className="flex items-center gap-2 text-[10px] mb-1">
          <span className="text-gray-600">FA PROGRESS</span>
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${faPct}%`, backgroundColor: faPct >= 80 ? '#ef4444' : faPct >= 50 ? '#eab308' : '#3b82f6' }} />
          </div>
          <span className="text-gray-400 tabular-nums">{faPct}%</span>
        </div>

        {player.isSuperTwo && (
          <div className="text-purple-400 text-[10px] font-bold mt-1">SUPER TWO ELIGIBLE</div>
        )}
        {player.manipulationRisk && (
          <div className="text-red-400 text-[10px] mt-1">
            Service time manipulation risk — close to next year threshold
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServiceTimeView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<ServiceTimePlayer[]>(() => generateDemoServiceTime());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const preArb = players.filter(p => p.status === 'pre_arb').length;
  const arb = players.filter(p => ['arb_1', 'arb_2', 'arb_3', 'arb_4', 'super_two'].includes(p.status)).length;
  const nearFA = players.filter(p => p.daysToFA <= 172).length;
  const superTwo = players.filter(p => p.isSuperTwo).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SERVICE TIME TRACKER</span>
        <span className="text-gray-600 text-[10px]">{players.length} PLAYERS</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PRE-ARB</div>
          <div className="text-gray-400 font-bold text-xl tabular-nums">{preArb}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ARBITRATION</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{arb}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">NEAR FA</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{nearFA}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SUPER TWO</div>
          <div className="text-purple-400 font-bold text-xl tabular-nums">{superTwo}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {players.sort((a, b) => b.totalServiceDays - a.totalServiceDays).map(p => (
          <PlayerRow key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
