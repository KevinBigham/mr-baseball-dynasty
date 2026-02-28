import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ZONE_SIZE_DISPLAY,
  generateDemoUmpires,
  generateDemoCrews,
  getConsistencyLabel,
  getStrikeZoneEffect,
  getEjectionRisk,
  type Umpire,
  type CrewAssignment,
} from '../../engine/game/umpireTendencies';

function UmpireCard({ ump }: { ump: Umpire }) {
  const ratingColor = ump.rating >= 80 ? '#22c55e' : ump.rating >= 65 ? '#eab308' : '#ef4444';
  const consistencyInfo = getConsistencyLabel(ump.consistency);
  const zoneInfo = ZONE_SIZE_DISPLAY[ump.strikeZoneSize];
  const effect = getStrikeZoneEffect(ump);
  const ejRisk = getEjectionRisk(ump);

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ratingColor, color: ratingColor, backgroundColor: ratingColor + '11' }}>
              {ump.rating}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{ump.name}</div>
              <div className="text-gray-600 text-[10px]">{ump.experience} yrs | {ump.personality}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: zoneInfo.color + '22', color: zoneInfo.color }}>
            {zoneInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div>
            <div className="text-gray-600">CONSISTENCY</div>
            <div className="font-bold" style={{ color: consistencyInfo.color }}>{ump.consistency}%</div>
          </div>
          <div>
            <div className="text-gray-600">LOW ZONE</div>
            <div className="tabular-nums" style={{ color: ump.lowZoneBias > 0 ? '#22c55e' : ump.lowZoneBias < 0 ? '#ef4444' : '#94a3b8' }}>
              {ump.lowZoneBias > 0 ? '+' : ''}{ump.lowZoneBias}
            </div>
          </div>
          <div>
            <div className="text-gray-600">CORNER</div>
            <div className="tabular-nums" style={{ color: ump.outsideCornerBias > 0 ? '#22c55e' : ump.outsideCornerBias < 0 ? '#ef4444' : '#94a3b8' }}>
              {ump.outsideCornerBias > 0 ? '+' : ''}{ump.outsideCornerBias}
            </div>
          </div>
          <div>
            <div className="text-gray-600">EJECT RISK</div>
            <div className="font-bold" style={{ color: ejRisk.color }}>{ejRisk.label}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-gray-600">Pitcher adj: <span className={`font-bold ${effect.pitcherAdj >= 0 ? 'text-green-400' : 'text-red-400'}`}>{effect.pitcherAdj > 0 ? '+' : ''}{effect.pitcherAdj}</span></span>
          <span className="text-gray-600">Hitter adj: <span className={`font-bold ${effect.hitterAdj >= 0 ? 'text-green-400' : 'text-red-400'}`}>{effect.hitterAdj > 0 ? '+' : ''}{effect.hitterAdj}</span></span>
        </div>
      </div>
    </div>
  );
}

function CrewCard({ crew }: { crew: CrewAssignment }) {
  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">{crew.game}</div>
      <div className="grid grid-cols-4 text-[10px]">
        {[
          { label: 'HOME PLATE', ump: crew.homePlate },
          { label: '1ST BASE', ump: crew.firstBase },
          { label: '2ND BASE', ump: crew.secondBase },
          { label: '3RD BASE', ump: crew.thirdBase },
        ].map(({ label, ump }) => (
          <div key={label} className="px-3 py-2 border-r border-gray-800/30 last:border-0 text-center">
            <div className="text-gray-600 mb-0.5">{label}</div>
            <div className="text-orange-300 font-bold">{ump.name.split(' ').pop()}</div>
            <div className="text-gray-500">{ump.rating} OVR</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UmpireView() {
  const { gameStarted } = useGameStore();
  const [umpires] = useState(() => generateDemoUmpires());
  const [crews] = useState(() => generateDemoCrews());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const avgRating = Math.round(umpires.reduce((s, u) => s + u.rating, 0) / umpires.length);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>UMPIRE TENDENCIES</span>
        <span className="text-gray-600 text-[10px]">{umpires.length} UMPIRES | AVG {avgRating} OVR</span>
      </div>

      {/* Crew assignments */}
      <div>
        <div className="text-gray-500 text-[10px] font-bold mb-2 px-1">TODAY&apos;S CREW ASSIGNMENTS</div>
        <div className="grid grid-cols-2 gap-3">
          {crews.map(c => <CrewCard key={c.game} crew={c} />)}
        </div>
      </div>

      {/* Umpire cards */}
      <div>
        <div className="text-gray-500 text-[10px] font-bold mb-2 px-1">ALL UMPIRES</div>
        <div className="grid grid-cols-2 gap-3">
          {umpires.sort((a, b) => b.rating - a.rating).map(u => (
            <UmpireCard key={u.id} ump={u} />
          ))}
        </div>
      </div>
    </div>
  );
}
