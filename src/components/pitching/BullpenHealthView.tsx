import { generateDemoBullpenHealth, getRiskLevelColor, getHealthColor } from '../../engine/pitching/bullpenArmHealthMonitor';

const data = generateDemoBullpenHealth();

export default function BullpenHealthView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>BULLPEN ARM HEALTH MONITOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Workload, fatigue, and availability tracking</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'OVERALL HEALTH', value: data.overallBullpenHealth, color: getHealthColor(data.overallBullpenHealth) },
          { label: 'FRESH ARMS', value: data.freshArms, color: '#22c55e' },
          { label: 'TAXED ARMS', value: data.taxedArms, color: '#f59e0b' },
          { label: 'UNAVAILABLE', value: data.unavailable, color: '#ef4444' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.pitchers.map(p => (
        <div key={p.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10, opacity: p.riskLevel === 'high' ? 0.7 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.role} | {p.throws}HP</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getRiskLevelColor(p.riskLevel), border: `1px solid ${getRiskLevelColor(p.riskLevel)}44` }}>
                {p.riskLevel.toUpperCase()}
              </span>
              <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getHealthColor(p.armHealthScore), border: `1px solid ${getHealthColor(p.armHealthScore)}44` }}>
                HP: {p.armHealthScore}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 8 }}>
            {[
              { label: '3-DAY', value: p.pitchesLast3Days, color: p.pitchesLast3Days > 30 ? '#ef4444' : '#9ca3af' },
              { label: '7-DAY', value: p.pitchesLast7Days, color: p.pitchesLast7Days > 50 ? '#ef4444' : '#9ca3af' },
              { label: '30-DAY', value: p.pitchesLast30Days, color: p.pitchesLast30Days > 170 ? '#ef4444' : '#9ca3af' },
              { label: 'REST', value: `${p.daysRest}d`, color: p.daysRest >= 2 ? '#22c55e' : p.daysRest >= 1 ? '#f59e0b' : '#ef4444' },
              { label: 'VELO Δ', value: `${p.velocityTrend > 0 ? '+' : ''}${p.velocityTrend.toFixed(1)}`, color: p.velocityTrend >= 0 ? '#22c55e' : '#ef4444' },
              { label: 'MAX P', value: p.maxAvailablePitches, color: p.maxAvailablePitches > 0 ? '#22c55e' : '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ padding: 4, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: getRiskLevelColor(p.riskLevel), paddingLeft: 8, borderLeft: `2px solid ${getRiskLevelColor(p.riskLevel)}66` }}>{p.recommendation}</div>
        </div>
      ))}

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>WEEKLY WORKLOAD TREND</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {data.weeklyTrend.map(d => (
            <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: `${Math.max((d.totalPitches / 80) * 100, 2)}%`, background: d.totalPitches > 60 ? '#ef4444' : d.totalPitches > 40 ? '#f59e0b' : '#22c55e', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>{d.day}</div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>{d.totalPitches}p</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
