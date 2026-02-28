import { generateDemoRelieverMatchup, getGradeColor, getLeverageColor } from '../../engine/pitching/relieverMatchupEngine';

const data = generateDemoRelieverMatchup();

export default function RelieverMatchupView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>RELIEVER MATCHUP ENGINE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Inning {data.inning} | Score: {data.score} | Leverage: {data.leverage.toUpperCase()}</p>
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>RECOMMENDATION</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>{data.recommendation.relieverName}</div>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>{data.recommendation.reason}</div>
        <div style={{ fontSize: 10, color: '#22c55e', marginTop: 4 }}>Confidence: {data.recommendation.confidence}%</div>
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>AVAILABLE RELIEVERS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 30px 50px 50px 50px 55px 50px 50px', gap: 4, marginBottom: 6 }}>
          {['NAME', 'T', 'ERA', 'WHIP', 'K/9', 'HI-LEV', 'REST', 'GRADE'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.relievers.map(r => (
          <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '100px 30px 50px 50px 50px 55px 50px 50px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', alignItems: 'center', opacity: r.available ? 1 : 0.5 }}>
            <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 600 }}>{r.name}{!r.available ? ' ✕' : ''}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{r.throws}</div>
            <div style={{ fontSize: 10, color: r.era < 3.0 ? '#22c55e' : r.era < 4.0 ? '#f59e0b' : '#ef4444' }}>{r.era.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{r.whip.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: r.kPer9 >= 9 ? '#22c55e' : '#9ca3af' }}>{r.kPer9.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: r.highLeverageERA < 3.0 ? '#22c55e' : '#f59e0b' }}>{r.highLeverageERA.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: r.restDays >= 2 ? '#22c55e' : r.restDays >= 1 ? '#f59e0b' : '#ef4444' }}>{r.restDays}d</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: getGradeColor(r.grade) }}>{r.grade}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>UPCOMING BATTER MATCHUPS</div>
        {data.upcomingBatters.map(b => (
          <div key={b.batterName} style={{ padding: '8px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{b.batterName}</span>
                <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{b.bats}HH | OPS: {b.situationOPS.toFixed(3)}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 6 }}>
              {b.matchupScores.map(ms => (
                <div key={ms.relieverName} style={{ padding: 4, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#6b7280' }}>{ms.relieverName}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ms.score >= 75 ? '#22c55e' : ms.score >= 50 ? '#f59e0b' : '#ef4444' }}>{ms.score}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: '#22c55e' }}>BEST: {b.bestReliever} — {b.bestRelieverAdvantage}</div>
            <div style={{ fontSize: 9, color: '#ef4444' }}>WORST: {b.worstReliever} — {b.worstRelieverRisk}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
