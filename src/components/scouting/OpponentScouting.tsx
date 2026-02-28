import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import {
  getConfidenceLevel,
  type DossierEntry,
} from '../../engine/scouting/opponentDossier';

function ConfidenceMeter({ value }: { value: number }) {
  const { label, color } = getConfidenceLevel(value);
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-gray-600 text-[10px]">INTEL CONFIDENCE</span>
        <span className="text-[10px] font-bold" style={{ color }}>{label} ({value}%)</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function WeakSpotBadge({ position, ovr }: { position: string; ovr: number }) {
  const color = ovr < 45 ? 'bg-red-900/40 text-red-400' :
    ovr < 55 ? 'bg-orange-900/40 text-orange-400' :
    'bg-gray-800 text-gray-400';
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${color}`}>
      {position} ({ovr})
    </span>
  );
}

function DossierCard({ entry }: { entry: DossierEntry }) {
  const [expanded, setExpanded] = useState(false);
  const { label, color } = getConfidenceLevel(entry.confidence);

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-3 py-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-orange-300 font-bold text-sm">{entry.oppName}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
            <span className="text-gray-600 text-[10px]">{entry.scoutCount}x scouted</span>
          </div>
        </div>
        <ConfidenceMeter value={entry.confidence} />
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-800/30 pt-2 space-y-2">
          {/* Stars */}
          {entry.stars.length > 0 && (
            <div>
              <div className="text-gray-600 text-[10px] font-bold mb-1">KEY PLAYERS</div>
              {entry.stars.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-gray-300">{s.name}</span>
                  <span className="text-gray-600">{s.position}</span>
                  <span className="text-orange-400 font-bold tabular-nums">{s.overall} OVR</span>
                </div>
              ))}
            </div>
          )}

          {/* Weak spots */}
          {entry.weakSpots.length > 0 && (
            <div>
              <div className="text-gray-600 text-[10px] font-bold mb-1">WEAK SPOTS</div>
              <div className="flex flex-wrap gap-1">
                {entry.weakSpots.map((w, i) => (
                  <WeakSpotBadge key={i} position={w.position} ovr={w.avgOvr} />
                ))}
              </div>
            </div>
          )}

          {/* Tells */}
          {entry.tells.length > 0 && (
            <div>
              <div className="text-gray-600 text-[10px] font-bold mb-1">SCOUTING TELLS</div>
              {entry.tells.map((t, i) => (
                <div key={i} className="text-gray-400 text-[10px] py-0.5">• {t}</div>
              ))}
            </div>
          )}

          {/* Counter tip */}
          {entry.counterTip && (
            <div className="bg-orange-900/20 border border-orange-800/30 rounded px-2 py-1.5">
              <div className="text-orange-400 text-[10px] font-bold">COUNTER STRATEGY</div>
              <div className="text-gray-300 text-xs">{entry.counterTip}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Demo data for display
const DEMO_DOSSIERS: DossierEntry[] = [
  {
    oppTeamId: 2, oppName: 'Baltimore Colonials', season: 1, confidence: 78, scoutCount: 3, lastScouted: 85,
    tells: ['Relies on power-heavy lineup — vulnerable to breaking stuff', 'Bullpen is thin after the 7th inning'],
    weakSpots: [{ position: '2B', avgOvr: 45, note: 'Below average' }, { position: 'LF', avgOvr: 48, note: 'Weak bat' }],
    stars: [{ name: 'Marcus Bell', position: 'SS', overall: 78 }],
    pitchingTendency: 'Fastball-heavy rotation, struggles with lefties', counterTip: 'Stack lefty bats and exploit the bullpen late'
  },
  {
    oppTeamId: 3, oppName: 'Boston Lobsters', season: 1, confidence: 45, scoutCount: 1, lastScouted: 60,
    tells: ['Strong top of rotation but depth drops off'],
    weakSpots: [{ position: 'C', avgOvr: 42, note: 'Weak defense' }],
    stars: [{ name: 'James Chen', position: 'SP', overall: 82 }],
    pitchingTendency: '', counterTip: ''
  },
  {
    oppTeamId: 4, oppName: 'Tampa Bay Steamers', season: 1, confidence: 15, scoutCount: 0, lastScouted: 0,
    tells: [],
    weakSpots: [],
    stars: [],
    pitchingTendency: '', counterTip: ''
  },
];

export default function OpponentScouting() {
  const { gameStarted } = useGameStore();
  const [dossiers] = useState<DossierEntry[]>(DEMO_DOSSIERS);
  const [sortBy, setSortBy] = useState<'confidence' | 'name'>('confidence');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const sorted = [...dossiers].sort((a, b) =>
    sortBy === 'confidence' ? b.confidence - a.confidence : a.oppName.localeCompare(b.oppName)
  );

  const avgConf = dossiers.length > 0
    ? Math.round(dossiers.reduce((s, d) => s + d.confidence, 0) / dossiers.length)
    : 0;
  const scouted = dossiers.filter(d => d.scoutCount > 0).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">OPPONENT SCOUTING INTEL</div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">OPPONENTS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{dossiers.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SCOUTED</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{scouted}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG CONFIDENCE</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{avgConf}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">UNSCOUTED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{dossiers.length - scouted}</div>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-1">
        <span className="text-gray-600 text-xs">SORT:</span>
        {(['confidence', 'name'] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              sortBy === s ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{s.toUpperCase()}</button>
        ))}
      </div>

      {/* Dossier cards */}
      <div className="grid grid-cols-2 gap-3">
        {sorted.map(d => (
          <DossierCard key={d.oppTeamId} entry={d} />
        ))}
      </div>

      {/* How it works */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">SCOUTING INTEL GUIDE</div>
        <div className="p-3 grid grid-cols-3 gap-4 text-[10px] text-gray-500">
          <div>
            <div className="text-orange-300 font-bold mb-1">CONFIDENCE</div>
            <div>Each scouting session adds 15-35 confidence. Stale intel decays -8 every 30 games unscouted.</div>
          </div>
          <div>
            <div className="text-orange-300 font-bold mb-1">TELLS</div>
            <div>Scouting reveals opponent tendencies, weak spots, and key players to game-plan around.</div>
          </div>
          <div>
            <div className="text-orange-300 font-bold mb-1">VERIFICATION</div>
            <div>After facing a scouted opponent, intel confidence adjusts based on whether the intel helped.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
