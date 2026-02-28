import { generateDemoPitchSequenceOpt } from '../../engine/pitching/pitchSequenceOptimizer';

const data = generateDemoPitchSequenceOpt();

export default function PitchSequenceOptView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCH SEQUENCE OPTIMIZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Optimal pitch sequences by count and situation</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TEAM K RATE', value: `${data.teamStrikeoutRate}%`, color: '#22c55e' },
          { label: 'WEAK CONTACT RATE', value: `${data.teamWeakContactRate}%`, color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.plans.map((plan, idx) => (
        <div key={idx} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{plan.pitcherName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>vs {plan.batterName} ({plan.batterHand}HB)</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 10, color: '#22c55e' }}>K Prob: {plan.strikeoutProb}%</span>
              <span style={{ fontSize: 10, color: '#3b82f6' }}>Weak Contact: {plan.weakContactProb}%</span>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 10 }}>Situation: {plan.situation}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '60px 50px 60px 1fr 1fr 70px', gap: 4, marginBottom: 6 }}>
            {['COUNT', 'PITCH', 'VELO', 'LOCATION', 'EXPECTED', 'SUCCESS'].map(h => (
              <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {plan.sequence.map((step, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 50px 60px 1fr 1fr 70px', gap: 4, padding: '6px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{step.count}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{step.recommendedPitch}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{step.velocity} mph</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{step.location}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{step.expectedResult}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: step.successPct >= 50 ? '#22c55e' : step.successPct >= 40 ? '#f59e0b' : '#ef4444' }}>{step.successPct}%</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
