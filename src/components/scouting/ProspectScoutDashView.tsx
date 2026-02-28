import { generateDemoProspectScoutDash, getFVColor } from '../../engine/scouting/prospectScoutingDashboard';

const data = generateDemoProspectScoutDash();

export default function ProspectScoutDashView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PROSPECT SCOUTING DASHBOARD</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Comprehensive prospect evaluation and grading</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'SYSTEM RANK', value: `#${data.systemRanking}`, color: data.systemRanking <= 10 ? '#22c55e' : '#f59e0b' },
          { label: 'TOP 100', value: data.top100Count, color: '#3b82f6' },
          { label: 'PROSPECTS SCOUTED', value: data.prospects.length, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.prospects.map(p => (
        <div key={p.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position} | Age {p.age} | {p.level}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: getFVColor(p.overallFV) }}>FV: {p.overallFV}</span>
              <span style={{ fontSize: 10, padding: '2px 6px', color: p.risk === 'low' ? '#22c55e' : p.risk === 'medium' ? '#f59e0b' : p.risk === 'high' ? '#ef4444' : '#a855f7', border: '1px solid', borderColor: p.risk === 'low' ? '#22c55e44' : p.risk === 'medium' ? '#f59e0b44' : '#ef444444' }}>
                {p.risk.toUpperCase()} RISK
              </span>
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>ETA: {p.eta} | Comp: <span style={{ color: '#3b82f6' }}>{p.comp}</span></div>
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 10 }}>{p.summary}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {p.grades.map(g => (
              <div key={g.tool} style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>{g.tool.toUpperCase()}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: getFVColor(g.current) }}>{g.current}</span>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>{'\u2192'}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: getFVColor(g.future) }}>{g.future}</span>
                </div>
                <div style={{ fontSize: 9, color: g.trend === 'up' ? '#22c55e' : g.trend === 'down' ? '#ef4444' : '#6b7280', marginTop: 2 }}>
                  {g.trend === 'up' ? '\u25B2 Rising' : g.trend === 'down' ? '\u25BC Falling' : '\u25C6 Steady'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
