import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoUnlockState,
  getUnlockProgress,
  type UnlockState,
} from '../../engine/progression/unlocks';

export default function UnlocksView() {
  const { gameStarted } = useGameStore();
  const [state] = useState<UnlockState>(() => generateDemoUnlockState());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const progress = getUnlockProgress(state);
  const totalUnlocked = progress.filter(p => p.unlocked).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PROGRESSIVE UNLOCKS</span>
        <span className="text-gray-600 text-[10px]">{totalUnlocked}/{progress.length} UNLOCKED</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SEASONS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{state.seasonsPlayed}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL WINS</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{state.totalWins}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PLAYOFFS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{state.playoffAppearances}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RINGS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{state.championships}</div>
        </div>
      </div>

      {/* Recent unlock toast */}
      {state.recentUnlock && (
        <div className="bloomberg-border px-4 py-3" style={{ borderColor: state.recentUnlock.color + '44' }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{state.recentUnlock.emoji}</span>
            <div>
              <div className="font-bold text-sm" style={{ color: state.recentUnlock.color }}>
                UNLOCKED: {state.recentUnlock.label}
              </div>
              <div className="text-gray-500 text-[10px]">{state.recentUnlock.toast}</div>
            </div>
          </div>
        </div>
      )}

      {/* Unlock cards */}
      <div className="grid grid-cols-2 gap-3">
        {progress.map(p => (
          <div key={p.def.id} className={`bloomberg-border ${p.unlocked ? '' : 'opacity-60'} hover:bg-gray-800/20 transition-colors`}>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.def.emoji}</span>
                  <div>
                    <div className="font-bold text-sm" style={{ color: p.unlocked ? p.def.color : '#6b7280' }}>
                      {p.def.label}
                    </div>
                    <div className="text-gray-500 text-[10px]">{p.def.desc}</div>
                  </div>
                </div>
                {p.unlocked ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-600/20 text-green-400">UNLOCKED</span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-800 text-gray-500">LOCKED</span>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 text-[10px] mb-1">
                <span className="text-gray-600">{p.def.triggerDesc}</span>
                <span className="text-gray-400 tabular-nums">{p.current}/{p.target}</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${p.progress}%`, backgroundColor: p.unlocked ? p.def.color : '#4b5563' }} />
              </div>

              {/* Tabs unlocked */}
              <div className="flex flex-wrap gap-1 mt-2">
                {p.def.tabs.map(t => (
                  <span key={t} className="px-1 py-0.5 text-[9px] bg-gray-800 text-gray-500 rounded">{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
