import { generateDemoFarmSystemGrader, getSystemGradeColor } from '../../engine/prospects/farmSystemGrader';

const data = generateDemoFarmSystemGrader();

export default function FarmSystemGraderView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>FARM SYSTEM GRADER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Comprehensive minor league system evaluation</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'OVERALL GRADE', value: data.overallGrade, color: getSystemGradeColor(data.overallGrade) },
          { label: 'SYSTEM RANK', value: `#${data.systemRank}`, color: data.systemRank <= 10 ? '#22c55e' : '#f59e0b' },
          { label: 'SCORE', value: `${data.overallScore}/100`, color: '#3b82f6' },
          { label: 'GRADS THIS YR', value: data.graduatesThisYear, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>CATEGORY GRADES</div>
        {data.categories.map(c => (
          <div key={c.category} style={{ padding: '6px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{c.category}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: getSystemGradeColor(c.grade) }}>{c.grade}</span>
            </div>
            <div style={{ height: 4, background: '#1f2937', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${c.score}%`, background: getSystemGradeColor(c.grade) }} />
            </div>
            <div style={{ fontSize: 9, color: '#6b7280' }}>{c.description}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>BY LEVEL</div>
        {data.levels.map(l => (
          <div key={l.level} style={{ padding: '8px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{l.level}</span>
                <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>Top: {l.topProspect}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: getSystemGradeColor(l.grade) }}>{l.grade}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#9ca3af' }}>
              <span>W%: {l.winPct.toFixed(3)}</span>
              <span>Avg Age: {l.avgAge.toFixed(1)}</span>
              <span>Notable: {l.notablePerformers}</span>
            </div>
            <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>Concern: {l.concerns}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
