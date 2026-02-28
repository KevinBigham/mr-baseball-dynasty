import { generateDemoFatiguePredictor, getFatigueColor, getRiskColor } from '../../engine/pitching/pitcherFatiguePredictor';

const data = generateDemoFatiguePredictor();

export default function PitcherFatigueView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCHER FATIGUE PREDICTOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Workload monitoring and performance decline prediction</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TEAM AVG FATIGUE', value: `${data.teamAvgFatigue}%`, color: getFatigueColor(data.teamAvgFatigue) },
          { label: 'OVERWORKED', value: data.overworkedCount, color: data.overworkedCount > 0 ? '#ef4444' : '#22c55e' },
          { label: 'PITCHERS TRACKED', value: data.pitchers.length, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.pitchers.map(p => (
        <div key={p.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.role}</span>
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getRiskColor(p.riskLevel), border: `1px solid ${getRiskColor(p.riskLevel)}44`, background: getRiskColor(p.riskLevel) + '15' }}>
              {p.riskLevel.toUpperCase()} RISK
            </span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
              <span>FATIGUE LEVEL</span><span>{p.fatigueLevel}%</span>
            </div>
            <div style={{ height: 8, background: '#1f2937', position: 'relative' }}>
              <div style={{ height: '100%', width: `${p.fatigueLevel}%`, background: getFatigueColor(p.fatigueLevel), transition: 'width 0.3s' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
            {[
              { label: 'IP', value: p.inningsPitched.toFixed(1) },
              { label: 'PITCHES', value: p.pitchCount.toLocaleString() },
              { label: 'AVG/OUT', value: p.avgPitchesPerOuting },
              { label: 'VELO DROP', value: `-${p.velocityDrop.toFixed(1)} mph`, color: p.velocityDrop > 1.5 ? '#ef4444' : '#f59e0b' },
              { label: 'IP LEFT', value: p.projectedInningsLeft },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.color || '#e5e7eb' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 10 }}>
            <span>ERA (30d): <span style={{ color: p.eraLast30 > p.eraSeason ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{p.eraLast30.toFixed(2)}</span></span>
            <span>ERA (Season): <span style={{ color: '#9ca3af', fontWeight: 700 }}>{p.eraSeason.toFixed(2)}</span></span>
          </div>

          <div style={{ fontSize: 10, color: '#9ca3af', paddingLeft: 8, borderLeft: `2px solid ${getRiskColor(p.riskLevel)}66` }}>{p.recommendation}</div>
        </div>
      ))}
    </div>
  );
}
