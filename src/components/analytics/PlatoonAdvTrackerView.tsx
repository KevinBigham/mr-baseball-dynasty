import { generateDemoPlatoonAdvTracker, getPlatoonGradeColor } from '../../engine/analytics/platoonAdvTracker';

const data = generateDemoPlatoonAdvTracker();

export default function PlatoonAdvTrackerView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PLATOON ADVANTAGE TRACKER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — L/R split performance and platoon optimization</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TEAM PLATOON ADV', value: `+${(data.teamPlatoonAdvantage * 1000).toFixed(0)} OPS pts`, color: '#22c55e' },
          { label: 'BEST PLATOON PAIR', value: `${data.bestPlatoonPair.player1} / ${data.bestPlatoonPair.player2}`, color: '#f59e0b' },
          { label: 'PAIR OPS vs ' + data.bestPlatoonPair.vs, value: data.bestPlatoonPair.combinedOPS.toFixed(3), color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.playersTracked.map(p => (
        <div key={p.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position} | Bats: {p.hand}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: getPlatoonGradeColor(p.platoonGrade) }}>Grade: {p.platoonGrade}</span>
              <span style={{ fontSize: 10, padding: '2px 8px', background: p.recommendation === 'everyday' ? '#065f46' : p.recommendation === 'start-vs-all' ? '#1e3a5f' : p.recommendation === 'platoon-only' ? '#78350f' : '#7f1d1d', color: '#e5e7eb' }}>
                {p.recommendation.replace(/-/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#0a0f1a', padding: 10, border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>vs LHP ({p.vsLHP.pa} PA)</div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { label: 'AVG', val: p.vsLHP.avg.toFixed(3) },
                  { label: 'OBP', val: p.vsLHP.obp.toFixed(3) },
                  { label: 'SLG', val: p.vsLHP.slg.toFixed(3) },
                  { label: 'OPS', val: p.vsLHP.ops.toFixed(3) },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#0a0f1a', padding: 10, border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>vs RHP ({p.vsRHP.pa} PA)</div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { label: 'AVG', val: p.vsRHP.avg.toFixed(3) },
                  { label: 'OBP', val: p.vsRHP.obp.toFixed(3) },
                  { label: 'SLG', val: p.vsRHP.slg.toFixed(3) },
                  { label: 'OPS', val: p.vsRHP.ops.toFixed(3) },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#9ca3af' }}>
            Platoon Split: <span style={{ color: p.platoonSplit > .100 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>{(p.platoonSplit * 1000).toFixed(0)} OPS pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}
