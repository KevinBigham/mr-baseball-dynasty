import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ROLE_DISPLAY,
  STATUS_DISPLAY,
  generateDemoStaff,
  getSummary,
  counterOffer,
  letGo,
  type StaffMember,
} from '../../engine/management/staffPoaching';

function StaffCard({ staff, onCounter, onLetGo }: { staff: StaffMember; onCounter: () => void; onLetGo: () => void }) {
  const roleInfo = ROLE_DISPLAY[staff.role];
  const statusInfo = STATUS_DISPLAY[staff.poachStatus];
  const ovrColor = staff.overall >= 80 ? '#22c55e' : staff.overall >= 70 ? '#eab308' : '#94a3b8';
  const isActionable = staff.poachStatus === 'offer_pending';

  return (
    <div className={`bloomberg-border ${staff.poachStatus === 'poached' ? 'opacity-40' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {staff.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{staff.name}</div>
              <div className="text-gray-600 text-[10px]">{roleInfo.emoji} {roleInfo.label} | ${staff.salary}M/yr | {staff.yearsOnStaff} yrs</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: statusInfo.color + '22', color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>

        <div className="text-[10px] text-gray-500 mb-2">
          Specialty: <span className="text-gray-300">{staff.specialty}</span>
        </div>

        {/* Poach chance bar */}
        <div className="flex items-center gap-2 text-[10px] mb-2">
          <span className="text-gray-600">POACH RISK</span>
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${staff.poachChance}%`, backgroundColor: staff.poachChance >= 60 ? '#ef4444' : staff.poachChance >= 30 ? '#f97316' : '#22c55e' }} />
          </div>
          <span className="tabular-nums font-bold" style={{ color: staff.poachChance >= 60 ? '#ef4444' : staff.poachChance >= 30 ? '#f97316' : '#22c55e' }}>
            {staff.poachChance}%
          </span>
        </div>

        {staff.poachingTeam && (
          <div className="text-[10px] mb-2">
            <span className="text-gray-600">Interested: </span>
            <span className="px-1 py-0.5 bg-gray-800 text-orange-300 rounded font-bold">{staff.poachingTeam}</span>
            {staff.offerAmount && (
              <span className="text-green-400 ml-2">${staff.offerAmount}M offered</span>
            )}
          </div>
        )}

        {isActionable && (
          <div className="flex gap-1">
            <button onClick={onCounter}
              className="flex-1 text-[10px] font-bold py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">
              COUNTER (${staff.counterCost}M)
            </button>
            <button onClick={onLetGo}
              className="flex-1 text-[10px] font-bold py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30">
              LET GO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StaffPoachingView() {
  const { gameStarted } = useGameStore();
  const [staff, setStaff] = useState<StaffMember[]>(() => generateDemoStaff());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getSummary(staff);

  const handleCounter = (id: number) => {
    setStaff(prev => prev.map(s => s.id === id ? counterOffer(s) : s));
  };
  const handleLetGo = (id: number) => {
    setStaff(prev => prev.map(s => s.id === id ? letGo(s) : s));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>STAFF POACHING</span>
        <span className="text-gray-600 text-[10px]">{summary.offersPending} OFFERS PENDING</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL STAFF</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.totalStaff}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TARGETED</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.targeted}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">OFFERS</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.offersPending}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RETAINED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.retained}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COUNTER COST</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">${summary.totalCounterCost.toFixed(1)}M</div>
        </div>
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-2 gap-3">
        {staff.sort((a, b) => b.poachChance - a.poachChance).map(s => (
          <StaffCard key={s.id} staff={s} onCounter={() => handleCounter(s.id)} onLetGo={() => handleLetGo(s.id)} />
        ))}
      </div>
    </div>
  );
}
