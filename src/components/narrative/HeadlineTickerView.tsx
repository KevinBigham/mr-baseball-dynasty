import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoHeadlines,
  type GameContext,
  type Headline,
} from '../../engine/narrative/statHeadlines';

function HeadlineCard({ game, headlines }: { game: GameContext; headlines: Headline[] }) {
  const resultColor = game.won ? '#22c55e' : '#ef4444';
  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tabular-nums" style={{ color: resultColor }}>
              {game.runs}-{game.oppRuns}
            </span>
            <span className="text-gray-400 text-xs">vs</span>
            <span className="text-orange-300 font-bold text-sm">{game.opp}</span>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: resultColor + '22', color: resultColor }}>
            {game.won ? 'WIN' : 'LOSS'}
          </span>
        </div>

        {/* Stat line */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-2">
          {game.hr > 0 && <span>{game.hr} HR</span>}
          {game.sb > 0 && <span>{game.sb} SB</span>}
          <span>{game.k} K</span>
          <span>{game.hits} H</span>
          {game.errors > 0 && <span className="text-red-400">{game.errors} E</span>}
          {game.streak !== 0 && (
            <span className={game.streak > 0 ? 'text-green-400' : 'text-red-400'}>
              {game.streak > 0 ? `W${game.streak}` : `L${Math.abs(game.streak)}`}
            </span>
          )}
        </div>

        {/* Headlines */}
        <div className="space-y-1">
          {headlines.map((h, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span>{h.emoji}</span>
              <span className="text-gray-300">{h.text}</span>
              <span className="text-gray-700 text-[10px] ml-auto">P{h.priority}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeadlineTickerView() {
  const { gameStarted } = useGameStore();
  const [data] = useState(() => generateDemoHeadlines());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  // Collect all headlines for the ticker
  const allHeadlines = data.flatMap(d => d.headlines);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>STAT HEADLINES</span>
        <span className="text-gray-600 text-[10px]">{data.length} RECENT GAMES</span>
      </div>

      {/* Headline ticker */}
      <div className="bloomberg-border px-4 py-3">
        <div className="text-gray-500 text-[10px] font-bold mb-2">TOP HEADLINES</div>
        <div className="space-y-1.5">
          {allHeadlines.sort((a, b) => b.priority - a.priority).slice(0, 5).map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span>{h.emoji}</span>
              <span className="text-orange-300 font-bold">{h.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game cards */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((d, i) => (
          <HeadlineCard key={i} game={d.game} headlines={d.headlines} />
        ))}
      </div>
    </div>
  );
}
