import { generateDemoInjuryPrediction, getInjuryRiskColor } from '../../engine/analytics/injuryPredictionModel';

const data = generateDemoInjuryPrediction();

export default function InjuryPredictionView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>INJURY PREDICTION MODEL</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Workload and injury risk analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'PLAYERS TRACKED', value: data.totalPlayersTracked, color: '#f59e0b' },
          { label: 'HIGH RISK', value: data.highRiskCount, color: data.highRiskCount > 0 ? '#ef4444' : '#22c55e' },
          { label: 'HEALTHY', value: data.totalPlayersTracked - data.highRiskCount, color: '#22c55e' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.players.map(p => (
        <div key={p.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position} | Age {p.age}</span>
              {p.workloadFlag && <span style={{ fontSize: 9, color: '#ef4444', marginLeft: 8 }}>WORKLOAD FLAG</span>}
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getInjuryRiskColor(p.riskLevel), border: `1px solid ${getInjuryRiskColor(p.riskLevel)}44`, background: getInjuryRiskColor(p.riskLevel) + '15' }}>
              {p.riskLevel.toUpperCase()} — {p.riskScore}%
            </span>
          </div>

          <div style={{ height: 6, background: '#1f2937', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${p.riskScore}%`, background: getInjuryRiskColor(p.riskLevel) }} />
          </div>

          {p.injuryHistory.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 2 }}>INJURY HISTORY</div>
              {p.injuryHistory.map((h, i) => (
                <div key={i} style={{ fontSize: 10, color: '#9ca3af' }}>{h.year}: {h.injury} ({h.missedGames} games)</div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 2 }}>RISK FACTORS</div>
          {p.keyRiskFactors.map((f, i) => (
            <div key={i} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 1 }}>- {f}</div>
          ))}

          <div style={{ marginTop: 6, fontSize: 10, color: '#9ca3af', paddingLeft: 8, borderLeft: `2px solid ${getInjuryRiskColor(p.riskLevel)}66` }}>{p.recommendation}</div>
        </div>
      ))}
    </div>
  );
}
