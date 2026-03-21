import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { cn } from '../../lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  /** Initial sorting state */
  initialSorting?: SortingState;
  /** Controlled sorting (overrides internal state) */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Manual sorting — skip internal sort, just show indicators */
  manualSorting?: boolean;
  /** Row click handler */
  onRowClick?: (row: TData) => void;
  /** Function to determine row styling class */
  rowClassName?: (row: TData) => string | undefined;
  /** Custom row style */
  rowStyle?: (row: TData) => React.CSSProperties | undefined;
  /** Optional caption for accessibility */
  caption?: string;
  /** Show striped rows */
  striped?: boolean;
  /** Compact cell padding */
  compact?: boolean;
  /** Sticky first N columns */
  stickyColumns?: number;
  /** Footer row (e.g., totals) */
  footer?: React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional table class */
  className?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DataTable<TData>({
  columns,
  data,
  initialSorting,
  sorting: controlledSorting,
  onSortingChange,
  manualSorting = false,
  onRowClick,
  rowClassName,
  rowStyle,
  caption,
  striped = false,
  compact = false,
  stickyColumns = 0,
  footer,
  emptyMessage = 'No data available.',
  className,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>(
    initialSorting ?? []
  );

  const sorting = controlledSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
  });

  const tdPad = compact ? 'px-1.5 py-0.5' : 'px-2 py-1';
  const thPad = compact ? 'px-1.5 py-1' : 'px-2 py-1.5';

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full whitespace-nowrap" style={{ fontSize: compact ? '11px' : undefined }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr
              key={headerGroup.id}
              className="text-gray-500 text-xs"
              style={{ borderBottom: '1px solid #1E2A4A' }}
            >
              {headerGroup.headers.map((header, colIdx) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const isSticky = colIdx < stickyColumns;

                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      thPad,
                      'select-none transition-colors font-bold uppercase tracking-wider',
                      canSort && 'cursor-pointer hover:text-orange-400',
                      sorted && 'text-orange-400',
                      isSticky && 'sticky bg-gray-950 z-10',
                      header.column.columnDef.meta?.align === 'left' ? 'text-left' : 'text-right',
                    )}
                    style={isSticky ? { left: colIdx === 0 ? 0 : undefined } : undefined}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    aria-sort={
                      sorted === 'asc' ? 'ascending' :
                      sorted === 'desc' ? 'descending' : undefined
                    }
                    aria-label={canSort ? `Sort by ${flexRender(header.column.columnDef.header, header.getContext())}` : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {sorted === 'asc' && ' ▲'}
                    {sorted === 'desc' && ' ▼'}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-gray-500 text-xs text-center py-8"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, rowIdx) => (
              <tr
                key={row.id}
                className={cn(
                  'bloomberg-row text-xs transition-colors',
                  onRowClick && 'cursor-pointer',
                  striped && rowIdx % 2 === 1 && 'bg-white/[0.015]',
                  rowClassName?.(row.original),
                )}
                style={rowStyle?.(row.original)}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell, colIdx) => {
                  const isSticky = colIdx < stickyColumns;
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        tdPad,
                        'tabular-nums',
                        isSticky && 'sticky bg-gray-950',
                        cell.column.columnDef.meta?.align === 'left' ? 'text-left' : 'text-right',
                        cell.column.columnDef.meta?.className,
                      )}
                      style={isSticky ? { left: colIdx === 0 ? 0 : undefined } : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
        {footer && (
          <tfoot>{footer}</tfoot>
        )}
      </table>
    </div>
  );
}

// ─── Helpers for building column defs ──────────────────────────────────────────

/** Create a stat column with optional elite highlighting and formatting */
export function statColumn<TData>(opts: {
  key: string;
  header: string;
  accessorFn: (row: TData) => number;
  format?: (v: number) => string;
  isElite?: (v: number) => boolean;
  isSortColumn?: (row: TData) => boolean;
  sortDescFirst?: boolean;
}): ColumnDef<TData, number> {
  return {
    id: opts.key,
    header: opts.header,
    accessorFn: opts.accessorFn,
    sortDescFirst: opts.sortDescFirst ?? true,
    cell: ({ getValue }) => {
      const val = getValue();
      const elite = opts.isElite?.(val) ?? false;
      const formatted = opts.format ? opts.format(val) : String(val);
      return (
        <span className={cn(elite && 'text-yellow-400 font-bold')}>
          {formatted}
        </span>
      );
    },
    meta: { align: 'right' as const },
  };
}

// Extend TanStack column meta type
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    align?: 'left' | 'right' | 'center';
    className?: string;
  }
}
