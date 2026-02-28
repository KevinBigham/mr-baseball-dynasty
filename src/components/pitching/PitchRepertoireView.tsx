import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  PITCH_INFO,
  generateRepertoire,
  type PitcherRepertoire,
  type PitchData,
  type PitchType,
} from '../../engine/pitching/pitchRepertoire';

function PitchBar({ pitch }: { pitch: PitchData }) {
  const info = PITCH_INFO[pitch.type];
  return (
    <div className="bloomberg-border px-3 py-2.5 hover:bg-gray-800/20 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">{info.icon}</span>
          <span className="text-xs font-bold" style={{ color: info.color }}>{info.label}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-gray-500">
            {pitch.velocityRange[0]}-{pitch.velocityRange[1]} mph
          </span>
          <span className="text-orange-400 font-bold tabular-nums">{pitch.velocity} avg</span>
        </div>
      </div>

      {/* Usage bar */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-600 text-[10px] w-12">USAGE</span>
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{
            width: `${pitch.usage}%`, backgroundColor: info.color,
          }} />
        </div>
        <span className="text-gray-400 text-[10px] tabular-nums w-8 text-right">{pitch.usage}%</span>
      </div>

      {/* Effectiveness bar */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-600 text-[10px] w-12">EFF</span>
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{
            width: `${pitch.effectiveness}%`,
            backgroundColor: pitch.effectiveness >= 70 ? '#22c55e' : pitch.effectiveness >= 50 ? '#eab308' : '#ef4444',
          }} />
        </div>
        <span className="text-gray-400 text-[10px] tabular-nums w-8 text-right">{pitch.effectiveness}</span>
      </div>

      <div className="flex items-center gap-4 text-[10px] mt-1">
        <span className="text-gray-600">WHIFF: <span className="text-gray-400">{pitch.whiffRate}%</span></span>
        <span className="text-gray-600">ZONE: <span className="text-gray-400">{pitch.zonePct}%</span></span>
      </div>
    </div>
  );
}

function PitcherCard({ rep, isExpanded, onToggle }: {
  rep: PitcherRepertoire; isExpanded: boolean; onToggle: () => void;
}) {
  const bestInfo = PITCH_INFO[rep.bestPitch];
  const gradeColor = rep.arsenalGrade.startsWith('A') ? '#22c55e' :
    rep.arsenalGrade.startsWith('B') ? '#3b82f6' : '#eab308';

  return (
    <div className="bloomberg-border">
      <button className="w-full px-4 py-3 text-left" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-orange-400 font-bold text-sm border border-gray-700">
              {rep.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{rep.name}</div>
              <div className="text-gray-600 text-[10px]">{rep.position} | {rep.pitches.length} pitches</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-gray-600">BEST PITCH</div>
              <div className="text-xs font-bold" style={{ color: bestInfo.color }}>
                {bestInfo.icon} {bestInfo.label}
              </div>
            </div>
            <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: gradeColor + '22', color: gradeColor }}>
              {rep.arsenalGrade}
            </div>
            <svg className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {/* Pitch mix pie visual */}
          <div className="flex items-center gap-1 mb-2">
            {rep.pitches.map(p => {
              const info = PITCH_INFO[p.type];
              return (
                <div key={p.type} className="h-3 rounded-full transition-all" style={{
                  width: `${p.usage}%`, backgroundColor: info.color, minWidth: '8px',
                }} title={`${info.label} ${p.usage}%`} />
              );
            })}
          </div>

          {rep.pitches.map(p => <PitchBar key={p.type} pitch={p} />)}
        </div>
      )}
    </div>
  );
}

// Demo data
const DEMO_PITCHERS: PitcherRepertoire[] = [
  generateRepertoire(100, "James O'Brien", 'SP', 78),
  generateRepertoire(101, 'Jake Morrison', 'SP', 70),
  generateRepertoire(102, 'Sam Williams', 'SP', 65),
  generateRepertoire(103, 'Ryan Parker', 'RP', 62),
  generateRepertoire(104, 'Chris Lee', 'RP', 60),
];

export default function PitchRepertoireView() {
  const { gameStarted } = useGameStore();
  const [pitchers] = useState<PitcherRepertoire[]>(DEMO_PITCHERS);
  const [expandedId, setExpandedId] = useState<number | null>(DEMO_PITCHERS[0]?.playerId ?? null);
  const [filter, setFilter] = useState<'all' | 'SP' | 'RP'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filtered = filter === 'all' ? pitchers : pitchers.filter(p => p.position === filter || (filter === 'RP' && p.position === 'CL'));

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PITCH REPERTOIRE</span>
        <span className="text-gray-600 text-[10px]">{pitchers.length} PITCHERS</span>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'SP', 'RP'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f === 'all' ? 'ALL' : f}</button>
        ))}
      </div>

      {/* Pitcher cards */}
      <div className="space-y-2">
        {filtered.map(p => (
          <PitcherCard
            key={p.playerId}
            rep={p}
            isExpanded={expandedId === p.playerId}
            onToggle={() => setExpandedId(expandedId === p.playerId ? null : p.playerId)}
          />
        ))}
      </div>

      {/* Pitch types legend */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">PITCH TYPES</div>
        <div className="p-3 grid grid-cols-4 gap-2 text-[10px]">
          {(Object.entries(PITCH_INFO) as [PitchType, typeof PITCH_INFO[PitchType]][]).map(([type, info]) => (
            <div key={type} className="flex items-start gap-1.5">
              <span>{info.icon}</span>
              <div>
                <div className="font-bold" style={{ color: info.color }}>{info.label} ({type})</div>
                <div className="text-gray-600">{info.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
