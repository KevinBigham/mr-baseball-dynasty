import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  INTEL_LEVELS,
  generateDraftBoard,
  getBoardSummary,
  type ProspectIntel,
  type IntelLevel,
} from '../../engine/scouting/draftScoutBoard';

function IntelBadge({ level }: { level: IntelLevel }) {
  const info = INTEL_LEVELS[level];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.label}
    </span>
  );
}

function GradeCell({ grade, label }: { grade?: number; label: string }) {
  if (grade === undefined) return (
    <div className="text-center">
      <div className="text-gray-700 text-[10px]">{label}</div>
      <div className="text-gray-800 text-sm font-bold">?</div>
    </div>
  );
  const color = grade >= 65 ? '#22c55e' : grade >= 50 ? '#eab308' : grade >= 40 ? '#f97316' : '#ef4444';
  return (
    <div className="text-center">
      <div className="text-gray-600 text-[10px]">{label}</div>
      <div className="text-sm font-bold tabular-nums" style={{ color }}>{grade}</div>
    </div>
  );
}

function ProspectCard({ prospect }: { prospect: ProspectIntel }) {
  const [expanded, setExpanded] = useState(false);
  const intelInfo = INTEL_LEVELS[prospect.intelLevel];
  const progressPct = Math.min(100, (prospect.scoutPoints / 100) * 100);

  return (
    <div className="bloomberg-border hover:bg-gray-800/10 transition-colors">
      <button className="w-full px-4 py-3 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-700">
              R{prospect.round}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-orange-300 font-bold text-sm">{prospect.name}</span>
                <IntelBadge level={prospect.intelLevel} />
              </div>
              <div className="text-gray-600 text-[10px]">
                {prospect.position} | Age {prospect.age} | {prospect.school}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {prospect.overallGrade !== undefined && (
              <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: (prospect.overallGrade >= 65 ? '#22c55e' : prospect.overallGrade >= 50 ? '#eab308' : '#f97316') + '22',
                  color: prospect.overallGrade >= 65 ? '#22c55e' : prospect.overallGrade >= 50 ? '#eab308' : '#f97316',
                }}>
                {prospect.overallGrade}
              </div>
            )}
            <svg className={`w-4 h-4 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          {/* Scout progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-gray-600">SCOUT PROGRESS</span>
              <span className="text-gray-400 tabular-nums">{prospect.scoutPoints}/100</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${progressPct}%`, backgroundColor: intelInfo.color,
              }} />
            </div>
          </div>

          {/* Tool grades */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            <GradeCell grade={prospect.overallGrade} label="OVR" />
            <GradeCell grade={prospect.hitGrade} label="HIT" />
            <GradeCell grade={prospect.powerGrade} label="PWR" />
            <GradeCell grade={prospect.armGrade} label="ARM" />
            <GradeCell grade={prospect.speedGrade} label="SPD" />
            <GradeCell grade={prospect.fieldGrade} label="FLD" />
          </div>

          {/* Detailed intel */}
          <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
            <div>
              <span className="text-gray-600">CEILING: </span>
              <span className="text-gray-300">{prospect.ceiling ?? '???'}</span>
            </div>
            <div>
              <span className="text-gray-600">RISK: </span>
              <span className={prospect.risk ? (
                prospect.risk.includes('High') ? 'text-red-400' :
                prospect.risk.includes('Low') ? 'text-green-400' : 'text-yellow-400'
              ) : 'text-gray-700'}>{prospect.risk ?? '???'}</span>
            </div>
            <div>
              <span className="text-gray-600">SIGN: </span>
              <span className={prospect.signability ? (
                prospect.signability === 'easy' ? 'text-green-400' :
                prospect.signability === 'tough' ? 'text-red-400' : 'text-yellow-400'
              ) : 'text-gray-700'}>{prospect.signability?.toUpperCase() ?? '???'}</span>
            </div>
          </div>

          {prospect.scoutNotes && (
            <div className="bg-gray-800/30 rounded px-3 py-2 text-[10px] text-gray-400 italic">
              Scout notes: &ldquo;{prospect.scoutNotes}&rdquo;
            </div>
          )}

          {prospect.intelLevel === 'unknown' && (
            <div className="text-gray-700 text-[10px] text-center py-2">
              Assign a scout to begin evaluation.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DraftScoutBoardView() {
  const { gameStarted } = useGameStore();
  const [board] = useState<ProspectIntel[]>(() => generateDraftBoard(20));
  const [filter, setFilter] = useState<'all' | IntelLevel>('all');
  const [sort, setSort] = useState<'round' | 'grade' | 'intel'>('round');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getBoardSummary(board);

  let filtered = filter === 'all' ? board : board.filter(p => p.intelLevel === filter);
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'round') return a.round - b.round;
    if (sort === 'grade') return (b.overallGrade ?? 0) - (a.overallGrade ?? 0);
    return b.scoutPoints - a.scoutPoints;
  });

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>DRAFT SCOUT BOARD</span>
        <span className="text-gray-600 text-[10px]">{summary.total} PROSPECTS</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.total}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">UNKNOWN</div>
          <div className="text-gray-500 font-bold text-xl tabular-nums">{summary.unknown}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">BASIC</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.basic}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DETAILED</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.detailed}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COMPLETE</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.complete}</div>
        </div>
      </div>

      {/* Filter & sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(['all', 'unknown', 'basic', 'detailed', 'complete'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>{f.toUpperCase()}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-gray-600">SORT:</span>
          {(['round', 'grade', 'intel'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-1.5 py-0.5 font-bold rounded ${
                sort === s ? 'bg-gray-700 text-orange-400' : 'text-gray-500 hover:text-gray-300'
              }`}>{s.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Prospect cards */}
      <div className="space-y-2">
        {filtered.map(p => <ProspectCard key={p.prospectId} prospect={p} />)}
        {filtered.length === 0 && (
          <div className="text-gray-600 text-xs text-center py-8">No prospects matching filter.</div>
        )}
      </div>

      {/* Intel guide */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">SCOUTING INTEL LEVELS</div>
        <div className="p-3 grid grid-cols-4 gap-3 text-[10px] text-gray-500">
          {(Object.entries(INTEL_LEVELS) as [IntelLevel, typeof INTEL_LEVELS[IntelLevel]][]).map(([level, info]) => (
            <div key={level}>
              <div className="font-bold mb-0.5" style={{ color: info.color }}>{info.label} ({info.points}+ pts)</div>
              <div>Reveals: {info.reveals.length > 0 ? info.reveals.join(', ') : 'Nothing yet'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
