import { generateDemoPitchTipDetector, getTipRiskColor } from '../../engine/pitching/pitchTipDetector';

const data = generateDemoPitchTipDetector();

export default function PitchTipDetectorView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCH TIP DETECTOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Identify pitchers who may be tipping</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'PITCHERS ANALYZED', value: data.pitchersAnalyzed, color: '#f59e0b' },
          { label: 'TIPPERS FOUND', value: data.tippersFound, color: data.tippersFound > 0 ? '#ef4444' : '#22c55e' },
          { label: 'CLEAN', value: data.pitchersAnalyzed - data.tippersFound, color: '#22c55e' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.pitchers.map(p => (
        <div key={p.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.role}</span>
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getTipRiskColor(p.tipRisk), border: `1px solid ${getTipRiskColor(p.tipRisk)}44`, background: getTipRiskColor(p.tipRisk) + '15' }}>
              {p.tipRisk.toUpperCase()} {p.overallConfidence > 0 ? `(${p.overallConfidence}%)` : ''}
            </span>
          </div>

          {p.indicators.length > 0 ? (
            <>
              {p.indicators.map(ind => (
                <div key={ind.indicator} style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 8, marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{ind.indicator}</span>
                    <span style={{ fontSize: 10, color: ind.confidence >= 70 ? '#ef4444' : ind.confidence >= 50 ? '#f59e0b' : '#6b7280' }}>{ind.confidence}% confident ({ind.evidenceCount} samples)</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{ind.description}</div>
                </div>
              ))}
              <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>{p.impactEstimate}</div>
            </>
          ) : (
            <div style={{ fontSize: 10, color: '#22c55e' }}>{p.impactEstimate}</div>
          )}

          <div style={{ marginTop: 6, fontSize: 10, color: '#9ca3af', paddingLeft: 8, borderLeft: `2px solid ${getTipRiskColor(p.tipRisk)}66` }}>{p.recommendation}</div>
        </div>
      ))}
    </div>
  );
}
