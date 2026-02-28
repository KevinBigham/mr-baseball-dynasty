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

interface TripleCrownHitter {
  playerId: number; name: string; teamAbbr: string;
  avg: number; hr: number; rbi: number;
  leadsAvg: boolean; leadsHr: boolean; leadsRbi: boolean;
}
interface TripleCrownPitcher {
  playerId: number; name: string; teamAbbr: string;
  era: number; wins: number; k: number;
  leadsEra: boolean; leadsW: boolean; leadsK: boolean;
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

function LeadBadge({ leads }: { leads: boolean }) {
  if (!leads) return null;
  return <span className="text-yellow-500 text-[10px] font-bold ml-0.5">*</span>;
}

function TripleCrownPanel({ title, hitters, pitchers, onClickPlayer }: {
  title: string;
  hitters: TripleCrownHitter[];
  pitchers: TripleCrownPitcher[];
  onClickPlayer: (id: number) => void;
}) {
  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">{title}</div>
      <div className="grid grid-cols-2 gap-0 divide-x divide-gray-800">
        {/* Hitting */}
        <div>
          <div className="text-gray-500 text-[10px] font-bold px-2 py-1 border-b border-gray-800 bg-gray-900/30">
            BATTING: AVG / HR / RBI
          </div>
          <div className="max-h-[16rem] overflow-y-auto">
            {hitters.slice(0, 8).map((h, i) => {
              const crowns = [h.leadsAvg, h.leadsHr, h.leadsRbi].filter(Boolean).length;
              return (
                <div key={h.playerId}
                  className="flex items-center gap-1 px-2 py-1 text-xs border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => onClickPlayer(h.playerId)}>
                  <span className="text-gray-600 w-4 text-right tabular-nums">{i + 1}</span>
                  <span className={`font-bold truncate flex-1 ${crowns === 3 ? 'text-yellow-400' : crowns >= 2 ? 'text-orange-300' : 'text-gray-300'}`}>
                    {h.name}
                    {crowns === 3 && <span className="text-yellow-500 text-[10px] ml-1">TRIPLE CROWN</span>}
                  </span>
                  <span className="text-gray-600 text-[10px]">{h.teamAbbr}</span>
                  <span className="tabular-nums text-gray-400 w-8 text-right">
                    .{h.avg.toFixed(3).slice(2)}<LeadBadge leads={h.leadsAvg} />
                  </span>
                  <span className="tabular-nums text-gray-400 w-6 text-right">
                    {h.hr}<LeadBadge leads={h.leadsHr} />
                  </span>
                  <span className="tabular-nums text-gray-400 w-7 text-right">
                    {h.rbi}<LeadBadge leads={h.leadsRbi} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Pitching */}
        <div>
          <div className="text-gray-500 text-[10px] font-bold px-2 py-1 border-b border-gray-800 bg-gray-900/30">
            PITCHING: ERA / W / K
          </div>
          <div className="max-h-[16rem] overflow-y-auto">
            {pitchers.slice(0, 8).map((p, i) => {
              const crowns = [p.leadsEra, p.leadsW, p.leadsK].filter(Boolean).length;
              return (
                <div key={p.playerId}
                  className="flex items-center gap-1 px-2 py-1 text-xs border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => onClickPlayer(p.playerId)}>
                  <span className="text-gray-600 w-4 text-right tabular-nums">{i + 1}</span>
                  <span className={`font-bold truncate flex-1 ${crowns === 3 ? 'text-yellow-400' : crowns >= 2 ? 'text-blue-300' : 'text-gray-300'}`}>
                    {p.name}
                    {crowns === 3 && <span className="text-yellow-500 text-[10px] ml-1">TRIPLE CROWN</span>}
                  </span>
                  <span className="text-gray-600 text-[10px]">{p.teamAbbr}</span>
                  <span className="tabular-nums text-gray-400 w-8 text-right">
                    {p.era.toFixed(2)}<LeadBadge leads={p.leadsEra} />
                  </span>
                  <span className="tabular-nums text-gray-400 w-6 text-right">
                    {p.wins}<LeadBadge leads={p.leadsW} />
                  </span>
                  <span className="tabular-nums text-gray-400 w-7 text-right">
                    {p.k}<LeadBadge leads={p.leadsK} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AwardRaces() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [races, setRaces] = useState<AwardRaces | null>(null);
  const [tripleCrown, setTripleCrown] = useState<{ hitting: TripleCrownHitter[]; pitching: TripleCrownPitcher[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    Promise.all([
      getEngine().getAwardRaces(),
      getEngine().getTripleCrownRaces(),
    ]).then(([r, tc]) => {
      setRaces(r);
      setTripleCrown(tc);
    }).finally(() => setLoading(false));
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

      {/* Triple Crown Watch */}
      {tripleCrown && (tripleCrown.hitting.length > 0 || tripleCrown.pitching.length > 0) && (
        <TripleCrownPanel
          title="TRIPLE CROWN WATCH"
          hitters={tripleCrown.hitting}
          pitchers={tripleCrown.pitching}
          onClickPlayer={goToPlayer}
        />
      )}

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
