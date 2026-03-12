/**
 * RosterViews.tsx — Switchable data views + smart filter chips.
 *
 * "The answer to 'too much data' is NOT less data. It's better tools."
 * — Every deep research report
 *
 * DataView: Changes WHICH COLUMNS you see
 * FilterChips: Changes WHOSE DATA you see
 */

import type { RosterPlayer } from '../../types/league';

// ─── Data Views ───────────────────────────────────────────────────────────────

export type DataView = 'overview' | 'batting' | 'pitching' | 'contracts' | 'development';

export const DATA_VIEWS: Array<{ id: DataView; label: string; desc: string }> = [
  { id: 'overview',    label: 'OVERVIEW',    desc: 'OVR, key stats, position' },
  { id: 'batting',     label: 'BATTING',     desc: 'Full hitting stats' },
  { id: 'pitching',    label: 'PITCHING',    desc: 'Full pitching stats' },
  { id: 'contracts',   label: 'CONTRACTS',   desc: 'Salary, years, service time' },
  { id: 'development', label: 'DEVELOPMENT', desc: 'Potential, age curve, traits' },
];

// ─── Filter Chips ─────────────────────────────────────────────────────────────

export interface FilterChip {
  id: string;
  label: string;
  filter: (p: RosterPlayer) => boolean;
  color?: string;
}

export const POSITION_GROUPS: FilterChip[] = [
  { id: 'ALL',     label: 'ALL',     filter: () => true },
  { id: 'IF',      label: 'INFIELD', filter: p => ['C','1B','2B','3B','SS'].includes(p.position) },
  { id: 'OF',      label: 'OUTFIELD',filter: p => ['LF','CF','RF'].includes(p.position) },
  { id: 'DH',      label: 'DH',      filter: p => p.position === 'DH' },
  { id: 'SP',      label: 'STARTERS',filter: p => p.position === 'SP' },
  { id: 'RP',      label: 'BULLPEN', filter: p => ['RP','CL'].includes(p.position) },
];

export const STATUS_FILTERS: FilterChip[] = [
  { id: 'expiring', label: 'EXPIRING', filter: p => p.contractYearsRemaining <= 1, color: '#F43F5E' },
  { id: 'arb',      label: 'ARB ELIGIBLE', filter: p => p.serviceTimeDays >= 516 && p.serviceTimeDays < 1032, color: '#F59E0B' },
  { id: 'fa',       label: 'FA ELIGIBLE',  filter: p => p.serviceTimeDays >= 1032, color: '#F43F5E' },
  { id: 'prospects', label: 'PROSPECTS', filter: p => p.potential - p.overall >= 8 && p.age <= 26, color: '#38BDF8' },
  { id: 'over30',    label: 'AGE 30+', filter: p => p.age >= 30, color: '#F59E0B' },
  { id: 'elite',     label: 'ELITE (80+)', filter: p => p.overall >= 80, color: '#22C55E' },
];

// ─── View Switcher Component ──────────────────────────────────────────────────

interface ViewSwitcherProps {
  activeView: DataView;
  onViewChange: (v: DataView) => void;
}

export function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-1 min-w-max">
      {DATA_VIEWS.map(v => (
        <button
          key={v.id}
          onClick={() => onViewChange(v.id)}
          className={`text-[9px] font-bold tracking-widest px-2.5 py-1.5 sm:py-1 rounded transition-all uppercase whitespace-nowrap ${
            activeView === v.id
              ? 'text-orange-400 bg-orange-500/10 border border-orange-500/30'
              : 'text-gray-500 hover:text-gray-400 border border-transparent hover:border-gray-700'
          }`}
          title={v.desc}
        >
          {v.label}
        </button>
      ))}
      </div>
    </div>
  );
}

// ─── Filter Chips Component ───────────────────────────────────────────────────

interface FilterChipsProps {
  activeFilters: Set<string>;
  onToggle: (id: string) => void;
  chips: FilterChip[];
  label?: string;
}

export function FilterChips({ activeFilters, onToggle, chips, label }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {label && (
        <span className="text-[8px] font-bold tracking-[0.2em] uppercase mr-1" style={{ color: '#64748B' }}>{label}</span>
      )}
      {chips.map(chip => {
        const active = activeFilters.has(chip.id);
        const chipColor = chip.color ?? '#f97316';
        return (
          <button
            key={chip.id}
            onClick={() => onToggle(chip.id)}
            className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full transition-all"
            style={{
              backgroundColor: active ? `${chipColor}18` : 'transparent',
              border: `1px solid ${active ? `${chipColor}50` : '#1E2A4A'}`,
              color: active ? chipColor : '#64748B',
            }}
          >
            {chip.label}
            {active && chip.id !== 'ALL' && (
              <span className="ml-1 opacity-60">✕</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Active Filters Summary ───────────────────────────────────────────────────

interface ActiveFiltersSummaryProps {
  count: number;
  total: number;
  activeFilters: Set<string>;
  onClear: () => void;
}

export function ActiveFiltersSummary({ count, total, activeFilters, onClear }: ActiveFiltersSummaryProps) {
  const hasFilters = activeFilters.size > 0 && !activeFilters.has('ALL');
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] tabular-nums" style={{ color: '#A7B3C7' }}>
        {count} of {total} player{total !== 1 ? 's' : ''}
      </span>
      {hasFilters && (
        <button
          onClick={onClear}
          className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded transition-colors"
          style={{ color: '#F43F5E', border: '1px solid #F43F5E30' }}
        >
          CLEAR FILTERS
        </button>
      )}
    </div>
  );
}

// ─── Column definitions per DataView ──────────────────────────────────────────

export interface ColumnDef {
  key: string;
  label: string;
  align: 'left' | 'right' | 'center';
  getValue: (p: RosterPlayer) => string | number;
  sortable?: boolean;
}

export function getColumnsForView(view: DataView, isPitcher: boolean): ColumnDef[] {
  switch (view) {
    case 'overview':
      return isPitcher ? [
        { key: 'age', label: 'AGE', align: 'right', getValue: p => p.age, sortable: true },
        { key: 'w', label: 'W', align: 'right', getValue: p => p.stats.w ?? '—' },
        { key: 'era', label: 'ERA', align: 'right', getValue: p => p.stats.era ?? '—' },
        { key: 'ip', label: 'IP', align: 'right', getValue: p => p.stats.ip ?? '—' },
        { key: 'sal', label: 'SAL', align: 'right', getValue: p => `$${(p.salary / 1_000_000).toFixed(1)}M` },
      ] : [
        { key: 'age', label: 'AGE', align: 'right', getValue: p => p.age, sortable: true },
        { key: 'avg', label: 'AVG', align: 'right', getValue: p => p.stats.avg ?? '—' },
        { key: 'hr', label: 'HR', align: 'right', getValue: p => p.stats.hr ?? '—' },
        { key: 'rbi', label: 'RBI', align: 'right', getValue: p => p.stats.rbi ?? '—' },
        { key: 'sal', label: 'SAL', align: 'right', getValue: p => `$${(p.salary / 1_000_000).toFixed(1)}M` },
      ];

    case 'batting':
      return [
        { key: 'age', label: 'AGE', align: 'right', getValue: p => p.age },
        { key: 'pa', label: 'PA', align: 'right', getValue: p => p.stats.pa ?? '—' },
        { key: 'avg', label: 'AVG', align: 'right', getValue: p => p.stats.avg ?? '—' },
        { key: 'obp', label: 'OBP', align: 'right', getValue: p => p.stats.obp ?? '—' },
        { key: 'slg', label: 'SLG', align: 'right', getValue: p => p.stats.slg ?? '—' },
        { key: 'hr', label: 'HR', align: 'right', getValue: p => p.stats.hr ?? '—' },
        { key: 'rbi', label: 'RBI', align: 'right', getValue: p => p.stats.rbi ?? '—' },
        { key: 'sb', label: 'SB', align: 'right', getValue: p => p.stats.sb ?? '—' },
        { key: 'k', label: 'K', align: 'right', getValue: p => p.stats.k ?? '—' },
        { key: 'bb', label: 'BB', align: 'right', getValue: p => p.stats.bb ?? '—' },
      ];

    case 'pitching':
      return [
        { key: 'age', label: 'AGE', align: 'right', getValue: p => p.age },
        { key: 'w', label: 'W', align: 'right', getValue: p => p.stats.w ?? '—' },
        { key: 'l', label: 'L', align: 'right', getValue: p => p.stats.l ?? '—' },
        { key: 'era', label: 'ERA', align: 'right', getValue: p => p.stats.era ?? '—' },
        { key: 'ip', label: 'IP', align: 'right', getValue: p => p.stats.ip ?? '—' },
        { key: 'k9', label: 'K/9', align: 'right', getValue: p => p.stats.k9 ?? '—' },
        { key: 'bb9', label: 'BB/9', align: 'right', getValue: p => p.stats.bb9 ?? '—' },
        { key: 'whip', label: 'WHIP', align: 'right', getValue: p => p.stats.whip ?? '—' },
        { key: 'sv', label: 'SV', align: 'right', getValue: p => p.stats.sv ?? '—' },
      ];

    case 'contracts':
      return [
        { key: 'age', label: 'AGE', align: 'right', getValue: p => p.age },
        { key: 'sal', label: 'SALARY', align: 'right', getValue: p => `$${(p.salary / 1_000_000).toFixed(1)}M` },
        { key: 'ctr', label: 'YEARS', align: 'right', getValue: p => `${p.contractYearsRemaining}yr` },
        { key: 'svc', label: 'SERVICE', align: 'right', getValue: p => {
          const y = Math.floor(p.serviceTimeDays / 172);
          const d = p.serviceTimeDays % 172;
          return `${y}.${String(d).padStart(3, '0')}`;
        }},
        { key: 'opt', label: 'OPTIONS', align: 'right', getValue: p => p.optionYearsRemaining },
        { key: 'ovr', label: 'OVR', align: 'right', getValue: p => p.overall },
      ];

    case 'development':
      return [
        { key: 'age', label: 'AGE', align: 'right', getValue: p => p.age },
        { key: 'ovr', label: 'OVR', align: 'right', getValue: p => p.overall },
        { key: 'pot', label: 'POT', align: 'right', getValue: p => p.potential },
        { key: 'gap', label: 'GAP', align: 'right', getValue: p => p.potential - p.overall },
        { key: 'phase', label: 'PHASE', align: 'left', getValue: p =>
          p.age <= 24 ? 'PROSPECT' : p.age <= 28 ? 'ASCENT' : p.age <= 32 ? 'PRIME' : 'DECLINE'
        },
      ];

    default:
      return [];
  }
}
