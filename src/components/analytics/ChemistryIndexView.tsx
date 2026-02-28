import { useState } from 'react';
import { generateDemoChemistryIndex, type TeamChemistryProfile } from '../../engine/analytics/teamChemistryIndex';

const data = generateDemoChemistryIndex();

const trendIcon: Record<string, { icon: string; color: string }> = {
  improving: { icon: '\u25B2', color: '#22c55e' },
  stable: { icon: '\u25AC', color: '#9ca3af' },
  declining: { icon: '\u25BC', color: '#ef4444' },
};

const gradeColor = (g: string) => g.startsWith('A') ? '#22c55e' : g.startsWith('B') ? '#f59e0b' : g.startsWith('C') ? '#9ca3af' : '#ef4444';

export default function ChemistryIndexView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const team = data[selectedIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TEAM CHEMISTRY INDEX</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Comprehensive chemistry scoring with component breakdown and impact analysis</p>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((t, i) => (
          <button key={t.teamId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {t.teamName}
          </button>
        ))}
      </div>

      {/* Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 12, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280' }}>OVERALL INDEX</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>{team.overallIndex}</div>
        </div>
        <div style={{ padding: 12, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280' }}>GRADE</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: gradeColor(team.grade), marginTop: 4 }}>{team.grade}</div>
        </div>
        <div style={{ padding: 12, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280' }}>CHEMISTRY WAR</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: team.chemistryWAR > 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
            {team.chemistryWAR > 0 ? '+' : ''}{team.chemistryWAR}
          </div>
        </div>
        <div style={{ padding: 12, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280' }}>LEADERS</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', marginTop: 4 }}>{team.leaders.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Components */}
        <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CHEMISTRY COMPONENTS</div>
          {team.components.map(c => {
            const t = trendIcon[c.trend];
            return (
              <div key={c.factor} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>
                    {c.score} <span style={{ color: t.color, fontSize: 10 }}>{t.icon}</span>
                  </span>
                </div>
                <div style={{ height: 6, background: '#1f2937' }}>
                  <div style={{ width: `${c.score}%`, height: '100%', background: c.score > 75 ? '#22c55e' : c.score > 55 ? '#f59e0b' : c.score > 35 ? '#9ca3af' : '#ef4444' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Leaders & Concerns */}
        <div>
          <div style={{ border: '1px solid #374151', padding: 16, background: '#111827', marginBottom: 16 }}>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CLUBHOUSE LEADERS</div>
            {team.leaders.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < team.leaders.length - 1 ? '1px solid #1f2937' : 'none' }}>
                <div>
                  <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 12 }}>{l.name}</span>
                  <span style={{ color: '#6b7280', fontSize: 10, marginLeft: 8 }}>{l.role}</span>
                </div>
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>+{l.impact}</span>
              </div>
            ))}
          </div>

          {team.concerns.length > 0 && (
            <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
              <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>CONCERNS</div>
              {team.concerns.map((c, i) => (
                <div key={i} style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid #ef4444' }}>{c}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
