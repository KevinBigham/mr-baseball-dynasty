import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  SUB_TYPE_DISPLAY,
  generateDemoBench,
  generateDemoOpportunities,
  type BenchPlayer,
  type SubstitutionOpportunity,
} from '../../engine/strategy/pinchHit';

function BenchCard({ player }: { player: BenchPlayer }) {
  const subInfo = SUB_TYPE_DISPLAY[player.bestUse];
  const ovrColor = player.overall >= 75 ? '#22c55e' : player.overall >= 65 ? '#eab308' : '#94a3b8';
  const advColor = player.matchupAdvantage > 0 ? '#22c55e' : player.matchupAdvantage < 0 ? '#ef4444' : '#6b7280';

  return (
    <div className={`bloomberg-border hover:bg-gray-800/20 transition-colors ${!player.available ? 'opacity-40' : ''}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {player.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{player.name}</div>
              <div className="text-gray-600 text-[10px]">{player.pos}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: subInfo.color + '22', color: subInfo.color }}>
            {subInfo.emoji} {subInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[10px]">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">vs RHP</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.vsRHP}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">vs LHP</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.vsLHP}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">SPEED</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.speed}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">DEF</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.defense}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-[10px]">
          <span className="font-bold" style={{ color: advColor }}>
            {player.matchupAdvantage > 0 ? '+' : ''}{player.matchupAdvantage} OVR advantage
          </span>
          {player.usedToday && <span className="text-red-400 font-bold">USED TODAY</span>}
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({ opp }: { opp: SubstitutionOpportunity }) {
  const subInfo = SUB_TYPE_DISPLAY[opp.subType];
  const urgencyColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#6b7280' };

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
              style={{ backgroundColor: subInfo.color + '22', color: subInfo.color }}>
              {subInfo.emoji} {subInfo.label}
            </span>
            <span className="text-gray-400 text-[10px]">INN {opp.inning}</span>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase"
            style={{ backgroundColor: urgencyColors[opp.urgency] + '22', color: urgencyColors[opp.urgency] }}>
            {opp.urgency}
          </span>
        </div>

        <div className="text-gray-400 text-[10px] mb-2">{opp.situation}</div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-red-400">{opp.currentBatter} ({opp.currentBatterOvr})</span>
          <span className="text-gray-600">→</span>
          <span className="text-green-400">{opp.suggestedSub.name} ({opp.suggestedSub.overall})</span>
          <span className="text-green-400 font-bold ml-auto">+{opp.advantage} OVR</span>
        </div>

        <div className="text-gray-600 text-[9px] mt-1">{subInfo.desc}</div>
      </div>
    </div>
  );
}

export default function PinchHitView() {
  const { gameStarted } = useGameStore();
  const [bench] = useState<BenchPlayer[]>(() => generateDemoBench());
  const [opportunities] = useState<SubstitutionOpportunity[]>(() => generateDemoOpportunities());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const available = bench.filter(p => p.available).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PINCH HIT / PINCH RUN STRATEGY</span>
        <span className="text-gray-600 text-[10px]">{available}/{bench.length} BENCH AVAILABLE</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {Object.entries(SUB_TYPE_DISPLAY).map(([key, info]) => (
          <div key={key} className="bloomberg-border px-3 py-2 text-center">
            <div className="text-gray-500 text-[10px]">{info.label.toUpperCase()}</div>
            <div className="font-bold text-lg" style={{ color: info.color }}>{info.emoji}</div>
          </div>
        ))}
      </div>

      {/* Opportunities */}
      <div>
        <div className="text-orange-400 text-[10px] font-bold mb-2">SUBSTITUTION OPPORTUNITIES</div>
        <div className="space-y-2">
          {opportunities.map(o => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </div>
      </div>

      {/* Bench */}
      <div>
        <div className="text-blue-400 text-[10px] font-bold mb-2">BENCH PLAYERS</div>
        <div className="grid grid-cols-2 gap-3">
          {bench.map(p => (
            <BenchCard key={p.id} player={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
