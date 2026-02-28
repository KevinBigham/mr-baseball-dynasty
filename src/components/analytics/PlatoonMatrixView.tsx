import { useState } from 'react';
import { generateDemoPlatoonMatrix, type PlatoonAdvantagePlayer, type HandSplit } from '../../engine/analytics/platoonMatchupMatrix';

const data = generateDemoPlatoonMatrix();

const recBadge: Record<PlatoonAdvantagePlayer['recommendation'], { label: string; color: string }> = {
  everyday: { label: 'EVERYDAY', color: '#22c55e' },
  platoon_strong: { label: 'PLATOON+', color: '#f59e0b' },
  platoon_weak: { label: 'PLATOON-', color: '#a855f7' },
  bench: { label: 'BENCH', color: '#ef4444' },
};

export default function PlatoonMatrixView() {
  const [sortBy, setSortBy] = useState<'delta' | 'name'>('delta');
  const [viewHand, setViewHand] = useState<HandSplit | 'both'>('both');

  const sorted = [...data].sort((a, b) =>
    sortBy === 'delta' ? b.platoonDelta - a.platoonDelta : a.name.localeCompare(b.name)
  );

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PLATOON MATCHUP MATRIX</h2>
          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Platoon split analysis with lineup optimization recommendations</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['both', 'vs_LHP', 'vs_RHP'] as const).map(h => (
            <button key={h} onClick={() => setViewHand(h)}
              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', border: '1px solid', borderColor: viewHand === h ? '#f59e0b' : '#374151', background: viewHand === h ? '#78350f' : 'transparent', color: viewHand === h ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
              {h === 'both' ? 'BOTH' : h === 'vs_LHP' ? 'vs LHP' : 'vs RHP'}
            </button>
          ))}
          <button onClick={() => setSortBy(sortBy === 'delta' ? 'name' : 'delta')}
            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', border: '1px solid #374151', background: 'transparent', color: '#9ca3af', cursor: 'pointer' }}>
            SORT: {sortBy === 'delta' ? 'DELTA' : 'NAME'}
          </button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>PLAYER</th>
            <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>POS</th>
            <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>BATS</th>
            {(viewHand === 'both' || viewHand === 'vs_LHP') && <>
              <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>AVG vL</th>
              <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>OPS vL</th>
              <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>wRC+ vL</th>
            </>}
            {(viewHand === 'both' || viewHand === 'vs_RHP') && <>
              <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>AVG vR</th>
              <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>OPS vR</th>
              <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>wRC+ vR</th>
            </>}
            <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>DELTA</th>
            <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>REC</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => {
            const vsL = p.splits.find(s => s.hand === 'vs_LHP')!;
            const vsR = p.splits.find(s => s.hand === 'vs_RHP')!;
            const badge = recBadge[p.recommendation];
            return (
              <tr key={p.playerId} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '6px 8px', color: '#e5e7eb', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', color: '#9ca3af' }}>{p.position}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', color: '#9ca3af' }}>{p.bats}</td>
                {(viewHand === 'both' || viewHand === 'vs_LHP') && <>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: vsL.avg >= 0.280 ? '#22c55e' : vsL.avg < 0.220 ? '#ef4444' : '#e5e7eb' }}>{vsL.avg.toFixed(3)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: vsL.ops >= 0.800 ? '#22c55e' : vsL.ops < 0.650 ? '#ef4444' : '#e5e7eb' }}>{vsL.ops.toFixed(3)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: vsL.wRC_plus >= 120 ? '#22c55e' : vsL.wRC_plus < 80 ? '#ef4444' : '#e5e7eb' }}>{vsL.wRC_plus}</td>
                </>}
                {(viewHand === 'both' || viewHand === 'vs_RHP') && <>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: vsR.avg >= 0.280 ? '#22c55e' : vsR.avg < 0.220 ? '#ef4444' : '#e5e7eb' }}>{vsR.avg.toFixed(3)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: vsR.ops >= 0.800 ? '#22c55e' : vsR.ops < 0.650 ? '#ef4444' : '#e5e7eb' }}>{vsR.ops.toFixed(3)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: vsR.wRC_plus >= 120 ? '#22c55e' : vsR.wRC_plus < 80 ? '#ef4444' : '#e5e7eb' }}>{vsR.wRC_plus}</td>
                </>}
                <td style={{ padding: '6px 8px', textAlign: 'center', color: p.platoonDelta > 0.100 ? '#f59e0b' : '#9ca3af', fontWeight: 700 }}>{p.platoonDelta.toFixed(3)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <span style={{ padding: '2px 6px', fontSize: 10, fontWeight: 700, background: badge.color + '22', color: badge.color, border: `1px solid ${badge.color}44` }}>
                    {badge.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 20, padding: 12, border: '1px solid #374151', background: '#111827' }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>OPTIMIZATION NOTES</div>
        {sorted.filter(p => p.recommendation !== 'everyday').slice(0, 4).map(p => (
          <div key={p.playerId} style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
            <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{p.name}</span>: {p.optimalRole}
          </div>
        ))}
      </div>
    </div>
  );
}
