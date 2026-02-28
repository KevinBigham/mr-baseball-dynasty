import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  MENTOR_DISPLAY,
  type MentorPair,
  type MentorBonusResult,
  calcWeeklyBonus,
  getMentorSummary,
} from '../../engine/player/mentorSystem';

function StatusBadge({ status }: { status: MentorPair['status'] }) {
  const info = MENTOR_DISPLAY[status];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function BonusBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function PairCard({ pair }: { pair: MentorPair }) {
  const bonus = calcWeeklyBonus(pair);
  const progressPct = Math.min(100, (pair.weeksActive / 20) * 100);

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-orange-400 font-bold text-xs border border-gray-700">
                {pair.mentorOvr}
              </div>
              <span className="text-gray-700">→</span>
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-blue-400 font-bold text-xs border border-gray-700">
                {pair.menteeOvr}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-bold text-sm">{pair.mentorName}</span>
                <span className="text-gray-700 text-[10px]">mentoring</span>
                <span className="text-blue-300 font-bold text-sm">{pair.menteeName}</span>
              </div>
              <div className="text-gray-600 text-[10px]">
                {pair.mentorPosition} → {pair.menteePosition} | Week {pair.weeksActive}/20
              </div>
            </div>
          </div>
          <StatusBadge status={pair.status} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
          <div>
            <div className="text-gray-600">WEEKLY BONUS</div>
            <div className="text-green-400 font-bold tabular-nums">+{bonus.weeklyBonus.toFixed(1)} OVR</div>
          </div>
          <div>
            <div className="text-gray-600">TOTAL ACCRUED</div>
            <div className="text-orange-400 font-bold tabular-nums">+{pair.bonusAccrued.toFixed(1)} OVR</div>
          </div>
          <div>
            <div className="text-gray-600">OVR GAP</div>
            <div className="text-gray-300 tabular-nums">{pair.mentorOvr - pair.menteeOvr} pts</div>
          </div>
        </div>

        <div className="mb-1">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-gray-600">PROGRESS</span>
            <span className="text-gray-500">{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="text-gray-400 text-[10px] italic mt-2">&ldquo;{bonus.narrative}&rdquo;</div>
      </div>
    </div>
  );
}

// Demo data
const DEMO_PAIRS: MentorPair[] = [
  {
    mentorId: 1, mentorName: 'Tommy Nakamura', mentorPosition: 'RF', mentorOvr: 72, mentorAge: 34,
    menteeId: 10, menteeName: 'Carlos Reyes', menteePosition: 'CF', menteeOvr: 55, menteeAge: 22,
    season: 3, weeksActive: 12, bonusAccrued: 8.4, status: 'active',
  },
  {
    mentorId: 2, mentorName: 'Derek Anderson', mentorPosition: 'C', mentorOvr: 68, mentorAge: 33,
    menteeId: 11, menteeName: 'Jake Morrison', menteePosition: 'C', menteeOvr: 50, menteeAge: 21,
    season: 3, weeksActive: 8, bonusAccrued: 5.2, status: 'active',
  },
  {
    mentorId: 3, mentorName: 'Marcus Bell', mentorPosition: 'SS', mentorOvr: 78, mentorAge: 32,
    menteeId: 12, menteeName: 'Darius Coleman', menteePosition: '2B', menteeOvr: 52, menteeAge: 23,
    season: 2, weeksActive: 20, bonusAccrued: 15.0, status: 'graduated',
  },
];

export default function MentorHub() {
  const { gameStarted } = useGameStore();
  const [pairs] = useState<MentorPair[]>(DEMO_PAIRS);
  const [filter, setFilter] = useState<'all' | 'active' | 'graduated'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getMentorSummary(pairs);
  const filtered = filter === 'all' ? pairs : pairs.filter(p => p.status === filter);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>MENTOR HUB</span>
        <span className="text-gray-600 text-[10px]">{summary.active} ACTIVE PAIRS</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL PAIRS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.totalPairs}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ACTIVE</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.active}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GRADUATED</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.graduated}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL BONUS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">+{summary.totalBonusAccrued}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG BONUS</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">+{summary.avgBonus}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'active', 'graduated'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f.toUpperCase()}</button>
        ))}
      </div>

      {/* Pair cards */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((p, i) => <PairCard key={i} pair={p} />)}
        {filtered.length === 0 && (
          <div className="col-span-2 text-gray-600 text-xs text-center py-8">No mentor pairs matching filter.</div>
        )}
      </div>

      {/* How it works */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">MENTORSHIP GUIDE</div>
        <div className="p-3 grid grid-cols-3 gap-4 text-[10px] text-gray-500">
          <div>
            <div className="text-orange-300 font-bold mb-1">ELIGIBILITY</div>
            <div>Mentors: age 30+, OVR 60+, 6+ seasons. Mentees: age 25 or under, 3 or fewer seasons.</div>
          </div>
          <div>
            <div className="text-orange-300 font-bold mb-1">BONUS</div>
            <div>Weekly OVR bonus based on the gap between mentor and mentee. Larger gaps = bigger bonuses (up to +2.5/week).</div>
          </div>
          <div>
            <div className="text-orange-300 font-bold mb-1">GRADUATION</div>
            <div>After 20 weeks, the mentee graduates. Position group matching required (e.g., infield, outfield, pitching).</div>
          </div>
        </div>
      </div>
    </div>
  );
}
