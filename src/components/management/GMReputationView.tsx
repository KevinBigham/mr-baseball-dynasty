import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  REPUTATION_TIERS,
  AXIS_DISPLAY,
  REPUTATION_ACTIONS,
  getReputationTier,
  getReputationEffects,
  initReputation,
  type GMReputation,
  type ReputationTier,
  type ReputationEvent,
} from '../../engine/management/gmReputation';

function TierBadge({ tier }: { tier: ReputationTier }) {
  const info = REPUTATION_TIERS[tier];
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function AxisMeter({ label, icon, value, desc }: { label: string; icon: string; value: number; desc: string }) {
  const color = value >= 70 ? '#22c55e' : value >= 45 ? '#eab308' : '#ef4444';
  return (
    <div className="bloomberg-border px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-sm">{icon}</span>
          <span className="text-gray-400 text-[10px] font-bold">{label}</span>
        </div>
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <div className="text-gray-600 text-[10px]">{desc}</div>
    </div>
  );
}

function EventRow({ event }: { event: ReputationEvent }) {
  const color = event.delta > 0 ? 'text-green-400' : event.delta < 0 ? 'text-red-400' : 'text-gray-500';
  const axisInfo = AXIS_DISPLAY[event.axis];
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-800/30 last:border-0">
      <span className={`font-bold tabular-nums w-10 text-right ${color}`}>
        {event.delta > 0 ? '+' : ''}{event.delta}
      </span>
      <span className="text-gray-600 text-[10px] w-20">{axisInfo.icon} {axisInfo.label}</span>
      <span className="text-gray-300 flex-1">{event.action}</span>
      <span className="text-gray-700 text-[10px]">S{event.season} G{event.gameDay}</span>
    </div>
  );
}

// Demo data
const DEMO_REP: GMReputation = {
  fairDealer: 72,
  aggressive: 58,
  loyalty: 65,
  overall: 66,
  label: 'Respected',
  history: [
    { season: 3, gameDay: 120, action: 'Completed balanced trade for reliever', axis: 'fairDealer', delta: 5 },
    { season: 3, gameDay: 110, action: 'Active buyer at trade deadline', axis: 'aggressive', delta: 5 },
    { season: 3, gameDay: 95, action: 'Extended veteran Derek Anderson', axis: 'loyalty', delta: 6 },
    { season: 3, gameDay: 80, action: 'Traded homegrown player Mike Torres', axis: 'loyalty', delta: -6 },
    { season: 3, gameDay: 60, action: 'Made blockbuster deal for ace pitcher', axis: 'aggressive', delta: 8 },
    { season: 3, gameDay: 45, action: 'Promoted top prospect Carlos Reyes', axis: 'loyalty', delta: 4 },
    { season: 2, gameDay: 150, action: 'Stood pat at deadline', axis: 'aggressive', delta: -3 },
    { season: 2, gameDay: 100, action: 'Completed balanced trade', axis: 'fairDealer', delta: 5 },
  ],
};

export default function GMReputationView() {
  const { gameStarted } = useGameStore();
  const [rep] = useState<GMReputation>(DEMO_REP);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const tier = getReputationTier(rep.overall);
  const tierInfo = REPUTATION_TIERS[tier];
  const effects = getReputationEffects(rep);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>GM REPUTATION</span>
        <TierBadge tier={tier} />
      </div>

      {/* Overall */}
      <div className="bloomberg-border px-6 py-4 text-center">
        <div className="text-gray-500 text-[10px] mb-1">OVERALL REPUTATION</div>
        <div className="text-5xl font-bold tabular-nums mb-1" style={{ color: tierInfo.color }}>
          {rep.overall}
        </div>
        <div className="text-gray-400 text-xs">{tierInfo.desc}</div>
      </div>

      {/* Axis meters */}
      <div className="grid grid-cols-3 gap-3">
        <AxisMeter label={AXIS_DISPLAY.fairDealer.label} icon={AXIS_DISPLAY.fairDealer.icon}
          value={rep.fairDealer} desc={AXIS_DISPLAY.fairDealer.desc} />
        <AxisMeter label={AXIS_DISPLAY.aggressive.label} icon={AXIS_DISPLAY.aggressive.icon}
          value={rep.aggressive} desc={AXIS_DISPLAY.aggressive.desc} />
        <AxisMeter label={AXIS_DISPLAY.loyalty.label} icon={AXIS_DISPLAY.loyalty.icon}
          value={rep.loyalty} desc={AXIS_DISPLAY.loyalty.desc} />
      </div>

      {/* Effects */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">REPUTATION EFFECTS</div>
        <div className="p-3 grid grid-cols-4 gap-3 text-[10px]">
          <div>
            <div className="text-gray-600">TRADE WILLINGNESS</div>
            <div className={`font-bold tabular-nums ${effects.tradeWillingness >= 1 ? 'text-green-400' : 'text-red-400'}`}>
              {effects.tradeWillingness.toFixed(1)}x
            </div>
          </div>
          <div>
            <div className="text-gray-600">FA DISCOUNT</div>
            <div className={`font-bold tabular-nums ${effects.faDiscount <= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {effects.faDiscount > 0 ? '+' : ''}{effects.faDiscount}%
            </div>
          </div>
          <div>
            <div className="text-gray-600">MORALE BONUS</div>
            <div className={`font-bold tabular-nums ${effects.moraleBonus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {effects.moraleBonus > 0 ? '+' : ''}{effects.moraleBonus}
            </div>
          </div>
          <div>
            <div className="text-gray-600">MEDIA</div>
            <div className="text-gray-300">{effects.mediaPerception}</div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">REPUTATION HISTORY ({rep.history.length})</div>
        <div className="max-h-[20rem] overflow-y-auto">
          {rep.history.map((e, i) => <EventRow key={i} event={e} />)}
        </div>
      </div>

      {/* Actions reference */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">ACTIONS THAT AFFECT REPUTATION</div>
        <div className="p-3 grid grid-cols-3 gap-2">
          {REPUTATION_ACTIONS.map(a => (
            <div key={a.id} className="text-[10px] px-2 py-1 bg-gray-800/30 rounded">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold">{a.label}</span>
                <span className={`font-bold tabular-nums ${a.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {a.delta > 0 ? '+' : ''}{a.delta}
                </span>
              </div>
              <div className="text-gray-600">{AXIS_DISPLAY[a.axis].icon} {a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
