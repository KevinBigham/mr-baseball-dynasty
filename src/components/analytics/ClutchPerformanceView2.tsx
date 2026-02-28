import { generateDemoClutchPerformanceIndex, getCPIColor } from '../../engine/analytics/clutchPerformanceIndex2';

const data = generateDemoClutchPerformanceIndex();

export default function ClutchPerformanceView2() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>CLUTCH PERFORMANCE INDEX</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Context-aware pressure performance</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TEAM CPI', value: data.teamCPI, color: getCPIColor(data.teamCPI) },
          { label: 'CLUTCH RANK', value: `#${data.teamClutchRank}`, color: data.teamClutchRank <= 10 ? '#22c55e' : '#f59e0b' },
          { label: 'PLAYERS TRACKED', value: data.players.length, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.players.map(p => (
        <div key={p.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position} | #{p.rank}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: p.trend === 'rising' ? '#22c55e' : p.trend === 'falling' ? '#ef4444' : '#6b7280' }}>
                {p.trend === 'rising' ? '\u25B2' : p.trend === 'falling' ? '\u25BC' : '\u25C6'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: getCPIColor(p.overallCPI) }}>{p.overallCPI}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: getCPIColor(p.overallCPI) }}>{p.cpiGrade}</span>
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#3b82f6', marginBottom: 8 }}>{p.bestMoment}</div>

          {p.situations.map(s => (
            <div key={s.situation} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ width: 130, fontSize: 10, color: '#f59e0b' }}>{s.situation}</div>
              <div style={{ width: 50, fontSize: 10, color: '#6b7280' }}>{s.opportunities} opp</div>
              <div style={{ width: 50, fontSize: 10, fontWeight: 600, color: s.successRate >= 30 ? '#22c55e' : '#9ca3af' }}>{s.successRate}%</div>
              <div style={{ width: 60, fontSize: 10, fontWeight: 700, color: s.wpa > 0 ? '#22c55e' : '#ef4444' }}>{s.wpa > 0 ? '+' : ''}{s.wpa.toFixed(2)} WPA</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>LI: {s.leverage.toFixed(1)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
