import { generateDemoTeamMorale, getMoraleColor } from '../../engine/analytics/teamMoraleTracker';

const data = generateDemoTeamMorale();

export default function TeamMoraleView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TEAM MORALE TRACKER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Clubhouse mood and player satisfaction</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TEAM MORALE', value: `${data.teamMorale}%`, color: getMoraleColor(data.teamMorale) },
          { label: 'TREND', value: data.moraleTrend.toUpperCase(), color: data.moraleTrend === 'rising' ? '#22c55e' : data.moraleTrend === 'falling' ? '#ef4444' : '#f59e0b' },
          { label: 'AT RISK', value: data.atRiskCount, color: data.atRiskCount > 0 ? '#ef4444' : '#22c55e' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 10 }}>PLAYER MORALE</div>
        {data.players.map(p => (
          <div key={p.name} style={{ padding: '8px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
                <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position}</span>
                {p.riskOfIssue && <span style={{ fontSize: 9, color: '#ef4444', marginLeft: 8 }}>AT RISK</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: p.trend === 'rising' ? '#22c55e' : p.trend === 'falling' ? '#ef4444' : '#6b7280' }}>
                  {p.trend === 'rising' ? '\u25B2' : p.trend === 'falling' ? '\u25BC' : '\u25C6'} {p.trend}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: getMoraleColor(p.morale) }}>{p.morale}%</span>
              </div>
            </div>
            <div style={{ height: 6, background: '#1f2937', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${p.morale}%`, background: getMoraleColor(p.morale) }} />
            </div>
            <div style={{ fontSize: 9, color: '#6b7280' }}>
              {p.factors.map((f, i) => <span key={i}>{i > 0 ? ' | ' : ''}{f}</span>)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 10 }}>RECENT EVENTS</div>
        {data.recentEvents.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: i > 0 ? '1px solid #1f2937' : 'none' }}>
            <div style={{ width: 50, fontSize: 10, color: '#6b7280' }}>{e.date}</div>
            <div style={{ flex: 1, fontSize: 11, color: '#e5e7eb' }}>{e.event}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: e.impact > 0 ? '#22c55e' : '#ef4444' }}>
              {e.impact > 0 ? '+' : ''}{e.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
