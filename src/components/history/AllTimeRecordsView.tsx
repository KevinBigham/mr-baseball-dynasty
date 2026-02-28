import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  CATEGORY_DISPLAY,
  populateDemoRecords,
  detectRecordChases,
  type RecordEntry,
  type RecordCategory,
  type RecordChase,
} from '../../engine/history/allTimeRecords';

function CategoryBadge({ category }: { category: RecordCategory }) {
  const info = CATEGORY_DISPLAY[category];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function RecordRow({ record }: { record: RecordEntry }) {
  const fmt = (val: number) => {
    if (record.format === 'decimal') return val.toFixed(3).replace(/^0(?=\.)/, '');
    return String(val);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800/30 last:border-0 text-xs">
      <CategoryBadge category={record.category} />
      <span className="text-gray-300 flex-1">{record.label}</span>
      <span className="text-orange-400 font-bold tabular-nums w-16 text-right">{fmt(record.record)}</span>
      <span className="text-gray-400 w-28 text-right">{record.holderName}</span>
      <span className="text-gray-600 tabular-nums w-10 text-right">S{record.holderSeason}</span>
    </div>
  );
}

function ChaseCard({ chase }: { chase: RecordChase }) {
  const isClose = chase.pctOfRecord >= 80;
  return (
    <div className={`bloomberg-border ${isClose ? 'border-orange-800/50' : ''}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-orange-300 font-bold text-sm">{chase.chaserName}</span>
          {isClose && <span className="text-orange-400 text-[10px] animate-pulse font-bold">RECORD WATCH</span>}
        </div>
        <div className="text-gray-500 text-[10px] mb-2">
          Chasing: {chase.recordLabel} ({chase.recordValue} by {chase.holderName})
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${chase.pctOfRecord}%` }} />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-600">Current: <span className="text-gray-300 font-bold">{chase.chaserValue}</span></span>
          <span className="text-gray-600">Pace: <span className="text-orange-400 font-bold">{chase.pace}</span></span>
          <span className="text-gray-600">{chase.gamesRemaining} games left</span>
        </div>
      </div>
    </div>
  );
}

// Demo record chases
const DEMO_CHASES: RecordChase[] = [
  { recordId: 'season_hr', recordLabel: 'Home Runs (Season)', recordValue: 44, holderName: 'Marcus Bell', chaserName: 'Marcus Bell', chaserValue: 32, pace: 46, pctOfRecord: 73, gamesRemaining: 50 },
  { recordId: 'season_sb', recordLabel: 'Stolen Bases (Season)', recordValue: 42, holderName: 'Carlos Reyes', chaserName: 'Carlos Reyes', chaserValue: 36, pace: 52, pctOfRecord: 86, gamesRemaining: 50 },
  { recordId: 'season_so', recordLabel: 'Strikeouts (Season)', recordValue: 224, holderName: "James O'Brien", chaserName: "James O'Brien", chaserValue: 188, pace: 240, pctOfRecord: 84, gamesRemaining: 35 },
];

export default function AllTimeRecordsView() {
  const { gameStarted } = useGameStore();
  const [records] = useState<RecordEntry[]>(() => populateDemoRecords());
  const [chases] = useState<RecordChase[]>(DEMO_CHASES);
  const [filter, setFilter] = useState<'all' | RecordCategory>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filtered = filter === 'all' ? records : records.filter(r => r.category === filter);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">ALL-TIME RECORDS</div>

      {/* Record chases */}
      {chases.length > 0 && (
        <div>
          <div className="text-gray-500 text-[10px] font-bold mb-2 px-1">ACTIVE RECORD CHASES</div>
          <div className="grid grid-cols-3 gap-3">
            {chases.map(c => <ChaseCard key={c.recordId} chase={c} />)}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'batting', 'pitching', 'team'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f.toUpperCase()}</button>
        ))}
      </div>

      {/* Records table */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">
          FRANCHISE RECORDS ({filtered.length})
        </div>
        <div className="max-h-[30rem] overflow-y-auto">
          {filtered.map(r => <RecordRow key={r.id} record={r} />)}
        </div>
      </div>
    </div>
  );
}
