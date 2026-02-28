import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import {
  GM_STRATEGIES,
  applyGMStrategy,
  recommendStrategy,
  type GMStrategyId,
  type GMStrategyEffect,
} from '../../engine/analytics/gmStrategies';

function StrategyCard({
  id,
  active,
  recommended,
  onClick,
}: {
  id: GMStrategyId;
  active: boolean;
  recommended: boolean;
  onClick: () => void;
}) {
  const strat = GM_STRATEGIES[id];
  const borderColor = active ? 'border-orange-500' : 'border-gray-800';
  return (
    <div
      className={`bloomberg-border cursor-pointer transition-all hover:bg-gray-800/30 ${borderColor} ${active ? 'ring-1 ring-orange-500/30' : ''}`}
      onClick={onClick}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{strat.icon}</span>
            <span className="text-orange-300 font-bold text-sm">{strat.label}</span>
          </div>
          <div className="flex gap-1">
            {active && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-900/40 text-orange-400">ACTIVE</span>}
            {recommended && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-900/40 text-green-400">REC</span>}
          </div>
        </div>
        <div className="text-gray-400 text-xs mb-3">{strat.desc}</div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <div className="text-gray-600">TRADE POSTURE</div>
            <div className={`font-bold ${strat.tradePosture === 'buyer' ? 'text-green-400' : strat.tradePosture === 'seller' ? 'text-red-400' : 'text-gray-400'}`}>
              {strat.tradePosture.toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-gray-600">YOUTH BIAS</div>
            <div className={`font-bold ${strat.youthBias ? 'text-blue-400' : 'text-gray-500'}`}>
              {strat.youthBias ? 'YES' : 'NO'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">CAP MODE</div>
            <div className="font-bold text-gray-400">{strat.capMode.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TradeBlockList({ playerIds, label }: { playerIds: number[]; label: string }) {
  if (playerIds.length === 0) return null;
  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header text-gray-500">{label}</div>
      <div className="px-3 py-2 text-xs text-gray-400">
        {playerIds.length} player{playerIds.length !== 1 ? 's' : ''} flagged
      </div>
    </div>
  );
}

export default function GMStrategyPanel() {
  const { gameStarted, userTeamId } = useGameStore();
  const [activeStrategy, setActiveStrategy] = useState<GMStrategyId>('balanced');
  const [effects, setEffects] = useState<GMStrategyEffect | null>(null);
  const [recommendation, setRecommendation] = useState<{ recommended: GMStrategyId; reasoning: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);

    Promise.all([
      getEngine().getRoster(userTeamId),
      getEngine().getStandings(),
    ]).then(([roster, standings]) => {
      const players = (roster as any)?.players ?? [];
      const avgOvr = players.length > 0
        ? players.reduce((s: number, p: any) => s + (p.overall ?? 50), 0) / players.length
        : 50;
      const avgAge = players.length > 0
        ? players.reduce((s: number, p: any) => s + (p.age ?? 25), 0) / players.length
        : 25;

      // Find user team record
      const rows = (standings as any)?.rows ?? standings;
      const userRow = Array.isArray(rows) ? rows.find((r: any) => r.teamId === userTeamId) : null;
      const wins = userRow?.wins ?? 0;
      const losses = userRow?.losses ?? 0;

      const rec = recommendStrategy(wins, losses, avgOvr, avgAge, 50);
      setRecommendation(rec);
    }).finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  const handleSelect = (id: GMStrategyId) => {
    setActiveStrategy(id);
    // Effects would be computed with actual roster data
    // For display purposes, show the strategy effects
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading strategy data...</div>;

  const activeStrat = GM_STRATEGIES[activeStrategy];

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">GM STRATEGY</div>

      {/* Recommendation */}
      {recommendation && (
        <div className="bloomberg-border px-4 py-3 border-green-800/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-400 text-[10px] font-bold">RECOMMENDED</span>
            <span className="text-orange-300 font-bold text-sm">
              {GM_STRATEGIES[recommendation.recommended].icon} {GM_STRATEGIES[recommendation.recommended].label}
            </span>
          </div>
          <div className="text-gray-400 text-xs">{recommendation.reasoning}</div>
        </div>
      )}

      {/* Strategy cards */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(GM_STRATEGIES) as GMStrategyId[]).map(id => (
          <StrategyCard
            key={id}
            id={id}
            active={activeStrategy === id}
            recommended={recommendation?.recommended === id}
            onClick={() => handleSelect(id)}
          />
        ))}
      </div>

      {/* Active strategy details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bloomberg-border">
          <div className="bloomberg-header text-orange-400">STRATEGY EFFECTS</div>
          <div className="p-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Trade Posture</span>
              <span className={`font-bold ${activeStrat.tradePosture === 'buyer' ? 'text-green-400' : activeStrat.tradePosture === 'seller' ? 'text-red-400' : 'text-gray-400'}`}>
                {activeStrat.tradePosture.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Youth Bias</span>
              <span className={`font-bold ${activeStrat.youthBias ? 'text-blue-400' : 'text-gray-500'}`}>
                {activeStrat.youthBias ? 'Active — prioritize young talent' : 'Off — evaluate all ages equally'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cap Mode</span>
              <span className="text-gray-300 font-bold">{activeStrat.capMode.toUpperCase()}</span>
            </div>

            {activeStrategy === 'rebuild' && (
              <div className="mt-2 border-t border-gray-800 pt-2 space-y-1">
                <div className="text-gray-600 text-[10px] font-bold">REBUILD EFFECTS:</div>
                <div className="text-gray-400">Veterans 28+ with OVR 55+ → trade block</div>
                <div className="text-gray-400">Prospects U-25 with POT 60+ → protected</div>
                <div className="text-gray-400">Draft picks valued 50% higher</div>
                <div className="text-gray-400">Prospect valuations increased 40%</div>
              </div>
            )}
            {activeStrategy === 'contend' && (
              <div className="mt-2 border-t border-gray-800 pt-2 space-y-1">
                <div className="text-gray-600 text-[10px] font-bold">CONTEND EFFECTS:</div>
                <div className="text-gray-400">Underperforming vets (OVR &lt;50, 27+) → trade block</div>
                <div className="text-gray-400">Core players (OVR 65+) → protected</div>
                <div className="text-gray-400">FA targets: minimum 60 OVR</div>
                <div className="text-gray-400">Willing to trade picks + prospects for impact</div>
              </div>
            )}
            {activeStrategy === 'balanced' && (
              <div className="mt-2 border-t border-gray-800 pt-2 space-y-1">
                <div className="text-gray-600 text-[10px] font-bold">BALANCED EFFECTS:</div>
                <div className="text-gray-400">Franchise cornerstones (OVR 70+) → protected</div>
                <div className="text-gray-400">No automatic trade block</div>
                <div className="text-gray-400">Standard draft pick + prospect valuation</div>
                <div className="text-gray-400">Opportunistic — evaluate each deal on merit</div>
              </div>
            )}
          </div>
        </div>

        <div className="bloomberg-border">
          <div className="bloomberg-header text-gray-500">STRATEGY GUIDE</div>
          <div className="p-3 space-y-3 text-xs">
            <div>
              <div className="text-orange-300 font-bold mb-0.5">When to Rebuild</div>
              <div className="text-gray-400">Aging roster with a losing record. Sell expiring veterans for young talent and draft capital.</div>
            </div>
            <div>
              <div className="text-orange-300 font-bold mb-0.5">When to Contend</div>
              <div className="text-gray-400">Your window is open. Winning record, strong core. Add the missing pieces to make a championship run.</div>
            </div>
            <div>
              <div className="text-orange-300 font-bold mb-0.5">When to Balance</div>
              <div className="text-gray-400">Not sure which way to go? Stay flexible. Take value trades when they come but don't force anything.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
