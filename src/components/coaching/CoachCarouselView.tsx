import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ROLE_DISPLAY,
  generateCarouselPool,
  getCarouselSummary,
  type CarouselCoach,
  type CoachRole,
} from '../../engine/coaching/coachCarousel';

function RoleBadge({ role }: { role: CoachRole }) {
  const info = ROLE_DISPLAY[role];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function CoachCard({ coach, onHire }: { coach: CarouselCoach; onHire: () => void }) {
  const roleInfo = ROLE_DISPLAY[coach.role];
  const ovrColor = coach.overall >= 70 ? '#22c55e' : coach.overall >= 55 ? '#eab308' : '#ef4444';
  const wpct = coach.record.wins + coach.record.losses > 0
    ? ((coach.record.wins / (coach.record.wins + coach.record.losses)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {coach.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{coach.name}</div>
              <div className="text-gray-600 text-[10px]">Age {coach.age} | {coach.personality}</div>
            </div>
          </div>
          <RoleBadge role={coach.role} />
        </div>

        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div>
            <div className="text-gray-600">SPECIALTY</div>
            <div className="text-gray-300">{coach.specialty}</div>
          </div>
          <div>
            <div className="text-gray-600">RECORD</div>
            <div className="text-gray-300 tabular-nums">{coach.record.wins}W-{coach.record.losses}L ({wpct}%)</div>
          </div>
          <div>
            <div className="text-gray-600">RINGS</div>
            <div className="text-yellow-400 font-bold tabular-nums">{coach.record.rings}</div>
          </div>
          <div>
            <div className="text-gray-600">SALARY</div>
            <div className="text-green-400 tabular-nums">${coach.askingSalary}M/yr</div>
          </div>
        </div>

        {coach.firedFrom && (
          <div className="text-[10px] text-gray-600 mb-2">
            Fired from <span className="text-gray-400">{coach.firedFrom}</span>
            {coach.firedYear && <span> (Season {coach.firedYear - 2024})</span>}
          </div>
        )}

        <button onClick={onHire}
          className="w-full bloomberg-border px-2 py-1.5 text-[10px] font-bold text-orange-400 hover:bg-orange-900/20 transition-colors text-center"
          disabled={!coach.available}>
          {coach.available ? 'HIRE' : 'UNAVAILABLE'}
        </button>
      </div>
    </div>
  );
}

export default function CoachCarouselView() {
  const { gameStarted } = useGameStore();
  const [pool, setPool] = useState<CarouselCoach[]>(() => generateCarouselPool(12));
  const [filter, setFilter] = useState<'all' | CoachRole>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getCarouselSummary(pool);
  const available = pool.filter(c => c.available);
  const filtered = filter === 'all' ? available : available.filter(c => c.role === filter);

  const handleHire = (coachId: number) => {
    setPool(prev => prev.map(c => c.id === coachId ? { ...c, available: false } : c));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>COACH CAROUSEL</span>
        <span className="text-gray-600 text-[10px]">{summary.available} AVAILABLE</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVAILABLE</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.available}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MANAGERS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.managers}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PIT COACH</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.pitchingCoaches}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HIT COACH</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.hittingCoaches}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG OVR</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgOvr}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        <button onClick={() => setFilter('all')}
          className={`px-2 py-0.5 text-xs font-bold rounded ${filter === 'all' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>ALL</button>
        {(['manager', 'pitching_coach', 'hitting_coach', 'bench_coach'] as CoachRole[]).map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === r ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{ROLE_DISPLAY[r].label}</button>
        ))}
      </div>

      {/* Coach cards */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(c => (
          <CoachCard key={c.id} coach={c} onHire={() => handleHire(c.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-gray-600 text-xs text-center py-8">No coaches available for this role.</div>
        )}
      </div>
    </div>
  );
}
