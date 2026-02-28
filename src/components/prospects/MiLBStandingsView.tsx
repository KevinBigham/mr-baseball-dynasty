import { generateDemoMiLBStandings, getContColor } from '../../engine/prospects/minorLeagueStandingsTracker';

const data = generateDemoMiLBStandings();

export default function MiLBStandingsView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>MINOR LEAGUE STANDINGS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.parentTeam} — System Win%: {(data.systemWinPct * 100).toFixed(1)}%</p>
      </div>

      {data.affiliates.map(a => (
        <div key={a.level} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', padding: '1px 6px', border: '1px solid #f59e0b44', marginRight: 8 }}>{a.level}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{a.teamName}</span>
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getContColor(a.playoffContention), border: `1px solid ${getContColor(a.playoffContention)}44` }}>
              {a.playoffContention.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
            {[
              { label: 'RECORD', value: `${a.wins}-${a.losses}`, color: '#e5e7eb' },
              { label: 'WIN%', value: a.winPct.toFixed(3), color: a.winPct >= 0.550 ? '#22c55e' : '#9ca3af' },
              { label: 'GB', value: a.gamesBack === 0 ? '—' : a.gamesBack.toFixed(1), color: a.gamesBack === 0 ? '#22c55e' : '#9ca3af' },
              { label: 'STREAK', value: a.streak, color: a.streak.startsWith('W') ? '#22c55e' : '#ef4444' },
              { label: 'L10', value: a.lastTen, color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#3b82f6', marginBottom: 2 }}>Top Prospect: {a.topProspect}</div>
          <div style={{ fontSize: 9, color: '#9ca3af' }}>{a.notablePerformance}</div>
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>RECENT PROMOTIONS</div>
          {data.promotions.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #1f2937' }}>
              <span style={{ fontSize: 10, color: '#e5e7eb' }}>{p.playerName}</span>
              <span style={{ fontSize: 10, color: '#22c55e' }}>{p.from} → {p.to} ({p.date})</span>
            </div>
          ))}
        </div>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>REHAB ASSIGNMENTS</div>
          {data.rehabAssignments.map((r, i) => (
            <div key={i} style={{ padding: '4px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#e5e7eb' }}>{r.playerName} @ {r.level}</div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>{r.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
