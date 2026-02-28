import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  SEVERITY_DISPLAY,
  BODY_PART_DISPLAY,
  generateInjury,
  getInjurySummary,
  type Injury,
  type InjurySeverity,
  type BodyPart,
} from '../../engine/medical/injuryTracker';

function SeverityBadge({ severity }: { severity: InjurySeverity }) {
  const info = SEVERITY_DISPLAY[severity];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.label}
    </span>
  );
}

function RiskMeter({ risk }: { risk: number }) {
  const color = risk >= 25 ? '#ef4444' : risk >= 15 ? '#f97316' : '#22c55e';
  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${risk}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] tabular-nums" style={{ color }}>{risk}%</span>
    </div>
  );
}

function InjuryCard({ injury, currentDay }: { injury: Injury; currentDay: number }) {
  const bodyInfo = BODY_PART_DISPLAY[injury.bodyPart];
  const daysLeft = Math.max(0, injury.expectedReturn - currentDay);
  const isOverdue = currentDay > injury.expectedReturn && injury.isActive;

  return (
    <div className="bloomberg-border hover:bg-gray-800/10 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{bodyInfo.icon}</span>
            <div>
              <div className="text-orange-300 font-bold text-sm">{injury.playerName}</div>
              <div className="text-gray-600 text-[10px]">{injury.position}</div>
            </div>
          </div>
          <SeverityBadge severity={injury.severity} />
        </div>

        <div className="text-gray-400 text-xs mb-2">{injury.description}</div>

        <div className="grid grid-cols-4 gap-2 text-[10px]">
          <div>
            <div className="text-gray-600">BODY PART</div>
            <div className="text-gray-300">{bodyInfo.label}</div>
          </div>
          <div>
            <div className="text-gray-600">INJURED</div>
            <div className="text-gray-300 tabular-nums">Game {injury.gameDay}</div>
          </div>
          <div>
            <div className="text-gray-600">RETURN</div>
            <div className={`font-bold tabular-nums ${isOverdue ? 'text-red-400' : daysLeft <= 3 ? 'text-green-400' : 'text-gray-300'}`}>
              {injury.severity === 'season_ending' ? 'NEXT YEAR' :
                daysLeft === 0 ? 'TODAY' : `${daysLeft} games`}
            </div>
          </div>
          <div>
            <div className="text-gray-600">RE-INJURY RISK</div>
            <RiskMeter risk={injury.reinjuryRisk} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo data
const DEMO_INJURIES: Injury[] = [
  generateInjury(1, 'Marcus Bell', 'SS', 95),
  generateInjury(2, "James O'Brien", 'SP', 80),
  generateInjury(3, 'Carlos Reyes', 'CF', 100),
  generateInjury(4, 'Derek Anderson', 'C', 60),
  { playerId: 5, playerName: 'Alex Ramirez', position: 'LF', bodyPart: 'hamstring', description: 'Grade 2 hamstring tear', severity: 'il_60', gameDay: 45, expectedReturn: 110, reinjuryRisk: 22, isActive: true },
];

export default function InjuryTrackerView() {
  const { gameStarted } = useGameStore();
  const [injuries] = useState<Injury[]>(DEMO_INJURIES);
  const [filter, setFilter] = useState<'all' | 'active' | 'il'>('all');
  const currentDay = 105;

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getInjurySummary(injuries);
  const filtered = filter === 'all' ? injuries :
    filter === 'active' ? injuries.filter(i => i.isActive) :
    injuries.filter(i => i.isActive && i.severity !== 'day_to_day');

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>INJURY TRACKER</span>
        {summary.seasonEnding > 0 && (
          <span className="text-red-400 text-[10px]">{summary.seasonEnding} SEASON-ENDING</span>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.total}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ON IL</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.onIL}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DAY-TO-DAY</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.dayToDay}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HIGH RISK</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.highRisk}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SEASON OVER</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.seasonEnding}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'active', 'il'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f === 'il' ? 'ON IL' : f.toUpperCase()}</button>
        ))}
      </div>

      {/* Injury cards */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((inj, i) => (
          <InjuryCard key={`${inj.playerId}-${i}`} injury={inj} currentDay={currentDay} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-gray-600 text-xs text-center py-8">No injuries. Knock on wood.</div>
        )}
      </div>
    </div>
  );
}
