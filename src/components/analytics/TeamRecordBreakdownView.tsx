import { useState } from 'react';
import { generateDemoTeamRecordBreakdown, getRecordColor, getTeamRecordSummary } from '../../engine/analytics/teamRecordBreakdown';

const data = generateDemoTeamRecordBreakdown();
const summary = getTeamRecordSummary(data);

const categories = [...new Set(data.splits.map(s => s.category))];
const categoryLabels: Record<string, string> = {
  venue: 'VENUE', time: 'TIME', opponent: 'OPPONENT', quality: 'QUALITY',
  margin: 'MARGIN', extras: 'EXTRAS', month: 'MONTHLY', streak: 'STREAK',
};

export default function TeamRecordBreakdownView() {
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const filtered = filterCat ? data.splits.filter(s => s.category === filterCat) : data.splits;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TEAM RECORD BREAKDOWN</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — {data.totalWins}-{data.totalLosses} ({data.totalPct.toFixed(3)})</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'OVERALL', value: `${data.totalWins}-${data.totalLosses}`, color: getRecordColor(data.totalPct) },
          { label: 'WIN PCT', value: data.totalPct.toFixed(3), color: getRecordColor(data.totalPct) },
          { label: 'STRENGTHS', value: String(summary.strengths), color: '#22c55e' },
          { label: 'WEAKNESSES', value: String(summary.weaknesses), color: '#ef4444' },
          { label: 'BEST SPLIT', value: `${summary.bestLabel} (${summary.bestPct.toFixed(3)})`, color: '#22c55e' },
          { label: 'CLUTCH', value: `${data.clutchRecord.wins}-${data.clutchRecord.losses}`, color: getRecordColor(data.clutchRecord.pct) },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterCat(null)}
          style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: !filterCat ? '#f59e0b' : '#374151', background: !filterCat ? '#78350f' : 'transparent', color: !filterCat ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
          ALL
        </button>
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: filterCat === c ? '#f59e0b' : '#374151', background: filterCat === c ? '#78350f' : 'transparent', color: filterCat === c ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {categoryLabels[c] ?? c.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Table */}
        <div style={{ border: '1px solid #374151', background: '#111827' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #374151', color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>RECORD SPLITS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['SPLIT', 'W', 'L', 'PCT', 'BAR'].map(h => (
                  <th key={h} style={{ padding: '4px 8px', color: '#6b7280', fontWeight: 700, textAlign: h === 'SPLIT' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '4px 8px', color: '#e5e7eb', fontWeight: 600 }}>{s.label}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#22c55e' }}>{s.wins}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#ef4444' }}>{s.losses}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: getRecordColor(s.pct), fontWeight: 700 }}>{s.pct.toFixed(3)}</td>
                  <td style={{ padding: '4px 8px' }}>
                    <div style={{ height: 8, background: '#1f2937', borderRadius: 2, position: 'relative' }}>
                      <div style={{ width: `${s.pct * 100}%`, height: '100%', borderRadius: 2, background: getRecordColor(s.pct) }} />
                      <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: '#374151' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual breakdown */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>WIN % BY SPLIT</div>
          {data.splits.sort((a, b) => b.pct - a.pct).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 100, fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
              <div style={{ flex: 1, height: 10, background: '#1f2937', borderRadius: 2 }}>
                <div style={{ width: `${s.pct * 100}%`, height: '100%', borderRadius: 2, background: getRecordColor(s.pct) }} />
              </div>
              <div style={{ width: 40, fontSize: 10, color: getRecordColor(s.pct), fontWeight: 700, textAlign: 'right' }}>{s.pct.toFixed(3)}</div>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>KEY INSIGHT</div>
            <div style={{ fontSize: 11, color: '#e5e7eb' }}>
              Best performance in <span style={{ color: '#22c55e', fontWeight: 700 }}>{summary.bestLabel}</span> ({summary.bestPct.toFixed(3)}).
              Struggles in <span style={{ color: '#ef4444', fontWeight: 700 }}>{summary.worstLabel}</span> ({summary.worstPct.toFixed(3)}).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
