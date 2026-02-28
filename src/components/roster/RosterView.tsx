import { useEffect, useState, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer } from '../../types/league';
import { assignTraits, type PlayerTrait } from '../../engine/playerTraits';

type RosterTab = 'ACTIVE' | 'IL' | 'MINORS' | 'DFA';

// ─── Trait badge chip ─────────────────────────────────────────────────────────

function TraitChip({ trait }: { trait: PlayerTrait }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
      style={{
        background: `${trait.color}15`,
        border:     `1px solid ${trait.color}40`,
        color:      trait.color,
        fontSize:   '0.65rem',
      }}
      title={trait.desc}
    >
      {trait.emoji} {trait.label}
    </span>
  );
}

// ─── Prospect traits panel (shown in MINORS tab) ──────────────────────────────

function ProspectTraitsPanel({ players }: { players: RosterPlayer[] }) {
  const prospects = players
    .filter(p => p.potential - p.overall >= 5 && p.age <= 28)
    .sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall))
    .slice(0, 12);

  if (prospects.length === 0) return null;

  return (
    <div className="bloomberg-border mt-4">
      <div className="bloomberg-header">PROSPECT DEVELOPMENT TRAITS</div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {prospects.map(p => {
          const traits = assignTraits(p);
          if (traits.length === 0) return null;
          return (
            <div
              key={p.playerId}
              className="flex items-start gap-2 py-1.5 border-b border-gray-800 last:border-0"
            >
              <div className="shrink-0 text-right w-14">
                <div className="text-orange-400 font-mono text-xs font-bold">{p.overall}</div>
                <div className="text-gray-700 text-xs">{'\u2192'}{p.potential}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-200 font-mono text-xs font-bold truncate">{p.name}</div>
                <div className="text-gray-600 text-xs">{p.position} · Age {p.age}</div>
                <div className="flex gap-1 flex-wrap mt-0.5">
                  {traits.map(t => <TraitChip key={t.id} trait={t} />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-3 pb-2 text-gray-700 text-xs">
        Traits are scouting assessments of player development DNA. Tap a badge for details.
      </div>
    </div>
  );
}

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
  if (value === undefined || value === null) return <td className="text-right px-2 py-1 text-gray-600">{'\u2014'}</td>;
  return <td className="text-right px-2 py-1 tabular-nums" title={label}>{value}</td>;
}

// ─── Action button component ────────────────────────────────────────────────────

function ActionBtn({ label, color, onClick, disabled }: {
  label: string;
  color: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-bold px-1.5 py-0.5 rounded transition-colors disabled:opacity-40"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}50`,
        color,
      }}
    >
      {label}
    </button>
  );
}

function levelBadge(rosterStatus: string): string | null {
  const map: Record<string, string> = {
    'MINORS_AAA':    'AAA',
    'MINORS_AA':     'AA',
    'MINORS_APLUS':  'A+',
    'MINORS_AMINUS': 'A-',
    'MINORS_ROOKIE': 'RK',
    'MINORS_INTL':   'INT',
    'MLB_ACTIVE':    'MLB',
    'DFA':           'DFA',
    'MLB_IL_10':     'IL10',
    'MLB_IL_60':     'IL60',
  };
  return map[rosterStatus] ?? null;
}

// ─── Row components with actions ────────────────────────────────────────────────

function PitcherRow({ p, onClick, isOwner, rosterTab, onAction }: {
  p: RosterPlayer;
  onClick: () => void;
  isOwner: boolean;
  rosterTab: RosterTab;
  onAction: (playerId: number, action: string) => void;
}) {
  const badge = rosterTab === 'MINORS' ? levelBadge(p.rosterStatus) : null;
  return (
    <tr className="bloomberg-row cursor-pointer text-xs group" onClick={onClick}>
      <td className="px-2 py-1 font-bold text-orange-300">
        {p.name}
        {badge && <span className="ml-1.5 text-gray-600 font-normal text-xs">{badge}</span>}
        {p.isOn40Man && rosterTab === 'MINORS' && <span className="ml-1 text-blue-500 text-xs" title="40-man roster">40</span>}
      </td>
      <td className="px-2 py-1 text-gray-500">{p.position}</td>
      <td className="px-2 py-1 tabular-nums">{p.age}</td>
      <td className="px-2 py-1 text-gray-500">{p.throws}</td>
      <td className="px-2 py-1 tabular-nums text-right">
        <span className={p.overall >= 400 ? 'text-green-400' : p.overall >= 300 ? 'text-gray-300' : 'text-gray-500'}>{p.overall}</span>
      </td>
      <td className="px-2 py-1 tabular-nums text-right text-gray-600">{p.potential}</td>
      <StatCell value={p.stats.w} />
      <StatCell value={p.stats.l} />
      <StatCell value={p.stats.sv} />
      <StatCell value={p.stats.era} />
      <StatCell value={p.stats.ip} />
      <StatCell value={p.stats.k9} />
      <StatCell value={p.stats.whip} />
      <td className="px-2 py-1 text-gray-600">{formatSalary(p.salary)}</td>
      <td className="px-2 py-1 text-gray-600">{formatServiceTime(p.serviceTimeDays)}</td>
      {isOwner && (
        <td className="px-2 py-1">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {rosterTab === 'ACTIVE' && (
              <>
                <ActionBtn label="OPT" color="#f59e0b" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'demote'); }} />
                <ActionBtn label="DFA" color="#ef4444" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'dfa'); }} />
              </>
            )}
            {rosterTab === 'MINORS' && (
              <>
                <ActionBtn label="CALL UP" color="#4ade80" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'promote'); }} />
                <ActionBtn label="DFA" color="#ef4444" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'dfa'); }} />
              </>
            )}
            {rosterTab === 'DFA' && (
              <ActionBtn label="RELEASE" color="#ef4444" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'dfa'); }} />
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

function HitterRow({ p, onClick, isOwner, rosterTab, onAction }: {
  p: RosterPlayer;
  onClick: () => void;
  isOwner: boolean;
  rosterTab: RosterTab;
  onAction: (playerId: number, action: string) => void;
}) {
  const badge = rosterTab === 'MINORS' ? levelBadge(p.rosterStatus) : null;
  return (
    <tr className="bloomberg-row cursor-pointer text-xs group" onClick={onClick}>
      <td className="px-2 py-1 font-bold text-orange-300">
        {p.name}
        {badge && <span className="ml-1.5 text-gray-600 font-normal text-xs">{badge}</span>}
        {p.isOn40Man && rosterTab === 'MINORS' && <span className="ml-1 text-blue-500 text-xs" title="40-man roster">40</span>}
      </td>
      <td className="px-2 py-1 text-gray-500">{p.position}</td>
      <td className="px-2 py-1 tabular-nums">{p.age}</td>
      <td className="px-2 py-1 text-gray-500">{p.bats}</td>
      <td className="px-2 py-1 tabular-nums text-right">
        <span className={p.overall >= 400 ? 'text-green-400' : p.overall >= 300 ? 'text-gray-300' : 'text-gray-500'}>{p.overall}</span>
      </td>
      <td className="px-2 py-1 tabular-nums text-right text-gray-600">{p.potential}</td>
      <StatCell value={p.stats.pa} />
      <StatCell value={p.stats.avg} />
      <StatCell value={p.stats.obp} />
      <StatCell value={p.stats.slg} />
      <StatCell value={p.stats.hr} />
      <StatCell value={p.stats.rbi} />
      <StatCell value={p.stats.sb} />
      <td className="px-2 py-1 text-gray-600">{formatSalary(p.salary)}</td>
      <td className="px-2 py-1 text-gray-600">{formatServiceTime(p.serviceTimeDays)}</td>
      {isOwner && (
        <td className="px-2 py-1">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {rosterTab === 'ACTIVE' && (
              <>
                <ActionBtn label="OPT" color="#f59e0b" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'demote'); }} />
                <ActionBtn label="DFA" color="#ef4444" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'dfa'); }} />
              </>
            )}
            {rosterTab === 'MINORS' && (
              <>
                <ActionBtn label="CALL UP" color="#4ade80" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'promote'); }} />
                <ActionBtn label="DFA" color="#ef4444" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'dfa'); }} />
              </>
            )}
            {rosterTab === 'DFA' && (
              <ActionBtn label="RELEASE" color="#ef4444" onClick={(e) => { e.stopPropagation(); onAction(p.playerId, 'dfa'); }} />
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

export default function RosterView() {
  const { roster, setRoster } = useLeagueStore();
  const { gameStarted, userTeamId } = useGameStore();
  const { selectedTeamId, setSelectedPlayer, setActiveTab } = useUIStore();
  const [activeTab, setRosterTab] = useState<RosterTab>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; color: string } | null>(null);

  const teamId = selectedTeamId ?? userTeamId;
  const isOwnTeam = teamId === userTeamId;

  const refreshRoster = useCallback(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getRoster(teamId)
      .then(setRoster)
      .finally(() => setLoading(false));
  }, [gameStarted, teamId, setRoster]);

  useEffect(() => {
    refreshRoster();
  }, [refreshRoster]);

  const openPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  const handleAction = useCallback(async (playerId: number, action: string) => {
    setActionMsg(null);
    const engine = getEngine();
    let result: { ok: boolean; error?: string };

    switch (action) {
      case 'promote':
        result = await engine.promotePlayer(playerId);
        break;
      case 'demote':
        result = await engine.demotePlayer(playerId);
        break;
      case 'dfa':
        result = await engine.dfaPlayer(playerId);
        break;
      default:
        return;
    }

    if (result.ok) {
      const labels: Record<string, string> = { promote: 'Called up', demote: 'Optioned', dfa: 'Designated for assignment' };
      setActionMsg({ text: `${labels[action] ?? action} successfully.`, color: '#4ade80' });
      refreshRoster();
    } else {
      setActionMsg({ text: result.error ?? 'Action failed.', color: '#ef4444' });
    }

    setTimeout(() => setActionMsg(null), 4000);
  }, [refreshRoster]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading && !roster) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading roster...</div>;
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
        <span>ROSTER {'\u2014'} TEAM {teamId}</span>
        <span className="text-gray-500 font-normal">
          {(['ACTIVE', 'IL', 'MINORS', 'DFA'] as RosterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setRosterTab(tab)}
              className={[
                'mr-4 hover:text-orange-400 transition-colors',
                activeTab === tab ? 'text-orange-500' : 'text-gray-500',
              ].join(' ')}
            >
              {tab} ({tabMap[tab]?.length ?? 0})
            </button>
          ))}
        </span>
      </div>

      {/* Roster counts bar */}
      {isOwnTeam && (
        <div className="flex gap-4 mb-3 px-1">
          <span className="text-gray-500 text-xs">
            <span className="text-gray-400 font-bold">{roster.active.length}</span>/26 Active
          </span>
          <span className="text-gray-500 text-xs">
            <span className="text-gray-400 font-bold">{roster.active.length + roster.il.length + roster.minors.length}</span>/40 Man
          </span>
          {isOwnTeam && (
            <span className="text-gray-600 text-xs">Hover a row for roster actions</span>
          )}
        </div>
      )}

      {/* Action feedback */}
      {actionMsg && (
        <div className="mb-3 px-3 py-2 rounded text-xs font-bold" style={{
          background: `${actionMsg.color}12`,
          border: `1px solid ${actionMsg.color}40`,
          color: actionMsg.color,
        }}>
          {actionMsg.text}
        </div>
      )}

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
                <th className="text-right px-2 py-1">OVR</th>
                <th className="text-right px-2 py-1">POT</th>
                <th className="text-right px-2 py-1">PA</th>
                <th className="text-right px-2 py-1">AVG</th>
                <th className="text-right px-2 py-1">OBP</th>
                <th className="text-right px-2 py-1">SLG</th>
                <th className="text-right px-2 py-1">HR</th>
                <th className="text-right px-2 py-1">RBI</th>
                <th className="text-right px-2 py-1">SB</th>
                <th className="text-right px-2 py-1">SAL</th>
                <th className="text-right px-2 py-1">SVC</th>
                {isOwnTeam && <th className="text-right px-2 py-1">ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {hitters.map(p => (
                <HitterRow
                  key={p.playerId}
                  p={p}
                  onClick={() => openPlayer(p.playerId)}
                  isOwner={isOwnTeam}
                  rosterTab={activeTab}
                  onAction={handleAction}
                />
              ))}
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
                <th className="text-right px-2 py-1">OVR</th>
                <th className="text-right px-2 py-1">POT</th>
                <th className="text-right px-2 py-1">W</th>
                <th className="text-right px-2 py-1">L</th>
                <th className="text-right px-2 py-1">SV</th>
                <th className="text-right px-2 py-1">ERA</th>
                <th className="text-right px-2 py-1">IP</th>
                <th className="text-right px-2 py-1">K/9</th>
                <th className="text-right px-2 py-1">WHIP</th>
                <th className="text-right px-2 py-1">SAL</th>
                <th className="text-right px-2 py-1">SVC</th>
                {isOwnTeam && <th className="text-right px-2 py-1">ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {pitchers.map(p => (
                <PitcherRow
                  key={p.playerId}
                  p={p}
                  onClick={() => openPlayer(p.playerId)}
                  isOwner={isOwnTeam}
                  rosterTab={activeTab}
                  onAction={handleAction}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {players.length === 0 && (
        <div className="text-gray-500 text-xs text-center py-8">No players in this category.</div>
      )}

      {/* ── Prospect Traits panel — shows only on MINORS tab ───────────────── */}
      {activeTab === 'MINORS' && players.length > 0 && (
        <ProspectTraitsPanel players={players} />
      )}
    </div>
  );
}
