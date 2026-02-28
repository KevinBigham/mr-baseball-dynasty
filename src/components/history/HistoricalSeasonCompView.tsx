import { generateDemoHistoricalComp, getCompColor, getResultColor } from '../../engine/history/historicalSeasonComp';

const data = generateDemoHistoricalComp();

export default function HistoricalSeasonCompView() {
  const curr = data.currentSeason;
  const pace162 = Math.round((curr.wins / curr.gamesPlayed) * 162);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>HISTORICAL SEASON COMPARISON</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Compare current season performance to franchise history</p>
      </div>

      {/* Current season summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'RECORD', value: `${curr.wins}-${curr.losses}`, color: '#e5e7eb' },
          { label: 'WIN %', value: curr.winPct.toFixed(3), color: curr.winPct >= .600 ? '#22c55e' : '#f59e0b' },
          { label: '162-GAME PACE', value: `${pace162} W`, color: pace162 >= 100 ? '#22c55e' : pace162 >= 90 ? '#f59e0b' : '#9ca3af' },
          { label: 'RUN DIFF', value: curr.runDiff > 0 ? `+${curr.runDiff}` : String(curr.runDiff), color: curr.runDiff > 0 ? '#22c55e' : '#ef4444' },
          { label: 'CLOSEST COMP', value: `${data.closestComp.year} (${data.closestComp.similarity}%)`, color: getCompColor(data.closestComp.similarity) },
          { label: 'FRANCHISE AVG', value: `${data.avgWins} W`, color: '#9ca3af' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Season-by-season comparison */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>FRANCHISE SEASONS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['YEAR', 'W-L', 'PCT', 'R±', 'ERA', 'OPS', 'RESULT'].map(h => (
                  <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'RESULT' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Current season first */}
              <tr style={{ borderBottom: '2px solid #f59e0b', background: '#1f2937' }}>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{curr.year}*</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{curr.wins}-{curr.losses}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb', fontWeight: 700 }}>{curr.winPct.toFixed(3)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: curr.runDiff > 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{curr.runDiff > 0 ? '+' : ''}{curr.runDiff}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: curr.teamERA <= 3.50 ? '#22c55e' : '#f59e0b' }}>{curr.teamERA.toFixed(2)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{curr.teamOPS.toFixed(3)}</td>
                <td style={{ padding: '4px 6px', color: '#f59e0b', fontSize: 10 }}>{curr.result}</td>
              </tr>
              {data.historicalSeasons.map(s => (
                <tr key={s.year} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: s.year === data.closestComp.year ? '#3b82f6' : '#e5e7eb', fontWeight: s.year === data.closestComp.year ? 700 : 400 }}>{s.year}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af' }}>{s.wins}-{s.losses}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: s.winPct >= .600 ? '#22c55e' : s.winPct >= .500 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{s.winPct.toFixed(3)}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: s.runDiff > 0 ? '#22c55e' : '#ef4444' }}>{s.runDiff > 0 ? '+' : ''}{s.runDiff}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: s.teamERA <= 3.50 ? '#22c55e' : '#f59e0b' }}>{s.teamERA.toFixed(2)}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{s.teamOPS.toFixed(3)}</td>
                  <td style={{ padding: '4px 6px', fontSize: 10 }}>
                    <span style={{ color: getResultColor(s.result) }}>{s.result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 9, color: '#6b7280' }}>* Current season ({curr.gamesPlayed} games)</div>
        </div>

        {/* Win chart + key stats comparison */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>WIN TOTAL COMPARISON</div>

          {/* Current pace bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{curr.year} PACE</span>
              <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{pace162}W</span>
            </div>
            <div style={{ height: 12, background: '#1f2937', borderRadius: 2 }}>
              <div style={{ width: `${(pace162 / 120) * 100}%`, height: '100%', borderRadius: 2, background: '#f59e0b' }} />
            </div>
          </div>

          {/* Historical bars */}
          {data.historicalSeasons.map(s => (
            <div key={s.year} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: s.year === data.closestComp.year ? '#3b82f6' : '#6b7280', fontWeight: 700 }}>{s.year}</span>
                <span style={{ fontSize: 10, color: s.winPct >= .600 ? '#22c55e' : s.winPct >= .500 ? '#9ca3af' : '#ef4444', fontWeight: 700 }}>{s.wins}W</span>
              </div>
              <div style={{ height: 8, background: '#1f2937', borderRadius: 2 }}>
                <div style={{ width: `${(s.wins / 120) * 100}%`, height: '100%', borderRadius: 2, background: s.year === data.closestComp.year ? '#3b82f6' : s.winPct >= .600 ? '#22c55e66' : s.winPct >= .500 ? '#6b728066' : '#ef444466' }} />
              </div>
            </div>
          ))}

          {/* MVP/Cy Young comparison */}
          <div style={{ marginTop: 16, color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>KEY FIGURES</div>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 4, fontSize: 10 }}>
            <div style={{ color: '#6b7280', fontWeight: 700 }}>YEAR</div>
            <div style={{ color: '#6b7280', fontWeight: 700 }}>MVP</div>
            <div style={{ color: '#6b7280', fontWeight: 700 }}>CY YOUNG</div>
            <div style={{ color: '#f59e0b', fontWeight: 700 }}>{curr.year}*</div>
            <div style={{ color: '#e5e7eb' }}>{curr.mvp}</div>
            <div style={{ color: '#e5e7eb' }}>{curr.cyYoung}</div>
            {data.historicalSeasons.slice(0, 5).map(s => (
              <div key={s.year} style={{ display: 'contents' }}>
                <div style={{ color: '#6b7280' }}>{s.year}</div>
                <div style={{ color: '#9ca3af' }}>{s.mvp}</div>
                <div style={{ color: '#9ca3af' }}>{s.cyYoung}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
