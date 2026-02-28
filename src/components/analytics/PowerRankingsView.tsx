import { generateDemoPowerRankings, getTierColor } from '../../engine/analytics/teamPowerRankingEngine';

const data = generateDemoPowerRankings();

export default function PowerRankingsView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>POWER RANKINGS ENGINE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>As of {data.asOfDate} — Your team: #{data.userTeamRank}</p>
      </div>

      {data.rankings.map(t => (
        <div key={t.abbreviation} style={{ border: `1px solid ${t.abbreviation === 'SFG' ? '#f59e0b44' : '#374151'}`, background: t.abbreviation === 'SFG' ? '#1a1a0a' : '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>#{t.rank}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{t.teamName}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{t.record}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, padding: '2px 8px', fontWeight: 700, color: getTierColor(t.tierLabel), border: `1px solid ${getTierColor(t.tierLabel)}44` }}>
                {t.tierLabel.toUpperCase()}
              </span>
              <span style={{ fontSize: 12, padding: '2px 8px', fontWeight: 700, color: '#f59e0b', border: '1px solid #f59e0b44' }}>
                {t.overallScore}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
            {t.categories.map(c => (
              <div key={c.category} style={{ padding: 4, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#6b7280' }}>{c.category}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.score >= 80 ? '#22c55e' : c.score >= 60 ? '#f59e0b' : '#ef4444' }}>{c.score}</div>
                <div style={{ fontSize: 8, color: c.trend === 'up' ? '#22c55e' : c.trend === 'down' ? '#ef4444' : '#6b7280' }}>
                  {c.trend === 'up' ? '\u25B2' : c.trend === 'down' ? '\u25BC' : '\u25C6'} #{c.leagueRank}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280' }}>
            <span>SOS Remaining: {t.strengthOfScheduleRemaining.toFixed(3)}</span>
            <span>Playoff: <span style={{ color: t.playoffProb >= 50 ? '#22c55e' : '#f59e0b' }}>{t.playoffProb}%</span></span>
            <span>WS: <span style={{ color: t.wsProb >= 10 ? '#22c55e' : '#6b7280' }}>{t.wsProb}%</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}
