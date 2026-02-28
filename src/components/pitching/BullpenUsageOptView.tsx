import { generateDemoBullpenUsageOpt, getAvailabilityColor } from '../../engine/pitching/bullpenUsageOptimizer';

const data = generateDemoBullpenUsageOpt();

export default function BullpenUsageOptView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>BULLPEN USAGE OPTIMIZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} vs {data.seriesOpponent} — Series deployment plan</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'BP HEALTH SCORE', value: `${data.bullpenHealthScore}%`, color: data.bullpenHealthScore >= 70 ? '#22c55e' : '#f59e0b' },
          { label: 'AVAILABLE ARMS', value: data.relievers.filter(r => r.available).length + '/' + data.relievers.length, color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>RELIEVER AVAILABILITY</div>
        {data.relievers.map(r => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: getAvailabilityColor(r.available, r.fatigueLevel) }} />
            <div style={{ width: 140, fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{r.name}</div>
            <div style={{ width: 30, fontSize: 10, color: '#6b7280' }}>{r.role}</div>
            <div style={{ width: 50, fontSize: 10, color: r.available ? '#22c55e' : '#ef4444' }}>{r.available ? 'AVAIL' : 'OUT'}</div>
            <div style={{ width: 60, fontSize: 10, color: '#9ca3af' }}>Fat: {r.fatigueLevel}%</div>
            <div style={{ flex: 1, fontSize: 9, color: '#6b7280' }}>{r.optimalUsage}</div>
          </div>
        ))}
      </div>

      {data.gamePlans.map(gp => (
        <div key={gp.game} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Game {gp.game} vs {gp.opponent}</span>
            <span style={{ fontSize: 10, color: '#6b7280' }}>Starter: {gp.startingPitcher} ({gp.projectedLength} IP proj)</span>
          </div>
          {gp.plan.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ width: 50, fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>Inn {p.inning}</div>
              <div style={{ flex: 1, fontSize: 11, color: '#e5e7eb' }}>{p.reliever}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>Limit: {p.pitchLimit} pitches</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
