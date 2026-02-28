import { generateDemoStreakPredictor, getStreakColor } from '../../engine/analytics/streakPredictor';

const data = generateDemoStreakPredictor();

export default function StreakPredictorView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>STREAK PREDICTOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Hot/cold streak analysis and regression probability</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'HOT STREAKERS', value: data.hotStreakers, color: '#ef4444' },
          { label: 'COLD STREAKERS', value: data.coldStreakers, color: '#3b82f6' },
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {p.currentStreak !== 'neutral' && (
                <span style={{ fontSize: 10, color: '#e5e7eb' }}>{p.streakLength} games</span>
              )}
              <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getStreakColor(p.currentStreak), border: `1px solid ${getStreakColor(p.currentStreak)}44`, background: getStreakColor(p.currentStreak) + '15' }}>
                {p.currentStreak.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
            {[
              { label: 'RECENT AVG', value: p.recentAVG.toFixed(3), color: p.recentAVG > p.seasonAVG ? '#22c55e' : '#ef4444' },
              { label: 'SEASON AVG', value: p.seasonAVG.toFixed(3), color: '#9ca3af' },
              { label: 'xBA', value: p.xBA.toFixed(3), color: '#3b82f6' },
              { label: 'DIFF', value: `${p.recentAVG > p.seasonAVG ? '+' : ''}${((p.recentAVG - p.seasonAVG) * 1000).toFixed(0)} pts`, color: p.recentAVG > p.seasonAVG ? '#22c55e' : '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                <span>REGRESSION PROB</span><span>{p.regressionProb}%</span>
              </div>
              <div style={{ height: 6, background: '#1f2937' }}>
                <div style={{ height: '100%', width: `${p.regressionProb}%`, background: '#f59e0b' }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                <span>SUSTAIN PROB</span><span>{p.sustainProb}%</span>
              </div>
              <div style={{ height: 6, background: '#1f2937' }}>
                <div style={{ height: '100%', width: `${p.sustainProb}%`, background: '#22c55e' }} />
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#9ca3af', paddingLeft: 8, borderLeft: '2px solid #f59e0b44' }}>{p.keyFactor}</div>
        </div>
      ))}
    </div>
  );
}
