import type { SortState } from '../../hooks/useSort';

// ─── SortHeader (for <table> views) ──────────────────────────────────────────

export function SortHeader<K extends string>({
  label,
  sortKey: sk,
  currentSort,
  onSort,
  align,
}: {
  label: string;
  sortKey: K;
  currentSort: SortState<K>;
  onSort: (key: K) => void;
  align?: 'left' | 'right' | 'center';
}) {
  const active = currentSort.key === sk;
  const arrow = active ? (currentSort.dir === 'asc' ? ' ▲' : ' ▼') : '';
  const textAlign = align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right';
  return (
    <th
      scope="col"
      role="button"
      tabIndex={0}
      aria-sort={active ? (currentSort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      aria-label={`Sort by ${label}`}
      className={`${textAlign} px-2 py-1.5 cursor-pointer select-none hover:text-orange-400 transition-colors whitespace-nowrap ${
        active ? 'text-orange-400' : 'text-gray-500'
      } text-xs`}
      onClick={() => onSort(sk)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(sk); } }}
    >
      {label}{arrow}
    </th>
  );
}

// ─── SortPills (for card / chip layouts) ─────────────────────────────────────

export function SortPills<K extends string>({
  keys,
  currentSort,
  onSort,
  compact,
}: {
  keys: { key: K; label: string }[];
  currentSort: SortState<K>;
  onSort: (key: K) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {keys.map(({ key, label }) => {
        const active = currentSort.key === key;
        const arrow = active ? (currentSort.dir === 'asc' ? '▲' : '▼') : '';
        return (
          <button
            key={key}
            onClick={() => onSort(key)}
            className={`${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'} font-bold tracking-wide transition-colors ${
              active
                ? 'text-orange-400 bg-orange-900/40 border border-orange-600'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-gray-700/50'
            }`}
          >
            {label}{active ? ` ${arrow}` : ''}
          </button>
        );
      })}
    </div>
  );
}

// ─── SortSpan (for flex / div-based layouts like Draft) ──────────────────────

export function SortSpan<K extends string>({
  label,
  sortKey: sk,
  currentSort,
  onSort,
  className,
}: {
  label: string;
  sortKey: K;
  currentSort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = currentSort.key === sk;
  const arrow = active ? (currentSort.dir === 'asc' ? '▲' : '▼') : '';
  return (
    <span
      role="button"
      tabIndex={0}
      aria-sort={active ? (currentSort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      className={`cursor-pointer select-none hover:text-orange-400 transition-colors ${
        active ? 'text-orange-400 font-bold' : ''
      } ${className ?? ''}`}
      onClick={() => onSort(sk)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(sk); } }}
    >
      {label}{arrow ? ` ${arrow}` : ''}
    </span>
  );
}
