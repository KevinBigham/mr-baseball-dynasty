import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ARB_YEAR_DISPLAY,
  generateDemoArbitrationCases,
  getSettlementRange,
  getGapPct,
  getLikelyOutcome,
  settleCase,
  hearingResult,
  type ArbitrationCase,
} from '../../engine/contracts/arbitration';

function CaseCard({ arbCase, onSettle, onHearing }: { arbCase: ArbitrationCase; onSettle: () => void; onHearing: (teamWins: boolean) => void }) {
  const yearInfo = ARB_YEAR_DISPLAY[arbCase.arbYear];
  const range = getSettlementRange(arbCase);
  const gap = getGapPct(arbCase);
  const outcome = getLikelyOutcome(arbCase);
  const isResolved = arbCase.status !== 'pending' && arbCase.status !== 'hearing';

  return (
    <div className={`bloomberg-border ${isResolved ? 'opacity-60' : 'hover:bg-gray-800/20'} transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-orange-300 font-bold text-sm">{arbCase.playerName}</div>
            <div className="text-gray-600 text-[10px]">{arbCase.pos} | Age {arbCase.age} | {arbCase.serviceYears} yrs service</div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: yearInfo.color + '22', color: yearInfo.color }}>
            {yearInfo.label}
          </span>
        </div>

        {/* Salary comparison */}
        <div className="grid grid-cols-3 gap-2 text-center mb-2">
          <div className="bloomberg-border px-2 py-1">
            <div className="text-gray-600 text-[10px]">TEAM OFFER</div>
            <div className="text-green-400 font-bold tabular-nums">${arbCase.teamOffer}M</div>
          </div>
          <div className="bloomberg-border px-2 py-1">
            <div className="text-gray-600 text-[10px]">MIDPOINT</div>
            <div className="text-yellow-400 font-bold tabular-nums">${range.midpoint}M</div>
          </div>
          <div className="bloomberg-border px-2 py-1">
            <div className="text-gray-600 text-[10px]">PLAYER ASK</div>
            <div className="text-red-400 font-bold tabular-nums">${arbCase.playerAsk}M</div>
          </div>
        </div>

        {/* Gap and prediction */}
        <div className="flex items-center justify-between text-[10px] mb-2">
          <span className="text-gray-500">Gap: <span className="text-orange-400 font-bold">{gap}%</span></span>
          <span className="text-gray-500">Market: <span className="text-blue-400 font-bold">${arbCase.projectedValue}M</span></span>
          <span className="text-gray-500">Likely: <span className={`font-bold ${outcome.winner === 'team' ? 'text-green-400' : 'text-red-400'}`}>
            {outcome.winner === 'team' ? 'Team' : 'Player'} ({outcome.confidence}%)
          </span></span>
        </div>

        {/* Recent stats */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
          {Object.entries(arbCase.recentStats).map(([k, v]) => (
            <span key={k}>{k}: <span className="text-gray-300">{v}</span></span>
          ))}
        </div>

        {/* Comparables */}
        <div className="text-[10px] text-gray-600 mb-2">
          <div className="font-bold mb-0.5">COMPARABLES:</div>
          {arbCase.comparables.map(c => (
            <div key={c.name}>{c.name} — ${c.salary}M ({c.stats})</div>
          ))}
        </div>

        {/* Status / Actions */}
        {isResolved ? (
          <div className="text-center text-xs font-bold py-1 rounded bg-gray-800"
            style={{ color: arbCase.status === 'settled' ? '#eab308' : arbCase.status === 'team_wins' ? '#22c55e' : '#ef4444' }}>
            {arbCase.status === 'settled' ? `SETTLED: $${arbCase.currentSalary}M` :
             arbCase.status === 'team_wins' ? `TEAM WINS: $${arbCase.teamOffer}M` :
             `PLAYER WINS: $${arbCase.playerAsk}M`}
          </div>
        ) : (
          <div className="flex gap-1">
            <button onClick={onSettle}
              className="flex-1 text-[10px] font-bold py-1.5 rounded bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">
              SETTLE (${range.midpoint}M)
            </button>
            <button onClick={() => onHearing(true)}
              className="flex-1 text-[10px] font-bold py-1.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30">
              HEARING (TEAM)
            </button>
            <button onClick={() => onHearing(false)}
              className="flex-1 text-[10px] font-bold py-1.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30">
              HEARING (PLAYER)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArbitrationView() {
  const { gameStarted } = useGameStore();
  const [cases, setCases] = useState<ArbitrationCase[]>(() => generateDemoArbitrationCases());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const pending = cases.filter(c => c.status === 'pending' || c.status === 'hearing').length;
  const totalExposure = cases.reduce((s, c) => s + c.playerAsk, 0);
  const totalOffered = cases.reduce((s, c) => s + c.teamOffer, 0);

  const handleSettle = (id: number) => {
    setCases(prev => prev.map(c => c.id === id ? settleCase(c) : c));
  };
  const handleHearing = (id: number, teamWins: boolean) => {
    setCases(prev => prev.map(c => c.id === id ? hearingResult(c, teamWins) : c));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SALARY ARBITRATION</span>
        <span className="text-gray-600 text-[10px]">{pending} PENDING CASES</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CASES</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{cases.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PENDING</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{pending}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM OFFERS</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">${totalOffered.toFixed(1)}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PLAYER ASKS</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">${totalExposure.toFixed(1)}M</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cases.map(c => (
          <CaseCard key={c.id} arbCase={c} onSettle={() => handleSettle(c.id)} onHearing={(tw) => handleHearing(c.id, tw)} />
        ))}
      </div>
    </div>
  );
}
