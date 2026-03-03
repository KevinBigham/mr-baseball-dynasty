import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer } from '../../types/league';
import { assignTraits, type PlayerTrait } from '../../engine/playerTraits';
import DepthChart from './DepthChart';
import ProspectPipeline from './ProspectPipeline';
import ILManagement from './ILManagement';
import DevLab from './DevLab';
import ScoutingReports from './ScoutingReports';
import { formatSalary } from '../../utils/format';
import { SkeletonTable } from '../layout/Skeleton';
import ScrollableTable from '../layout/ScrollableTable';
import ConfirmModal from '../layout/ConfirmModal';
import type { RosterStatus } from '../../types/player';

type RosterTab = 'ACTIVE' | 'IL' | 'AAA' | 'AA' | 'HIGH-A' | 'LOW-A' | 'ROOKIE' | 'INTL' | 'DFA';
type SortKey = 'name' | 'position' | 'age' | 'overall' | 'potential' | 'salary' | 'contract' | 'service' | 'stat1' | 'stat2' | 'stat3' | 'stat4';
type ViewMode = 'table' | 'depth' | 'pipeline' | 'devlab' | 'scouting';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatServiceTime(days: number): string {
  const years = Math.floor(days / 172);
  const remaining = days % 172;
  return `${years}.${String(remaining).padStart(3, '0')}`;
}

function serviceTimeColor(days: number): string {
  if (days >= 1032) return 'text-red-400';    // FA eligible (6+ years)
  if (days >= 516) return 'text-yellow-400';   // Arbitration eligible (3+ years)
  return 'text-gray-400';                      // Pre-arb
}

function contractColor(years: number): string {
  if (years <= 1) return 'text-orange-400';
  if (years >= 4) return 'text-green-400';
  return 'text-gray-400';
}

function getSortValue(p: RosterPlayer, key: SortKey, isPitcherTable: boolean): number | string {
  switch (key) {
    case 'name': return p.name.toLowerCase();
    case 'position': return p.position;
    case 'age': return p.age;
    case 'overall': return p.overall;
    case 'potential': return p.potential;
    case 'salary': return p.salary;
    case 'contract': return p.contractYearsRemaining;
    case 'service': return p.serviceTimeDays;
    case 'stat1': return isPitcherTable ? (p.stats.w ?? 0) : (p.stats.avg ?? 0);
    case 'stat2': return isPitcherTable ? (p.stats.era ?? 99) : (p.stats.hr ?? 0);
    case 'stat3': return isPitcherTable ? (p.stats.ip ?? 0) : (p.stats.rbi ?? 0);
    case 'stat4': return isPitcherTable ? (p.stats.k9 ?? 0) : (p.stats.obp ?? 0);
    default: return 0;
  }
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
                <div className="text-gray-500 text-xs">{p.position} · Age {p.age}</div>
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

// ─── Sortable header cell ────────────────────────────────────────────────────
function SortHeader({ label, sortKey: sk, currentSort, onSort, align }: {
  label: string; sortKey: SortKey; currentSort: { key: SortKey; dir: 'asc' | 'desc' };
  onSort: (key: SortKey) => void; align?: 'left' | 'right';
}) {
  const active = currentSort.key === sk;
  const arrow = active ? (currentSort.dir === 'asc' ? ' ▲' : ' ▼') : '';
  return (
    <th
      scope="col"
      role="button"
      tabIndex={0}
      aria-sort={active ? (currentSort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      aria-label={`Sort by ${label}`}
      className={`${align === 'left' ? 'text-left' : 'text-right'} px-2 py-1 cursor-pointer select-none hover:text-orange-400 transition-colors ${
        active ? 'text-orange-400' : 'text-gray-500'
      }`}
      onClick={() => onSort(sk)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(sk); } }}
    >
      {label}{arrow}
    </th>
  );
}

// ─── Player row ──────────────────────────────────────────────────────────────
function PlayerRow({
  p, isUserTeam, tab, onAction, onClick, showContractCols, showOptionCol,
}: {
  p: RosterPlayer; isUserTeam: boolean; tab: RosterTab;
  onAction: (playerId: number, action: string, targetStatus?: string) => void;
  onClick: () => void;
  showContractCols: boolean;
  showOptionCol: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const actions = isUserTeam ? getActionsForTab(tab) : [];

  // Close dropdown on click/touch outside
  useEffect(() => {
    if (!showActions) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showActions]);

  return (
    <tr className="bloomberg-row text-xs">
      <td className="px-2 py-1 font-bold text-orange-300 cursor-pointer hover:text-orange-200 whitespace-nowrap" onClick={onClick}>
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
      <td className="px-2 py-1 text-gray-500 text-right">{formatSalary(p.salary)}</td>
      {showContractCols && (
        <>
          <td className={`px-2 py-1 tabular-nums text-right ${contractColor(p.contractYearsRemaining)}`}>
            {p.contractYearsRemaining}yr
          </td>
          <td className={`px-2 py-1 tabular-nums text-right ${serviceTimeColor(p.serviceTimeDays)}`}>
            {formatServiceTime(p.serviceTimeDays)}
          </td>
        </>
      )}
      {showOptionCol && (
        <td className={`px-2 py-1 tabular-nums text-right ${p.optionYearsRemaining === 0 ? 'text-red-400' : 'text-gray-400'}`}>
          {p.optionYearsRemaining}
        </td>
      )}
      <td className="px-2 py-1 relative">
        {isUserTeam && actions.length > 0 && (
          <div ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
              className="text-gray-500 hover:text-orange-400 text-xs transition-colors px-1 min-h-[44px] min-w-[44px]"
              aria-label="Player actions menu"
            >
              ···
            </button>
            {showActions && (
              <div className="absolute right-0 top-full z-40 bg-gray-900 border border-gray-700 shadow-lg min-w-[180px]">
                {actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(false);
                      onAction(p.playerId, a.actionType, a.targetStatus);
                    }}
                    className={`block w-full text-left px-3 py-2 min-h-[44px] text-xs hover:bg-gray-800 transition-colors ${
                      a.destructive ? 'text-red-400 hover:text-red-300' : 'text-gray-300 hover:text-orange-400'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Payroll Bar ─────────────────────────────────────────────────────────────
function PayrollBar({ payroll, budget }: { payroll: number; budget: number }) {
  const budgetDollars = budget * 1_000_000;
  const pct = budgetDollars > 0 ? (payroll / budgetDollars) * 100 : 0;
  const barColor = pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500';
  const textColor = pct > 100 ? 'text-red-400' : pct > 80 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="bloomberg-border bg-gray-900 px-4 py-2 mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 text-xs">PAYROLL</span>
        <div className="flex items-center gap-4 text-xs">
          <span className={textColor + ' font-bold'}>{formatSalary(payroll)}</span>
          <span className="text-gray-500">of</span>
          <span className="text-gray-400 font-bold">${budget}M</span>
          <span className={textColor + ' tabular-nums'}>{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

// ─── Main RosterView ─────────────────────────────────────────────────────────
export default function RosterView() {
  const { setRoster } = useLeagueStore();
  const { gameStarted, userTeamId } = useGameStore();
  const { selectedTeamId, setSelectedPlayer, setActiveTab } = useUIStore();
  const [rosterTab, setRosterTab] = useState<RosterTab>('ACTIVE');
  const rosterViewModeFromStore = useUIStore(s => s.rosterViewMode);
  const setRosterViewModeStore = useUIStore(s => s.setRosterViewMode);
  const [viewMode, setViewMode] = useState<ViewMode>(
    (rosterViewModeFromStore as ViewMode) || 'table'
  );

  // Consume rosterViewMode from store (deep-link from in-season dashboard)
  useEffect(() => {
    if (rosterViewModeFromStore) {
      setViewMode(rosterViewModeFromStore as ViewMode);
      setRosterViewModeStore(null);
    }
  }, [rosterViewModeFromStore, setRosterViewModeStore]);
  const [loading, setLoading] = useState(false);
  const [fullRoster, setFullRoster] = useState<FullRosterData | null>(null);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [hitterSort, setHitterSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'overall', dir: 'desc' });
  const [pitcherSort, setPitcherSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'overall', dir: 'desc' });
  const [teamBudget, setTeamBudget] = useState(0);

  const teamId = selectedTeamId ?? userTeamId;
  const isUserTeam = teamId === userTeamId;

  const showContractCols = ['ACTIVE', 'IL', 'AAA', 'DFA'].includes(rosterTab);
  const showOptionCol = ['ACTIVE', 'AAA'].includes(rosterTab);

  const loadRoster = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    try {
      const engine = getEngine();
      const [data, teams] = await Promise.all([
        engine.getFullRoster(teamId),
        engine.getLeagueTeams(),
      ]);
      setFullRoster(data);
      const team = teams.find(t => t.teamId === teamId);
      if (team) setTeamBudget(team.budget);
      setRoster({ teamId: data.teamId, season: data.season, active: data.active, il: data.il, minors: data.aaa, dfa: data.dfa });
    } catch { /* fallback */ } finally {
      setLoading(false);
    }
  }, [gameStarted, teamId, setRoster]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  const openPlayer = (id: number) => { setSelectedPlayer(id); setActiveTab('profile'); };

  const handleAction = useCallback(async (playerId: number, actionType: string, targetStatus?: string) => {
    const engine = getEngine();
    const destructive = actionType === 'dfa' || actionType === 'release';

    const doAction = async () => {
      let result: { ok: boolean; error?: string };
      switch (actionType) {
        case 'promote':
          result = await engine.promotePlayer(playerId, targetStatus as RosterStatus);
          break;
        case 'demote':
          result = await engine.demotePlayer(playerId, targetStatus as RosterStatus);
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
        useUIStore.getState().addToast('Transaction complete.', 'success');
        await loadRoster();
      } else {
        useUIStore.getState().addToast(result.error ?? 'Transaction failed.', 'error');
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

  const toggleSort = useCallback((isPitcherTable: boolean) => (key: SortKey) => {
    const setter = isPitcherTable ? setPitcherSort : setHitterSort;
    setter(prev => ({
      key,
      dir: prev.key === key ? (prev.dir === 'desc' ? 'asc' : 'desc') : 'desc',
    }));
  }, []);

  // Compute data
  const tabMap: Record<RosterTab, RosterPlayer[]> | null = fullRoster ? {
    ACTIVE: fullRoster.active,
    IL:     fullRoster.il,
    AAA:    fullRoster.aaa,
    AA:     fullRoster.aa,
    'HIGH-A': fullRoster.aPlus,
    'LOW-A':  fullRoster.aMinus,
    ROOKIE: fullRoster.rookie,
    INTL:   fullRoster.intl,
    DFA:    fullRoster.dfa,
  } : null;

  const allPlayers = tabMap ? (tabMap[rosterTab] ?? []) : [];

  // Apply search and position filter
  const filteredPlayers = useMemo(() => {
    let list = allPlayers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    if (posFilter !== 'ALL') {
      list = list.filter(p => p.position === posFilter);
    }
    return list;
  }, [allPlayers, searchQuery, posFilter]);

  // Split and sort
  const hitters = useMemo(() => {
    const list = filteredPlayers.filter(p => !p.isPitcher);
    return list.sort((a, b) => {
      const aVal = getSortValue(a, hitterSort.key, false);
      const bVal = getSortValue(b, hitterSort.key, false);
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return hitterSort.dir === 'desc' ? -cmp : cmp;
    });
  }, [filteredPlayers, hitterSort]);

  const pitchers = useMemo(() => {
    const list = filteredPlayers.filter(p => p.isPitcher);
    return list.sort((a, b) => {
      const aVal = getSortValue(a, pitcherSort.key, true);
      const bVal = getSortValue(b, pitcherSort.key, true);
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return pitcherSort.dir === 'desc' ? -cmp : cmp;
    });
  }, [filteredPlayers, pitcherSort]);

  // Compute payroll (active + IL salaries)
  const totalPayroll = useMemo(() => {
    if (!fullRoster) return 0;
    return [...fullRoster.active, ...fullRoster.il].reduce((s, p) => s + p.salary, 0);
  }, [fullRoster]);

  // Expiring contracts
  const expiringContracts = useMemo(() => {
    if (!fullRoster) return [];
    return fullRoster.active.filter(p => p.contractYearsRemaining <= 1);
  }, [fullRoster]);

  // Unique positions for filter
  const positions = useMemo(() => {
    const posSet = new Set(allPlayers.map(p => p.position));
    return ['ALL', ...Array.from(posSet).sort()];
  }, [allPlayers]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4"><SkeletonTable rows={8} cols={6} /></div>;
  if (!fullRoster) return <div className="p-4 text-gray-500 text-xs">No roster data.</div>;

  const TABS: RosterTab[] = ['ACTIVE', 'IL', 'AAA', 'AA', 'HIGH-A', 'LOW-A', 'ROOKIE', 'INTL', 'DFA'];

  return (
    <div className="p-4">
      {confirmState && <ConfirmModal message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} />}

      <div className="bloomberg-header -mx-4 -mt-4 px-4 py-2 mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span>ROSTER — TEAM {teamId}</span>
          {isUserTeam && (
            <span className="text-gray-400 font-normal">
              <span className="text-orange-400 font-bold">{fullRoster.activeCount}</span>
              <span className="text-gray-500">/{26} ACTIVE</span>
              <span className="mx-2 text-gray-700">|</span>
              <span className="text-orange-400 font-bold">{fullRoster.fortyManCount}</span>
              <span className="text-gray-500">/{40} 40-MAN</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`text-xs px-2 py-1 transition-colors ${viewMode === 'table' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            TABLE
          </button>
          <button
            onClick={() => setViewMode('depth')}
            className={`text-xs px-2 py-1 transition-colors ${viewMode === 'depth' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            DEPTH CHART
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`text-xs px-2 py-1 transition-colors ${viewMode === 'pipeline' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            PIPELINE
          </button>
          {isUserTeam && (
            <button
              onClick={() => setViewMode('devlab')}
              className={`text-xs px-2 py-1 transition-colors ${viewMode === 'devlab' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              DEV LAB
            </button>
          )}
          <button
            onClick={() => setViewMode('scouting')}
            className={`text-xs px-2 py-1 transition-colors ${viewMode === 'scouting' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            SCOUTING
          </button>
        </div>
      </div>

      {/* Payroll bar */}
      {isUserTeam && teamBudget > 0 && (
        <PayrollBar payroll={totalPayroll} budget={teamBudget} />
      )}

      {/* Expiring contracts warning */}
      {isUserTeam && rosterTab === 'ACTIVE' && expiringContracts.length > 0 && (
        <div className="bg-orange-900/15 border border-orange-800/50 px-3 py-2 mb-4 text-xs">
          <span className="text-orange-500 font-bold">{expiringContracts.length} EXPIRING:</span>
          <span className="text-gray-400 ml-2">
            {expiringContracts.slice(0, 5).map(p => p.name).join(', ')}
            {expiringContracts.length > 5 && ` +${expiringContracts.length - 5} more`}
          </span>
        </div>
      )}

      {viewMode === 'devlab' && isUserTeam ? (
        <DevLab
          players={[
            ...(fullRoster?.active ?? []),
            ...(fullRoster?.aaa ?? []),
            ...(fullRoster?.aa ?? []),
            ...(fullRoster?.aPlus ?? []),
            ...(fullRoster?.aMinus ?? []),
            ...(fullRoster?.rookie ?? []),
            ...(fullRoster?.intl ?? []),
          ]}
        />
      ) : viewMode === 'scouting' ? (
        <ScoutingReports />
      ) : viewMode === 'pipeline' ? (
        <ProspectPipeline
          players={[
            ...(fullRoster?.active ?? []),
            ...(fullRoster?.aaa ?? []),
            ...(fullRoster?.aa ?? []),
            ...(fullRoster?.aPlus ?? []),
            ...(fullRoster?.aMinus ?? []),
            ...(fullRoster?.rookie ?? []),
            ...(fullRoster?.intl ?? []),
          ]}
        />
      ) : viewMode === 'depth' ? (
        <DepthChart
          players={[...(fullRoster?.active ?? []), ...(fullRoster?.il ?? [])]}
          editable
          onClickPlayer={(id) => {
            setSelectedPlayer(id);
            setActiveTab('profile');
          }}
        />
      ) : (
        <>
          {/* Tab row + controls */}
          <div className="flex flex-wrap items-center gap-1 mb-3">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setRosterTab(tab); setSearchQuery(''); setPosFilter('ALL'); }}
                className={[
                  'px-3 py-1.5 text-xs font-bold tracking-wider transition-colors',
                  rosterTab === tab
                    ? 'bg-orange-900/40 text-orange-400 border border-orange-700'
                    : 'text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-600',
                ].join(' ')}
              >
                {tab} ({tabMap ? (tabMap[tab]?.length ?? 0) : 0})
              </button>
            ))}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-gray-800 text-gray-300 text-xs border border-gray-700 px-3 py-1.5 w-full sm:w-48 placeholder-gray-600 focus:border-orange-700 outline-none"
            />
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
              {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* IL Management panel (when IL tab is active) */}
          {rosterTab === 'IL' && fullRoster && (
            <div className="mb-4">
              <ILManagement ilPlayers={fullRoster.il} />
            </div>
          )}

          {/* Position players table */}
          {hitters.length > 0 && (
            <ScrollableTable className="bloomberg-border mb-4">
              <div className="bloomberg-header px-4">POSITION PLAYERS</div>
              <table className="w-full">
                <caption className="sr-only">Position Players</caption>
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <SortHeader label="NAME" sortKey="name" currentSort={hitterSort} onSort={toggleSort(false)} align="left" />
                    <SortHeader label="POS" sortKey="position" currentSort={hitterSort} onSort={toggleSort(false)} align="left" />
                    <SortHeader label="AGE" sortKey="age" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <th className="text-left px-2 py-1">B</th>
                    <SortHeader label="OVR" sortKey="overall" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <SortHeader label="POT" sortKey="potential" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <SortHeader label="AVG" sortKey="stat1" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <SortHeader label="HR" sortKey="stat2" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <SortHeader label="RBI" sortKey="stat3" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <SortHeader label="OBP" sortKey="stat4" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <SortHeader label="SAL" sortKey="salary" currentSort={hitterSort} onSort={toggleSort(false)} />
                    {showContractCols && (
                      <>
                        <SortHeader label="CTR" sortKey="contract" currentSort={hitterSort} onSort={toggleSort(false)} />
                        <SortHeader label="SVC" sortKey="service" currentSort={hitterSort} onSort={toggleSort(false)} />
                      </>
                    )}
                    {showOptionCol && <th className="text-right px-2 py-1">OPT</th>}
                    <th className="px-2 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {hitters.map(p => (
                    <PlayerRow key={p.playerId} p={p} isUserTeam={isUserTeam} tab={rosterTab}
                      onAction={handleAction} onClick={() => openPlayer(p.playerId)}
                      showContractCols={showContractCols} showOptionCol={showOptionCol} />
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          )}

          {/* Pitchers table */}
          {pitchers.length > 0 && (
            <ScrollableTable className="bloomberg-border mb-4">
              <div className="bloomberg-header px-4">PITCHERS</div>
              <table className="w-full">
                <caption className="sr-only">Pitchers</caption>
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <SortHeader label="NAME" sortKey="name" currentSort={pitcherSort} onSort={toggleSort(true)} align="left" />
                    <SortHeader label="POS" sortKey="position" currentSort={pitcherSort} onSort={toggleSort(true)} align="left" />
                    <SortHeader label="AGE" sortKey="age" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <th className="text-left px-2 py-1">T</th>
                    <SortHeader label="OVR" sortKey="overall" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <SortHeader label="POT" sortKey="potential" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <SortHeader label="W" sortKey="stat1" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <SortHeader label="ERA" sortKey="stat2" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <SortHeader label="IP" sortKey="stat3" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <SortHeader label="K/9" sortKey="stat4" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <SortHeader label="SAL" sortKey="salary" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    {showContractCols && (
                      <>
                        <SortHeader label="CTR" sortKey="contract" currentSort={pitcherSort} onSort={toggleSort(true)} />
                        <SortHeader label="SVC" sortKey="service" currentSort={pitcherSort} onSort={toggleSort(true)} />
                      </>
                    )}
                    {showOptionCol && <th className="text-right px-2 py-1">OPT</th>}
                    <th className="px-2 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {pitchers.map(p => (
                    <PlayerRow key={p.playerId} p={p} isUserTeam={isUserTeam} tab={rosterTab}
                      onAction={handleAction} onClick={() => openPlayer(p.playerId)}
                      showContractCols={showContractCols} showOptionCol={showOptionCol} />
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          )}

          {filteredPlayers.length === 0 && (
            <div className="text-gray-500 text-xs text-center py-8">No players in this category.</div>
          )}

          {['AAA', 'AA', 'HIGH-A', 'LOW-A', 'ROOKIE', 'INTL'].includes(rosterTab) && filteredPlayers.length > 0 && (
            <ProspectTraitsPanel players={filteredPlayers} />
          )}
        </>
      )}
    </div>
  );
}
