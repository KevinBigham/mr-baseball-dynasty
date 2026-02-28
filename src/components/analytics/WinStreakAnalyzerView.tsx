import { generateDemoWinStreakAnalysis, getStreakColor, getImpactColor } from '../../engine/analytics/winStreakAnalyzer';

const data = generateDemoWinStreakAnalysis();

export default function WinStreakAnalyzerView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>WIN STREAK ANALYZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Current streak analysis and projections</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'CURRENT STREAK', value: `${data.currentStreakLength}${data.currentStreakType === 'winning' ? 'W' : 'L'}`, color: getStreakColor(data.currentStreakType) },
          { label: 'LONGEST WIN', value: `${data.longestWinStreak}W`, color: '#22c55e' },
          { label: 'LONGEST LOSS', value: `${data.longestLoseStreak}L`, color: '#ef4444' },
          { label: 'PROJ END IN', value: `~${data.projectedEnd}G`, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>STREAK GAMES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '50px 60px 60px 120px 1fr', gap: 4, marginBottom: 6 }}>
          {['OPP', 'RESULT', 'WPA', 'MVP', 'KEY PLAY'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.streakGames.map((g, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 60px 60px 120px 1fr', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{g.opponent}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>{g.result}</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{g.winProbAdded > 0 ? '+' : ''}{g.winProbAdded.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#e5e7eb' }}>{g.mvp}</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>{g.keyPlay}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>CONTRIBUTING FACTORS</div>
        {data.contributingFactors.map(f => (
          <div key={f.factor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid #1f2937' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{f.factor}</span>
              <span style={{ fontSize: 10, color: getImpactColor(f.impact), marginLeft: 8, fontWeight: 700 }}>{f.impact.toUpperCase()}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{f.description}</div>
              <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>{f.statChange}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>STREAK vs SEASON</div>
          {data.streakImpact.map(s => (
            <div key={s.stat} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderTop: '1px solid #1f2937' }}>
              <span style={{ fontSize: 10, color: '#6b7280' }}>{s.stat}</span>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>{typeof s.duringStreak === 'number' && s.duringStreak < 1 ? s.duringStreak.toFixed(3) : s.duringStreak.toFixed(2)}</span>
                <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>vs {typeof s.seasonAvg === 'number' && s.seasonAvg < 1 ? s.seasonAvg.toFixed(3) : s.seasonAvg.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>HISTORICAL COMPS</div>
          {data.historicalComps.map((c, i) => (
            <div key={i} style={{ padding: '5px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#3b82f6' }}>{c.season}: {c.streak}-game streak</div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>{c.outcome}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
