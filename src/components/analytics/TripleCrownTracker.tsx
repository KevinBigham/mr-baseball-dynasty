import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';

interface HitterEntry {
  playerId: number;
  name: string;
  teamAbbr: string;
  avg: number;
  hr: number;
  rbi: number;
  leadsAvg: boolean;
  leadsHr: boolean;
  leadsRbi: boolean;
}

interface PitcherEntry {
  playerId: number;
  name: string;
  teamAbbr: string;
  era: number;
  wins: number;
  k: number;
  leadsEra: boolean;
  leadsW: boolean;
  leadsK: boolean;
}

function CrownBadge({ leads }: { leads: number }) {
  if (leads === 3) return <span className="text-yellow-400 text-[10px] font-bold">TRIPLE CROWN</span>;
  if (leads === 2) return <span className="text-orange-400 text-[10px] font-bold">2/3</span>;
  if (leads === 1) return <span className="text-gray-400 text-[10px]">1/3</span>;
  return null;
}

function LeaderHighlight({ isLeader }: { isLeader: boolean }) {
  if (!isLeader) return null;
  return <span className="text-yellow-400 text-[10px] font-bold ml-0.5">*</span>;
}

export default function TripleCrownTracker() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [hitters, setHitters] = useState<HitterEntry[]>([]);
  const [pitchers, setPitchers] = useState<PitcherEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getTripleCrownRaces()
      .then(data => {
        setHitters(data.hitting);
        setPitchers(data.pitching);
      })
      .finally(() => setLoading(false));
  }, [gameStarted]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading triple crown data...</div>;

  const hitterCrown = hitters.find(h => h.leadsAvg && h.leadsHr && h.leadsRbi);
  const pitcherCrown = pitchers.find(p => p.leadsEra && p.leadsW && p.leadsK);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TRIPLE CROWN TRACKER</span>
        <div className="flex items-center gap-3">
          {hitterCrown && (
            <span className="text-yellow-400 text-xs font-bold animate-pulse">
              HITTING TRIPLE CROWN: {hitterCrown.name}
            </span>
          )}
          {pitcherCrown && (
            <span className="text-yellow-400 text-xs font-bold animate-pulse">
              PITCHING TRIPLE CROWN: {pitcherCrown.name}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Hitting Triple Crown */}
        <div className="bloomberg-border">
          <div className="bloomberg-header text-orange-400">HITTING TRIPLE CROWN</div>
          <div className="px-3 py-1 text-[10px] text-gray-600 bg-gray-900/50 flex justify-between">
            <span>Categories: AVG · HR · RBI</span>
            <span>* = League Leader</span>
          </div>
          <div className="max-h-[24rem] overflow-y-auto">
            {hitters.length === 0 ? (
              <div className="px-4 py-8 text-gray-600 text-xs text-center">Not enough data yet.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                    <th className="px-2 py-1 text-right w-6">#</th>
                    <th className="px-2 py-1 text-left">PLAYER</th>
                    <th className="px-2 py-1">TEAM</th>
                    <th className="px-2 py-1 text-right">AVG</th>
                    <th className="px-2 py-1 text-right">HR</th>
                    <th className="px-2 py-1 text-right">RBI</th>
                    <th className="px-2 py-1 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {hitters.map((h, i) => {
                    const leads = (h.leadsAvg ? 1 : 0) + (h.leadsHr ? 1 : 0) + (h.leadsRbi ? 1 : 0);
                    return (
                      <tr key={h.playerId}
                        className={`text-xs hover:bg-gray-800/50 cursor-pointer ${leads === 3 ? 'bg-yellow-900/10' : ''}`}
                        onClick={() => goToPlayer(h.playerId)}>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-600">{i + 1}</td>
                        <td className="px-2 py-1 font-bold text-orange-300">{h.name}</td>
                        <td className="px-2 py-1 text-gray-500 text-center">{h.teamAbbr}</td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          <span className={h.leadsAvg ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
                            .{h.avg.toFixed(3).slice(2)}
                          </span>
                          <LeaderHighlight isLeader={h.leadsAvg} />
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          <span className={h.leadsHr ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
                            {h.hr}
                          </span>
                          <LeaderHighlight isLeader={h.leadsHr} />
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          <span className={h.leadsRbi ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
                            {h.rbi}
                          </span>
                          <LeaderHighlight isLeader={h.leadsRbi} />
                        </td>
                        <td className="px-2 py-1 text-center"><CrownBadge leads={leads} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pitching Triple Crown */}
        <div className="bloomberg-border">
          <div className="bloomberg-header text-blue-400">PITCHING TRIPLE CROWN</div>
          <div className="px-3 py-1 text-[10px] text-gray-600 bg-gray-900/50 flex justify-between">
            <span>Categories: ERA · W · K</span>
            <span>* = League Leader</span>
          </div>
          <div className="max-h-[24rem] overflow-y-auto">
            {pitchers.length === 0 ? (
              <div className="px-4 py-8 text-gray-600 text-xs text-center">Not enough data yet.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                    <th className="px-2 py-1 text-right w-6">#</th>
                    <th className="px-2 py-1 text-left">PLAYER</th>
                    <th className="px-2 py-1">TEAM</th>
                    <th className="px-2 py-1 text-right">ERA</th>
                    <th className="px-2 py-1 text-right">W</th>
                    <th className="px-2 py-1 text-right">K</th>
                    <th className="px-2 py-1 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {pitchers.map((p, i) => {
                    const leads = (p.leadsEra ? 1 : 0) + (p.leadsW ? 1 : 0) + (p.leadsK ? 1 : 0);
                    return (
                      <tr key={p.playerId}
                        className={`text-xs hover:bg-gray-800/50 cursor-pointer ${leads === 3 ? 'bg-yellow-900/10' : ''}`}
                        onClick={() => goToPlayer(p.playerId)}>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-600">{i + 1}</td>
                        <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
                        <td className="px-2 py-1 text-gray-500 text-center">{p.teamAbbr}</td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          <span className={p.leadsEra ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
                            {p.era.toFixed(2)}
                          </span>
                          <LeaderHighlight isLeader={p.leadsEra} />
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          <span className={p.leadsW ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
                            {p.wins}
                          </span>
                          <LeaderHighlight isLeader={p.leadsW} />
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          <span className={p.leadsK ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
                            {p.k}
                          </span>
                          <LeaderHighlight isLeader={p.leadsK} />
                        </td>
                        <td className="px-2 py-1 text-center"><CrownBadge leads={leads} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="text-gray-700 text-[10px] px-2">
        The Triple Crown is one of baseball's rarest achievements — leading the league in all three
        categories (AVG/HR/RBI for hitters, ERA/W/K for pitchers) in the same season.
      </div>
    </div>
  );
}
