import { generateDemoProspectTools, getGradeColor, getRiskColor } from '../../engine/prospects/prospectToolGrader';

const data = generateDemoProspectTools();

export default function ProspectToolGraderView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PROSPECT TOOL GRADER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — System Rank: #{data.systemRank} — Detailed tool grades</p>
      </div>

      {data.prospects.map(p => (
        <div key={p.playerName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{p.playerName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position} | Age {p.age} | {p.level}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getGradeColor(p.overallFV), border: `1px solid ${getGradeColor(p.overallFV)}44` }}>
                FV: {p.overallFV}
              </span>
              <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getRiskColor(p.riskLevel), border: `1px solid ${getRiskColor(p.riskLevel)}44` }}>
                {p.riskLevel.toUpperCase()} RISK
              </span>
              <span style={{ fontSize: 10, padding: '2px 8px', color: '#3b82f6', border: '1px solid #3b82f644' }}>ETA: {p.eta}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '70px 55px 55px 55px 55px 65px 1fr', gap: 4, marginBottom: 6 }}>
            {['TOOL', 'NOW', 'FUTURE', 'CEIL', 'FLOOR', 'TREND', 'NOTES'].map(h => (
              <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {p.tools.map(t => (
            <div key={t.tool} style={{ display: 'grid', gridTemplateColumns: '70px 55px 55px 55px 55px 65px 1fr', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{t.tool}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: getGradeColor(t.currentGrade) }}>{t.currentGrade}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: getGradeColor(t.futureGrade) }}>{t.futureGrade}</div>
              <div style={{ fontSize: 10, color: '#22c55e' }}>{t.ceiling}</div>
              <div style={{ fontSize: 10, color: '#ef4444' }}>{t.floor}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: t.trend === 'improving' ? '#22c55e' : t.trend === 'declining' ? '#ef4444' : '#9ca3af' }}>
                {t.trend === 'improving' ? '\u25B2' : t.trend === 'declining' ? '\u25BC' : '\u25C6'} {t.trend.toUpperCase()}
              </div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{t.notes}</div>
            </div>
          ))}

          <div style={{ marginTop: 8, padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#e5e7eb', marginBottom: 6 }}>{p.scoutingSummary}</div>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>COMPARISONS</div>
            {p.comparisons.map((c, i) => (
              <div key={i} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{c}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
