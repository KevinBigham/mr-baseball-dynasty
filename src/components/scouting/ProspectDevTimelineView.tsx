import { useState } from 'react';
import { generateDemoProspectTimelines, MILESTONE_DISPLAY, getPaceColor, type ProspectTimeline } from '../../engine/scouting/prospectDevTimeline';

const data = generateDemoProspectTimelines();

export default function ProspectDevTimelineView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const prospect = data[selectedIdx];
  const paceColor = getPaceColor(prospect.developmentPace);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PROSPECT DEVELOPMENT TIMELINE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Track prospect progression through the minor league system</p>
      </div>

      {/* Prospect selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((p, i) => (
          <button key={p.prospectId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {p.name} ({p.position})
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'CURRENT LEVEL', value: prospect.currentLevel, color: '#f59e0b' },
          { label: 'GRADE', value: String(prospect.currentGrade), color: prospect.currentGrade >= 70 ? '#22c55e' : prospect.currentGrade >= 60 ? '#f59e0b' : '#9ca3af' },
          { label: 'DRAFT YEAR', value: String(prospect.draftYear), color: '#e5e7eb' },
          { label: 'PROJECTED DEBUT', value: prospect.projectedDebut, color: '#3b82f6' },
          { label: 'DEV PACE', value: prospect.developmentPace.toUpperCase(), color: paceColor },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 16 }}>DEVELOPMENT TIMELINE — {prospect.name}</div>

        {prospect.milestones.map((m, i) => {
          const display = MILESTONE_DISPLAY[m.type];
          return (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 0 }}>
              {/* Timeline line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: display.color + '33', border: `2px solid ${display.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: display.color, fontWeight: 700, flexShrink: 0 }}>
                  {display.icon}
                </div>
                {i < prospect.milestones.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: '#374151' }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>{m.date}</span>
                  <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: display.color + '22', color: display.color, border: `1px solid ${display.color}44` }}>
                    {display.label}
                  </span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{m.level}</span>
                </div>
                <div style={{ fontSize: 11, color: '#e5e7eb' }}>{m.description}</div>
                {m.gradeChange && (
                  <div style={{ fontSize: 10, marginTop: 2 }}>
                    <span style={{ color: '#6b7280' }}>Grade: </span>
                    <span style={{ color: '#ef4444' }}>{m.gradeChange.from}</span>
                    <span style={{ color: '#6b7280' }}> → </span>
                    <span style={{ color: m.gradeChange.to > m.gradeChange.from ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{m.gradeChange.to}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* All prospects quick view */}
      <div style={{ marginTop: 16, border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>ALL TRACKED PROSPECTS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['PROSPECT', 'POS', 'LEVEL', 'GRADE', 'PACE', 'ETA', 'MILESTONES'].map(h => (
                <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PROSPECT' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={p.prospectId} onClick={() => setSelectedIdx(i)}
                style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: i === selectedIdx ? '#1f2937' : 'transparent' }}>
                <td style={{ padding: '4px 6px', color: '#e5e7eb', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#f59e0b' }}>{p.position}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{p.currentLevel}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: p.currentGrade >= 70 ? '#22c55e' : p.currentGrade >= 60 ? '#f59e0b' : '#9ca3af', fontWeight: 700 }}>{p.currentGrade}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: getPaceColor(p.developmentPace) }}>{p.developmentPace.toUpperCase()}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#3b82f6' }}>{p.projectedDebut}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#6b7280' }}>{p.milestones.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
