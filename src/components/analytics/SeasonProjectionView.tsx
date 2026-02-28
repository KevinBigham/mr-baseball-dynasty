import { generateDemoSeasonProjection, getProbColor } from '../../engine/analytics/seasonProjectionModel';

const data = generateDemoSeasonProjection();

export default function SeasonProjectionView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>SEASON PROJECTION MODEL</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>As of {data.asOfDate} — {data.gamesRemaining} games remaining</p>
      </div>

      {data.divisions.map(div => (
        <div key={div.division} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>{div.division}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 140px 55px 65px 80px 55px 55px 55px', gap: 4, marginBottom: 6 }}>
            {['#', 'TEAM', 'CUR', 'PROJ W-L', 'WIN RANGE', 'DIV%', 'PO%', 'WS%'].map(h => (
              <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {div.teams.map(t => (
            <div key={t.abbreviation} style={{ display: 'grid', gridTemplateColumns: '40px 140px 55px 65px 80px 55px 55px 55px', gap: 4, padding: '5px 0', borderTop: '1px solid #1f2937', alignItems: 'center', background: t.abbreviation === 'SFG' ? '#1a1a0a' : 'transparent' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{t.abbreviation}</div>
              <div style={{ fontSize: 10, color: '#e5e7eb' }}>{t.teamName}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{t.currentWins}-{t.currentLosses}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.projectedWins >= 90 ? '#22c55e' : t.projectedWins >= 80 ? '#f59e0b' : '#ef4444' }}>{t.projectedWins}-{t.projectedLosses}</div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{t.winRange[0]}-{t.winRange[1]}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: getProbColor(t.divisionProb) }}>{t.divisionProb}%</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: getProbColor(t.playoffProb) }}>{t.playoffProb}%</div>
              <div style={{ fontSize: 10, color: t.worldSeriesProb >= 5 ? '#22c55e' : '#6b7280' }}>{t.worldSeriesProb}%</div>
            </div>
          ))}
        </div>
      ))}

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>WILD CARD RACE</div>
        {data.wildcardRace.map(t => (
          <div key={t.abbreviation} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid #1f2937', background: t.abbreviation === 'SFG' ? '#1a1a0a' : 'transparent' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>{t.teamName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{t.currentWins}-{t.currentLosses}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Proj: {t.projectedWins}W</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: getProbColor(t.wildcardProb) }}>WC: {t.wildcardProb}%</span>
              <span style={{ fontSize: 10, color: getProbColor(t.playoffProb) }}>PO: {t.playoffProb}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
