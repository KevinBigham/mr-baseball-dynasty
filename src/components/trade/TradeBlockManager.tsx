import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ASKING_PRICE_DISPLAY,
  generateInterest,
  getBlockSummary,
  type TradeBlockEntry,
  type AskingPrice,
  type TradeInterest,
} from '../../engine/trade/tradeBlock';

function AskingPriceBadge({ price }: { price: AskingPrice }) {
  const info = ASKING_PRICE_DISPLAY[price];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function InterestBadge({ quality }: { quality: TradeInterest['quality'] }) {
  const colors = { strong: '#22c55e', fair: '#eab308', lowball: '#ef4444' };
  return (
    <span className="px-1 py-0.5 text-[9px] font-bold rounded"
      style={{ backgroundColor: colors[quality] + '22', color: colors[quality] }}>
      {quality.toUpperCase()}
    </span>
  );
}

function BlockCard({ entry, onRemove }: { entry: TradeBlockEntry; onRemove: () => void }) {
  const [showInterest, setShowInterest] = useState(false);

  return (
    <div className="bloomberg-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-orange-400 font-bold text-sm border border-gray-700">
              {entry.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{entry.playerName}</div>
              <div className="text-gray-600 text-[10px]">
                {entry.position} | Age {entry.age} | ${entry.salary}M / {entry.contractYears}yr
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AskingPriceBadge price={entry.askingPrice} />
            <button onClick={onRemove}
              className="text-gray-700 hover:text-red-400 transition-colors text-xs">
              ✕
            </button>
          </div>
        </div>

        {entry.notes && (
          <div className="text-gray-500 text-[10px] italic mb-2">{entry.notes}</div>
        )}

        {/* Interest section */}
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => setShowInterest(!showInterest)}
            className="text-gray-500 text-[10px] hover:text-gray-300 transition-colors flex items-center gap-1">
            <span>{entry.interest.length} TEAM{entry.interest.length !== 1 ? 'S' : ''} INTERESTED</span>
            <svg className={`w-3 h-3 transition-transform ${showInterest ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {entry.interest.some(i => i.quality === 'strong') && (
            <span className="text-green-400 text-[10px] animate-pulse">STRONG OFFER</span>
          )}
        </div>

        {showInterest && entry.interest.length > 0 && (
          <div className="space-y-1 mt-2">
            {entry.interest.map((int, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/30 rounded text-[10px]">
                <span className="text-gray-400 font-bold w-10">{int.teamAbbr}</span>
                <InterestBadge quality={int.quality} />
                <span className="text-gray-500 uppercase w-16">{int.offerType}</span>
                <span className="text-gray-400 flex-1">{int.desc}</span>
              </div>
            ))}
          </div>
        )}

        {showInterest && entry.interest.length === 0 && (
          <div className="text-gray-700 text-[10px] text-center py-2">No offers yet. Check back later.</div>
        )}
      </div>
    </div>
  );
}

// Demo data
const DEMO_BLOCK: TradeBlockEntry[] = [
  {
    playerId: 1, playerName: 'Tommy Nakamura', position: 'RF', overall: 68, age: 34, salary: 10, contractYears: 1,
    askingPrice: 'salary_dump', addedDay: 80, notes: 'Veteran bat, declining defense. Looking to clear salary.',
    interest: generateInterest({ playerId: 1, playerName: 'Tommy Nakamura', position: 'RF', overall: 68, age: 34, salary: 10, contractYears: 1, askingPrice: 'salary_dump', addedDay: 80, interest: [], notes: '' }),
  },
  {
    playerId: 2, playerName: 'Mike Torres', position: '1B', overall: 66, age: 29, salary: 8, contractYears: 2,
    askingPrice: 'fair', addedDay: 90, notes: 'Solid platoon bat. Could net a pitching prospect.',
    interest: generateInterest({ playerId: 2, playerName: 'Mike Torres', position: '1B', overall: 66, age: 29, salary: 8, contractYears: 2, askingPrice: 'fair', addedDay: 90, interest: [], notes: '' }),
  },
  {
    playerId: 3, playerName: 'Derek Anderson', position: 'C', overall: 72, age: 33, salary: 14, contractYears: 1,
    askingPrice: 'premium', addedDay: 100, notes: 'Elite game-caller. Contenders will pay up.',
    interest: generateInterest({ playerId: 3, playerName: 'Derek Anderson', position: 'C', overall: 72, age: 33, salary: 14, contractYears: 1, askingPrice: 'premium', addedDay: 100, interest: [], notes: '' }),
  },
];

export default function TradeBlockManager() {
  const { gameStarted } = useGameStore();
  const [block, setBlock] = useState<TradeBlockEntry[]>(DEMO_BLOCK);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getBlockSummary(block);

  const handleRemove = (playerId: number) => {
    setBlock(prev => prev.filter(e => e.playerId !== playerId));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TRADE BLOCK</span>
        <span className="text-gray-600 text-[10px]">{summary.total} PLAYERS AVAILABLE</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ON BLOCK</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.total}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">WITH INTEREST</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.withInterest}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL OFFERS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.totalInterest}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SALARY ON BLOCK</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">${summary.totalSalary}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SALARY DUMPS</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.salaryDumps}</div>
        </div>
      </div>

      {/* Block cards */}
      <div className="space-y-3">
        {block.map(e => (
          <BlockCard key={e.playerId} entry={e} onRemove={() => handleRemove(e.playerId)} />
        ))}
        {block.length === 0 && (
          <div className="bloomberg-border px-4 py-8 text-center text-gray-600 text-xs">
            No players on the trade block. Add players from the roster view.
          </div>
        )}
      </div>

      {/* Guide */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">ASKING PRICE GUIDE</div>
        <div className="p-3 grid grid-cols-4 gap-3 text-[10px]">
          {(Object.entries(ASKING_PRICE_DISPLAY) as [AskingPrice, typeof ASKING_PRICE_DISPLAY[AskingPrice]][]).map(([price, info]) => (
            <div key={price}>
              <div className="font-bold mb-0.5" style={{ color: info.color }}>{info.icon} {info.label}</div>
              <div className="text-gray-600">{info.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
