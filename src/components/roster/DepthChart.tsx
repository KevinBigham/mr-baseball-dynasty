import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer, RosterData } from '../../types/league';

const FIELD_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const;
const PITCHER_ROLES = ['SP', 'RP', 'CL'] as const;

function OvrBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 75 ? 'text-green-400' : ovr >= 60 ? 'text-orange-400' : ovr >= 45 ? 'text-gray-400' : 'text-red-400';
  return <span className={`tabular-nums font-bold ${color}`}>{ovr}</span>;
}

function PlayerRow({ player, rank, onClickPlayer }: { player: RosterPlayer; rank: number; onClickPlayer: (id: number) => void }) {
  const isPitcher = player.isPitcher;
  const statLine = isPitcher
    ? `${player.stats.w ?? 0}-${player.stats.l ?? 0}, ${player.stats.era?.toFixed(2) ?? '-.--'} ERA`
    : `${player.stats.avg?.toFixed(3) ?? '.---'} / ${player.stats.hr ?? 0} HR / ${player.stats.rbi ?? 0} RBI`;

  return (
    <tr className="text-xs hover:bg-gray-800/50 cursor-pointer" onClick={() => onClickPlayer(player.playerId)}>
      <td className="px-1.5 py-0.5 text-right tabular-nums text-gray-600 w-6">{rank}</td>
      <td className="px-1.5 py-0.5 font-bold text-orange-300 truncate max-w-[10rem]">{player.name}</td>
      <td className="px-1.5 py-0.5 text-center"><OvrBadge ovr={player.overall} /></td>
      <td className="px-1.5 py-0.5 tabular-nums text-gray-500 text-center">{player.age}</td>
      <td className="px-1.5 py-0.5 text-gray-400 font-mono text-xs truncate max-w-[12rem]">{statLine}</td>
      <td className="px-1.5 py-0.5 text-right tabular-nums text-gray-600">
        ${(player.salary / 1_000_000).toFixed(1)}M
      </td>
    </tr>
  );
}

export default function DepthChart() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted || userTeamId == null) return;
    setLoading(true);
    getEngine().getRoster(userTeamId)
      .then(setRoster)
      .finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading depth chart...</div>;
  if (!roster) return null;

  const allPlayers = [...roster.active, ...roster.il, ...roster.minors];

  // Group players by position for field positions
  const getPlayersAtPosition = (pos: string): RosterPlayer[] => {
    return allPlayers
      .filter(p => p.position === pos || (pos === 'DH' && !p.isPitcher))
      .sort((a, b) => {
        // Active MLB first, then by overall
        const aActive = a.rosterStatus === 'MLB_ACTIVE' ? 1 : 0;
        const bActive = b.rosterStatus === 'MLB_ACTIVE' ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return b.overall - a.overall;
      });
  };

  // For DH, show hitters not at a primary defensive position who are highly rated
  const getPitchersByRole = (role: string): RosterPlayer[] => {
    return allPlayers
      .filter(p => p.position === role)
      .sort((a, b) => {
        const aActive = a.rosterStatus === 'MLB_ACTIVE' ? 1 : 0;
        const bActive = b.rosterStatus === 'MLB_ACTIVE' ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return b.overall - a.overall;
      });
  };

  const statusColor = (status: string) => {
    if (status === 'MLB_ACTIVE') return 'bg-green-900/30 text-green-400';
    if (status.startsWith('MLB_IL')) return 'bg-red-900/30 text-red-400';
    return 'bg-gray-800/50 text-gray-500';
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">DEPTH CHART</div>

      {/* Diamond visualization */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">FIELD POSITIONS</div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {FIELD_POSITIONS.map(pos => {
            const players = getPlayersAtPosition(pos).slice(0, 4);
            return (
              <div key={pos} className="bloomberg-border">
                <div className="flex items-center justify-between px-2 py-1 border-b border-gray-800 bg-gray-900/50">
                  <span className="text-orange-400 font-bold text-xs">{pos}</span>
                  <span className="text-gray-600 text-xs">{players.length} deep</span>
                </div>
                <table className="w-full">
                  <tbody>
                    {players.length === 0 ? (
                      <tr><td className="px-2 py-2 text-gray-700 text-xs text-center">No players</td></tr>
                    ) : players.map((p, i) => (
                      <tr key={p.playerId}
                        className={`text-xs cursor-pointer hover:bg-gray-800/50 ${i === 0 ? 'bg-gray-900/30' : ''}`}
                        onClick={() => goToPlayer(p.playerId)}>
                        <td className="px-1.5 py-0.5 text-gray-600 w-4">{i + 1}.</td>
                        <td className="px-1.5 py-0.5 font-bold text-orange-300 truncate">{p.name}</td>
                        <td className="px-1.5 py-0.5 text-right"><OvrBadge ovr={p.overall} /></td>
                        <td className="px-1.5 py-0.5 text-right">
                          <span className={`text-xs px-1 rounded ${statusColor(p.rosterStatus)}`}>
                            {p.rosterStatus === 'MLB_ACTIVE' ? 'MLB' : p.rosterStatus.startsWith('MLB_IL') ? 'IL' : 'MiL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pitching staff */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">PITCHING STAFF</div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {PITCHER_ROLES.map(role => {
            const players = getPitchersByRole(role);
            const label = role === 'SP' ? 'STARTING ROTATION' : role === 'RP' ? 'BULLPEN' : 'CLOSER';
            return (
              <div key={role} className="bloomberg-border">
                <div className="flex items-center justify-between px-2 py-1 border-b border-gray-800 bg-gray-900/50">
                  <span className="text-orange-400 font-bold text-xs">{label}</span>
                  <span className="text-gray-600 text-xs">{players.length}</span>
                </div>
                <div className="max-h-[16rem] overflow-y-auto">
                  <table className="w-full">
                    <tbody>
                      {players.length === 0 ? (
                        <tr><td className="px-2 py-2 text-gray-700 text-xs text-center">No {role}s</td></tr>
                      ) : players.map((p, i) => (
                        <PlayerRow key={p.playerId} player={p} rank={i + 1} onClickPlayer={goToPlayer} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roster summary */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">ROSTER SUMMARY</div>
        <div className="grid grid-cols-4 gap-0 divide-x divide-gray-800 p-0">
          <div className="px-4 py-3 text-center">
            <div className="text-gray-500 text-xs">ACTIVE (26-MAN)</div>
            <div className="text-2xl font-bold tabular-nums text-green-400">{roster.active.length}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-gray-500 text-xs">INJURED LIST</div>
            <div className="text-2xl font-bold tabular-nums text-red-400">{roster.il.length}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-gray-500 text-xs">MINOR LEAGUES</div>
            <div className="text-2xl font-bold tabular-nums text-blue-400">{roster.minors.length}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-gray-500 text-xs">DFA</div>
            <div className="text-2xl font-bold tabular-nums text-gray-500">{roster.dfa.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
