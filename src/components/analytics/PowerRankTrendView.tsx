import { generateDemoPowerRankTrend, getRankColor, getChangeColor } from '../../engine/analytics/powerRankTrend';

const data = generateDemoPowerRankTrend();

export default function PowerRankTrendView() {
  const maxWeek = data.weeklyRankings.length;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>POWER RANKINGS TREND</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Weekly power ranking movement and league-wide comparison</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'CURRENT RANK', value: `#${data.currentRank}`, color: getRankColor(data.currentRank) },
          { label: 'BEST RANK', value: `#${data.bestRank}`, color: '#22c55e' },
          { label: 'WORST RANK', value: `#${data.worstRank}`, color: '#ef4444' },
          { label: 'AVG RANK', value: data.avgRank.toFixed(1), color: '#f59e0b' },
          { label: 'WEEKS TRACKED', value: String(maxWeek), color: '#e5e7eb' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Weekly trend chart */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>RANKING TREND — {data.teamName}</div>

          {/* Visual ranking bars (inverted — lower rank = better) */}
          {data.weeklyRankings.map(w => (
            <div key={w.week} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 28, fontSize: 10, color: '#6b7280', fontWeight: 700, textAlign: 'right' }}>W{w.week}</div>
              <div style={{ flex: 1, height: 14, background: '#1f2937', borderRadius: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: `${((30 - w.rank) / 30) * 100}%`, height: '100%', borderRadius: 2, background: getRankColor(w.rank), opacity: 0.7 }} />
              </div>
              <div style={{ width: 22, fontSize: 12, fontWeight: 700, color: getRankColor(w.rank), textAlign: 'right' }}>#{w.rank}</div>
              <div style={{ width: 28, fontSize: 10, color: getChangeColor(w.change), textAlign: 'right' }}>
                {w.change === 0 ? '—' : w.change > 0 ? `▼${w.change}` : `▲${Math.abs(w.change)}`}
              </div>
              <div style={{ width: 32, fontSize: 9, color: '#6b7280', textAlign: 'right' }}>{w.weeklyRecord}</div>
            </div>
          ))}

          {/* Key events */}
          <div style={{ marginTop: 12, color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>KEY EVENTS</div>
          {data.weeklyRankings.filter(w => w.keyEvent !== 'Steady' && w.keyEvent !== 'Holding steady').slice(-5).map(w => (
            <div key={w.week} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>
              <span style={{ color: '#6b7280' }}>W{w.week}: </span>{w.keyEvent}
            </div>
          ))}
        </div>

        {/* League rankings */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CURRENT LEAGUE RANKINGS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['#', 'TEAM', 'RECORD', 'CHG', 'STREAK'].map(h => (
                  <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'TEAM' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.leagueTeams.map(t => (
                <tr key={t.teamName} style={{ borderBottom: '1px solid #1f2937', background: t.teamName === data.teamName ? '#1f2937' : 'transparent' }}>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: getRankColor(t.currentRank), fontWeight: 700 }}>{t.currentRank}</td>
                  <td style={{ padding: '4px 6px', color: t.teamName === data.teamName ? '#f59e0b' : '#e5e7eb', fontWeight: t.teamName === data.teamName ? 700 : 400 }}>{t.teamName}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af' }}>{t.record}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: getChangeColor(t.change), fontWeight: 700 }}>
                    {t.change === 0 ? '—' : t.change > 0 ? `▼${t.change}` : `▲${Math.abs(t.change)}`}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: t.streak.startsWith('W') ? '#22c55e' : '#ef4444' }}>{t.streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
