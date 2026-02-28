import { generateDemoTeamChemistry, getChemColor, getRelColor } from '../../engine/analytics/teamChemistryEngine';

const data = generateDemoTeamChemistry();

export default function TeamChemistryEngineView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TEAM CHEMISTRY ENGINE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Relationships, morale, and clubhouse dynamics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'OVERALL CHEM', value: data.overallChemistry, color: getChemColor(data.overallChemistry) },
          { label: 'GRADE', value: data.chemistryGrade, color: getChemColor(data.overallChemistry) },
          { label: 'LEAGUE RANK', value: `#${data.leagueRank}`, color: '#3b82f6' },
          { label: 'WINS ADDED', value: `+${data.performanceBoost.toFixed(1)}`, color: '#22c55e' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>KEY RELATIONSHIPS</div>
        {data.relationships.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid #1f2937' }}>
            <div>
              <span style={{ fontSize: 10, color: '#e5e7eb' }}>{r.player1}</span>
              <span style={{ fontSize: 10, color: '#6b7280' }}> ↔ </span>
              <span style={{ fontSize: 10, color: '#e5e7eb' }}>{r.player2}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: getRelColor(r.relationship), marginRight: 8 }}>{r.relationship.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: r.chemBonus > 0 ? '#22c55e' : r.chemBonus < 0 ? '#ef4444' : '#9ca3af' }}>{r.chemBonus > 0 ? '+' : ''}{r.chemBonus}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>CLUBHOUSE LEADERS</div>
          {data.leaders.map(l => (
            <div key={l.playerName} style={{ padding: '5px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#e5e7eb' }}>{l.playerName}</span>
                <span style={{ fontSize: 10, color: '#3b82f6' }}>{l.leadershipType} ({l.influence})</span>
              </div>
              <div style={{ fontSize: 9, color: '#22c55e' }}>{l.effect}</div>
            </div>
          ))}
        </div>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>RECENT EVENTS</div>
          {data.recentEvents.map((e, i) => (
            <div key={i} style={{ padding: '4px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: '#6b7280' }}>{e.date}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: e.impact === 'positive' ? '#22c55e' : e.impact === 'negative' ? '#ef4444' : '#9ca3af' }}>{e.chemChange > 0 ? '+' : ''}{e.chemChange}</span>
              </div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>{e.event}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>CLIQUES</div>
        {data.cliques.map(c => (
          <div key={c.name} style={{ padding: '6px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{c.name}</div>
            <div style={{ fontSize: 9, color: '#e5e7eb' }}>{c.members.join(', ')}</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>{c.vibe}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
