import { generateDemoLuxuryTax, getTaxStatusColor } from '../../engine/contracts/luxuryTaxCalculator';

const data = generateDemoLuxuryTax();

export default function LuxuryTaxView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>LUXURY TAX CALCULATOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — CBT compliance and payroll analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'ACTUAL PAYROLL', value: `$${data.currentPayroll.toFixed(1)}M`, color: '#e5e7eb' },
          { label: 'CBT PAYROLL', value: `$${data.cbtPayroll.toFixed(1)}M`, color: '#f59e0b' },
          { label: 'TAX BILL', value: `$${data.currentTaxBill.toFixed(1)}M`, color: data.currentTaxBill > 0 ? '#ef4444' : '#22c55e' },
          { label: 'PROJ NEXT YR', value: `$${data.projectedNextYear.toFixed(1)}M`, color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>CBT THRESHOLDS</div>
        {data.thresholds.map(t => (
          <div key={t.tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid #1f2937' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{t.tier}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>${t.threshold}M ({t.taxRate}%)</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: getTaxStatusColor(t.status) }}>
              {t.currentOver > 0 ? '+' : ''}{t.currentOver.toFixed(1)}M {t.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>TOP CONTRACTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 40px 60px 45px 60px 50px', gap: 4, marginBottom: 6 }}>
          {['PLAYER', 'POS', 'AAV', 'YRS', 'CBT $', '%PAY'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.topContracts.map(c => (
          <div key={c.playerName} style={{ display: 'grid', gridTemplateColumns: '120px 40px 60px 45px 60px 50px', gap: 4, padding: '3px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#e5e7eb' }}>{c.playerName}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{c.position}</div>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>${c.aav.toFixed(1)}M</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{c.yearsRemaining}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>${c.cbtContribution.toFixed(1)}M</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{c.pctOfPayroll.toFixed(1)}%</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>RECOMMENDATIONS</div>
        {data.recommendations.map((r, i) => (
          <div key={i} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #f59e0b66' }}>{r}</div>
        ))}
      </div>
    </div>
  );
}
