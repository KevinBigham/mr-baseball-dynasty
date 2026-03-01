import { useEffect, useState, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer } from '../../types/league';
import { assignTraits, type PlayerTrait } from '../../engine/playerTraits';

type RosterTab = 'ACTIVE' | 'IL' | 'AAA' | 'AA' | 'HIGH-A' | 'LOW-A' | 'ROOKIE' | 'INTL' | 'DFA';

interface FullRosterData {
  teamId: number;
  season: number;
  active: RosterPlayer[];
  il: RosterPlayer[];
  dfa: RosterPlayer[];
  aaa: RosterPlayer[];
  aa: RosterPlayer[];
  aPlus: RosterPlayer[];
  aMinus: RosterPlayer[];
  rookie: RosterPlayer[];
  intl: RosterPlayer[];
  fortyManCount: number;
  activeCount: number;
}

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

// ─── Prospect traits panel ──────────────────────────────────────────────────
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
            <div key={p.playerId} className="flex items-start gap-2 py-1.5 border-b border-gray-800 last:border-0">
              <div className="shrink-0 text-right w-14">
                <div className="text-orange-400 font-mono text-xs font-bold">{p.overall}</div>
                <div className="text-gray-700 text-xs">→{p.potential}</div>
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
    </div>
  );
}

function formatSalary(s: number): string {
  if (s >= 1_000_000) return `$${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `$${(s / 1000).toFixed(0)}K`;
  return `$${s}`;
}

// ─── Confirmation modal ──────────────────────────────────────────────────────
function ConfirmModal({
  message, onConfirm, onCancel,
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bloomberg-border bg-gray-900 p-6 max-w-sm">
        <div className="text-gray-200 text-sm mb-4">{message}</div>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold text-xs py-2 uppercase tracking-widest">
            CONFIRM
          </button>
          <button onClick={onCancel}
            className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-400 font-bold text-xs py-2 uppercase tracking-widest">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 text-xs font-bold tracking-wider uppercase ${
      isError ? 'bg-red-900 text-red-300 border border-red-700' : 'bg-green-900 text-green-300 border border-green-700'
    }`}>
      {message}
    </div>
  );
}

// ─── Per-tab action definitions ──────────────────────────────────────────────
interface ActionDef {
  label: string;
  actionType: string;
  targetStatus?: string;
  destructive?: boolean;
}

function getActionsForTab(tab: RosterTab): ActionDef[] {
  switch (tab) {
    case 'ACTIVE': return [
      { label: '↓ Option to AAA', actionType: 'demote', targetStatus: 'MINORS_AAA' },
      { label: '✕ DFA', actionType: 'dfa', destructive: true },
      { label: '🚫 Release', actionType: 'release', destructive: true },
    ];
    case 'AAA': return [
      { label: '↑ Call Up to MLB', actionType: 'promote', targetStatus: 'MLB_ACTIVE' },
      { label: '↓ Demote to AA', actionType: 'demote', targetStatus: 'MINORS_AA' },
      { label: '🚫 Release', actionType: 'release', destructive: true },
    ];
    case 'AA': return [
      { label: '↑ Promote to AAA', actionType: 'promote', targetStatus: 'MINORS_AAA' },
      { label: '↓ Demote to High-A', actionType: 'demote', targetStatus: 'MINORS_APLUS' },
    ];
    case 'HIGH-A': return [
      { label: '↑ Promote to AA', actionType: 'promote', targetStatus: 'MINORS_AA' },
      { label: '↓ Demote to Low-A', actionType: 'demote', targetStatus: 'MINORS_AMINUS' },
    ];
    case 'LOW-A': return [
      { label: '↑ Promote to High-A', actionType: 'promote', targetStatus: 'MINORS_APLUS' },
      { label: '↓ Demote to Rookie', actionType: 'demote', targetStatus: 'MINORS_ROOKIE' },
    ];
    case 'ROOKIE': return [
      { label: '↑ Promote to Low-A', actionType: 'promote', targetStatus: 'MINORS_AMINUS' },
    ];
    case 'INTL': return [
      { label: '↑ Promote to Rookie', actionType: 'promote', targetStatus: 'MINORS_ROOKIE' },
    ];
    case 'DFA': return [
      { label: '↑ Restore to Active', actionType: 'promote', targetStatus: 'MLB_ACTIVE' },
      { label: '↓ Outright to AAA', actionType: 'demote', targetStatus: 'MINORS_AAA' },
      { label: '🚫 Release', actionType: 'release', destructive: true },
    ];
    default: return [];
  }
}

// ─── Player row ──────────────────────────────────────────────────────────────
function PlayerRow({
  p, isUserTeam, tab, onAction, onClick,
}: {
  p: RosterPlayer; isUserTeam: boolean; tab: RosterTab;
  onAction: (playerId: number, action: string, targetStatus?: string) => void;
  onClick: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const actions = isUserTeam ? getActionsForTab(tab) : [];

  return (
    <tr className="bloomberg-row text-xs">
      <td className="px-2 py-1 font-bold text-orange-300 cursor-pointer hover:text-orange-200" onClick={onClick}>
        {p.name}
      </td>
      <td className="px-2 py-1 text-gray-500">{p.position}</td>
      <td className="px-2 py-1 tabular-nums text-right">{p.age}</td>
      <td className="px-2 py-1 text-gray-500">{p.isPitcher ? p.throws : p.bats}</td>
      <td className="px-2 py-1 tabular-nums text-right text-orange-400 font-bold">{p.overall}</td>
      <td className="px-2 py-1 tabular-nums text-right text-gray-500">{p.potential}</td>
      {p.isPitcher ? (
        <>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats.w ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats.era ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats.ip ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats.k9 ?? '—'}</td>
        </>
      ) : (
        <>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats.avg ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats.hr ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats.rbi ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats.obp ?? '—'}</td>
        </>
      )}
      <td className="px-2 py-1 text-gray-600 text-right">{formatSalary(p.salary)}</td>
      <td className="px-2 py-1 relative">
        {isUserTeam && actions.length > 0 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
              className="text-gray-600 hover:text-orange-400 text-xs transition-colors px-1"
            >
              ···
            </button>
            {showActions && (
              <div className="absolute right-0 top-full z-40 bg-gray-900 border border-gray-700 shadow-lg min-w-[180px]"
                onMouseLeave={() => setShowActions(false)}>
                {actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(false);
                      onAction(p.playerId, a.actionType, a.targetStatus);
                    }}
                    className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-800 transition-colors ${
                      a.destructive ? 'text-red-400 hover:text-red-300' : 'text-gray-300 hover:text-orange-400'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

// ─── Main RosterView ─────────────────────────────────────────────────────────
export default function RosterView() {
  const { setRoster } = useLeagueStore();
  const { gameStarted, userTeamId } = useGameStore();
  const { selectedTeamId, setSelectedPlayer, setActiveTab } = useUIStore();
  const [rosterTab, setRosterTab] = useState<RosterTab>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [fullRoster, setFullRoster] = useState<FullRosterData | null>(null);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const teamId = selectedTeamId ?? userTeamId;
  const isUserTeam = teamId === userTeamId;

  const loadRoster = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    try {
      const engine = getEngine();
      const data = await engine.getFullRoster(teamId);
      setFullRoster(data);
      setRoster({ teamId: data.teamId, season: data.season, active: data.active, il: data.il, minors: data.aaa, dfa: data.dfa });
    } catch { /* fallback */ } finally {
      setLoading(false);
    }
  }, [gameStarted, teamId, setRoster]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const openPlayer = (id: number) => { setSelectedPlayer(id); setActiveTab('profile'); };

  const handleAction = useCallback(async (playerId: number, actionType: string, targetStatus?: string) => {
    const engine = getEngine();
    const destructive = actionType === 'dfa' || actionType === 'release';

    const doAction = async () => {
      let result: { ok: boolean; error?: string };
      switch (actionType) {
        case 'promote':
          result = await engine.promotePlayer(playerId, targetStatus as any);
          break;
        case 'demote':
          result = await engine.demotePlayer(playerId, targetStatus as any);
          break;
        case 'dfa':
          result = await engine.dfaPlayer(playerId);
          break;
        case 'release':
          result = await engine.releasePlayer(playerId);
          break;
        default:
          result = { ok: false, error: 'Unknown action' };
      }
      if (result.ok) {
        setToast({ message: 'Transaction complete.' });
        await loadRoster();
      } else {
        setToast({ message: result.error ?? 'Transaction failed.', isError: true });
      }
    };

    if (destructive) {
      const all = fullRoster ? [
        ...fullRoster.active, ...fullRoster.il, ...fullRoster.dfa,
        ...fullRoster.aaa, ...fullRoster.aa, ...fullRoster.aPlus,
        ...fullRoster.aMinus, ...fullRoster.rookie, ...fullRoster.intl,
      ] : [];
      const player = all.find(p => p.playerId === playerId);
      const name = player?.name ?? 'this player';
      setConfirmState({
        message: actionType === 'release'
          ? `Release ${name}? This cannot be undone.`
          : `DFA ${name}? They will be removed from the 40-man roster.`,
        onConfirm: () => { setConfirmState(null); doAction(); },
      });
    } else {
      doAction();
    }
  }, [loadRoster, fullRoster]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading roster...</div>;
  if (!fullRoster) return <div className="p-4 text-gray-500 text-xs">No roster data.</div>;

  const tabMap: Record<RosterTab, RosterPlayer[]> = {
    ACTIVE: fullRoster.active,
    IL:     fullRoster.il,
    AAA:    fullRoster.aaa,
    AA:     fullRoster.aa,
    'HIGH-A': fullRoster.aPlus,
    'LOW-A':  fullRoster.aMinus,
    ROOKIE: fullRoster.rookie,
    INTL:   fullRoster.intl,
    DFA:    fullRoster.dfa,
  };

  const players = tabMap[rosterTab] ?? [];
  const hitters  = players.filter(p => !p.isPitcher).sort((a, b) => b.overall - a.overall);
  const pitchers = players.filter(p => p.isPitcher).sort((a, b) => b.overall - a.overall);

  const TABS: RosterTab[] = ['ACTIVE', 'IL', 'AAA', 'AA', 'HIGH-A', 'LOW-A', 'ROOKIE', 'INTL', 'DFA'];

  return (
    <div className="p-4">
      {toast && <Toast message={toast.message} isError={toast.isError} />}
      {confirmState && <ConfirmModal message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} />}

      <div className="bloomberg-header -mx-4 -mt-4 px-4 py-2 mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span>ROSTER — TEAM {teamId}</span>
          {isUserTeam && (
            <span className="text-gray-400 font-normal">
              <span className="text-orange-400 font-bold">{fullRoster.activeCount}</span>
              <span className="text-gray-600">/{26} ACTIVE</span>
              <span className="mx-2 text-gray-700">|</span>
              <span className="text-orange-400 font-bold">{fullRoster.fortyManCount}</span>
              <span className="text-gray-600">/{40} 40-MAN</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setRosterTab(tab)}
            className={[
              'px-3 py-1.5 text-xs font-bold tracking-wider transition-colors',
              rosterTab === tab
                ? 'bg-orange-900/40 text-orange-400 border border-orange-700'
                : 'text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-600',
            ].join(' ')}
          >
            {tab} ({tabMap[tab]?.length ?? 0})
          </button>
        ))}
      </div>

      {hitters.length > 0 && (
        <div className="bloomberg-border mb-4 overflow-x-auto">
          <div className="bloomberg-header px-4">POSITION PLAYERS</div>
          <table className="w-full">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800">
                <th className="text-left px-2 py-1">NAME</th>
                <th className="text-left px-2 py-1">POS</th>
                <th className="text-right px-2 py-1">AGE</th>
                <th className="text-left px-2 py-1">B</th>
                <th className="text-right px-2 py-1">OVR</th>
                <th className="text-right px-2 py-1">POT</th>
                <th className="text-right px-2 py-1">AVG</th>
                <th className="text-right px-2 py-1">HR</th>
                <th className="text-right px-2 py-1">RBI</th>
                <th className="text-right px-2 py-1">OBP</th>
                <th className="text-right px-2 py-1">SAL</th>
                <th className="px-2 py-1" />
              </tr>
            </thead>
            <tbody>
              {hitters.map(p => (
                <PlayerRow key={p.playerId} p={p} isUserTeam={isUserTeam} tab={rosterTab}
                  onAction={handleAction} onClick={() => openPlayer(p.playerId)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pitchers.length > 0 && (
        <div className="bloomberg-border mb-4 overflow-x-auto">
          <div className="bloomberg-header px-4">PITCHERS</div>
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
                <th className="text-right px-2 py-1">ERA</th>
                <th className="text-right px-2 py-1">IP</th>
                <th className="text-right px-2 py-1">K/9</th>
                <th className="text-right px-2 py-1">SAL</th>
                <th className="px-2 py-1" />
              </tr>
            </thead>
            <tbody>
              {pitchers.map(p => (
                <PlayerRow key={p.playerId} p={p} isUserTeam={isUserTeam} tab={rosterTab}
                  onAction={handleAction} onClick={() => openPlayer(p.playerId)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {players.length === 0 && (
        <div className="text-gray-500 text-xs text-center py-8">No players in this category.</div>
      )}

      {['AAA', 'AA', 'HIGH-A', 'LOW-A', 'ROOKIE', 'INTL'].includes(rosterTab) && players.length > 0 && (
        <ProspectTraitsPanel players={players} />
      )}
    </div>
  );
}
