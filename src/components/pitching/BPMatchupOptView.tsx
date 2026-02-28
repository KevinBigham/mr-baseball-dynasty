import { generateDemoBPOpt } from '../../engine/pitching/bullpenMatchupOpt';

const data = generateDemoBPOpt();

export default function BPMatchupOptView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>BULLPEN MATCHUP OPTIMIZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Optimal reliever selection by batter matchup</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'BULLPEN HEALTH', value: `${data.bullpenHealth}%`, color: data.bullpenHealth >= 70 ? '#22c55e' : data.bullpenHealth >= 50 ? '#f59e0b' : '#ef4444' },
          { label: 'SCENARIOS', value: data.scenarios.length, color: '#e5e7eb' },
          { label: 'AVG LEVERAGE', value: (data.scenarios.reduce((a, s) => a + s.leverage, 0) / data.scenarios.length).toFixed(1), color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {data.scenarios.map((sc, si) => (
        <div key={si} style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700 }}>INNING {sc.inning} — {sc.situation.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: '#e5e7eb', marginTop: 4 }}>
                Facing: <span style={{ fontWeight: 700 }}>{sc.batter}</span>
                <span style={{ color: '#6b7280' }}> ({sc.batterHand}HB)</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: '#6b7280' }}>LEVERAGE</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: sc.leverage >= 4 ? '#ef4444' : sc.leverage >= 3 ? '#f59e0b' : '#3b82f6' }}>{sc.leverage.toFixed(1)}</div>
            </div>
          </div>

          <div style={{ color: '#f59e0b', fontSize: 9, fontWeight: 700, marginBottom: 8 }}>RELIEVER OPTIONS</div>
          {sc.options.map(o => (
            <div key={o.relieverName} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 4, background: '#0a0f1a', border: `1px solid ${o.relieverName === sc.bestChoice ? '#22c55e' : '#1f2937'}` }}>
              <div style={{ width: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>{o.relieverName}</span>
                  <span style={{ fontSize: 9, color: '#6b7280' }}>({o.hand}HP)</span>
                </div>
                {o.relieverName === sc.bestChoice && <span style={{ fontSize: 8, fontWeight: 700, color: '#22c55e' }}>★ RECOMMENDED</span>}
              </div>
              <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                {[
                  { label: 'MATCHUP', value: o.matchupScore, color: o.matchupScore >= 80 ? '#22c55e' : o.matchupScore >= 60 ? '#f59e0b' : '#ef4444' },
                  { label: 'OUT%', value: `${o.vsCurrentBatter}%`, color: '#3b82f6' },
                  { label: 'FATIGUE', value: `${o.fatigue}%`, color: o.fatigue >= 50 ? '#ef4444' : o.fatigue >= 25 ? '#f59e0b' : '#22c55e' },
                  { label: 'ERA', value: o.recentERA.toFixed(2), color: o.recentERA <= 2.5 ? '#22c55e' : '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', width: 55 }}>
                    <div style={{ fontSize: 7, color: '#6b7280' }}>{s.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, fontSize: 9, color: '#9ca3af', fontStyle: 'italic', textAlign: 'right' }}>{o.arsenalFit}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
