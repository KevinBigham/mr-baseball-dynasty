import { generateDemoPlayerValue, getCostPerWARColor } from '../../engine/analytics/playerValueTracker';

const data = generateDemoPlayerValue();

export default function PlayerValueView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PLAYER VALUE TRACKER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — WAR decomposition and value over time</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>TOTAL TEAM WAR</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>{data.totalTeamWAR.toFixed(1)}</div>
        </div>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>AVG COST/WAR</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: getCostPerWARColor(data.avgCostPerWAR), marginTop: 4 }}>${data.avgCostPerWAR.toFixed(1)}M</div>
        </div>
      </div>

      {data.players.map(p => (
        <div key={p.playerName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{p.playerName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position} | #{p.leagueRank} in MLB</span>
            </div>
            <span style={{ fontSize: 12, padding: '2px 8px', fontWeight: 700, color: '#f59e0b', border: '1px solid #f59e0b44' }}>
              {p.currentWAR.toFixed(1)} WAR
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'PROJ WAR', value: p.projectedWAR.toFixed(1), color: '#3b82f6' },
              { label: '162-GAME PACE', value: p.warPace.toFixed(1), color: '#22c55e' },
              { label: '$/WAR', value: `$${p.costPerWAR.toFixed(1)}M`, color: getCostPerWARColor(p.costPerWAR) },
              { label: 'CAREER WAR', value: p.careerWAR.toFixed(1), color: '#9ca3af' },
            ].map(s => (
              <div key={s.label} style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>WAR COMPONENTS</div>
          {p.components.map(c => (
            <div key={c.component} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <div style={{ width: 90, fontSize: 9, color: '#6b7280' }}>{c.component}</div>
              <div style={{ flex: 1, height: 8, background: '#1f2937', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${Math.max(Math.abs(c.percentOfTotal), 2)}%`, background: c.value >= 0 ? '#22c55e' : '#ef4444', borderRadius: 4 }} />
              </div>
              <div style={{ width: 40, fontSize: 10, fontWeight: 700, color: c.value >= 0 ? '#22c55e' : '#ef4444', textAlign: 'right' }}>{c.value > 0 ? '+' : ''}{c.value.toFixed(1)}</div>
            </div>
          ))}

          <div style={{ marginTop: 8, fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>MONTHLY WAR PROGRESSION</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {p.monthlySnapshots.map(ms => (
              <div key={ms.month} style={{ flex: 1, textAlign: 'center', padding: 4, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{ms.month}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{ms.war.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
