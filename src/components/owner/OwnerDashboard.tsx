import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { OwnerGoalsState, SeasonGoal, GMEvaluation } from '../../engine/owner/ownerGoals';
import { MANDATE_LABELS, ARCHETYPE_LABELS } from '../../engine/owner/ownerGoals';

function SecurityGauge({ value }: { value: number }) {
  const color = value >= 70 ? 'text-green-400' : value >= 50 ? 'text-orange-400' : value >= 30 ? 'text-yellow-400' : 'text-red-400';
  const bgColor = value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-orange-500' : value >= 30 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-[10px] font-bold">JOB SECURITY</span>
        <span className={`font-bold text-lg tabular-nums ${color}`}>{value}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${bgColor} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <div className="text-[10px] text-gray-600 text-center">
        {value >= 80 ? 'Untouchable' : value >= 60 ? 'Secure' : value >= 40 ? 'On Notice' : value >= 20 ? 'Hot Seat' : 'About to be Fired'}
      </div>
    </div>
  );
}

function GoalRow({ goal }: { goal: SeasonGoal }) {
  return (
    <div className="flex items-center gap-2 py-1 border-b border-gray-800/50 last:border-b-0">
      <span className={`w-4 text-center font-bold ${goal.met ? 'text-green-400' : 'text-gray-600'}`}>
        {goal.met ? '✓' : '○'}
      </span>
      <div className="flex-1">
        <div className="text-xs text-gray-300">{goal.target}</div>
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${goal.met ? 'bg-green-500' : 'bg-gray-600'}`}
              style={{ width: `${goal.weight * 100}%` }} />
          </div>
          <span className="text-[10px] text-gray-500 tabular-nums">{Math.round(goal.weight * 100)}%</span>
        </div>
      </div>
      {goal.actual !== undefined && (
        <span className={`text-xs tabular-nums font-bold ${goal.met ? 'text-green-400' : 'text-red-400'}`}>
          {goal.actual}
        </span>
      )}
    </div>
  );
}

function GradeDisplay({ grade }: { grade: string }) {
  const color = grade.startsWith('A') ? 'text-green-400' : grade.startsWith('B') ? 'text-blue-400'
    : grade.startsWith('C') ? 'text-orange-400' : grade.startsWith('D') ? 'text-yellow-500' : 'text-red-500';
  return <span className={`font-bold text-2xl ${color}`}>{grade}</span>;
}

function EvalCard({ evaluation }: { evaluation: GMEvaluation }) {
  return (
    <div className={`bloomberg-border ${evaluation.fired ? 'border-red-800' : ''}`}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs tabular-nums font-bold">{evaluation.season}</span>
          <GradeDisplay grade={evaluation.overallGrade} />
        </div>
        <div className="text-right">
          <div className="text-gray-500 text-[10px]">JOB SECURITY</div>
          <div className={`tabular-nums font-bold ${
            evaluation.jobSecurity >= 60 ? 'text-green-400' : evaluation.jobSecurity >= 30 ? 'text-orange-400' : 'text-red-400'
          }`}>{evaluation.jobSecurity}</div>
        </div>
      </div>
      <div className="px-3 pb-2 space-y-1">
        {evaluation.goalsResult.map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`${g.met ? 'text-green-400' : 'text-red-400'}`}>
              {g.met ? '✓' : '✗'}
            </span>
            <span className="text-gray-400">{g.target}</span>
          </div>
        ))}
        <div className="text-gray-500 text-xs italic mt-1 border-t border-gray-800 pt-1">
          {evaluation.ownerStatement}
        </div>
        {evaluation.mandateChange && (
          <div className="text-orange-400 text-[10px] font-bold">
            NEW MANDATE: {MANDATE_LABELS[evaluation.mandateChange]}
          </div>
        )}
        {evaluation.fired && (
          <div className="text-red-400 text-xs font-bold animate-pulse mt-1">
            YOU HAVE BEEN FIRED.
          </div>
        )}
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { gameStarted, ownerPatience, seasonsManaged } = useGameStore();
  const [ownerState, setOwnerState] = useState<OwnerGoalsState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getOwnerGoals()
      .then(setOwnerState)
      .finally(() => setLoading(false));
  }, [gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading owner data...</div>;
  if (!ownerState) return <div className="p-4 text-gray-500 text-xs">Owner goals not yet initialized.</div>;

  const { owner, mandate, jobSecurity, seasonGoals, evaluations } = ownerState;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">OWNER & FRONT OFFICE</div>

      {/* Owner profile + job security */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2">
          <div className="text-gray-500 text-[10px] font-bold">OWNER</div>
          <div className="text-orange-300 font-bold text-sm">{owner.name}</div>
          <div className="text-gray-500 text-xs">{ARCHETYPE_LABELS[owner.archetype]}</div>
        </div>
        <div className="bloomberg-border px-3 py-2">
          <div className="text-gray-500 text-[10px] font-bold">MANDATE</div>
          <div className="text-orange-400 font-bold text-sm">{MANDATE_LABELS[mandate]}</div>
        </div>
        <div className="bloomberg-border px-3 py-2">
          <div className="text-gray-500 text-[10px] font-bold">TENURE</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{seasonsManaged}</div>
          <div className="text-gray-600 text-[10px]">seasons managed</div>
        </div>
        <div className="bloomberg-border px-3 py-2">
          <SecurityGauge value={jobSecurity} />
        </div>
      </div>

      {/* Owner attributes */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">OWNER PROFILE</div>
        <div className="grid grid-cols-4 gap-0 divide-x divide-gray-800 p-0">
          {[
            { label: 'PATIENCE', value: owner.patience, desc: owner.patience >= 60 ? 'Patient' : 'Impatient' },
            { label: 'SPENDING', value: owner.spendingWilling, desc: owner.spendingWilling >= 60 ? 'Big Spender' : 'Frugal' },
            { label: 'DEV FOCUS', value: owner.devFocus, desc: owner.devFocus >= 60 ? 'Homegrown' : 'Win Now' },
            { label: 'FAN FOCUS', value: owner.fanRelations, desc: owner.fanRelations >= 60 ? 'Fan-First' : 'Business-First' },
          ].map(attr => (
            <div key={attr.label} className="px-4 py-3 text-center">
              <div className="text-gray-500 text-[10px] font-bold">{attr.label}</div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1 mb-1">
                <div className={`h-full rounded-full ${
                  attr.value >= 70 ? 'bg-green-500' : attr.value >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`} style={{ width: `${attr.value}%` }} />
              </div>
              <div className="text-gray-400 text-xs">{attr.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current season goals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bloomberg-border">
          <div className="bloomberg-header">CURRENT SEASON GOALS</div>
          <div className="p-2">
            {seasonGoals.map((g, i) => <GoalRow key={i} goal={g} />)}
          </div>
        </div>

        {/* Owner patience from game store */}
        <div className="bloomberg-border">
          <div className="bloomberg-header">ORGANIZATIONAL HEALTH</div>
          <div className="p-3 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Owner Patience</span>
                <span className={`font-bold tabular-nums ${ownerPatience >= 60 ? 'text-green-400' : ownerPatience >= 30 ? 'text-orange-400' : 'text-red-400'}`}>
                  {ownerPatience}
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                <div className={`h-full rounded-full ${
                  ownerPatience >= 60 ? 'bg-green-500' : ownerPatience >= 30 ? 'bg-orange-500' : 'bg-red-500'
                }`} style={{ width: `${ownerPatience}%` }} />
              </div>
            </div>
            <div className="border-t border-gray-800 pt-2 space-y-1">
              <div className="text-gray-500 text-[10px] font-bold">KEY FACTORS</div>
              <div className="text-xs text-gray-400">
                {mandate === 'championship' && 'Owner expects a championship. Anything less will cost you.'}
                {mandate === 'playoff_contender' && 'Owner wants to see this team in the playoffs.'}
                {mandate === 'competitive' && 'Stay competitive while building for the future.'}
                {mandate === 'rebuild' && 'Owner is patient. Focus on developing young talent.'}
                {mandate === 'full_rebuild' && 'Full rebuild mode. Cut costs and stockpile prospects.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation history */}
      {evaluations.length > 0 && (
        <div>
          <div className="text-orange-400 text-xs font-bold mb-2 tracking-wider">SEASON EVALUATIONS</div>
          <div className="grid grid-cols-2 gap-3">
            {[...evaluations].reverse().map((ev, i) => (
              <EvalCard key={i} evaluation={ev} />
            ))}
          </div>
        </div>
      )}

      {evaluations.length === 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">SEASON EVALUATIONS</div>
          <div className="px-4 py-8 text-gray-600 text-xs text-center">
            Complete a season to receive your first performance evaluation.
          </div>
        </div>
      )}
    </div>
  );
}
