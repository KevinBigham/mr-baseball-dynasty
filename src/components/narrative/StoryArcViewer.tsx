import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import {
  ARC_DISPLAY,
  type PlayerArcState,
  type NarrativeState,
} from '../../engine/narrative/storyArcEngine';

function ArcBadge({ state }: { state: NarrativeState }) {
  const info = ARC_DISPLAY[state];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '33', color: info.color }}>
      {info.emoji} {info.label}
    </span>
  );
}

function ArcCard({ arc, onClick }: { arc: PlayerArcState; onClick: () => void }) {
  const info = arc.arcState ? ARC_DISPLAY[arc.arcState] : null;

  return (
    <div className="bloomberg-border hover:bg-gray-800/30 cursor-pointer transition-colors" onClick={onClick}>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-orange-300 font-bold text-sm">{arc.name}</span>
          {arc.arcState && <ArcBadge state={arc.arcState} />}
        </div>
        <div className="text-gray-600 text-xs">{arc.position}</div>
        {info && <div className="text-gray-400 text-[10px] mt-1">{info.desc}</div>}
        {arc.headlines.length > 0 && (
          <div className="mt-2 border-t border-gray-800/30 pt-1">
            <div className="text-gray-500 text-[10px] italic">
              "{arc.headlines[arc.headlines.length - 1]}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Demo data
const DEMO_ARCS: PlayerArcState[] = [
  { playerId: 101, name: 'Carlos Reyes', position: 'SS', arcState: 'breakout', arcTurns: 12, headlines: ['Carlos Reyes is breaking out — the SS looks like a future star.'] },
  { playerId: 102, name: 'James O\'Brien', position: 'SP', arcState: 'elite', arcTurns: 8, headlines: ['James O\'Brien is playing at an elite level. MVP-caliber stuff.'] },
  { playerId: 103, name: 'Marcus Washington', position: '1B', arcState: 'swan_song', arcTurns: 15, headlines: ['The sun is setting on Marcus Washington\'s career. Every at-bat could be the last.'] },
  { playerId: 104, name: 'Tommy Nakamura', position: 'RF', arcState: 'slump', arcTurns: 6, headlines: ['Tommy Nakamura is in a slump. The RF needs to find their swing.'] },
  { playerId: 105, name: 'Derek Miller', position: 'C', arcState: 'mentor', arcTurns: 10, headlines: ['Derek Miller has taken on a mentor role — the veteran C is guiding the young core.'] },
  { playerId: 106, name: 'Jake Ferretti', position: 'RP', arcState: 'comeback', arcTurns: 4, headlines: ['Jake Ferretti is mounting a comeback — fighting back after a rough stretch.'] },
];

export default function StoryArcViewer() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [arcs] = useState<PlayerArcState[]>(DEMO_ARCS);
  const [filterState, setFilterState] = useState<NarrativeState | 'all'>('all');

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filtered = filterState === 'all' ? arcs : arcs.filter(a => a.arcState === filterState);

  // Count by arc type
  const arcCounts = new Map<string, number>();
  arcs.forEach(a => {
    if (a.arcState) arcCounts.set(a.arcState, (arcCounts.get(a.arcState) ?? 0) + 1);
  });

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PLAYER STORY ARCS</span>
        <span className="text-gray-600 text-[10px]">{arcs.length} ACTIVE NARRATIVES</span>
      </div>

      {/* Arc type summary */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterState('all')}
          className={`px-2 py-1 text-xs font-bold rounded ${
            filterState === 'all' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ALL ({arcs.length})
        </button>
        {Object.entries(ARC_DISPLAY).map(([state, info]) => {
          const count = arcCounts.get(state) ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={state}
              onClick={() => setFilterState(state as NarrativeState)}
              className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 ${
                filterState === state ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span>{info.emoji}</span>
              <span>{info.label} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Arc cards */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(arc => (
          <ArcCard key={arc.playerId} arc={arc} onClick={() => goToPlayer(arc.playerId)} />
        ))}
      </div>

      {/* Arc types legend */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">NARRATIVE ARC TYPES</div>
        <div className="p-3 grid grid-cols-3 gap-3">
          {Object.entries(ARC_DISPLAY).map(([state, info]) => (
            <div key={state} className="flex items-start gap-2 text-xs">
              <span className="text-base">{info.emoji}</span>
              <div>
                <div className="font-bold" style={{ color: info.color }}>{info.label}</div>
                <div className="text-gray-500 text-[10px]">{info.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
