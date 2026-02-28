import { generateDemoDefShiftAnalysis, getSuccessColor } from '../../engine/analytics/teamDefensiveShiftAnalyzer';

const data = generateDemoDefShiftAnalysis();

export default function DefShiftAnalyzerView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>DEFENSIVE SHIFT ANALYZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Shift effectiveness and positioning analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TOTAL SHIFTS', value: data.totalShifts, color: '#f59e0b' },
          { label: 'SUCCESS RATE', value: `${data.shiftSuccessRate}%`, color: getSuccessColor(data.shiftSuccessRate) },
          { label: 'RUNS PREVENTED', value: data.runsPreventedByShifts, color: '#22c55e' },
          { label: 'LEAGUE RANK', value: `#${data.leagueShiftRank}`, color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>SHIFT SCENARIOS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 80px 50px 50px 50px 70px 60px', gap: 4, marginBottom: 6 }}>
          {['SCENARIO', 'TYPE', 'GB', 'OUTS', 'HITS', 'RUNS SAVED', 'SUCCESS'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.shiftScenarios.map(s => (
          <div key={s.againstBatter} style={{ display: 'grid', gridTemplateColumns: '110px 80px 50px 50px 50px 70px 60px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 600 }}>{s.againstBatter}</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{s.shiftType}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.groundBalls}</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{s.outs}</div>
            <div style={{ fontSize: 10, color: '#ef4444' }}>{s.hits}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#22c55e' }}>+{s.runsPreventedVsNoShift.toFixed(1)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: getSuccessColor(s.successRate) }}>{s.successRate}%</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>POSITION PERFORMANCE IN SHIFTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 110px 70px 60px 65px 70px', gap: 4, marginBottom: 6 }}>
          {['POS', 'PLAYER', 'COMPLY %', 'REACT', 'RANGE', 'RUNS+'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.positionData.map(pd => (
          <div key={pd.position} style={{ display: 'grid', gridTemplateColumns: '40px 110px 70px 60px 65px 70px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{pd.position}</div>
            <div style={{ fontSize: 10, color: '#e5e7eb' }}>{pd.playerName}</div>
            <div style={{ fontSize: 10, color: pd.shiftCompliance >= 90 ? '#22c55e' : '#f59e0b' }}>{pd.shiftCompliance}%</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{pd.reactTime}s</div>
            <div style={{ fontSize: 10, color: pd.rangeWithShift >= 80 ? '#22c55e' : '#f59e0b' }}>{pd.rangeWithShift}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: pd.runsAboveAvgPos >= 0 ? '#22c55e' : '#ef4444' }}>{pd.runsAboveAvgPos > 0 ? '+' : ''}{pd.runsAboveAvgPos}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>SHIFT RECOMMENDATIONS</div>
        {data.shiftRecommendations.map((r, i) => (
          <div key={i} style={{ padding: '6px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{r.scenario}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{r.recommendation}</div>
            <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>{r.expectedBenefit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
