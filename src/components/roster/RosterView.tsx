import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer } from '../../types/league';

type RosterTab = 'ACTIVE' | 'IL' | 'MINORS' | 'DFA';

function formatSalary(s: number): string {
  if (s >= 1_000_000) return `$${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `$${(s / 1000).toFixed(0)}K`;
  return `$${s}`;
}

function formatServiceTime(days: number): string {
  const years = Math.floor(days / 172);
  const rem = days % 172;
  return `${years}Y ${rem}D`;
}

function StatCell({ value, label }: { value: number | undefined; label?: string }) {
  if (value === undefined || value === null) return <td className="text-right px-2 py-1 text-gray-600">—</td>;
  return <td className="text-right px-2 py-1 tabular-nums" title={label}>{value}</td>;
}

function PitcherRow({ p, onClick }: { p: RosterPlayer; onClick: () => void }) {
  return (
    <tr className="bloomberg-row cursor-pointer text-xs" onClick={onClick}>
      <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
      <td className="px-2 py-1 text-gray-500">{p.position}</td>
      <td className="px-2 py-1 tabular-nums">{p.age}</td>
      <td className="px-2 py-1 text-gray-500">{p.throws}</td>
      <StatCell value={p.stats.w} />
      <StatCell value={p.stats.l} />
      <StatCell value={p.stats.sv} />
      <StatCell value={p.stats.era} />
      <StatCell value={p.stats.ip} />
      <StatCell value={p.stats.k9} />
      <StatCell value={p.stats.whip} />
      <td className="px-2 py-1 text-gray-600">{formatSalary(p.salary)}</td>
      <td className="px-2 py-1 text-gray-600">{formatServiceTime(p.serviceTimeDays)}</td>
    </tr>
  );
}

function HitterRow({ p, onClick }: { p: RosterPlayer; onClick: () => void }) {
  return (
    <tr className="bloomberg-row cursor-pointer text-xs" onClick={onClick}>
      <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
      <td className="px-2 py-1 text-gray-500">{p.position}</td>
      <td className="px-2 py-1 tabular-nums">{p.age}</td>
      <td className="px-2 py-1 text-gray-500">{p.bats}</td>
      <StatCell value={p.stats.pa} />
      <StatCell value={p.stats.avg} />
      <StatCell value={p.stats.obp} />
      <StatCell value={p.stats.slg} />
      <StatCell value={p.stats.hr} />
      <StatCell value={p.stats.rbi} />
      <StatCell value={p.stats.sb} />
      <td className="px-2 py-1 text-gray-600">{formatSalary(p.salary)}</td>
      <td className="px-2 py-1 text-gray-600">{formatServiceTime(p.serviceTimeDays)}</td>
    </tr>
  );
}

export default function RosterView() {
  const { roster, setRoster } = useLeagueStore();
  const { gameStarted, userTeamId } = useGameStore();
  const { selectedTeamId, setSelectedPlayer, setActiveTab } = useUIStore();
  const [activeTab, setRosterTab] = useState<RosterTab>('ACTIVE');
  const [loading, setLoading] = useState(false);

  const teamId = selectedTeamId ?? userTeamId;

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getRoster(teamId)
      .then(setRoster)
      .finally(() => setLoading(false));
  }, [gameStarted, teamId, setRoster]);

  const openPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading roster…</div>;
  if (!roster) return <div className="p-4 text-gray-500 text-xs">No roster data.</div>;

  const tabMap: Record<RosterTab, RosterPlayer[]> = {
    ACTIVE: roster.active,
    IL:     roster.il,
    MINORS: roster.minors,
    DFA:    roster.dfa,
  };

  const players = tabMap[activeTab] ?? [];
  const hitters  = players.filter(p => !p.isPitcher);
  const pitchers = players.filter(p => p.isPitcher);

  return (
    <div className="p-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center gap-4">
        <span>ROSTER — TEAM {teamId}</span>
        <span className="text-gray-500 font-normal">
          {['ACTIVE', 'IL', 'MINORS', 'DFA'].map((tab) => (
            <button
              key={tab}
              onClick={() => setRosterTab(tab as RosterTab)}
              className={[
                'mr-4 hover:text-orange-400 transition-colors',
                activeTab === tab ? 'text-orange-500' : 'text-gray-500',
              ].join(' ')}
            >
              {tab} ({tabMap[tab as RosterTab]?.length ?? 0})
            </button>
          ))}
        </span>
      </div>

      {/* Hitters table */}
      {hitters.length > 0 && (
        <div className="bloomberg-border mb-4">
          <div className="bloomberg-header">POSITION PLAYERS</div>
          <table className="w-full">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800">
                <th className="text-left px-2 py-1">NAME</th>
                <th className="text-left px-2 py-1">POS</th>
                <th className="text-right px-2 py-1">AGE</th>
                <th className="text-left px-2 py-1">B</th>
                <th className="text-right px-2 py-1">PA</th>
                <th className="text-right px-2 py-1">AVG</th>
                <th className="text-right px-2 py-1">OBP</th>
                <th className="text-right px-2 py-1">SLG</th>
                <th className="text-right px-2 py-1">HR</th>
                <th className="text-right px-2 py-1">RBI</th>
                <th className="text-right px-2 py-1">SB</th>
                <th className="text-right px-2 py-1">SAL</th>
                <th className="text-right px-2 py-1">SVC</th>
              </tr>
            </thead>
            <tbody>
              {hitters.map(p => <HitterRow key={p.playerId} p={p} onClick={() => openPlayer(p.playerId)} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* Pitchers table */}
      {pitchers.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">PITCHERS</div>
          <table className="w-full">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800">
                <th className="text-left px-2 py-1">NAME</th>
                <th className="text-left px-2 py-1">POS</th>
                <th className="text-right px-2 py-1">AGE</th>
                <th className="text-left px-2 py-1">T</th>
                <th className="text-right px-2 py-1">W</th>
                <th className="text-right px-2 py-1">L</th>
                <th className="text-right px-2 py-1">SV</th>
                <th className="text-right px-2 py-1">ERA</th>
                <th className="text-right px-2 py-1">IP</th>
                <th className="text-right px-2 py-1">K/9</th>
                <th className="text-right px-2 py-1">WHIP</th>
                <th className="text-right px-2 py-1">SAL</th>
                <th className="text-right px-2 py-1">SVC</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map(p => <PitcherRow key={p.playerId} p={p} onClick={() => openPlayer(p.playerId)} />)}
            </tbody>
          </table>
        </div>
      )}

      {players.length === 0 && (
        <div className="text-gray-500 text-xs text-center py-8">No players in this category.</div>
      )}
    </div>
  );
}
