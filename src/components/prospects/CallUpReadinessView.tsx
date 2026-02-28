import { generateDemoCallUpReadiness, getReadinessColor, getRecColor } from '../../engine/prospects/prospectCallUpReadiness';

const data = generateDemoCallUpReadiness();

export default function CallUpReadinessView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PROSPECT CALL-UP READINESS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Next window: {data.nextCallUpWindow}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'CANDIDATES', value: data.candidates.length, color: '#f59e0b' },
          { label: 'READY NOW', value: data.candidates.filter(c => c.recommendation === 'ready-now').length, color: '#22c55e' },
          { label: 'NEXT WINDOW', value: data.nextCallUpWindow, color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.candidates.map(c => (
        <div key={c.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{c.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{c.position} | Age {c.age} | {c.level}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: getReadinessColor(c.overallReadiness) }}>{c.overallReadiness}%</span>
              <span style={{ fontSize: 10, padding: '2px 8px', background: getRecColor(c.recommendation) + '22', color: getRecColor(c.recommendation), border: `1px solid ${getRecColor(c.recommendation)}44` }}>
                {c.recommendation.replace(/-/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>ETA: {c.eta}</div>

          <div style={{ marginBottom: 10 }}>
            {c.metrics.map(m => (
              <div key={m.category} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 120, fontSize: 10, color: '#9ca3af' }}>{m.category}</div>
                <div style={{ flex: 1, height: 8, background: '#1f2937', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${m.score}%`, background: m.passed ? '#22c55e' : '#ef4444' }} />
                  <div style={{ position: 'absolute', left: `${m.threshold}%`, top: -2, bottom: -2, width: 2, background: '#f59e0b' }} />
                </div>
                <div style={{ width: 30, fontSize: 10, fontWeight: 700, color: m.passed ? '#22c55e' : '#ef4444', textAlign: 'right' }}>{m.score}</div>
                <div style={{ width: 14, fontSize: 10 }}>{m.passed ? '\u2713' : '\u2717'}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: '#0a0f1a', padding: 8, border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>STRENGTHS</div>
              {c.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>+ {s}</div>
              ))}
            </div>
            <div style={{ background: '#0a0f1a', padding: 8, border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>CONCERNS</div>
              {c.concerns.map((cn, i) => (
                <div key={i} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>- {cn}</div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
