import { generateDemoRunScoring, getRunColor } from '../../engine/analytics/runScoringProjector';

const data = generateDemoRunScoring();

export default function RunScoringView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>RUN SCORING PROJECTOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} vs {data.opponent} — Expected run production analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'PROJECTED RUNS', value: data.projectedRuns.toFixed(1), color: getRunColor(data.projectedRuns) },
          { label: 'WIN PROB (OFF)', value: `${data.winProbFromOffense}%`, color: data.winProbFromOffense > 50 ? '#22c55e' : '#ef4444' },
          { label: 'O/U LINE', value: data.overUnder.toFixed(1), color: '#3b82f6' },
          { label: 'OVER PROB', value: `${data.overProbability}%`, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>INNING-BY-INNING PROJECTION</div>
        <div style={{ display: 'grid', gridTemplateColumns: '50px 70px 50px 50px 90px 55px', gap: 4, marginBottom: 6 }}>
          {['INN', 'EXP RUNS', 'HIGH', 'LOW', 'KEY BATTER', 'LEV'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.inningProjections.map(ip => (
          <div key={ip.inning} style={{ display: 'grid', gridTemplateColumns: '50px 70px 50px 50px 90px 55px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>{ip.inning}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: getRunColor(ip.expectedRuns * 9) }}>{ip.expectedRuns.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{ip.highScenario}</div>
            <div style={{ fontSize: 10, color: '#ef4444' }}>{ip.lowScenario}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{ip.keyBatter}</div>
            <div style={{ fontSize: 10, color: ip.leverage >= 60 ? '#ef4444' : ip.leverage >= 40 ? '#f59e0b' : '#6b7280' }}>{ip.leverage}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>LINEUP CONTRIBUTIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '30px 120px 80px 80px 70px', gap: 4, marginBottom: 6 }}>
          {['#', 'PLAYER', 'RUN CONT', 'OBP CONT', 'EXP RBI'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.lineupContributions.map(lc => (
          <div key={lc.slot} style={{ display: 'grid', gridTemplateColumns: '30px 120px 80px 80px 70px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>{lc.slot}</div>
            <div style={{ fontSize: 10, color: '#e5e7eb' }}>{lc.playerName}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: lc.avgRunContribution >= 0.5 ? '#22c55e' : '#9ca3af' }}>{lc.avgRunContribution.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{lc.onBaseContribution.toFixed(3)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{lc.rbiExpected.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
