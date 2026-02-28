import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ACTION_DISPLAY,
  generateDemoRosterCrunch,
  getRosterSummary,
  type RosterSpot,
} from '../../engine/roster/rosterCrunch';

function SpotCard({ spot }: { spot: RosterSpot }) {
  const ovrColor = spot.overall >= 80 ? '#22c55e' : spot.overall >= 70 ? '#eab308' : '#94a3b8';
  const actionInfo = spot.suggestedAction ? ACTION_DISPLAY[spot.suggestedAction] : null;

  return (
    <div className={`bloomberg-border hover:bg-gray-800/20 transition-colors ${spot.onIL ? 'opacity-60' : ''}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {spot.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{spot.name}</div>
              <div className="text-gray-600 text-[10px]">{spot.pos} | Age {spot.age} | ${spot.salary}M</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {spot.on26Man && <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-green-900/30 text-green-400">26</span>}
            {spot.onFortyMan && <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-blue-900/30 text-blue-400">40</span>}
            {spot.onIL && <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-red-900/30 text-red-400">IL {spot.ilType}</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">OPTIONS</div>
            <div className={`font-bold tabular-nums ${spot.outOfOptions ? 'text-red-400' : 'text-gray-300'}`}>
              {spot.outOfOptions ? 'OUT' : spot.optionsRemaining}
            </div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">SERVICE</div>
            <div className="text-gray-300 font-bold tabular-nums">{spot.serviceYears}yr</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">STATUS</div>
            <div className={`font-bold ${spot.dfaCandidate ? 'text-red-400' : 'text-gray-300'}`}>
              {spot.dfaCandidate ? 'DFA?' : 'OK'}
            </div>
          </div>
        </div>

        {actionInfo && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 font-bold rounded"
              style={{ backgroundColor: actionInfo.color + '22', color: actionInfo.color }}>
              {actionInfo.emoji} {actionInfo.label}
            </span>
            <span className="text-gray-400">{spot.moveReason}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RosterCrunchView() {
  const { gameStarted } = useGameStore();
  const [spots] = useState<RosterSpot[]>(() => generateDemoRosterCrunch());
  const [filter, setFilter] = useState<'all' | 'active' | 'il' | 'action'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getRosterSummary(spots);
  const filtered = filter === 'all' ? spots
    : filter === 'active' ? spots.filter(s => s.on26Man)
    : filter === 'il' ? spots.filter(s => s.onIL)
    : spots.filter(s => s.suggestedAction !== null);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>ROSTER CRUNCH</span>
        <span className="text-gray-600 text-[10px]">{summary.roster26Count}/26 | {summary.roster40Count}/40</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">26-MAN</div>
          <div className={`font-bold text-xl tabular-nums ${summary.openSpots26 > 0 ? 'text-green-400' : 'text-gray-300'}`}>{summary.roster26Count}/26</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">40-MAN</div>
          <div className={`font-bold text-xl tabular-nums ${summary.openSpots40 > 0 ? 'text-green-400' : 'text-red-400'}`}>{summary.roster40Count}/40</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ON IL</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.ilCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">OUT OF OPT</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.outOfOptionsCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MOVES</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.pendingMoves}</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {(['all', 'active', 'il', 'action'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {f === 'action' ? 'NEEDS ACTION' : f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(s => (
          <SpotCard key={s.id} spot={s} />
        ))}
      </div>
    </div>
  );
}
