import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  LAYER_DISPLAY,
  generateOwnerGoals,
  generateManagerGoals,
  getGoalsSummary,
  type ActiveGoal,
  type GoalLayer,
  type GoalStatus,
} from '../../engine/goals/seasonGoals';

function LayerBadge({ layer }: { layer: GoalLayer }) {
  const info = LAYER_DISPLAY[layer];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function StatusIndicator({ status }: { status: GoalStatus }) {
  const config = {
    active:    { color: '#eab308', icon: '◯', label: 'ACTIVE' },
    completed: { color: '#22c55e', icon: '✓', label: 'COMPLETED' },
    failed:    { color: '#ef4444', icon: '✗', label: 'FAILED' },
  };
  const info = config[status];
  return (
    <span className="text-[10px] font-bold" style={{ color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function GoalCard({ goal }: { goal: ActiveGoal }) {
  const layerInfo = LAYER_DISPLAY[goal.layer];
  const hasTarget = goal.target !== undefined;
  const progressPct = hasTarget ? Math.min(100, (goal.current / (goal.target ?? 1)) * 100) : 0;

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LayerBadge layer={goal.layer} />
            <span className="text-orange-300 font-bold text-sm">{goal.label}</span>
          </div>
          <StatusIndicator status={goal.status} />
        </div>

        {goal.playerName && (
          <div className="text-gray-500 text-[10px] mb-1">Player: {goal.playerName}</div>
        )}

        {hasTarget && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-gray-600">PROGRESS</span>
              <span className="text-gray-400 tabular-nums">{goal.current} / {goal.target}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${progressPct}%`,
                backgroundColor: goal.status === 'completed' ? '#22c55e' :
                  goal.status === 'failed' ? '#ef4444' : layerInfo.color,
              }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-[10px]">
          <div>
            <span className="text-gray-600">REWARD: </span>
            <span className="text-green-400">
              {Object.entries(goal.reward)
                .filter(([, v]) => typeof v === 'number' && v > 0)
                .map(([k, v]) => `+${v} ${k}`)
                .join(', ') || 'None'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">PENALTY: </span>
            <span className="text-red-400">
              {Object.entries(goal.penalty)
                .filter(([, v]) => typeof v === 'number' && v < 0)
                .map(([k, v]) => `${v} ${k}`)
                .join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo data
const DEMO_GOALS: ActiveGoal[] = [
  ...generateOwnerGoals('playoff'),
  ...generateManagerGoals(),
  { id: '30hr', label: '30 Home Runs', layer: 'player', status: 'active', current: 18, target: 30, compare: 'gte', reward: { morale: 8, devBoost: 1 }, penalty: { morale: -3 }, playerName: 'Marcus Bell' },
  { id: '200k', label: '200 Strikeouts', layer: 'player', status: 'active', current: 145, target: 200, compare: 'gte', reward: { morale: 8, devBoost: 1 }, penalty: { morale: -3 }, playerName: "James O'Brien" },
  { id: '30sb', label: '30 Stolen Bases', layer: 'player', status: 'completed', current: 32, target: 30, compare: 'gte', reward: { morale: 7 }, penalty: { morale: -2 }, playerName: 'Carlos Reyes' },
];

export default function SeasonGoalsView() {
  const { gameStarted } = useGameStore();
  const [goals] = useState<ActiveGoal[]>(DEMO_GOALS);
  const [filter, setFilter] = useState<'all' | GoalLayer>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getGoalsSummary(goals);
  const filtered = filter === 'all' ? goals : goals.filter(g => g.layer === filter);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SEASON GOALS</span>
        <span className="text-gray-600 text-[10px]">
          {summary.completed}/{summary.total} COMPLETED
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.total}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ACTIVE</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.active}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COMPLETED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.completed}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">FAILED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.failed}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PLAYER GOALS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.playerGoals}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'owner', 'manager', 'player'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f.toUpperCase()}</button>
        ))}
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((g, i) => <GoalCard key={`${g.id}-${i}`} goal={g} />)}
        {filtered.length === 0 && (
          <div className="col-span-2 text-gray-600 text-xs text-center py-8">No goals matching filter.</div>
        )}
      </div>

      {/* Guide */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">SEASON GOALS GUIDE</div>
        <div className="p-3 grid grid-cols-3 gap-4 text-[10px] text-gray-500">
          {(Object.entries(LAYER_DISPLAY) as [GoalLayer, typeof LAYER_DISPLAY[GoalLayer]][]).map(([layer, info]) => (
            <div key={layer}>
              <div className="font-bold mb-1" style={{ color: info.color }}>
                {info.icon} {info.label} GOALS
              </div>
              <div>{layer === 'owner' ? 'Franchise-level objectives set by ownership. Affects owner patience and budget.' :
                    layer === 'manager' ? 'Performance targets for the coaching staff. Affects morale and development.' :
                    'Individual stat milestones for star players. Affects morale and growth.'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
