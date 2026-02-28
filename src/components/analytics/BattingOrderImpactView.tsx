import { generateDemoBattingOrderImpact, getEfficiencyColor } from '../../engine/analytics/battingOrderImpact';

const data = generateDemoBattingOrderImpact();

export default function BattingOrderImpactView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>BATTING ORDER IMPACT</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Lineup slot efficiency and optimization analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TOTAL RUNS', value: data.totalRunsScored, color: '#22c55e' },
          { label: 'OPTIMAL PROJ', value: data.optimalProjectedRuns, color: '#3b82f6' },
          { label: 'EFFICIENCY', value: `${data.currentEfficiency.toFixed(1)}%`, color: getEfficiencyColor(data.currentEfficiency) },
          { label: 'GAIN POTENTIAL', value: `+${data.optimalProjectedRuns - data.totalRunsScored}`, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>LINEUP SLOT ANALYSIS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 70px 70px 80px 90px', gap: 4, marginBottom: 8 }}>
          {['SLOT', 'BATTER', 'PA/G', 'wOBA', 'R CONT', 'RBI', 'LEVERAGE', 'OPTIMAL'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.slots.map(s => (
          <div key={s.slot} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 70px 70px 80px 90px', gap: 4, padding: '6px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>#{s.slot}</div>
            <div>
              <div style={{ fontSize: 11, color: '#e5e7eb', fontWeight: 600 }}>{s.currentBatter}</div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{s.position}</div>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.paPerGame.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: '#e5e7eb', fontWeight: 600 }}>{s.wOBA.toFixed(3)}</div>
            <div style={{ fontSize: 11, color: '#22c55e' }}>{s.runsScoredContrib}</div>
            <div style={{ fontSize: 11, color: '#3b82f6' }}>{s.rbiContrib}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.leverage.toFixed(2)}</div>
            <div style={{ fontSize: 11 }}>
              {s.optimalSlot === s.slot ? (
                <span style={{ color: '#22c55e' }}>OPTIMAL</span>
              ) : (
                <span style={{ color: s.impactDelta < -2 ? '#ef4444' : '#f59e0b' }}>
                  Move to #{s.optimalSlot} ({s.impactDelta > 0 ? '+' : ''}{s.impactDelta.toFixed(1)}R)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
