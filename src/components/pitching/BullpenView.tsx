import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ROLE_DISPLAY,
  generateDemoBullpen,
  getFatigueLabel,
  getAvailability,
  getVelocityDrop,
  warmUp,
  rest,
  type RelieverStatus,
  type BullpenRole,
} from '../../engine/pitching/bullpenManagement';

function RelieverCard({ reliever, onWarmUp, onRest }: { reliever: RelieverStatus; onWarmUp: () => void; onRest: () => void }) {
  const roleInfo = ROLE_DISPLAY[reliever.role];
  const fatigueInfo = getFatigueLabel(reliever.fatigue);
  const avail = getAvailability(reliever);
  const veloDrop = getVelocityDrop(reliever);
  const ovrColor = reliever.overall >= 75 ? '#22c55e' : reliever.overall >= 65 ? '#eab308' : '#ef4444';

  return (
    <div className={`bloomberg-border ${!avail.available ? 'opacity-50' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {reliever.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{reliever.name}</div>
              <div className="text-gray-600 text-[10px]">
                {reliever.era.toFixed(2)} ERA | {reliever.saves > 0 ? `${reliever.saves} SV` : `${reliever.holds} HLD`}
              </div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: roleInfo.color + '22', color: roleInfo.color }}>
            {roleInfo.emoji} {roleInfo.label}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div>
            <div className="text-gray-600">FATIGUE</div>
            <div className="font-bold" style={{ color: fatigueInfo.color }}>{reliever.fatigue}%</div>
          </div>
          <div>
            <div className="text-gray-600">VELO</div>
            <div className="text-gray-300 tabular-nums">{reliever.velocity} mph
              {veloDrop > 0 && <span className="text-red-400 ml-0.5">(-{veloDrop})</span>}
            </div>
          </div>
          <div>
            <div className="text-gray-600">CONSEC</div>
            <div className="tabular-nums" style={{ color: reliever.consecutiveDays >= 2 ? '#f97316' : '#94a3b8' }}>
              {reliever.consecutiveDays} days
            </div>
          </div>
          <div>
            <div className="text-gray-600">STATUS</div>
            <div className="font-bold" style={{ color: avail.available ? '#22c55e' : '#ef4444' }}>
              {reliever.warmingUp ? '🔥 WARM' : avail.available ? 'READY' : 'UNAV'}
            </div>
          </div>
        </div>

        {/* Fatigue bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${reliever.fatigue}%`, backgroundColor: fatigueInfo.color }} />
        </div>

        {!avail.available && (
          <div className="text-red-400 text-[10px] mb-2">{avail.reason}</div>
        )}

        {/* Actions */}
        <div className="flex gap-1">
          <button onClick={onWarmUp} disabled={reliever.warmingUp || !avail.available}
            className={`flex-1 text-[10px] font-bold py-1 rounded ${
              reliever.warmingUp || !avail.available ? 'bg-gray-800 text-gray-600' : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
            }`}>
            {reliever.warmingUp ? 'WARMING' : 'WARM UP'}
          </button>
          <button onClick={onRest} disabled={reliever.fatigue === 0}
            className={`flex-1 text-[10px] font-bold py-1 rounded ${
              reliever.fatigue === 0 ? 'bg-gray-800 text-gray-600' : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
            }`}>
            REST
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BullpenView() {
  const { gameStarted } = useGameStore();
  const [bullpen, setBullpen] = useState<RelieverStatus[]>(() => generateDemoBullpen());
  const [filter, setFilter] = useState<'all' | BullpenRole>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filtered = filter === 'all' ? bullpen : bullpen.filter(r => r.role === filter);
  const available = bullpen.filter(r => r.available).length;
  const warming = bullpen.filter(r => r.warmingUp).length;
  const avgFatigue = Math.round(bullpen.reduce((s, r) => s + r.fatigue, 0) / bullpen.length);

  const handleWarmUp = (id: number) => {
    setBullpen(prev => prev.map(r => r.id === id ? warmUp(r) : r));
  };
  const handleRest = (id: number) => {
    setBullpen(prev => prev.map(r => r.id === id ? rest(r) : r));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>BULLPEN MANAGEMENT</span>
        <span className="text-gray-600 text-[10px]">{available}/{bullpen.length} AVAILABLE</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVAILABLE</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{available}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">WARMING</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{warming}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG FATIGUE</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: avgFatigue > 50 ? '#f97316' : '#22c55e' }}>{avgFatigue}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RELIEVERS</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{bullpen.length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        <button onClick={() => setFilter('all')}
          className={`px-2 py-0.5 text-xs font-bold rounded ${filter === 'all' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>ALL</button>
        {(['closer', 'setup', 'middle', 'long', 'loogy', 'mopup'] as BullpenRole[]).map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === r ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{ROLE_DISPLAY[r].label.toUpperCase()}</button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.sort((a, b) => ROLE_DISPLAY[a.role].order - ROLE_DISPLAY[b.role].order).map(r => (
          <RelieverCard key={r.id} reliever={r} onWarmUp={() => handleWarmUp(r.id)} onRest={() => handleRest(r.id)} />
        ))}
      </div>
    </div>
  );
}
