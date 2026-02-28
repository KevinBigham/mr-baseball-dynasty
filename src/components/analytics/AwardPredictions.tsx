import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  AWARD_TYPES,
  generateAwardRaces,
  type AwardRace,
  type AwardType,
  type AwardCandidate,
} from '../../engine/analytics/awardPredictions';

function TrendIcon({ trend }: { trend: AwardCandidate['trend'] }) {
  if (trend === 'rising') return <span className="text-green-400 text-[10px]">▲</span>;
  if (trend === 'falling') return <span className="text-red-400 text-[10px]">▼</span>;
  return <span className="text-gray-600 text-[10px]">─</span>;
}

function ProbBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums w-10 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

function CandidateRow({ candidate, color }: { candidate: AwardCandidate; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800/30 last:border-0">
      <span className="text-gray-600 font-bold w-5 text-right tabular-nums">{candidate.rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-orange-300 font-bold text-xs truncate">{candidate.name}</span>
          <TrendIcon trend={candidate.trend} />
          <span className="text-gray-700 text-[10px]">{candidate.team}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {Object.entries(candidate.keyStats).slice(0, 4).map(([k, v]) => (
            <span key={k}>{k}: <span className="text-gray-400">{v}</span></span>
          ))}
        </div>
      </div>
      <div className="w-28">
        <ProbBar pct={candidate.winProbability} color={color} />
      </div>
    </div>
  );
}

function RacePanel({ race }: { race: AwardRace }) {
  const info = AWARD_TYPES[race.type];
  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center gap-2">
        <span>{info.icon}</span>
        <span>{info.label.toUpperCase()}</span>
      </div>
      {race.candidates.map(c => (
        <CandidateRow key={c.playerId} candidate={c} color={info.color} />
      ))}
    </div>
  );
}

export default function AwardPredictions() {
  const { gameStarted } = useGameStore();
  const [races] = useState<AwardRace[]>(() => generateAwardRaces());
  const [selected, setSelected] = useState<AwardType>('mvp');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const current = races.find(r => r.type === selected)!;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">AWARD PREDICTIONS</div>

      {/* Award tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {races.map(r => {
          const info = AWARD_TYPES[r.type];
          return (
            <button key={r.type} onClick={() => setSelected(r.type)}
              className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 ${
                selected === r.type ? 'text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              style={selected === r.type ? { backgroundColor: info.color } : {}}>
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* Featured race */}
      <RacePanel race={current} />

      {/* All races grid */}
      <div className="grid grid-cols-2 gap-3">
        {races.filter(r => r.type !== selected).map(r => (
          <RacePanel key={r.type} race={r} />
        ))}
      </div>
    </div>
  );
}
