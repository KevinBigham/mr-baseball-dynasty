import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { BreakoutCandidate } from '../../engine/player/breakoutSystem';
import { useUIStore } from '../../store/uiStore';

function StatusBadge({ candidate }: { candidate: BreakoutCandidate }) {
  if (!candidate.resolved) {
    return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-900/40 text-blue-400 animate-pulse">IN PROGRESS</span>;
  }
  if (candidate.hit) {
    return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-900/40 text-green-400">BREAKOUT</span>;
  }
  return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-900/40 text-red-400">BUST</span>;
}

function OvrBar({ current, start, target }: { current: number; start: number; target: number }) {
  const range = target - start;
  const progress = range > 0 ? Math.min(100, ((current - start) / range) * 100) : 0;
  const color = progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-orange-500' : progress >= 25 ? 'bg-blue-500' : 'bg-gray-600';
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 text-[10px] tabular-nums w-5">{start}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${progress}%` }} />
      </div>
      <span className="text-orange-400 text-[10px] tabular-nums w-5">{target}</span>
    </div>
  );
}

function CandidateCard({ candidate, onClick }: { candidate: BreakoutCandidate; onClick: () => void }) {
  return (
    <div className="bloomberg-border hover:bg-gray-800/30 cursor-pointer transition-colors" onClick={onClick}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-orange-300 font-bold text-sm">{candidate.name}</span>
            <span className="text-gray-600 text-xs ml-2">{candidate.position}</span>
          </div>
          <StatusBadge candidate={candidate} />
        </div>

        <OvrBar current={candidate.ovrAtStart} start={candidate.ovrAtStart} target={candidate.targetOvr} />

        <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
          <div>
            <div className="text-gray-600">START OVR</div>
            <div className="text-gray-400 font-bold tabular-nums">{candidate.ovrAtStart}</div>
          </div>
          <div>
            <div className="text-gray-600">POTENTIAL</div>
            <div className="text-blue-400 font-bold tabular-nums">{candidate.potAtStart}</div>
          </div>
          <div>
            <div className="text-gray-600">TARGET</div>
            <div className="text-orange-400 font-bold tabular-nums">{candidate.targetOvr}</div>
          </div>
        </div>

        {candidate.milestones.length > 0 && (
          <div className="mt-2 border-t border-gray-800 pt-2">
            {candidate.milestones.slice(-2).map((m, i) => (
              <div key={i} className="text-gray-400 text-[10px]">{m}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Demo data for display
const DEMO_CANDIDATES: BreakoutCandidate[] = [
  { playerId: 1, name: 'Carlos Reyes', position: 'SS', teamId: 1, ovrAtStart: 58, potAtStart: 72, targetOvr: 68, hit: false, bust: false, resolved: false, milestones: ['On pace for 20+ HR at midseason'] },
  { playerId: 2, name: 'Jake Morrison', position: 'SP', teamId: 1, ovrAtStart: 55, potAtStart: 70, targetOvr: 65, hit: false, bust: false, resolved: false, milestones: [] },
  { playerId: 3, name: 'Darius Coleman', position: 'CF', teamId: 1, ovrAtStart: 60, potAtStart: 75, targetOvr: 72, hit: true, bust: false, resolved: true, milestones: ['+5 OVR', 'Breakout confirmed!'] },
];

export default function BreakoutTracker() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [candidates] = useState<BreakoutCandidate[]>(DEMO_CANDIDATES);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filtered = filter === 'all' ? candidates :
    filter === 'active' ? candidates.filter(c => !c.resolved) :
    candidates.filter(c => c.resolved);

  const active = candidates.filter(c => !c.resolved).length;
  const hits = candidates.filter(c => c.hit).length;
  const busts = candidates.filter(c => c.bust).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>BREAKOUT TRACKER</span>
        <span className="text-gray-600 text-[10px]">{candidates.length} CANDIDATES</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CANDIDATES</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{candidates.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ACTIVE</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{active}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">BREAKOUTS</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{hits}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">BUSTS</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{busts}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'active', 'resolved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f.toUpperCase()}</button>
        ))}
        <span className="text-gray-600 text-xs ml-auto">{filtered.length} shown</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(c => (
          <CandidateCard key={c.playerId} candidate={c} onClick={() => goToPlayer(c.playerId)} />
        ))}
      </div>

      {/* How it works */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">HOW BREAKOUTS WORK</div>
        <div className="p-3 grid grid-cols-3 gap-4 text-[10px] text-gray-500">
          <div>
            <div className="text-orange-300 font-bold mb-1">ELIGIBILITY</div>
            <div>Ages 21-26, OVR 50-65, POT at least 8 points above current OVR. Up to 3 candidates per season.</div>
          </div>
          <div>
            <div className="text-orange-300 font-bold mb-1">RESOLUTION</div>
            <div>55% chance to hit breakout, gaining 8-14 OVR points. Resolved at end of season.</div>
          </div>
          <div>
            <div className="text-orange-300 font-bold mb-1">MILESTONES</div>
            <div>Mid-season stat checkpoints (HR pace, K pace, wins) generate narrative moments.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
