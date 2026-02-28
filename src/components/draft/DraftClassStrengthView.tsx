import { useState } from 'react';
import { generateDemoDraftClassStrength, GRADE_DISPLAY, type DraftClassProfile } from '../../engine/draft/draftClassStrength';

const data = generateDemoDraftClassStrength();

export default function DraftClassStrengthView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const cls = data[selectedIdx];
  const gradeColor = GRADE_DISPLAY[cls.overallGrade].color;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>DRAFT CLASS STRENGTH</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Annual draft class evaluation, depth analysis, and positional breakdown</p>
      </div>

      {/* Year selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {data.map((c, i) => (
          <button key={c.year} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 14px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {c.year}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'OVERALL GRADE', value: cls.overallGrade, color: gradeColor },
          { label: 'SCORE', value: String(cls.overallScore), color: '#f59e0b' },
          { label: 'TOP TALENT', value: String(cls.topTalent), color: cls.topTalent >= 80 ? '#22c55e' : '#f59e0b' },
          { label: 'DEPTH', value: String(cls.depth), color: cls.depth >= 75 ? '#22c55e' : '#f59e0b' },
          { label: 'COLLEGE/PREP', value: `${cls.collegeVsPrep.college}/${cls.collegeVsPrep.prep}`, color: '#9ca3af' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Picks */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TOP PROSPECTS — {cls.year}</div>
          {cls.topPicks.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, padding: '6px 8px', background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ width: 24, fontSize: 12, color: '#6b7280', fontWeight: 700 }}>#{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#e5e7eb', fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{p.position}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.grade >= 75 ? '#22c55e' : p.grade >= 65 ? '#f59e0b' : '#9ca3af' }}>
                {p.grade}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 12, padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>HISTORICAL COMPARISON</div>
            <div style={{ fontSize: 11, color: '#f59e0b' }}>{cls.historicalComp}</div>
          </div>
        </div>

        {/* Positional Breakdown */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>POSITIONAL BREAKDOWN</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['POSITION', 'COUNT', 'AVG GRADE', 'TOP PROSPECT'].map(h => (
                  <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'TOP PROSPECT' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cls.positionalBreakdown.map((pb, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{pb.position}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{pb.count}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <div style={{ width: 40, height: 6, background: '#1f2937', borderRadius: 2 }}>
                        <div style={{ width: `${pb.avgGrade}%`, height: '100%', borderRadius: 2, background: pb.avgGrade >= 70 ? '#22c55e' : pb.avgGrade >= 60 ? '#f59e0b' : '#9ca3af' }} />
                      </div>
                      <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{pb.avgGrade}</span>
                    </div>
                  </td>
                  <td style={{ padding: '4px 6px', color: '#9ca3af' }}>{pb.topProspect}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Score bars by year */}
          <div style={{ marginTop: 16, color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>ALL CLASSES COMPARISON</div>
          {data.map(c => (
            <div key={c.year} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 36, fontSize: 10, color: c.year === cls.year ? '#f59e0b' : '#6b7280', fontWeight: 700 }}>{c.year}</div>
              <div style={{ flex: 1, height: 10, background: '#1f2937', borderRadius: 2 }}>
                <div style={{ width: `${c.overallScore}%`, height: '100%', borderRadius: 2, background: GRADE_DISPLAY[c.overallGrade].color, opacity: c.year === cls.year ? 1 : 0.6 }} />
              </div>
              <div style={{ width: 30, fontSize: 10, color: GRADE_DISPLAY[c.overallGrade].color, fontWeight: 700, textAlign: 'right' }}>{c.overallGrade}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
