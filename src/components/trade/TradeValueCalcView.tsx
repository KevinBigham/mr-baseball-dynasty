import { generateDemoTradeValue, getTradeabilityColor } from '../../engine/trade/tradeValueCalculator';

const data = generateDemoTradeValue();

export default function TradeValueCalcView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TRADE VALUE CALCULATOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Comprehensive player trade valuations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'MOST VALUABLE', value: data.mostValuable, color: '#22c55e' },
          { label: 'BEST SURPLUS', value: data.bestSurplus, color: '#f59e0b' },
          { label: 'TOTAL ROSTER VALUE', value: data.totalRosterValue, color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.players.map(p => (
        <div key={p.playerName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{p.playerName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position} | Age {p.age} | {p.contractYearsLeft}yr @ ${p.currentSalary}M</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, padding: '2px 8px', fontWeight: 700, color: '#f59e0b', border: '1px solid #f59e0b44' }}>TV: {p.totalTradeValue}</span>
              <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getTradeabilityColor(p.tradeability), border: `1px solid ${getTradeabilityColor(p.tradeability)}44` }}>
                {p.tradeability.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {p.components.map(c => (
              <div key={c.component} style={{ flex: c.value, height: 6, background: c.value >= 20 ? '#22c55e' : c.value >= 10 ? '#3b82f6' : '#f59e0b', borderRadius: 2 }} title={c.component} />
            ))}
          </div>

          {p.components.map(c => (
            <div key={c.component} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span style={{ fontSize: 9, color: '#6b7280' }}>{c.component}: {c.description}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#3b82f6' }}>{c.value}</span>
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>SURPLUS VALUE</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: p.surplusValue > 0 ? '#22c55e' : '#ef4444' }}>${p.surplusValue.toFixed(1)}M</div>
            </div>
            <div style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>BEST RETURN</div>
              <div style={{ fontSize: 10, color: '#e5e7eb' }}>{p.bestReturn}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
