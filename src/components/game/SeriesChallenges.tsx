import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  CHALLENGE_POOL,
  DIFFICULTY_DISPLAY,
  type Challenge,
} from '../../engine/challenges/seriesChallenges';

function DiffBadge({ difficulty }: { difficulty: Challenge['difficulty'] }) {
  const info = DIFFICULTY_DISPLAY[difficulty];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '33', color: info.color }}>
      {info.label}
    </span>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <div className={`bloomberg-border transition-all ${challenge.completed ? 'border-green-800/50 bg-green-900/10' : ''}`}>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{challenge.icon}</span>
            <span className={`font-bold text-sm ${challenge.completed ? 'text-green-400' : 'text-orange-300'}`}>
              {challenge.label}
            </span>
          </div>
          <DiffBadge difficulty={challenge.difficulty} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-500 text-[10px]">
            {challenge.completed ? 'COMPLETED' : 'IN PROGRESS'}
          </span>
          <span className="text-yellow-400 text-[10px] font-bold tabular-nums">{challenge.xp} XP</span>
        </div>
        {challenge.completed && (
          <div className="mt-1 text-green-400 text-[10px] font-bold">Challenge Complete!</div>
        )}
      </div>
    </div>
  );
}

// Demo data
const DEMO_ACTIVE: Challenge[] = [
  { id: 'hr3', label: 'Hit 3+ home runs in a game', icon: '💣', difficulty: 'medium', xp: 15, completed: false, seriesNum: 12 },
  { id: 'k10', label: 'Strike out 10+ batters', icon: '🔥', difficulty: 'hard', xp: 20, completed: true, seriesNum: 12 },
  { id: 'no_errors', label: 'Play an error-free game', icon: '🧤', difficulty: 'medium', xp: 12, completed: false, seriesNum: 12 },
];

const DEMO_HISTORY: Challenge[] = [
  { id: 'score10', label: 'Score 10+ runs', icon: '🎯', difficulty: 'medium', xp: 15, completed: true, seriesNum: 11 },
  { id: 'win7plus', label: 'Win by 7+ runs', icon: '💪', difficulty: 'hard', xp: 25, completed: true, seriesNum: 10 },
  { id: 'walkoff', label: 'Win with a walk-off', icon: '🎬', difficulty: 'elite', xp: 35, completed: true, seriesNum: 8 },
  { id: 'cg', label: 'Throw a complete game', icon: '⚾', difficulty: 'hard', xp: 25, completed: true, seriesNum: 5 },
];

export default function SeriesChallenges() {
  const { gameStarted } = useGameStore();
  const [tab, setTab] = useState<'active' | 'history' | 'pool'>('active');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const totalXP = DEMO_HISTORY.reduce((s, c) => s + c.xp, 0) + DEMO_ACTIVE.filter(c => c.completed).reduce((s, c) => s + c.xp, 0);
  const totalCompleted = DEMO_HISTORY.length + DEMO_ACTIVE.filter(c => c.completed).length;
  const managerLevel = Math.floor(totalXP / 50) + 1;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SERIES CHALLENGES</span>
        <span className="text-yellow-400 text-[10px] font-bold">MANAGER LEVEL {managerLevel} · {totalXP} XP</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL XP</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{totalXP}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COMPLETED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{totalCompleted}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MANAGER LEVEL</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{managerLevel}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">NEXT LEVEL</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{50 - (totalXP % 50)} XP</div>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="bloomberg-border px-3 py-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-gray-500">Level {managerLevel}</span>
          <span className="text-gray-500">Level {managerLevel + 1}</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${(totalXP % 50) / 50 * 100}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {(['active', 'history', 'pool'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs font-bold rounded ${
              tab === t ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{t === 'active' ? 'CURRENT SERIES' : t.toUpperCase()}</button>
        ))}
      </div>

      {/* Content */}
      {tab === 'active' && (
        <div className="grid grid-cols-3 gap-3">
          {DEMO_ACTIVE.map(c => <ChallengeCard key={c.id} challenge={c} />)}
        </div>
      )}

      {tab === 'history' && (
        <div className="bloomberg-border">
          <div className="bloomberg-header text-green-400">COMPLETED CHALLENGES</div>
          <div className="max-h-[24rem] overflow-y-auto">
            {DEMO_HISTORY.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-800/30">
                <span className="text-base">{c.icon}</span>
                <span className="text-gray-300 flex-1">{c.label}</span>
                <DiffBadge difficulty={c.difficulty} />
                <span className="text-yellow-400 font-bold tabular-nums text-[10px]">+{c.xp} XP</span>
                <span className="text-gray-600 text-[10px]">Series {c.seriesNum}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'pool' && (
        <div className="bloomberg-border">
          <div className="bloomberg-header text-gray-500">ALL AVAILABLE CHALLENGES</div>
          <div className="max-h-[24rem] overflow-y-auto">
            {CHALLENGE_POOL.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-800/30">
                <span className="text-base">{c.icon}</span>
                <span className="text-gray-300 flex-1">{c.label}</span>
                <DiffBadge difficulty={c.difficulty} />
                <span className="text-yellow-400 font-bold tabular-nums text-[10px]">{c.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
