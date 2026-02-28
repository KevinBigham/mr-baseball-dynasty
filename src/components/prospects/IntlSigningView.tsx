import { generateDemoIntlSigning, getGradeColorIntl } from '../../engine/prospects/intlSigningTracker';

const data = generateDemoIntlSigning();

export default function IntlSigningView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>INTL SIGNING TRACKER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Signing period: {data.signingPeriod}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TOTAL POOL', value: `$${data.budget.totalPool.toFixed(1)}M`, color: '#f59e0b' },
          { label: 'SPENT', value: `$${data.budget.spent.toFixed(1)}M`, color: '#ef4444' },
          { label: 'REMAINING', value: `$${data.budget.remaining.toFixed(1)}M`, color: '#22c55e' },
          { label: 'SIGNEES', value: data.signees.length, color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>SIGNED PROSPECTS</div>
        {data.signees.map(s => (
          <div key={s.playerName} style={{ padding: '8px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{s.playerName}</span>
                <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{s.position} | Age {s.age} | {s.country}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: getGradeColorIntl(s.overallGrade) }}>OVR: {s.overallGrade}</span>
                <span style={{ fontSize: 10, color: '#f59e0b' }}>${s.signingBonus.toFixed(1)}M</span>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#3b82f6', marginBottom: 2 }}>Key Tool: {s.keyTool} | ETA: {s.eta}</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>{s.scoutingSummary}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #f59e0b44', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>TOP REMAINING TARGETS</div>
        {data.topTargets.map(t => (
          <div key={t.playerName} style={{ padding: '6px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>{t.playerName} ({t.position}, {t.country})</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: getGradeColorIntl(t.overallGrade) }}>OVR: {t.overallGrade} | ${t.signingBonus.toFixed(1)}M</span>
            </div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>{t.scoutingSummary}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>REGIONAL BREAKDOWN</div>
        {data.regions.map(r => (
          <div key={r.region} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #1f2937' }}>
            <span style={{ fontSize: 10, color: '#e5e7eb' }}>{r.region}</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{r.prospects} prospects | Avg: {r.avgGrade} | Top: {r.topTarget}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
