import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  HAND_DISPLAY,
  generatePlatoonSplit,
  getPlatoonSummary,
  type MatchupEntry,
  type Hand,
} from '../../engine/analytics/platoonMatchups';

function HandBadge({ hand }: { hand: Hand }) {
  const info = HAND_DISPLAY[hand];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.label}
    </span>
  );
}

function StatCell({ label, value, fmt }: { label: string; value: number; fmt: 'avg' | 'int' }) {
  const display = fmt === 'avg' ? value.toFixed(3).replace(/^0/, '') : String(value);
  const color = fmt === 'avg'
    ? (value >= 0.300 ? '#22c55e' : value >= 0.250 ? '#eab308' : '#ef4444')
    : '#94a3b8';
  return (
    <div className="text-center">
      <div className="text-gray-600 text-[9px]">{label}</div>
      <div className="font-bold tabular-nums text-xs" style={{ color }}>{display}</div>
    </div>
  );
}

function MatchupRow({ entry }: { entry: MatchupEntry }) {
  const [expanded, setExpanded] = useState(false);
  const advColor = entry.splits.advantage === 'vs_left' ? '#3b82f6' :
    entry.splits.advantage === 'vs_right' ? '#ef4444' : '#94a3b8';

  return (
    <div className="bloomberg-border">
      <button className="w-full px-4 py-2 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-orange-400 font-bold text-xs border border-gray-700">
              {entry.overall}
            </div>
            <div>
              <span className="text-orange-300 font-bold text-sm">{entry.name}</span>
              <span className="text-gray-600 text-[10px] ml-2">{entry.position}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HandBadge hand={entry.hand} />
            <span className="text-[10px] font-bold" style={{ color: advColor }}>
              {entry.splits.advantageDesc}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-3">
            {/* vs LHP */}
            <div className="bg-blue-900/10 rounded p-2 border border-blue-900/20">
              <div className="text-blue-400 text-[10px] font-bold mb-1">vs LHP</div>
              <div className="grid grid-cols-5 gap-1">
                <StatCell label="AVG" value={entry.splits.vsLeft.avg} fmt="avg" />
                <StatCell label="OBP" value={entry.splits.vsLeft.obp} fmt="avg" />
                <StatCell label="SLG" value={entry.splits.vsLeft.slg} fmt="avg" />
                <StatCell label="HR" value={entry.splits.vsLeft.hr} fmt="int" />
                <StatCell label="PA" value={entry.splits.vsLeft.pa} fmt="int" />
              </div>
            </div>
            {/* vs RHP */}
            <div className="bg-red-900/10 rounded p-2 border border-red-900/20">
              <div className="text-red-400 text-[10px] font-bold mb-1">vs RHP</div>
              <div className="grid grid-cols-5 gap-1">
                <StatCell label="AVG" value={entry.splits.vsRight.avg} fmt="avg" />
                <StatCell label="OBP" value={entry.splits.vsRight.obp} fmt="avg" />
                <StatCell label="SLG" value={entry.splits.vsRight.slg} fmt="avg" />
                <StatCell label="HR" value={entry.splits.vsRight.hr} fmt="int" />
                <StatCell label="PA" value={entry.splits.vsRight.pa} fmt="int" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2 text-[10px]">
            <div>
              <span className="text-gray-600">OPS vs L: </span>
              <span className="text-blue-400 font-bold tabular-nums">{entry.splits.vsLeft.ops.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-gray-600">OPS vs R: </span>
              <span className="text-red-400 font-bold tabular-nums">{entry.splits.vsRight.ops.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-gray-600">SPLIT DIFF: </span>
              <span className="text-orange-400 font-bold tabular-nums">
                {Math.abs(entry.splits.vsLeft.ops - entry.splits.vsRight.ops).toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Demo data
const DEMO_ENTRIES: MatchupEntry[] = [
  { playerId: 1, name: 'Marcus Bell', position: 'SS', hand: 'R', overall: 82, splits: generatePlatoonSplit(82, 'R') },
  { playerId: 2, name: 'Carlos Reyes', position: 'CF', hand: 'S', overall: 65, splits: generatePlatoonSplit(65, 'S') },
  { playerId: 3, name: 'Derek Anderson', position: 'C', hand: 'R', overall: 72, splits: generatePlatoonSplit(72, 'R') },
  { playerId: 4, name: 'David Chen', position: '3B', hand: 'L', overall: 70, splits: generatePlatoonSplit(70, 'L') },
  { playerId: 5, name: 'Alex Ramirez', position: 'LF', hand: 'L', overall: 67, splits: generatePlatoonSplit(67, 'L') },
  { playerId: 6, name: 'Mike Torres', position: '1B', hand: 'R', overall: 66, splits: generatePlatoonSplit(66, 'R') },
  { playerId: 7, name: 'Tommy Nakamura', position: 'RF', hand: 'L', overall: 68, splits: generatePlatoonSplit(68, 'L') },
  { playerId: 8, name: 'Darius Coleman', position: '2B', hand: 'R', overall: 64, splits: generatePlatoonSplit(64, 'R') },
];

export default function PlatoonMatchupsView() {
  const { gameStarted } = useGameStore();
  const [entries] = useState<MatchupEntry[]>(DEMO_ENTRIES);
  const [filter, setFilter] = useState<'all' | Hand>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getPlatoonSummary(entries);
  const filtered = filter === 'all' ? entries : entries.filter(e => e.hand === filter);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">PLATOON MATCHUPS</div>

      {/* Summary */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { label: 'LINEUP', val: summary.total, color: '#f97316' },
          { label: 'RHB', val: summary.rightHanded, color: '#ef4444' },
          { label: 'LHB', val: summary.leftHanded, color: '#3b82f6' },
          { label: 'SWITCH', val: summary.switchHitters, color: '#a855f7' },
          { label: 'L ADV', val: summary.vsLeftAdv, color: '#3b82f6' },
          { label: 'R ADV', val: summary.vsRightAdv, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border px-2 py-2 text-center">
            <div className="text-gray-500 text-[10px]">{s.label}</div>
            <div className="font-bold text-xl tabular-nums" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        <button onClick={() => setFilter('all')}
          className={`px-2 py-0.5 text-xs font-bold rounded ${filter === 'all' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>ALL</button>
        {(['R', 'L', 'S'] as Hand[]).map(h => (
          <button key={h} onClick={() => setFilter(h)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${filter === h ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {HAND_DISPLAY[h].label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.map(e => <MatchupRow key={e.playerId} entry={e} />)}
      </div>
    </div>
  );
}
