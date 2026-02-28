import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { FOCUS_INFO, type SpringFocus, type SpringTrainingResult } from '../../engine/offseason/springTraining';

function FocusButton({ focus, active, onClick }: { focus: SpringFocus; active: boolean; onClick: () => void }) {
  const info = FOCUS_INFO[focus];
  return (
    <button
      className={`bloomberg-border px-4 py-3 text-left transition-all hover:bg-gray-800/30 ${
        active ? 'ring-1 ring-orange-500/30 border-orange-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{info.icon}</span>
        <span className={`font-bold text-sm ${active ? 'text-orange-300' : 'text-gray-400'}`}>{info.label}</span>
      </div>
      <div className="text-gray-500 text-[10px]">{info.desc}</div>
    </button>
  );
}

function ResultRow({ result }: { result: SpringTrainingResult }) {
  const color = result.type === 'star' ? 'text-green-400' :
    result.type === 'improved' ? 'text-blue-400' :
    result.type === 'decline' ? 'text-red-400' :
    'text-gray-500';
  const badge = result.type === 'star' ? 'bg-green-900/40 text-green-400' :
    result.type === 'improved' ? 'bg-blue-900/40 text-blue-400' :
    result.type === 'decline' ? 'bg-red-900/40 text-red-400' :
    'bg-gray-800 text-gray-500';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-800/30 last:border-0">
      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${badge}`}>
        {result.change > 0 ? `+${result.change}` : result.change === 0 ? '—' : result.change}
      </span>
      <span className="text-orange-300 font-bold flex-1">{result.name}</span>
      <span className="text-gray-600 text-[10px]">{result.position}</span>
      <span className={`text-[10px] ${color}`}>{result.type.toUpperCase()}</span>
    </div>
  );
}

// Demo data
const DEMO_RESULTS: SpringTrainingResult[] = [
  { name: 'Carlos Reyes', position: 'SS', playerId: 1, change: 3, type: 'star', detail: 'Standout spring' },
  { name: 'Jake Morrison', position: 'SP', playerId: 2, change: 2, type: 'star', detail: 'Sharp performance' },
  { name: 'Darius Coleman', position: 'CF', playerId: 3, change: 1, type: 'improved', detail: 'Good camp' },
  { name: 'Mike Torres', position: '1B', playerId: 4, change: 0, type: 'neutral', detail: 'Status quo' },
  { name: 'Ryan Parker', position: 'RP', playerId: 5, change: -1, type: 'decline', detail: 'Rough spring' },
];

export default function SpringTraining() {
  const { gameStarted } = useGameStore();
  const [focus, setFocus] = useState<SpringFocus>('development');
  const [results] = useState<SpringTrainingResult[]>(DEMO_RESULTS);
  const [filter, setFilter] = useState<'all' | 'star' | 'improved' | 'decline'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filtered = filter === 'all' ? results : results.filter(r => r.type === filter);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">SPRING TRAINING</div>

      {/* Focus selection */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(FOCUS_INFO) as SpringFocus[]).map(f => (
          <FocusButton key={f} focus={f} active={focus === f} onClick={() => setFocus(f)} />
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">IMPROVED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{results.filter(r => r.change > 0).length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DECLINED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{results.filter(r => r.change < 0).length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">STANDOUTS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{results.filter(r => r.type === 'star').length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{results.length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'star', 'improved', 'decline'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f === 'star' ? 'STANDOUTS' : f.toUpperCase()}</button>
        ))}
      </div>

      {/* Results table */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">CAMP RESULTS ({filtered.length})</div>
        <div className="max-h-[28rem] overflow-y-auto">
          {filtered.map((r, i) => <ResultRow key={i} result={r} />)}
        </div>
      </div>
    </div>
  );
}
