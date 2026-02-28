import { generateDemoChemistryWeb, getLinkColor, getRoleColor } from '../../engine/analytics/teamChemistryWeb';

const data = generateDemoChemistryWeb();

export default function TeamChemistryWebView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TEAM CHEMISTRY WEB</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Player relationships and clubhouse dynamics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'OVERALL CHEMISTRY', value: data.overallChemistry, color: data.overallChemistry >= 70 ? '#22c55e' : '#f59e0b' },
          { label: 'CHEMISTRY GRADE', value: data.chemGrade, color: '#f59e0b' },
          { label: 'CONNECTIONS', value: data.links.length, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Player nodes */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>PLAYER CHEMISTRY PROFILES</div>
          {data.nodes.map(n => (
            <div key={n.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 4, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{n.name}</div>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{n.position} | {n.connections} connections</div>
              </div>
              <div style={{ textAlign: 'center', width: 50 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: n.chemScore >= 70 ? '#22c55e' : n.chemScore >= 50 ? '#f59e0b' : '#ef4444' }}>{n.chemScore}</div>
                <div style={{ fontSize: 7, color: '#6b7280' }}>CHEM</div>
              </div>
              <span style={{ padding: '2px 6px', fontSize: 9, fontWeight: 700, background: getRoleColor(n.role) + '22', color: getRoleColor(n.role) }}>
                {n.role.toUpperCase()}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 9, flexWrap: 'wrap' }}>
            {['leader', 'connector', 'glue-guy', 'disruptor', 'loner'].map(r => (
              <span key={r} style={{ color: getRoleColor(r) }}>● {r.toUpperCase()}</span>
            ))}
          </div>
        </div>

        {/* Relationship links */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>RELATIONSHIP LINKS</div>
          {data.links.map((l, i) => (
            <div key={i} style={{ padding: '8px 10px', marginBottom: 6, background: '#0a0f1a', border: `1px solid ${getLinkColor(l.type)}33` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: '#e5e7eb' }}>
                  <span style={{ fontWeight: 600 }}>{l.player1}</span>
                  <span style={{ color: '#6b7280', margin: '0 6px' }}>↔</span>
                  <span style={{ fontWeight: 600 }}>{l.player2}</span>
                </div>
                <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: getLinkColor(l.type) + '22', color: getLinkColor(l.type) }}>
                  {l.type.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: '#9ca3af', fontStyle: 'italic' }}>{l.reason}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: l.strength >= 0 ? '#22c55e' : '#ef4444' }}>
                  {l.strength > 0 ? '+' : ''}{l.strength}
                </span>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 9, flexWrap: 'wrap' }}>
            {['mentor', 'friend', 'rival', 'tension', 'neutral'].map(t => (
              <span key={t} style={{ color: getLinkColor(t) }}>● {t.toUpperCase()}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
