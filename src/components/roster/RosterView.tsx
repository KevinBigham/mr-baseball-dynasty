import { useEffect, useState, useCallback, useMemo } from 'react';
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
import FranchiseRatings from './FranchiseRatings';
import PositionBattles from './PositionBattles';
import CutAdvisor from './CutAdvisor';
import CoachTip from '../shared/CoachTip';
import { formatSalary } from '../../utils/format';
import { OVRBadge, PotentialArrow, ContractBadge, QuickActions, PlayerDetailPanel } from './RosterCards';
import { ViewSwitcher, FilterChips, ActiveFiltersSummary, POSITION_GROUPS, STATUS_FILTERS, type DataView } from './RosterViews';
import { SkeletonTable } from '../layout/Skeleton';
import ScrollableTable from '../layout/ScrollableTable';
import ConfirmModal from '../layout/ConfirmModal';
import type { RosterStatus } from '../../types/player';
import { useSort } from '../../hooks/useSort';
import { SortHeader } from '../shared/SortHeader';

type RosterTab = 'ACTIVE' | 'IL' | 'AAA' | 'AA' | 'HIGH-A' | 'LOW-A' | 'ROOKIE' | 'INTL' | 'DFA';
type SortKey = 'name' | 'position' | 'age' | 'overall' | 'potential' | 'salary' | 'contract' | 'service' | 'stat1' | 'stat2' | 'stat3' | 'stat4';
type ViewMode = 'table' | 'depth' | 'pipeline' | 'devlab' | 'scouting' | 'ratings';

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
    case 'stat1': return isPitcherTable ? (p.stats?.w ?? 0) : (p.stats?.avg ?? 0);
    case 'stat2': return isPitcherTable ? (p.stats?.era ?? 99) : (p.stats?.hr ?? 0);
    case 'stat3': return isPitcherTable ? (p.stats?.ip ?? 0) : (p.stats?.rbi ?? 0);
    case 'stat4': return isPitcherTable ? (p.stats?.k9 ?? 0) : (p.stats?.obp ?? 0);
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

// ─── Sortable header cell ────────────────────────────────────────────────────
// SortHeader is now imported from '../shared/SortHeader'

// ─── Player row (upgraded with OVR badge + quick actions) ────────────────────
function PlayerRow({
  p, isUserTeam, tab, onAction, onClick, showContractCols, showOptionCol,
}: {
  p: RosterPlayer; isUserTeam: boolean; tab: RosterTab;
  onAction: (playerId: number, action: string, targetStatus?: string) => void;
  onClick: () => void;
  showContractCols: boolean;
  showOptionCol: boolean;
}) {
  return (
    <tr className="bloomberg-row text-xs group">
      {/* OVR Badge + Name */}
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-2">
          <OVRBadge ovr={p.overall} size="small" />
          <div className="min-w-0">
            <button onClick={onClick} className="font-bold text-orange-300 hover:text-orange-200 truncate block text-left transition-colors">
              {p.name}
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-[9px]">{p.position}</span>
              <PotentialArrow ovr={p.overall} pot={p.potential} />
            </div>
          </div>
        </div>
      </td>
      <td className="px-2 py-1 tabular-nums text-right">{p.age}</td>
      <td className="px-2 py-1 text-gray-500 text-center">{p.isPitcher ? p.throws : p.bats}</td>
      {p.isPitcher ? (
        <>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats?.w ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats?.era ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats?.ip ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats?.k9 ?? '—'}</td>
        </>
      ) : (
        <>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats?.avg ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats?.hr ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats?.rbi ?? '—'}</td>
          <td className="text-right px-2 py-1 tabular-nums">{p.stats?.obp ?? '—'}</td>
        </>
      )}
      {showContractCols && (
        <td className="px-2 py-1">
          <ContractBadge years={p.contractYearsRemaining} salary={p.salary} />
        </td>
      )}
      {!showContractCols && (
        <td className="px-2 py-1 text-gray-500 text-right">{formatSalary(p.salary)}</td>
      )}
      {showOptionCol && (
        <td className={`px-2 py-1 tabular-nums text-right ${p.optionYearsRemaining === 0 ? 'text-red-400' : 'text-gray-400'}`}>
          {p.optionYearsRemaining}
        </td>
      )}
      <td className="px-2 py-1">
        {isUserTeam && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <QuickActions playerId={p.playerId} tab={tab} onAction={onAction} />
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Payroll Bar ─────────────────────────────────────────────────────────────
function PayrollBar({ payroll, budget }: { payroll: number; budget: number }) {
  // Budget may arrive as raw dollars (155000000) or millions (155) — normalize
  const budgetDollars = budget > 1000 ? budget : budget * 1_000_000;
  const pct = budgetDollars > 0 ? (payroll / budgetDollars) * 100 : 0;
  const barColor = pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500';
  const textColor = pct > 100 ? 'text-red-400' : pct > 80 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="bloomberg-border px-4 py-2 mb-4" style={{ backgroundColor: '#0F1930' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 text-xs">PAYROLL</span>
        <div className="flex items-center gap-4 text-xs">
          <span className={textColor + ' font-bold'}>{formatSalary(payroll)}</span>
          <span className="text-gray-500">of</span>
          <span className="text-gray-400 font-bold">{formatSalary(budgetDollars)}</span>
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

  // Sync sub-tab from 5-pillar navigation to internal view mode
  const currentSubTab = useUIStore(s => s.subTab);
  useEffect(() => {
    const subTabToMode: Record<string, ViewMode> = {
      'depth': 'depth', 'pipeline': 'pipeline', 'devlab': 'devlab', 'scouting': 'scouting',
    };
    if (subTabToMode[currentSubTab]) {
      setViewMode(subTabToMode[currentSubTab]);
    } else if (currentSubTab === 'roster' || currentSubTab === '') {
      setViewMode('table');
    }
  }, [currentSubTab]);
  const [loading, setLoading] = useState(false);
  const [fullRoster, setFullRoster] = useState<FullRosterData | null>(null);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [dataView, setDataView] = useState<DataView>('overview');
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<string>>(new Set());
  const { sort: hitterSort, toggle: toggleHitterSort } = useSort<SortKey>('overall');
  const { sort: pitcherSort, toggle: togglePitcherSort } = useSort<SortKey>('overall');
  const [teamBudget, setTeamBudget] = useState(0);

  const teamId = selectedTeamId ?? userTeamId;
  const isUserTeam = teamId === userTeamId;
  const [detailPlayer, setDetailPlayer] = useState<RosterPlayer | null>(null);

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
      setFullRoster(data as FullRosterData);
      const team = teams.find(t => t.teamId === teamId);
      if (team) setTeamBudget(team.budget);
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      setRoster({ teamId: data.teamId, season: data.season, active: data.active, il: data.il, minors: data.aaa, dfa: data.dfa });
    } catch { /* fallback */ } finally {
      setLoading(false);
    }
  }, [gameStarted, teamId, setRoster]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  const openPlayer = (id: number) => {
    // Find the player in current roster to show detail panel
    const allP = [
      ...(fullRoster?.active ?? []), ...(fullRoster?.il ?? []), ...(fullRoster?.dfa ?? []),
      ...(fullRoster?.aaa ?? []), ...(fullRoster?.aa ?? []),
      ...(fullRoster?.aPlus ?? []), ...(fullRoster?.aMinus ?? []),
      ...(fullRoster?.rookie ?? []), ...(fullRoster?.intl ?? []),
    ];
    const found = allP.find(p => p.playerId === id);
    if (found) {
      setDetailPlayer(found);
    } else {
      // Fallback: navigate to full profile
      setSelectedPlayer(id); setActiveTab('profile');
    }
  };

  const openFullProfile = (id: number) => {
    setDetailPlayer(null);
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  const handleAction = useCallback(async (playerId: number, actionType: string, targetStatus?: string) => {
    const engine = getEngine();
    const destructive = actionType === 'dfa' || actionType === 'release';

    const doAction = async () => {
      let result: { ok: boolean; error?: string };
      switch (actionType) {
        case 'promote':
          // @ts-expect-error Sprint 04 stub — contract alignment pending
          result = await engine.promotePlayer(playerId, targetStatus as RosterStatus);
          break;
        case 'demote':
          // @ts-expect-error Sprint 04 stub — contract alignment pending
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
    if (isPitcherTable) togglePitcherSort(key);
    else toggleHitterSort(key);
  }, [toggleHitterSort, togglePitcherSort]);

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

  // Apply search, position filter, and status filters
  const filteredPlayers = useMemo(() => {
    let list = allPlayers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    if (posFilter !== 'ALL') {
      const group = POSITION_GROUPS.find(g => g.id === posFilter);
      if (group) list = list.filter(group.filter);
    }
    // Apply status filters (union — player must match ANY active filter)
    if (activeStatusFilters.size > 0) {
      const statusChips = STATUS_FILTERS.filter(f => activeStatusFilters.has(f.id));
      if (statusChips.length > 0) {
        list = list.filter(p => statusChips.some(c => c.filter(p)));
      }
    }
    return list;
  }, [allPlayers, searchQuery, posFilter, activeStatusFilters]);

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

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4"><SkeletonTable rows={8} cols={6} /></div>;
  if (!fullRoster) return <div className="p-4 text-gray-500 text-xs">No roster data.</div>;

  const TABS: RosterTab[] = ['ACTIVE', 'IL', 'AAA', 'AA', 'HIGH-A', 'LOW-A', 'ROOKIE', 'INTL', 'DFA'];

  return (
    <div className="p-4">
      {confirmState && <ConfirmModal message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} />}

      <div className="bloomberg-header -mx-2 sm:-mx-4 -mt-2 sm:-mt-4 px-2 sm:px-4 py-2 mb-3 sm:mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] sm:text-xs">ROSTER — TEAM {teamId}</span>
          {isUserTeam && (
            <span className="text-gray-400 font-normal text-[10px] sm:text-xs">
              <span className="text-orange-400 font-bold">{fullRoster.activeCount}</span>
              <span className="text-gray-500">/{26}</span>
              <span className="mx-1 text-gray-700">|</span>
              <span className="text-orange-400 font-bold">{fullRoster.fortyManCount}</span>
              <span className="text-gray-500">/{40}</span>
            </span>
          )}
        </div>
        <div className="overflow-x-auto -mx-2 px-2">
          <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => setViewMode('table')}
            className={`text-[10px] sm:text-xs px-2 py-1 transition-colors rounded whitespace-nowrap ${viewMode === 'table' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            TABLE
          </button>
          <button
            onClick={() => setViewMode('depth')}
            className={`text-[10px] sm:text-xs px-2 py-1 transition-colors rounded whitespace-nowrap ${viewMode === 'depth' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            DEPTH
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`text-[10px] sm:text-xs px-2 py-1 transition-colors rounded whitespace-nowrap ${viewMode === 'pipeline' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            PIPELINE
          </button>
          {isUserTeam && (
            <button
              onClick={() => setViewMode('devlab')}
              className={`text-[10px] sm:text-xs px-2 py-1 transition-colors rounded whitespace-nowrap ${viewMode === 'devlab' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              DEV LAB
            </button>
          )}
          <button
            onClick={() => setViewMode('scouting')}
            className={`text-[10px] sm:text-xs px-2 py-1 transition-colors rounded whitespace-nowrap ${viewMode === 'scouting' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            SCOUTING
          </button>
          <button
            onClick={() => setViewMode('ratings')}
            className={`text-[10px] sm:text-xs px-2 py-1 transition-colors rounded whitespace-nowrap ${viewMode === 'ratings' ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            RATINGS
          </button>
          </div>
        </div>
      </div>

      {/* Coach tip */}
      <CoachTip section="roster" />

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

      {viewMode === 'ratings' ? (
        <FranchiseRatings teamId={teamId} />
      ) : viewMode === 'devlab' && isUserTeam ? (
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
          <div className="overflow-x-auto -mx-2 px-2 mb-3">
            <div className="flex items-center gap-1 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setRosterTab(tab); setSearchQuery(''); setPosFilter('ALL'); }}
                className={[
                  'px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold tracking-wider transition-colors whitespace-nowrap rounded',
                  rosterTab === tab
                    ? 'bg-orange-900/40 text-orange-400 border border-orange-700'
                    : 'text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-600',
                ].join(' ')}
              >
                {tab} ({tabMap ? (tabMap[tab]?.length ?? 0) : 0})
              </button>
            ))}
            </div>
          </div>

          {/* ── Views + Filters System ─────────────────────────────── */}
          <div className="space-y-2 mb-4">
            {/* View Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <ViewSwitcher activeView={dataView} onViewChange={setDataView} />
              <ActiveFiltersSummary
                count={filteredPlayers.length}
                total={allPlayers.length}
                activeFilters={activeStatusFilters}
                onClear={() => { setActiveStatusFilters(new Set()); setPosFilter('ALL'); setSearchQuery(''); }}
              />
            </div>

            {/* Search + Position Group Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs px-3 py-1.5 w-full sm:w-44 placeholder-gray-600 focus:outline-none rounded"
                style={{ backgroundColor: '#0B1020', color: '#E2E8F0', border: '1px solid #1E2A4A' }}
              />
              <FilterChips
                chips={POSITION_GROUPS}
                activeFilters={new Set([posFilter])}
                onToggle={(id) => setPosFilter(id === posFilter ? 'ALL' : id)}
                label="POS"
              />
            </div>

            {/* Status Filter Chips */}
            <FilterChips
              chips={STATUS_FILTERS}
              activeFilters={activeStatusFilters}
              onToggle={(id) => {
                setActiveStatusFilters(prev => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                });
              }}
              label="FILTER"
            />
          </div>

          {/* Position Battles (ACTIVE tab only) */}
          {rosterTab === 'ACTIVE' && fullRoster && (
            <div className="mb-4">
              <PositionBattles
                players={fullRoster.active}
                onClickPlayer={openPlayer}
              />
            </div>
          )}

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
                  <tr className="text-gray-500 text-xs" style={{ borderBottom: '1px solid #1E2A4A' }}>
                    <SortHeader label="PLAYER" sortKey="name" currentSort={hitterSort} onSort={toggleSort(false)} align="left" />
                    <SortHeader label="AGE" sortKey="age" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <th className="text-center px-2 py-1">B</th>
                    <SortHeader label="AVG" sortKey="stat1" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <SortHeader label="HR" sortKey="stat2" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <SortHeader label="RBI" sortKey="stat3" currentSort={hitterSort} onSort={toggleSort(false)} />
                    <SortHeader label="OBP" sortKey="stat4" currentSort={hitterSort} onSort={toggleSort(false)} />
                    {showContractCols ? (
                      <SortHeader label="CONTRACT" sortKey="contract" currentSort={hitterSort} onSort={toggleSort(false)} align="left" />
                    ) : (
                      <SortHeader label="SAL" sortKey="salary" currentSort={hitterSort} onSort={toggleSort(false)} />
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
                  <tr className="text-gray-500 text-xs" style={{ borderBottom: '1px solid #1E2A4A' }}>
                    <SortHeader label="PLAYER" sortKey="name" currentSort={pitcherSort} onSort={toggleSort(true)} align="left" />
                    <SortHeader label="AGE" sortKey="age" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <th className="text-center px-2 py-1">T</th>
                    <SortHeader label="W" sortKey="stat1" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <SortHeader label="ERA" sortKey="stat2" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <SortHeader label="IP" sortKey="stat3" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    <SortHeader label="K/9" sortKey="stat4" currentSort={pitcherSort} onSort={toggleSort(true)} />
                    {showContractCols ? (
                      <SortHeader label="CONTRACT" sortKey="contract" currentSort={pitcherSort} onSort={toggleSort(true)} align="left" />
                    ) : (
                      <SortHeader label="SAL" sortKey="salary" currentSort={pitcherSort} onSort={toggleSort(true)} />
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

          {/* Cut Advisor (ACTIVE tab, user team only) */}
          {rosterTab === 'ACTIVE' && isUserTeam && fullRoster && (
            <CutAdvisor
              players={fullRoster.active}
              fortyManCount={fullRoster.fortyManCount}
              onClickPlayer={openPlayer}
            />
          )}

          {filteredPlayers.length === 0 && (
            <div className="text-gray-500 text-xs text-center py-8">No players in this category.</div>
          )}

          {['AAA', 'AA', 'HIGH-A', 'LOW-A', 'ROOKIE', 'INTL'].includes(rosterTab) && filteredPlayers.length > 0 && (
            <ProspectTraitsPanel players={filteredPlayers} />
          )}
        </>
      )}

      {/* Player Detail Side Panel */}
      {detailPlayer && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setDetailPlayer(null)} />
          <PlayerDetailPanel
            player={detailPlayer}
            onClose={() => setDetailPlayer(null)}
            onOpenProfile={openFullProfile}
          />
        </>
      )}
    </div>
  );
}
