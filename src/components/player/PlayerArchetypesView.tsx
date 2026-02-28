import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoArchetypes,
  type DemoArchetypePlayer,
} from '../../engine/player/playerArchetypes';

function PhaseBadge({ phase }: { phase: DemoArchetypePlayer['phase'] }) {
  const cfg = {
    rising:    { label: 'RISING', color: '#22c55e' },
    prime:     { label: 'PRIME', color: '#f59e0b' },
    declining: { label: 'DECLINING', color: '#ef4444' },
  }[phase];

  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: cfg.color + '22', color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function ArchetypeCard({ player }: { player: DemoArchetypePlayer }) {
  const ovrColor = player.overall >= 75 ? '#22c55e' : player.overall >= 60 ? '#eab308' : '#ef4444';
  const primeRange = `${player.ageCurve.prime[0]}-${player.ageCurve.prime[1]}`;
  const yearsLeft = Math.max(0, player.ageCurve.cliff - player.age);

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {player.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{player.name}</div>
              <div className="text-gray-600 text-[10px]">{player.pos} | Age {player.age}</div>
            </div>
          </div>
          <PhaseBadge phase={player.phase} />
        </div>

        <div className="flex items-center gap-1 mb-2">
          <span>{player.archetype.emoji}</span>
          <span className="text-yellow-400 font-bold text-xs">{player.archetype.label}</span>
        </div>
        <div className="text-gray-500 text-[10px] mb-2">{player.archetype.desc}</div>

        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <div className="text-gray-600">PRIME</div>
            <div className="text-gray-300 tabular-nums">{primeRange}</div>
          </div>
          <div>
            <div className="text-gray-600">CLIFF</div>
            <div className="text-gray-300 tabular-nums">Age {player.ageCurve.cliff}</div>
          </div>
          <div>
            <div className="text-gray-600">YRS LEFT</div>
            <div className="tabular-nums font-bold" style={{ color: yearsLeft > 3 ? '#22c55e' : yearsLeft > 1 ? '#eab308' : '#ef4444' }}>
              {yearsLeft}
            </div>
          </div>
        </div>

        {/* Aging curve mini-bar */}
        <div className="mt-2 w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(5, ((player.age - 20) / (player.ageCurve.cliff + 5 - 20)) * 100))}%`,
              backgroundColor: player.phase === 'prime' ? '#f59e0b' : player.phase === 'rising' ? '#22c55e' : '#ef4444',
            }} />
        </div>
      </div>
    </div>
  );
}

export default function PlayerArchetypesView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<DemoArchetypePlayer[]>(() => generateDemoArchetypes());
  const [filter, setFilter] = useState<'all' | 'hitters' | 'pitchers'>('all');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'rising' | 'prime' | 'declining'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filtered = players
    .filter(p => filter === 'all' ? true : filter === 'pitchers' ? (p.pos === 'SP' || p.pos === 'RP') : (p.pos !== 'SP' && p.pos !== 'RP'))
    .filter(p => phaseFilter === 'all' ? true : p.phase === phaseFilter);

  const risingCount = players.filter(p => p.phase === 'rising').length;
  const primeCount = players.filter(p => p.phase === 'prime').length;
  const decliningCount = players.filter(p => p.phase === 'declining').length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PLAYER ARCHETYPES</span>
        <span className="text-gray-600 text-[10px]">{players.length} PLAYERS</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RISING</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{risingCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PRIME</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{primeCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DECLINING</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{decliningCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {(['all', 'hitters', 'pitchers'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>{f.toUpperCase()}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'rising', 'prime', 'declining'] as const).map(f => (
            <button key={f} onClick={() => setPhaseFilter(f)}
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                phaseFilter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>{f.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(p => (
          <ArchetypeCard key={p.id} player={p} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-gray-600 text-xs text-center py-8">No players match this filter.</div>
        )}
      </div>
    </div>
  );
}
