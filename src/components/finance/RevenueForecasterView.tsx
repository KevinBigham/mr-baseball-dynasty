import { generateDemoRevenueForecaster, getTrendColor } from '../../engine/finance/revenueForecaster';

const data = generateDemoRevenueForecaster();

export default function RevenueForecasterView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>REVENUE FORECASTER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Multi-season revenue projections</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'CURRENT REVENUE', value: `$${data.currentSeasonRevenue.toFixed(1)}M`, color: '#22c55e' },
          { label: 'PROJECTED NEXT', value: `$${data.projectedNextSeason.toFixed(1)}M`, color: '#3b82f6' },
          { label: 'GROWTH', value: `+${data.revenueGrowth.toFixed(1)}%`, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 10 }}>REVENUE BY SOURCE</div>
        {data.sources.map(s => (
          <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ width: 120, fontSize: 11, color: '#e5e7eb', fontWeight: 600 }}>{s.source}</div>
            <div style={{ flex: 1, display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 11, color: '#9ca3af', width: 70 }}>${s.current.toFixed(1)}M</span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{'\u2192'}</span>
              <span style={{ fontSize: 11, color: '#e5e7eb', width: 70 }}>${s.projected.toFixed(1)}M</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: getTrendColor(s.trend), width: 60 }}>
              {s.trend === 'up' ? '\u25B2' : s.trend === 'down' ? '\u25BC' : '\u25C6'} {s.growth.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 10 }}>5-YEAR FORECAST</div>
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 4, marginBottom: 6 }}>
          {['SEASON', 'REVENUE', 'EXPENSES', 'NET INCOME'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.forecast.map(f => (
          <div key={f.season} style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 4, padding: '5px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{f.season}</div>
            <div style={{ fontSize: 11, color: '#22c55e' }}>${f.totalRevenue.toFixed(1)}M</div>
            <div style={{ fontSize: 11, color: '#ef4444' }}>${f.totalExpenses.toFixed(1)}M</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: f.netIncome > 0 ? '#22c55e' : '#ef4444' }}>${f.netIncome.toFixed(1)}M</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>RISK FACTORS</div>
        {data.riskFactors.map((r, i) => (
          <div key={i} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #ef444466' }}>{r}</div>
        ))}
      </div>
    </div>
  );
}
