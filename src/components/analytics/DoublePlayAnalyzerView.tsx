import { generateDemoDPAnalysis, getDPGradeColor } from '../../engine/analytics/doublePlayAnalyzer';

const data = generateDemoDPAnalysis();

export default function DoublePlayAnalyzerView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>DOUBLE PLAY ANALYZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — DP efficiency on both sides of the ball</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'DP TURNED', value: data.totalDPTurned, color: '#22c55e' },
          { label: 'CONVERSION %', value: `${data.dpConversionRate}%`, color: '#3b82f6' },
          { label: 'GDP INDUCED', value: data.gdpInduced, color: '#f59e0b' },
          { label: 'LEAGUE RANK', value: `#${data.leagueDPRank}`, color: '#e5e7eb' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>DP OPPORTUNITIES</div>
        {data.dpOpportunities.map(op => (
          <div key={op.situation} style={{ display: 'grid', gridTemplateColumns: '180px 60px 60px 80px 80px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#e5e7eb' }}>{op.situation}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{op.attempts} ATT</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{op.converted} CVT</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: op.conversionRate >= 65 ? '#22c55e' : '#f59e0b' }}>{op.conversionRate}%</div>
            <div style={{ fontSize: 9, color: '#3b82f6' }}>{op.runsPreventedPerDP.toFixed(2)} R/DP</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>INFIELD DP PERFORMANCE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 110px 50px 50px 55px 55px 45px', gap: 4, marginBottom: 6 }}>
          {['POS', 'PLAYER', 'TURNED', 'ATT', 'PIVOT', 'ACC %', 'GRADE'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.infieldPlayers.map(ip => (
          <div key={ip.playerName} style={{ display: 'grid', gridTemplateColumns: '40px 110px 50px 50px 55px 55px 45px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{ip.position}</div>
            <div style={{ fontSize: 10, color: '#e5e7eb' }}>{ip.playerName}</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{ip.dpTurned}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{ip.dpAttempts}</div>
            <div style={{ fontSize: 10, color: ip.pivotSpeed < 0.45 ? '#22c55e' : '#9ca3af' }}>{ip.pivotSpeed}s</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{ip.throwAccuracy}%</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: getDPGradeColor(ip.dpGrade) }}>{ip.dpGrade}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>GDP INDUCERS (PITCHERS)</div>
          {data.pitcherGDPRates.map(p => (
            <div key={p.pitcher} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderTop: '1px solid #1f2937' }}>
              <span style={{ fontSize: 10, color: '#e5e7eb' }}>{p.pitcher}</span>
              <span style={{ fontSize: 10, color: '#22c55e' }}>{p.gdpInduced} GDP ({p.rate}%)</span>
            </div>
          ))}
        </div>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>GDP GROUNDED INTO (HITTERS)</div>
          {data.hitterGDPRates.map(h => (
            <div key={h.hitter} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderTop: '1px solid #1f2937' }}>
              <span style={{ fontSize: 10, color: '#e5e7eb' }}>{h.hitter}</span>
              <span style={{ fontSize: 10, color: h.rate > 15 ? '#ef4444' : '#9ca3af' }}>{h.gdp} GDP ({h.rate}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
