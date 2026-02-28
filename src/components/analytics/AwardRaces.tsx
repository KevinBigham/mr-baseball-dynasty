import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';

interface RaceEntry {
  playerId: number;
  name: string;
  teamAbbr: string;
  position: string;
  score: number;
  statLine: string;
}

interface AwardRaces {
  mvpAL: RaceEntry[];
  mvpNL: RaceEntry[];
  cyAL: RaceEntry[];
  cyNL: RaceEntry[];
}

function RacePanel({ title, entries, color, onClickPlayer }: {
  title: string;
  entries: RaceEntry[];
  color: string;
  onClickPlayer: (id: number) => void;
}) {
  if (entries.length === 0) return null;

  const maxScore = entries[0]?.score ?? 1;

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">{title}</div>
      <div className="max-h-[20rem] overflow-y-auto">
        {entries.map((e, i) => {
          const barWidth = maxScore > 0 ? ((e.score / maxScore) * 100) : 0;
          return (
            <div key={e.playerId}
              className="flex items-center gap-2 px-2 py-1.5 text-xs border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50 cursor-pointer"
              onClick={() => onClickPlayer(e.playerId)}>
              <span className={`w-5 text-right tabular-nums font-bold ${
                i === 0 ? color : 'text-gray-600'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold truncate ${i === 0 ? color : 'text-orange-300'}`}>
                    {e.name}
                  </span>
                  <span className="text-gray-600">{e.teamAbbr}</span>
                  <span className="text-gray-700">{e.position}</span>
                </div>
                <div className="text-gray-500 font-mono text-[10px] truncate">{e.statLine}</div>
                {/* Score bar */}
                <div className="h-0.5 bg-gray-800 rounded-full overflow-hidden mt-0.5">
                  <div className={`h-full rounded-full ${
                    i === 0 ? 'bg-orange-500' : 'bg-gray-700'
                  }`} style={{ width: `${Math.max(5, barWidth)}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AwardRaces() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [races, setRaces] = useState<AwardRaces | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getAwardRaces()
      .then(setRaces)
      .finally(() => setLoading(false));
  }, [gameStarted]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Computing award races...</div>;
  if (!races) return null;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">AWARD RACES</div>

      <div className="grid grid-cols-2 gap-4">
        <RacePanel title="AL MVP" entries={races.mvpAL} color="text-yellow-400" onClickPlayer={goToPlayer} />
        <RacePanel title="NL MVP" entries={races.mvpNL} color="text-yellow-400" onClickPlayer={goToPlayer} />
        <RacePanel title="AL CY YOUNG" entries={races.cyAL} color="text-blue-400" onClickPlayer={goToPlayer} />
        <RacePanel title="NL CY YOUNG" entries={races.cyNL} color="text-blue-400" onClickPlayer={goToPlayer} />
      </div>

      {races.mvpAL.length === 0 && races.mvpNL.length === 0 && (
        <div className="text-gray-600 text-xs text-center py-8">
          No season stats available yet. Simulate some games first.
        </div>
      )}
    </div>
  );
}
