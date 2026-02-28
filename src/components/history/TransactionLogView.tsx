import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoTransactionLog,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPE_COLORS,
  SIGNIFICANCE_COLORS,
  type TransactionType,
  type TransactionLogData,
  type TransactionEntry,
} from '../../engine/history/transactionLog';

// ── Type Badge ─────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: TransactionType }) {
  const color = TRANSACTION_TYPE_COLORS[type];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 6px',
      fontSize: '9px',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      borderRadius: '3px',
      backgroundColor: color + '22',
      color,
      minWidth: '52px',
      textAlign: 'center',
    }}>
      {TRANSACTION_TYPE_LABELS[type]}
    </span>
  );
}

// ── Significance Dot ───────────────────────────────────────────────────────

function SignificanceDot({ level }: { level: 'major' | 'minor' | 'routine' }) {
  const color = SIGNIFICANCE_COLORS[level];
  return (
    <span style={{
      display: 'inline-block',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: color,
      marginRight: '4px',
    }}
      title={level}
    />
  );
}

// ── Format Currency ────────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  if (amount === 0) return '--';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '+';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs}`;
}

// ── Transaction Row ────────────────────────────────────────────────────────

function TransactionRow({ entry }: { entry: TransactionEntry }) {
  const descColor = entry.significance === 'major' ? '#e5e7eb'
    : entry.significance === 'minor' ? '#9ca3af'
    : '#6b7280';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '8px 12px',
      borderBottom: '1px solid rgba(31, 41, 55, 0.5)',
      fontFamily: 'monospace',
      opacity: entry.significance === 'routine' ? 0.7 : 1,
    }}>
      {/* Date */}
      <div style={{
        width: '72px',
        flexShrink: 0,
        fontSize: '10px',
        color: '#6b7280',
        fontVariantNumeric: 'tabular-nums',
        paddingTop: '2px',
      }}>
        {entry.date}
      </div>

      {/* Significance + Type */}
      <div style={{ width: '70px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <SignificanceDot level={entry.significance} />
        <TypeBadge type={entry.type} />
      </div>

      {/* Description */}
      <div style={{ flex: 1, fontSize: '11px', color: descColor, lineHeight: '1.4' }}>
        {entry.description}
        {entry.significance === 'major' && (
          <span style={{
            marginLeft: '6px',
            padding: '1px 4px',
            fontSize: '8px',
            fontWeight: 'bold',
            borderRadius: '2px',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
          }}>
            MAJOR
          </span>
        )}
      </div>

      {/* Financial Impact */}
      <div style={{
        width: '72px',
        flexShrink: 0,
        textAlign: 'right',
        fontSize: '10px',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: entry.financialImpact !== 0 ? 'bold' : 'normal',
        color: entry.financialImpact > 0 ? '#ef4444' : entry.financialImpact < 0 ? '#22c55e' : '#374151',
      }}>
        {formatMoney(entry.financialImpact)}
      </div>
    </div>
  );
}

// ── Stat Box ───────────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      border: '1px solid #1f2937',
      padding: '8px 14px',
      textAlign: 'center',
      fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

// ── All Transaction Types ──────────────────────────────────────────────────

const ALL_TYPES: TransactionType[] = [
  'trade', 'signing', 'release', 'dfa', 'waiver_claim',
  'option', 'recall', 'extension', 'draft', 'retirement',
];

// ── Main Component ─────────────────────────────────────────────────────────

const DEMO_DATA = generateDemoTransactionLog();

export default function TransactionLogView() {
  const { gameStarted } = useGameStore();
  const [data] = useState<TransactionLogData>(DEMO_DATA);
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all');

  const filtered = useMemo(() => {
    let list = data.transactions;
    if (typeFilter !== 'all') {
      list = list.filter(t => t.type === typeFilter);
    }
    if (seasonFilter !== 'all') {
      list = list.filter(t => t.season === seasonFilter);
    }
    return list;
  }, [data, typeFilter, seasonFilter]);

  const seasons = useMemo(() => {
    const s = new Set(data.transactions.map(t => t.season));
    return [...s].sort((a, b) => b - a);
  }, [data]);

  const totalSpend = useMemo(() => {
    return filtered.reduce((s, t) => s + t.financialImpact, 0);
  }, [filtered]);

  const majorCount = useMemo(() => {
    return filtered.filter(t => t.significance === 'major').length;
  }, [filtered]);

  if (!gameStarted) {
    return <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>Start a game first.</div>;
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{
        margin: '-16px -16px 16px -16px',
        padding: '8px 32px',
        backgroundColor: '#111827',
        borderBottom: '1px solid #f59e0b',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#f59e0b',
        letterSpacing: '0.1em',
      }}>
        TRANSACTION LOG &mdash; {data.teamName.toUpperCase()}
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
        <StatBox label="Total Txns" value={filtered.length} color="#f59e0b" />
        <StatBox label="Major" value={majorCount} color="#eab308" />
        <StatBox label="Net Spend" value={formatMoney(totalSpend)} color={totalSpend > 0 ? '#ef4444' : '#22c55e'} />
        <StatBox label="Seasons" value={seasons.length} color="#94a3b8" />
      </div>

      {/* Season Summary Cards */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {data.seasonSummary.map(s => (
          <div key={s.season} style={{
            border: '1px solid #1f2937',
            padding: '8px 14px',
            fontFamily: 'monospace',
            minWidth: '140px',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>SEASON {s.season}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#4b5563' }}>TXNS</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#d1d5db', fontVariantNumeric: 'tabular-nums' }}>{s.count}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', color: '#4b5563' }}>NET SPEND</div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  fontVariantNumeric: 'tabular-nums',
                  color: s.netSpend > 0 ? '#ef4444' : s.netSpend < 0 ? '#22c55e' : '#6b7280',
                }}>
                  {formatMoney(s.netSpend)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Type Filter */}
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTypeFilter('all')}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: typeFilter === 'all' ? '#d97706' : '#1f2937',
              color: typeFilter === 'all' ? '#000' : '#9ca3af',
            }}
          >
            ALL
          </button>
          {ALL_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: typeFilter === t ? TRANSACTION_TYPE_COLORS[t] : '#1f2937',
                color: typeFilter === t ? '#000' : '#9ca3af',
              }}
            >
              {TRANSACTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', backgroundColor: '#374151' }} />

        {/* Season Filter */}
        <div style={{ display: 'flex', gap: '3px' }}>
          <button
            onClick={() => setSeasonFilter('all')}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: seasonFilter === 'all' ? '#d97706' : '#1f2937',
              color: seasonFilter === 'all' ? '#000' : '#9ca3af',
            }}
          >
            ALL SZN
          </button>
          {seasons.map(s => (
            <button
              key={s}
              onClick={() => setSeasonFilter(s)}
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: seasonFilter === s ? '#d97706' : '#1f2937',
                color: seasonFilter === s ? '#000' : '#9ca3af',
              }}
            >
              SZN {s}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div style={{
        border: '1px solid #1f2937',
        backgroundColor: '#030712',
        maxHeight: '500px',
        overflowY: 'auto',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '6px 12px',
          borderBottom: '1px solid #374151',
          backgroundColor: '#111827',
          fontSize: '9px',
          fontWeight: 'bold',
          color: '#6b7280',
          letterSpacing: '0.05em',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ width: '72px' }}>DATE</div>
          <div style={{ width: '70px' }}>TYPE</div>
          <div style={{ flex: 1 }}>DESCRIPTION</div>
          <div style={{ width: '72px', textAlign: 'right' }}>IMPACT</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#4b5563', fontSize: '11px' }}>
            No transactions match the current filters.
          </div>
        ) : (
          filtered.map(entry => (
            <TransactionRow key={entry.id} entry={entry} />
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px',
        fontSize: '9px',
        color: '#4b5563',
        fontFamily: 'monospace',
      }}>
        <span>Showing {filtered.length} of {data.transactions.length} transactions</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span>
            <SignificanceDot level="major" />
            <span style={{ color: '#f59e0b' }}>Major</span>
          </span>
          <span>
            <SignificanceDot level="minor" />
            <span style={{ color: '#6b7280' }}>Minor</span>
          </span>
          <span>
            <SignificanceDot level="routine" />
            <span style={{ color: '#374151' }}>Routine</span>
          </span>
        </div>
      </div>
    </div>
  );
}
