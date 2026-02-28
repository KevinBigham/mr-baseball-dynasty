import { useState } from 'react';
import { generateDemoBvPHistory, getBvPSummary, type BvPMatchup } from '../../engine/analytics/batterVsPitcherHistory';

const data = generateDemoBvPHistory();
const summary = getBvPSummary(data);

const batters = [...new Set(data.map(m => m.batterName))];
const pitchers = [...new Set(data.map(m => m.pitcherName))];

const edgeColor: Record<string, string> = { batter: '#22c55e', pitcher: '#ef4444', even: '#f59e0b' };

export default function BvPHistoryView() {
  const [filterBatter, setFilterBatter] = useState<string | null>(null);
  const [filterPitcher, setFilterPitcher] = useState<string | null>(null);

  const filtered = data.filter(m =>
    (!filterBatter || m.batterName === filterBatter) &&
    (!filterPitcher || m.pitcherName === filterPitcher)
  );

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>BATTER vs PITCHER HISTORY</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Head-to-head matchup statistics and edge analysis</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TOTAL MATCHUPS', value: String(summary.totalMatchups), color: '#f59e0b' },
          { label: 'BATTER EDGE', value: String(summary.batterDominated), color: '#22c55e' },
          { label: 'PITCHER EDGE', value: String(summary.pitcherDominated), color: '#ef4444' },
          { label: 'HIGHEST OPS', value: `${summary.highestOPS.ops.toFixed(3)}`, color: '#22c55e' },
          { label: 'LOWEST OPS', value: `${summary.lowestOPS.ops.toFixed(3)}`, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>FILTER BY BATTER</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={() => setFilterBatter(null)}
              style={{ padding: '3px 8px', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: !filterBatter ? '#f59e0b' : '#374151', background: !filterBatter ? '#78350f' : 'transparent', color: !filterBatter ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
              ALL
            </button>
            {batters.map(b => (
              <button key={b} onClick={() => setFilterBatter(b)}
                style={{ padding: '3px 8px', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: filterBatter === b ? '#f59e0b' : '#374151', background: filterBatter === b ? '#78350f' : 'transparent', color: filterBatter === b ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
                {b.split(' ').pop()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>FILTER BY PITCHER</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={() => setFilterPitcher(null)}
              style={{ padding: '3px 8px', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: !filterPitcher ? '#f59e0b' : '#374151', background: !filterPitcher ? '#78350f' : 'transparent', color: !filterPitcher ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
              ALL
            </button>
            {pitchers.map(p => (
              <button key={p} onClick={() => setFilterPitcher(p)}
                style={{ padding: '3px 8px', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: filterPitcher === p ? '#f59e0b' : '#374151', background: filterPitcher === p ? '#78350f' : 'transparent', color: filterPitcher === p ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
                {p.split(' ').pop()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            {['BATTER', 'PITCHER', 'PA', 'H', 'HR', 'BB', 'K', 'AVG', 'SLG', 'OPS', 'EDGE'].map(h => (
              <th key={h} style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700, textAlign: h === 'BATTER' || h === 'PITCHER' ? 'left' : 'center' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.sort((a, b) => b.ops - a.ops).map((m, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '6px 8px', color: '#e5e7eb', fontWeight: 600 }}>{m.batterName}</td>
              <td style={{ padding: '6px 8px', color: '#9ca3af' }}>{m.pitcherName}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#6b7280' }}>{m.pa}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#e5e7eb' }}>{m.hits}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: m.hr > 0 ? '#f59e0b' : '#6b7280' }}>{m.hr}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#9ca3af' }}>{m.bb}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: m.k > 5 ? '#ef4444' : '#9ca3af' }}>{m.k}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: m.avg >= 0.300 ? '#22c55e' : '#e5e7eb', fontWeight: 700 }}>{m.avg.toFixed(3)}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: m.slg >= 0.500 ? '#22c55e' : '#e5e7eb' }}>{m.slg.toFixed(3)}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: m.ops >= 0.850 ? '#22c55e' : m.ops <= 0.600 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                {m.ops.toFixed(3)}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: edgeColor[m.edge] + '22', color: edgeColor[m.edge], border: `1px solid ${edgeColor[m.edge]}44` }}>
                  {m.edge.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
