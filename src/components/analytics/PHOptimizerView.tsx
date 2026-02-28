import { generateDemoPHOptimizer, getFormColor } from '../../engine/analytics/pinchHitOptimizer';

const data = generateDemoPHOptimizer();

export default function PHOptimizerView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PINCH HIT OPTIMIZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Advanced pinch hit decision engine</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {data.phStats.map(s => (
          <div key={s.stat} style={{ flex: 1, padding: 8, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.stat.toUpperCase()}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {data.scenarios.map((sc, idx) => (
        <div key={idx} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
              INN {sc.inning} | {sc.outs} OUT | {sc.runners} | {sc.score}
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: sc.leverage >= 80 ? '#ef4444' : '#f59e0b', border: `1px solid ${sc.leverage >= 80 ? '#ef4444' : '#f59e0b'}44` }}>
              LEV: {sc.leverage}
            </span>
          </div>

          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>
            Current: {sc.currentBatter} ({sc.currentBatterOPS.toFixed(3)} OPS) vs {sc.opposingPitcher} ({sc.pitcherThrows}HP)
          </div>

          <div style={{ background: '#0a0f1a', border: '1px solid #22c55e44', padding: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>BEST CHOICE: {sc.bestChoice}</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>+{sc.expectedRunIncrease.toFixed(2)} expected runs | +{sc.winProbIncrease}% win prob</div>
          </div>

          {sc.candidates.map(c => (
            <div key={c.playerName} style={{ padding: '6px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>{c.playerName}</span>
                  <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{c.bats}HH | {c.seasonBA.toFixed(3)}/{c.seasonOPS.toFixed(3)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c.matchupScore >= 75 ? '#22c55e' : c.matchupScore >= 50 ? '#f59e0b' : '#ef4444' }}>MATCH: {c.matchupScore}</span>
                  <span style={{ fontSize: 10, color: getFormColor(c.recentForm) }}>{c.recentForm}</span>
                </div>
              </div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>
                vs Pitcher: {c.vsCurrentPitcher.avg.toFixed(3)} ({c.vsCurrentPitcher.pa} PA) | Clutch: {c.clutchRating} | {c.platoonAdvantage ? 'Platoon +' : 'No platoon'}
              </div>
              <div style={{ fontSize: 9, color: c.matchupScore >= 75 ? '#22c55e' : '#6b7280', marginTop: 2 }}>{c.recommendation}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
