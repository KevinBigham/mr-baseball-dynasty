import { useState } from 'react';
import { generateDemoFranchiseRecords, type RecordCategory } from '../../engine/history/franchiseRecords';

const board = generateDemoFranchiseRecords();

const CATEGORIES: { key: RecordCategory; label: string }[] = [
  { key: 'batting',     label: 'BATTING' },
  { key: 'pitching',    label: 'PITCHING' },
  { key: 'team',        label: 'TEAM' },
  { key: 'postseason',  label: 'POSTSEASON' },
];

export default function FranchiseRecordsView() {
  const [activeCategory, setActiveCategory] = useState<RecordCategory>('batting');
  const filtered = board.records.filter(r => r.category === activeCategory);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>FRANCHISE RECORDS BOARD</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{board.teamName} &middot; All-time franchise records by statistical category</p>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #374151' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: '8px 18px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
              border: 'none', borderBottom: activeCategory === cat.key ? '2px solid #f59e0b' : '2px solid transparent',
              background: 'transparent', cursor: 'pointer',
              color: activeCategory === cat.key ? '#f59e0b' : '#6b7280',
            }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Record Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
        {filtered.map((rec, ri) => (
          <div key={ri} style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>{rec.statLabel}</span>
              <span style={{ fontSize: 9, color: '#6b7280', border: '1px solid #374151', padding: '1px 6px' }}>{rec.unit}</span>
            </div>

            {rec.entries.map(entry => {
              const isCurrent = entry.current;
              return (
                <div key={entry.rank} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 6px', marginBottom: 2,
                  background: isCurrent ? '#f59e0b11' : 'transparent',
                  borderLeft: isCurrent ? '2px solid #f59e0b' : '2px solid transparent',
                }}>
                  {/* Rank */}
                  <span style={{
                    width: 20, fontSize: 11, fontWeight: 700, textAlign: 'center',
                    color: entry.rank === 1 ? '#f59e0b' : '#6b7280',
                  }}>
                    {entry.rank}
                  </span>

                  {/* Player Name */}
                  <span style={{
                    flex: 1, fontSize: 11,
                    color: isCurrent ? '#f59e0b' : '#e5e7eb',
                    fontWeight: isCurrent ? 700 : 400,
                  }}>
                    {entry.playerName}
                    {isCurrent && (
                      <span style={{
                        marginLeft: 6, fontSize: 8, padding: '1px 5px', fontWeight: 700,
                        background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44',
                        verticalAlign: 'middle',
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </span>

                  {/* Value */}
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: entry.rank === 1 ? '#f59e0b' : '#e5e7eb',
                    minWidth: 50, textAlign: 'right',
                  }}>
                    {typeof entry.value === 'number' ? entry.value : entry.value}
                  </span>

                  {/* Season */}
                  <span style={{ fontSize: 9, color: '#6b7280', minWidth: 36, textAlign: 'right' }}>
                    {entry.season}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 20, borderTop: '1px solid #374151', paddingTop: 10, display: 'flex', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: '#6b7280' }}>Active player on roster</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: '#374151', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: '#6b7280' }}>Historical record holder</span>
        </div>
      </div>
    </div>
  );
}
