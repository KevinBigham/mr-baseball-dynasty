import { generateDemoBuyoutScenarios, getRecColor } from '../../engine/contracts/contractBuyoutScenarios';

const data = generateDemoBuyoutScenarios();

export default function ContractBuyoutScenariosView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>CONTRACT BUYOUT SCENARIOS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Model buyout options and financial impact</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TOTAL BUYOUT COST', value: `$${data.totalBuyoutCost.toFixed(1)}M`, color: '#ef4444' },
          { label: 'TOTAL SAVINGS', value: `$${data.totalSavings.toFixed(1)}M`, color: '#22c55e' },
          { label: 'CANDIDATES', value: data.candidates.length, color: '#e5e7eb' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>BUYOUT CANDIDATES</div>
        {data.candidates.map(c => (
          <div key={c.name} style={{ padding: '10px 12px', marginBottom: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{c.name}</span>
                <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{c.position} | Age {c.age}</span>
              </div>
              <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 700, background: getRecColor(c.recommendation) + '22', color: getRecColor(c.recommendation) }}>
                {c.recommendation.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
              {[
                { label: 'SALARY', value: `$${c.salary}M`, color: '#f59e0b' },
                { label: 'BUYOUT', value: `$${c.buyoutAmount}M`, color: '#ef4444' },
                { label: 'SAVINGS', value: `$${c.savings.toFixed(1)}M`, color: c.savings > 0 ? '#22c55e' : '#6b7280' },
                { label: 'CURRENT WAR', value: c.war.toFixed(1), color: '#3b82f6' },
                { label: 'PROJ WAR', value: c.projectedWAR.toFixed(1), color: c.projectedWAR >= 2 ? '#22c55e' : '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: '#6b7280' }}>{s.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>{c.rationale}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
