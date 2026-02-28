import { generateDemoTradeDeadlineSim, getRiskBadgeColor, getRecBadgeColor } from '../../engine/trade/tradeDeadlineSimulator';

const data = generateDemoTradeDeadlineSim();

export default function TradeDeadlineSimView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TRADE DEADLINE SIMULATOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Scenario analysis and projected outcomes</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'RECORD', value: `${data.currentWins}-${data.currentLosses}`, color: '#e5e7eb' },
          { label: 'PLAYOFF ODDS', value: `${data.playoffOdds}%`, color: data.playoffOdds >= 60 ? '#22c55e' : '#f59e0b' },
          { label: 'SCENARIOS', value: data.scenarios.length, color: '#f59e0b' },
          { label: 'BEST PATH', value: data.bestScenario, color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.scenarios.map((sc, idx) => (
        <div key={idx} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{sc.scenarioName}</span>
              <span style={{ fontSize: 10, padding: '2px 6px', marginLeft: 8, fontWeight: 700, color: getRiskBadgeColor(sc.risk), border: `1px solid ${getRiskBadgeColor(sc.risk)}44` }}>{sc.risk.toUpperCase()} RISK</span>
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', fontWeight: 700, color: getRecBadgeColor(sc.recommendation), border: `1px solid ${getRecBadgeColor(sc.recommendation)}44`, background: getRecBadgeColor(sc.recommendation) + '15' }}>
              {sc.recommendation.replace(/-/g, ' ').toUpperCase()}
            </span>
          </div>

          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>{sc.description}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {[
              { label: 'WIN IMPACT', value: `+${sc.winImpact.toFixed(1)} W`, color: '#22c55e' },
              { label: 'PLAYOFF DELTA', value: `+${sc.playoffOddsDelta}%`, color: '#3b82f6' },
              { label: 'SALARY IMPACT', value: `$${sc.salaryImpact.toFixed(1)}M`, color: '#f59e0b' },
            ].map(m => (
              <div key={m.label} style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {sc.playersAcquired.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>ACQUIRE</div>
              {sc.playersAcquired.map((p, i) => (
                <div key={i} style={{ fontSize: 10, color: '#9ca3af' }}>+ {p.name} ({p.position}) from {p.team}</div>
              ))}
            </div>
          )}

          {sc.prospectsCost.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>COST</div>
              {sc.prospectsCost.map((p, i) => (
                <div key={i} style={{ fontSize: 10, color: '#9ca3af' }}>- {p.name} (#{p.rank} prospect)</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
