import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterData, RosterPlayer } from '../../types/league';

interface DevEvent {
  playerId: number;
  playerName: string;
  type: string;
  overallDelta?: number;
}

interface SeasonDevData {
  season: number;
  events: DevEvent[];
}

function EventBadge({ type, delta }: { type: string; delta?: number }) {
  if (type === 'breakout') {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-900/40 text-green-400">
        BREAKOUT {delta != null && delta > 0 ? `+${delta}` : ''}
      </span>
    );
  }
  if (type === 'bust') {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-900/40 text-red-400">
        BUST {delta != null ? `${delta}` : ''}
      </span>
    );
  }
  if (type === 'retirement') {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-800 text-gray-400">
        RETIRED
      </span>
    );
  }
  return <span className="text-gray-600 text-[10px]">{type}</span>;
}

function GrowthArrow({ ovr, pot }: { ovr: number; pot: number }) {
  const gap = pot - ovr;
  const growthPotential = gap > 15 ? 'HIGH' : gap > 5 ? 'MED' : 'LOW';
  const color = gap > 15 ? 'text-green-400' : gap > 5 ? 'text-orange-400' : 'text-gray-500';
  return (
    <div className="flex items-center gap-1">
      <span className={`text-[10px] font-bold ${color}`}>{growthPotential}</span>
      <div className="relative w-12 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="absolute h-full bg-blue-900/40 rounded-full" style={{ width: `${Math.min(100, (pot / 80) * 100)}%` }} />
        <div className={`absolute h-full rounded-full ${
          ovr >= 60 ? 'bg-green-500' : ovr >= 50 ? 'bg-orange-500' : 'bg-yellow-500'
        }`} style={{ width: `${Math.min(100, (ovr / 80) * 100)}%` }} />
      </div>
    </div>
  );
}

export default function DevelopmentTracker() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [devHistory, setDevHistory] = useState<SeasonDevData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'breakout' | 'bust'>('all');

  useEffect(() => {
    if (!gameStarted || userTeamId == null) return;
    setLoading(true);
    Promise.all([
      getEngine().getRoster(userTeamId),
      getEngine().getDevelopmentEvents(),
    ]).then(([r, d]) => {
      setRoster(r);
      setDevHistory(d);
    }).finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading development data...</div>;
  if (!roster) return null;

  // Combine all players
  const allPlayers = [...roster.active, ...roster.il, ...roster.minors, ...roster.dfa];

  // Young players with growth potential (sorted by gap)
  const developingPlayers = allPlayers
    .filter(p => p.age <= 30 && (p.potential - p.overall) >= 3)
    .sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall));

  // Players in prime (high OVR, low gap)
  const primePlayers = allPlayers
    .filter(p => p.overall >= 60 && (p.potential - p.overall) <= 5)
    .sort((a, b) => b.overall - a.overall);

  // Declining players (past potential)
  const decliningPlayers = allPlayers
    .filter(p => p.overall > p.potential || (p.age >= 33 && p.overall >= 45))
    .sort((a, b) => b.age - a.age);

  // All dev events for our team's players
  const teamPlayerIds = new Set(allPlayers.map(p => p.playerId));
  const allEvents = devHistory.flatMap(sd =>
    sd.events.filter(e => teamPlayerIds.has(e.playerId)).map(e => ({ ...e, season: sd.season }))
  );

  const filteredEvents = filter === 'all' ? allEvents : allEvents.filter(e => e.type === filter);
  const totalBreakouts = allEvents.filter(e => e.type === 'breakout').length;
  const totalBusts = allEvents.filter(e => e.type === 'bust').length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">PLAYER DEVELOPMENT TRACKER</div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DEVELOPING</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{developingPlayers.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">IN PRIME</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{primePlayers.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DECLINING</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{decliningPlayers.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">BREAKOUTS</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{totalBreakouts}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">BUSTS</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{totalBusts}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Developing players */}
        <div className="bloomberg-border">
          <div className="bloomberg-header text-blue-400">RISING ({developingPlayers.length})</div>
          <div className="max-h-[24rem] overflow-y-auto">
            {developingPlayers.map(p => (
              <div key={p.playerId}
                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/30"
                onClick={() => goToPlayer(p.playerId)}>
                <div className="flex-1 min-w-0">
                  <div className="text-orange-300 font-bold truncate">{p.name}</div>
                  <div className="text-gray-600 text-[10px]">{p.position} · {p.age}</div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums text-gray-400 text-[10px]">
                    <span className="text-gray-300 font-bold">{p.overall}</span>
                    <span className="text-gray-600 mx-0.5">→</span>
                    <span className="text-blue-400 font-bold">{p.potential}</span>
                  </div>
                  <GrowthArrow ovr={p.overall} pot={p.potential} />
                </div>
              </div>
            ))}
            {developingPlayers.length === 0 && (
              <div className="px-3 py-4 text-gray-700 text-xs text-center">No developing players.</div>
            )}
          </div>
        </div>

        {/* Prime players */}
        <div className="bloomberg-border">
          <div className="bloomberg-header text-green-400">PRIME ({primePlayers.length})</div>
          <div className="max-h-[24rem] overflow-y-auto">
            {primePlayers.map(p => (
              <div key={p.playerId}
                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/30"
                onClick={() => goToPlayer(p.playerId)}>
                <div className="flex-1 min-w-0">
                  <div className="text-orange-300 font-bold truncate">{p.name}</div>
                  <div className="text-gray-600 text-[10px]">{p.position} · {p.age}</div>
                </div>
                <span className={`font-bold tabular-nums ${
                  p.overall >= 70 ? 'text-green-400' : 'text-blue-400'
                }`}>{p.overall}</span>
              </div>
            ))}
            {primePlayers.length === 0 && (
              <div className="px-3 py-4 text-gray-700 text-xs text-center">No prime players.</div>
            )}
          </div>
        </div>

        {/* Declining players */}
        <div className="bloomberg-border">
          <div className="bloomberg-header text-red-400">DECLINING ({decliningPlayers.length})</div>
          <div className="max-h-[24rem] overflow-y-auto">
            {decliningPlayers.map(p => (
              <div key={p.playerId}
                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/30"
                onClick={() => goToPlayer(p.playerId)}>
                <div className="flex-1 min-w-0">
                  <div className="text-orange-300 font-bold truncate">{p.name}</div>
                  <div className="text-gray-600 text-[10px]">{p.position} · {p.age}</div>
                </div>
                <div className="text-right tabular-nums text-[10px]">
                  <span className="text-gray-400">{p.overall}</span>
                  {p.overall > p.potential && (
                    <span className="text-red-400 ml-1">↓{p.overall - p.potential}</span>
                  )}
                </div>
              </div>
            ))}
            {decliningPlayers.length === 0 && (
              <div className="px-3 py-4 text-gray-700 text-xs text-center">No declining players.</div>
            )}
          </div>
        </div>
      </div>

      {/* Development event history */}
      {allEvents.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header flex items-center justify-between">
            <span>DEVELOPMENT HISTORY ({filteredEvents.length} events)</span>
            <div className="flex items-center gap-1">
              {(['all', 'breakout', 'bust'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400'
                  }`}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[16rem] overflow-y-auto">
            {filteredEvents.map((e, i) => (
              <div key={i}
                className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-800/30 hover:bg-gray-800/50 cursor-pointer"
                onClick={() => goToPlayer(e.playerId)}>
                <span className="text-gray-600 tabular-nums w-12">S{e.season}</span>
                <span className="text-orange-300 font-bold flex-1">{e.playerName}</span>
                <EventBadge type={e.type} delta={e.overallDelta} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
