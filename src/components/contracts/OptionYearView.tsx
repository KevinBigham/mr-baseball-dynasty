import { generateDemoOptionAnalysis, getRecColor } from '../../engine/contracts/optionYearAnalyzer';

const data = generateDemoOptionAnalysis();

export default function OptionYearView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>OPTION YEAR ANALYZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Club, player, mutual, and vesting option analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>TOTAL OPTIONS</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>{data.totalOptions}</div>
        </div>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>COST IF ALL EXERCISED</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>${data.optionCostIfAllExercised.toFixed(1)}M</div>
        </div>
      </div>

      {data.optionDetails.map(o => (
        <div key={o.playerName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{o.playerName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{o.position} | {o.optionType.toUpperCase()} OPTION</span>
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getRecColor(o.recommendation), border: `1px solid ${getRecColor(o.recommendation)}44` }}>
              {o.recommendation.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'OPTION SALARY', value: `$${o.optionSalary.toFixed(1)}M`, color: '#e5e7eb' },
              { label: 'BUYOUT', value: `$${o.buyout.toFixed(1)}M`, color: '#6b7280' },
              { label: 'PROJ WAR', value: o.projectedWAR.toFixed(1), color: '#3b82f6' },
              { label: 'MARKET VALUE', value: `$${o.marketValue.toFixed(1)}M`, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {o.vestingThreshold && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#6b7280' }}>Vesting: {o.vestingThreshold}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>{o.vestingProgress}%</span>
              </div>
              <div style={{ height: 6, background: '#1f2937', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${o.vestingProgress}%`, background: '#f59e0b', borderRadius: 3 }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>Cost-Benefit Delta:</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: o.costBenefitDelta > 0 ? '#22c55e' : o.costBenefitDelta < 0 ? '#ef4444' : '#9ca3af' }}>
              {o.costBenefitDelta > 0 ? '+' : ''}${o.costBenefitDelta.toFixed(1)}M
            </span>
          </div>

          <div style={{ fontSize: 10, color: '#9ca3af', paddingLeft: 8, borderLeft: '2px solid #f59e0b66' }}>{o.analysis}</div>
        </div>
      ))}

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>OPTION TIMELINE</div>
        {data.timeline.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '4px 0', borderTop: '1px solid #1f2937' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', minWidth: 60 }}>{t.date}</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{t.event}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
