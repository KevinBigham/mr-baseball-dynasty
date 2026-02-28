import { generateDemoHitterApproach, getApproachColor } from '../../engine/analytics/hitterApproachProfiler';

const data = generateDemoHitterApproach();

export default function HitterApproachView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>HITTER APPROACH PROFILER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Approach breakdown by zone and count</p>
      </div>

      {data.hitters.map(h => (
        <div key={h.playerName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{h.playerName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{h.position}</span>
            </div>
            <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{h.overallApproach}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'CHASE RATE', value: `${h.chaseRate}%`, color: h.chaseRate < 25 ? '#22c55e' : '#ef4444' },
              { label: 'ZONE CONTACT', value: `${h.zoneContactRate}%`, color: h.zoneContactRate > 85 ? '#22c55e' : '#f59e0b' },
              { label: '1ST PITCH SWING', value: `${h.firstPitchSwingRate}%`, color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>ZONE MAP</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 10 }}>
            {h.zones.map(z => (
              <div key={z.zone} style={{ padding: 6, background: '#0a0f1a', border: `1px solid ${getApproachColor(z.label)}44` }}>
                <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{z.zone}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: getApproachColor(z.label) }}>{z.wOBA.toFixed(3)} wOBA</div>
                <div style={{ fontSize: 9, color: '#9ca3af' }}>Sw: {z.swingRate}% | Wh: {z.whiffRate}% | EV: {z.avgExitVelo}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>COUNT APPROACHES</div>
          <div style={{ display: 'grid', gridTemplateColumns: '50px 80px 70px 70px 70px', gap: 4, marginBottom: 4 }}>
            {['COUNT', 'APPROACH', 'SW%', 'CONTACT', 'SLG'].map(h2 => (
              <div key={h2} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h2}</div>
            ))}
          </div>
          {h.countApproaches.map(c => (
            <div key={c.count} style={{ display: 'grid', gridTemplateColumns: '50px 80px 70px 70px 70px', gap: 4, padding: '3px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{c.count}</div>
              <div style={{ fontSize: 10, color: c.approach === 'aggressive' ? '#ef4444' : c.approach === 'patient' ? '#22c55e' : '#9ca3af' }}>{c.approach}</div>
              <div style={{ fontSize: 10, color: '#e5e7eb' }}>{c.swingRate}%</div>
              <div style={{ fontSize: 10, color: '#e5e7eb' }}>{c.contactRate}%</div>
              <div style={{ fontSize: 10, color: '#e5e7eb' }}>{c.slugging.toFixed(3)}</div>
            </div>
          ))}

          <div style={{ marginTop: 8, paddingLeft: 8, borderLeft: '2px solid #f59e0b66' }}>
            {h.tendencies.map((t, i) => (
              <div key={i} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{t}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
