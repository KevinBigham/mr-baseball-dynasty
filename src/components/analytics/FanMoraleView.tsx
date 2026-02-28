import { generateDemoFanMorale, getMoraleColor } from '../../engine/analytics/fanMoraleEngine';

const data = generateDemoFanMorale();

export default function FanMoraleView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>FAN MORALE ENGINE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Fan happiness, attendance impact, and engagement drivers</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'OVERALL MORALE', value: data.overallMorale, color: getMoraleColor(data.overallMorale) },
          { label: 'GRADE', value: data.moraleGrade, color: '#f59e0b' },
          { label: 'TREND', value: data.trend.toUpperCase(), color: data.trend === 'rising' ? '#22c55e' : data.trend === 'falling' ? '#ef4444' : '#6b7280' },
          { label: 'ATTENDANCE', value: `${data.attendancePct}%`, color: data.attendancePct > 80 ? '#22c55e' : '#f59e0b' },
          { label: 'TICKET RENEWAL', value: `${data.seasonTicketRenewal}%`, color: '#3b82f6' },
          { label: 'SOCIAL SENTIMENT', value: data.socialSentiment > 0 ? `+${data.socialSentiment}` : `${data.socialSentiment}`, color: data.socialSentiment > 0 ? '#22c55e' : '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Morale drivers */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>MORALE DRIVERS</div>
          {data.drivers.sort((a, b) => b.impact - a.impact).map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 4, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ width: 40, fontSize: 12, fontWeight: 700, color: d.impact > 0 ? '#22c55e' : '#ef4444', textAlign: 'center' }}>
                {d.impact > 0 ? `+${d.impact}` : d.impact}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#e5e7eb', fontWeight: 600 }}>{d.factor}</div>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{d.description}</div>
              </div>
              <span style={{ padding: '1px 4px', fontSize: 8, fontWeight: 700, color: '#6b7280', background: '#1f2937' }}>{d.category.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Monthly trend */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>MONTHLY TREND</div>
          {data.monthlyMorale.map(m => (
            <div key={m.month} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>{m.month}</span>
                <span style={{ fontSize: 10, color: getMoraleColor(m.morale) }}>Morale: {m.morale}</span>
              </div>
              <div style={{ height: 12, background: '#1f2937', borderRadius: 4, marginBottom: 4 }}>
                <div style={{ width: `${m.morale}%`, height: '100%', borderRadius: 4, background: getMoraleColor(m.morale) }} />
              </div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>Attendance: {m.attendance}%</div>
            </div>
          ))}

          {/* Morale gauge */}
          <div style={{ marginTop: 16, padding: 12, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 8 }}>MORALE GAUGE</div>
            <div style={{ height: 20, background: '#1f2937', borderRadius: 6, position: 'relative' as const }}>
              <div style={{ width: `${data.overallMorale}%`, height: '100%', borderRadius: 6, background: getMoraleColor(data.overallMorale), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{data.overallMorale}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginTop: 4 }}>
              <span>Mutiny (0)</span><span>Apathy (25)</span><span>Content (50)</span><span>Excited (75)</span><span>Electric (100)</span>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#6b7280' }}>MERCH SALES INDEX</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: data.merchSalesIndex > 100 ? '#22c55e' : '#ef4444' }}>{data.merchSalesIndex}</div>
            <div style={{ fontSize: 9, color: '#6b7280' }}>100 = league average</div>
          </div>
        </div>
      </div>
    </div>
  );
}
