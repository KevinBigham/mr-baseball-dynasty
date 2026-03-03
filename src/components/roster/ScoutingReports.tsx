import { useEffect, useState, useCallback, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { toScoutingScale } from '../../engine/player/attributes';
import { SkeletonTable } from '../layout/Skeleton';
import ScrollableTable from '../layout/ScrollableTable';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScoutablePlayer {
  playerId: number;
  name: string;
  position: string;
  age: number;
  teamId: number;
  teamAbbr: string;
  isPitcher: boolean;
  observedOverall: number;
  observedPotential: number;
  scouted: boolean;
  confidence: number | null;
}

interface TeamOption {
  teamId: number;
  name: string;
  abbreviation: string;
}

const MAX_SCOUTS_PER_WEEK = 3;

// ─── Confidence Bar ─────────────────────────────────────────────────────────

function ConfidenceBar({ confidence }: { confidence: number | null }) {
  if (confidence === null) return null;
  const pct = Math.round(confidence * 100);
  const color =
    confidence >= 0.7 ? 'bg-green-500' :
    confidence >= 0.3 ? 'bg-yellow-500' :
    'bg-red-500';
  const textColor =
    confidence >= 0.7 ? 'text-green-400' :
    confidence >= 0.3 ? 'text-yellow-400' :
    'text-red-400';

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-800 rounded overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs tabular-nums ${textColor}`}>{pct}%</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ScoutingReports() {
  const { gameStarted } = useGameStore();
  const { setSelectedPlayer, setActiveTab } = useUIStore();

  const [players, setPlayers] = useState<ScoutablePlayer[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [teamFilter, setTeamFilter] = useState<number>(-1);
  const [posFilter, setPosFilter] = useState('ALL');
  const [scoutsUsed, setScoutsUsed] = useState(0);
  const [scoutingInProgress, setScoutingInProgress] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<'name' | 'ovr' | 'pot' | 'age' | 'conf'>('ovr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Load teams on mount
  useEffect(() => {
    if (!gameStarted) return;
    getEngine().getLeagueTeams().then(t => {
      const userTeamId = useGameStore.getState().userTeamId;
      setTeams(t.filter(team => team.teamId !== userTeamId).map(team => ({
        teamId: team.teamId,
        name: team.name,
        abbreviation: team.abbreviation,
      })));
    });
  }, [gameStarted]);

  // Load scoutable players
  const loadPlayers = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    try {
      const engine = getEngine();
      const data = await engine.getScoutablePlayers(
        teamFilter >= 0 ? teamFilter : undefined,
        posFilter !== 'ALL' ? posFilter : undefined,
      );
      setPlayers(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [gameStarted, teamFilter, posFilter]);

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  // Scout a player
  const handleScout = useCallback(async (playerId: number) => {
    if (scoutsUsed >= MAX_SCOUTS_PER_WEEK) {
      useUIStore.getState().addToast('Maximum 3 scouting missions per week.', 'error');
      return;
    }
    setScoutingInProgress(playerId);
    try {
      const engine = getEngine();
      await engine.scoutPlayer(playerId);
      setScoutsUsed(prev => prev + 1);
      useUIStore.getState().addToast('Scouting report updated.', 'success');
      await loadPlayers();
    } catch {
      useUIStore.getState().addToast('Scouting failed.', 'error');
    } finally {
      setScoutingInProgress(null);
    }
  }, [scoutsUsed, loadPlayers]);

  const openPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  // Unique positions
  const positions = useMemo(() => {
    const posSet = new Set(players.map(p => p.position));
    return ['ALL', ...Array.from(posSet).sort()];
  }, [players]);

  // Sort players
  const sortedPlayers = useMemo(() => {
    const list = [...players];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'ovr': cmp = a.observedOverall - b.observedOverall; break;
        case 'pot': cmp = a.observedPotential - b.observedPotential; break;
        case 'age': cmp = a.age - b.age; break;
        case 'conf': cmp = (a.confidence ?? 0) - (b.confidence ?? 0); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [players, sortKey, sortDir]);

  // Group by team
  const groupedByTeam = useMemo(() => {
    if (teamFilter >= 0) return null; // Don't group when filtered to one team
    const groups: Record<string, ScoutablePlayer[]> = {};
    for (const p of sortedPlayers) {
      const key = p.teamAbbr;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [sortedPlayers, teamFilter]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortTh = ({ label, sk, align }: { label: string; sk: typeof sortKey; align?: 'left' | 'right' }) => {
    const active = sortKey === sk;
    const arrow = active ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';
    return (
      <th
        scope="col"
        role="button"
        tabIndex={0}
        className={`${align === 'left' ? 'text-left' : 'text-right'} px-2 py-1 cursor-pointer select-none hover:text-orange-400 transition-colors ${active ? 'text-orange-400' : 'text-gray-500'}`}
        onClick={() => toggleSort(sk)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort(sk); } }}
      >
        {label}{arrow}
      </th>
    );
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bloomberg-border">
        <div className="bloomberg-header flex items-center justify-between">
          <span>SCOUTING REPORTS</span>
          <span className="text-gray-400 font-normal text-xs">
            <span className={scoutsUsed >= MAX_SCOUTS_PER_WEEK ? 'text-red-400' : 'text-orange-400'}>
              {scoutsUsed}
            </span>
            <span className="text-gray-500">/{MAX_SCOUTS_PER_WEEK} SCOUTS USED THIS WEEK</span>
          </span>
        </div>
        <div className="px-4 py-2 bg-gray-900 text-gray-500 text-xs border-t border-gray-800">
          Scout opposing players to reveal their true ratings. Higher scouting accuracy staff reduces noise.
          Each scout mission improves confidence. Your own players always show true grades.
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">TEAM:</span>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(Number(e.target.value))}
            className="bg-gray-800 text-gray-300 text-xs border border-gray-700 px-2 py-1.5"
          >
            <option value={-1}>ALL TEAMS</option>
            {teams.map(t => (
              <option key={t.teamId} value={t.teamId}>{t.abbreviation} - {t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">POS:</span>
          <select
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
            className="bg-gray-800 text-gray-300 text-xs border border-gray-700 px-2 py-1.5"
          >
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <span className="text-gray-500 text-xs ml-auto">
          {sortedPlayers.length} player{sortedPlayers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <SkeletonTable rows={10} cols={8} />
      ) : groupedByTeam ? (
        /* Grouped view */
        Object.entries(groupedByTeam).sort(([a], [b]) => a.localeCompare(b)).map(([teamAbbr, teamPlayers]) => (
          <ScrollableTable key={teamAbbr} className="bloomberg-border">
            <div className="bloomberg-header px-4">{teamAbbr}</div>
            <table className="w-full">
              <caption className="sr-only">Scouting reports for {teamAbbr}</caption>
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  <SortTh label="NAME" sk="name" align="left" />
                  <th className="text-left px-2 py-1">POS</th>
                  <SortTh label="AGE" sk="age" />
                  <SortTh label="OVR" sk="ovr" />
                  <SortTh label="POT" sk="pot" />
                  <SortTh label="CONF" sk="conf" />
                  <th className="text-center px-2 py-1">STATUS</th>
                  <th className="px-2 py-1" />
                </tr>
              </thead>
              <tbody>
                {teamPlayers.map(p => (
                  <PlayerScoutRow
                    key={p.playerId}
                    player={p}
                    onScout={handleScout}
                    onClickName={() => openPlayer(p.playerId)}
                    scoutingInProgress={scoutingInProgress === p.playerId}
                    scoutsRemaining={MAX_SCOUTS_PER_WEEK - scoutsUsed}
                  />
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        ))
      ) : (
        /* Flat view (single team filtered) */
        <ScrollableTable className="bloomberg-border">
          <div className="bloomberg-header px-4">
            {teams.find(t => t.teamId === teamFilter)?.abbreviation ?? 'PLAYERS'}
          </div>
          <table className="w-full">
            <caption className="sr-only">Scouting reports</caption>
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <SortTh label="NAME" sk="name" align="left" />
                <th className="text-left px-2 py-1">POS</th>
                <SortTh label="AGE" sk="age" />
                <SortTh label="OVR" sk="ovr" />
                <SortTh label="POT" sk="pot" />
                <SortTh label="CONF" sk="conf" />
                <th className="text-center px-2 py-1">STATUS</th>
                <th className="px-2 py-1" />
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map(p => (
                <PlayerScoutRow
                  key={p.playerId}
                  player={p}
                  onScout={handleScout}
                  onClickName={() => openPlayer(p.playerId)}
                  scoutingInProgress={scoutingInProgress === p.playerId}
                  scoutsRemaining={MAX_SCOUTS_PER_WEEK - scoutsUsed}
                />
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      )}

      {!loading && sortedPlayers.length === 0 && (
        <div className="text-gray-500 text-xs text-center py-8">No players found for current filters.</div>
      )}
    </div>
  );
}

// ─── Player Scout Row ───────────────────────────────────────────────────────

function PlayerScoutRow({
  player,
  onScout,
  onClickName,
  scoutingInProgress,
  scoutsRemaining,
}: {
  player: ScoutablePlayer;
  onScout: (id: number) => void;
  onClickName: () => void;
  scoutingInProgress: boolean;
  scoutsRemaining: number;
}) {
  const ovrScale = toScoutingScale(player.observedOverall);
  const potScale = toScoutingScale(player.observedPotential);

  const ovrColor = ovrScale >= 65 ? 'text-green-400' : ovrScale >= 50 ? 'text-orange-400' : 'text-red-400';
  const potColor = potScale >= 65 ? 'text-green-400' : potScale >= 50 ? 'text-gray-400' : 'text-red-400';

  return (
    <tr className="bloomberg-row text-xs">
      <td
        className="px-2 py-1 font-bold text-orange-300 cursor-pointer hover:text-orange-200 whitespace-nowrap"
        onClick={onClickName}
      >
        {player.name}
      </td>
      <td className="px-2 py-1 text-gray-500">{player.position}</td>
      <td className="px-2 py-1 tabular-nums text-right">{player.age}</td>
      <td className={`px-2 py-1 tabular-nums text-right font-bold ${player.scouted ? ovrColor : 'text-gray-500'}`}>
        {player.scouted ? ovrScale : (
          <span className="text-gray-500 italic">{ovrScale}?</span>
        )}
      </td>
      <td className={`px-2 py-1 tabular-nums text-right ${player.scouted ? potColor : 'text-gray-500'}`}>
        {player.scouted ? potScale : (
          <span className="text-gray-500 italic">{potScale}?</span>
        )}
      </td>
      <td className="px-2 py-1">
        {player.scouted ? (
          <ConfidenceBar confidence={player.confidence} />
        ) : (
          <span className="text-gray-700 text-xs">--</span>
        )}
      </td>
      <td className="px-2 py-1 text-center">
        {player.scouted ? (
          <span className="text-xs px-1.5 py-0.5 bg-green-900/30 border border-green-800 text-green-400">
            SCOUTED
          </span>
        ) : (
          <span className="text-xs px-1.5 py-0.5 bg-gray-800 border border-gray-700 text-gray-500">
            UNSCOUTED
          </span>
        )}
      </td>
      <td className="px-2 py-1">
        <button
          onClick={(e) => { e.stopPropagation(); onScout(player.playerId); }}
          disabled={scoutingInProgress || scoutsRemaining <= 0}
          className="text-xs px-2 py-1 min-h-[32px] bg-orange-900/30 border border-orange-800 text-orange-400 hover:bg-orange-800/40 hover:text-orange-300 disabled:bg-gray-800 disabled:border-gray-700 disabled:text-gray-500 transition-colors uppercase tracking-wider font-bold"
        >
          {scoutingInProgress ? 'SCOUTING...' : 'SCOUT'}
        </button>
      </td>
    </tr>
  );
}
