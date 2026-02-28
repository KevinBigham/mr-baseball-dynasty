import { generateDemoContractNeg, getRelationshipColor } from '../../engine/contracts/contractNegotiationEngine';

const data = generateDemoContractNeg();

export default function ContractNegView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>CONTRACT NEGOTIATION ENGINE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Extension talks and negotiation dynamics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TOTAL COMMITTED', value: `$${data.totalCommitted.toFixed(1)}M`, color: '#f59e0b' },
          { label: 'BUDGET REMAINING', value: `$${data.budgetRemaining.toFixed(1)}M`, color: '#22c55e' },
          { label: 'ACTIVE TALKS', value: data.negotiations.length, color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.negotiations.map(n => (
        <div key={n.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{n.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{n.position} | Age {n.age}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: getRelationshipColor(n.relationship) }}>{n.relationship.toUpperCase()}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: n.likelihood >= 60 ? '#22c55e' : n.likelihood >= 40 ? '#f59e0b' : '#ef4444' }}>{n.likelihood}% likely</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'CURRENT SAL', value: `$${n.currentSalary.toFixed(1)}M`, color: '#9ca3af' },
              { label: 'MARKET VALUE', value: `$${n.marketValue.toFixed(1)}M`, color: '#3b82f6' },
              { label: 'AGENT ASKS', value: `$${n.agentDemand.toFixed(1)}M/yr`, color: '#ef4444' },
              { label: 'TEAM MAX', value: `$${n.teamBudget.toFixed(1)}M/yr`, color: '#22c55e' },
            ].map(s => (
              <div key={s.label} style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>NEGOTIATION HISTORY</div>
          {n.offers.map(o => (
            <div key={o.round} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ width: 20, fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>R{o.round}</div>
              <div style={{ width: 50, fontSize: 10, color: o.offeredBy === 'team' ? '#3b82f6' : '#ef4444' }}>
                {o.offeredBy === 'team' ? 'TEAM' : 'PLAYER'}
              </div>
              <div style={{ flex: 1, fontSize: 10, color: '#e5e7eb' }}>
                {o.years}yr / ${o.totalValue.toFixed(0)}M (${o.aav.toFixed(1)}M AAV)
                {o.optOut && <span style={{ color: '#f59e0b', marginLeft: 4 }}>+opt-out</span>}
                {o.noTrade && <span style={{ color: '#a855f7', marginLeft: 4 }}>+NTC</span>}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: o.status === 'accepted' ? '#22c55e' : o.status === 'rejected' ? '#ef4444' : o.status === 'pending' ? '#f59e0b' : '#3b82f6' }}>
                {o.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
