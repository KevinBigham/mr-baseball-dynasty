import { generateDemoRosterConstruction, getRosterGradeColor } from '../../engine/analytics/rosterConstructionGrader';

const data = generateDemoRosterConstruction();

export default function RosterGraderView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>ROSTER CONSTRUCTION GRADER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Overall roster balance and depth analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'OVERALL GRADE', value: data.overallGrade, color: getRosterGradeColor(data.overallGrade) },
          { label: 'LEAGUE RANK', value: `#${data.leagueRank}`, color: '#3b82f6' },
          { label: 'TOTAL WAR', value: data.totalWAR.toFixed(1), color: '#f59e0b' },
          { label: 'AVG AGE', value: data.balance.youthVsVeteran.toFixed(1), color: '#e5e7eb' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>POSITION GROUP GRADES</div>
        {data.positionGroups.map(pg => (
          <div key={pg.group} style={{ padding: '8px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: getRosterGradeColor(pg.grade), minWidth: 30 }}>{pg.grade}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>{pg.group}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>Depth: {pg.depth}/5</span>
                <span style={{ fontSize: 10, color: '#3b82f6' }}>Avg WAR: {pg.avgWAR.toFixed(1)}</span>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#f59e0b', marginBottom: 2 }}>{pg.topPlayer}</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                {pg.strengths.map((s, i) => <div key={i} style={{ fontSize: 9, color: '#22c55e' }}>+ {s}</div>)}
              </div>
              <div>
                {pg.concerns.map((c, i) => <div key={i} style={{ fontSize: 9, color: '#ef4444' }}>- {c}</div>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>BIGGEST STRENGTH</div>
          <div style={{ fontSize: 10, color: '#e5e7eb' }}>{data.biggestStrength}</div>
        </div>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>BIGGEST WEAKNESS</div>
          <div style={{ fontSize: 10, color: '#e5e7eb' }}>{data.biggestWeakness}</div>
        </div>
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
