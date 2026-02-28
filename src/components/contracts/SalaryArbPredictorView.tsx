import { generateDemoSalaryArbPredictor, getArbRecColor } from '../../engine/contracts/salaryArbitrationPredictor';

const data = generateDemoSalaryArbPredictor();

export default function SalaryArbPredictorView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>SALARY ARBITRATION PREDICTOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Arbitration hearing outcome projections</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'ARB ELIGIBLE', value: data.totalArbEligible, color: '#f59e0b' },
          { label: 'PROJECTED COST', value: `$${data.projectedCost.toFixed(1)}M`, color: '#3b82f6' },
          { label: 'CASES', value: data.cases.length, color: '#e5e7eb' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.cases.map(c => (
        <div key={c.playerName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{c.playerName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{c.position} | {c.serviceTime} yrs service</span>
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getArbRecColor(c.recommendation), border: `1px solid ${getArbRecColor(c.recommendation)}44` }}>
              {c.recommendation.toUpperCase()}
            </span>
          </div>

          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>{c.keyStats}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'CURRENT', value: `$${c.currentSalary.toFixed(1)}M`, color: '#6b7280' },
              { label: 'TEAM OFFER', value: `$${c.teamOffer.toFixed(1)}M`, color: '#3b82f6' },
              { label: 'PLAYER ASK', value: `$${c.playerAsk.toFixed(1)}M`, color: '#ef4444' },
              { label: 'PREDICTED', value: `$${c.predictedAward.toFixed(1)}M`, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#22c55e', marginBottom: 6 }}>Team win probability: {c.teamWinProb}%</div>

          <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>COMPARABLES</div>
          {c.comparables.map((comp, i) => (
            <div key={i} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>
              {comp.playerName} ({comp.year}): {comp.stats} — <span style={{ color: '#f59e0b' }}>${comp.awarded.toFixed(1)}M</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
